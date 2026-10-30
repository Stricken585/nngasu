import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { AssignmentsService } from '../disciplines/assignments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_ATTACHMENTS = 5;

const messageInclude = {
  sender: { select: { id: true, fullName: true, role: true } },
  attachments: { select: { id: true, fileName: true, mimeType: true, size: true } },
} satisfies Prisma.MessageInclude;

export const dmRoom = (a: string, b: string) => `dm:${[a, b].sort().join(':')}`;
export const groupRoom = (groupId: string, teacherId: string) => `group:${groupId}:${teacherId}`;

export type ChatTarget = { receiverId?: string; groupId?: string; teacherId?: string };
type MessageWithAttachments = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

export const roomOfMessage = (m: { senderId: string; receiverId: string | null; groupId: string | null; teacherId: string | null }) =>
  m.groupId ? groupRoom(m.groupId, m.teacherId!) : dmRoom(m.senderId, m.receiverId!);

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
  ) {}

  // Ровно один чат: личный (receiverId) или групповой (groupId + teacherId).
  async send(
    sender: AuthUser,
    input: ChatTarget & { content: unknown; attachmentIds?: unknown },
    extra: { forwardedFromName?: string; copyAttachmentsOf?: string } = {},
  ) {
    await this.assertCanChat(sender, input);
    const attachmentIds = this.normalizeAttachmentIds(input.attachmentIds);
    const hasFiles = attachmentIds.length > 0 || !!extra.copyAttachmentsOf;
    const content = this.normalizeContent(input.content, hasFiles);
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content,
          senderId: sender.id,
          receiverId: input.receiverId ?? null,
          groupId: input.groupId ?? null,
          teacherId: input.groupId ? input.teacherId : null,
          forwardedFromName: extra.forwardedFromName,
        },
      });
      if (attachmentIds.length) {
        // Прикрепить можно только свои, ещё не использованные файлы.
        const { count } = await tx.attachment.updateMany({
          where: { id: { in: attachmentIds }, uploaderId: sender.id, messageId: null },
          data: { messageId: message.id },
        });
        if (count !== attachmentIds.length) throw new BadRequestException('Некорректные вложения');
      }
      if (extra.copyAttachmentsOf) {
        const source = await tx.attachment.findMany({ where: { messageId: extra.copyAttachmentsOf } });
        await tx.attachment.createMany({
          data: source.map(({ fileName, mimeType, size, storageName }) => ({
            fileName,
            mimeType,
            size,
            storageName,
            uploaderId: sender.id,
            messageId: message.id,
          })),
        });
      }
      return tx.message.findUniqueOrThrow({ where: { id: message.id }, include: messageInclude });
    });
  }

  async edit(user: AuthUser, id: string, content: unknown) {
    const m = await this.getAccessible(user, id);
    if (m.senderId !== user.id) throw new ForbiddenException('Редактировать можно только свои сообщения');
    const text = this.normalizeContent(content, m.attachments.length > 0);
    return this.prisma.message.update({
      where: { id },
      data: { content: text, editedAt: new Date() },
      include: messageInclude,
    });
  }

  // Удалить может автор, а в групповом чате ещё и его преподаватель (модерация).
  async remove(user: AuthUser, id: string) {
    const m = await this.getAccessible(user, id);
    if (m.senderId !== user.id && !(m.groupId && m.teacherId === user.id)) {
      throw new ForbiddenException('Нет прав удалить это сообщение');
    }
    await this.prisma.message.delete({ where: { id } });
    return m;
  }

  // В личном чате закрепляет любой из двоих, в групповом — только преподаватель.
  async setPinned(user: AuthUser, id: string, pinned: boolean) {
    const m = await this.getAccessible(user, id);
    if (m.groupId && m.teacherId !== user.id) {
      throw new ForbiddenException('Закреплять в групповом чате может только преподаватель');
    }
    return this.prisma.message.update({
      where: { id },
      data: { pinnedAt: pinned ? new Date() : null },
      include: messageInclude,
    });
  }

  async forward(user: AuthUser, id: string, target: ChatTarget) {
    const m = await this.getAccessible(user, id);
    return this.send(
      user,
      { ...target, content: m.content },
      { forwardedFromName: m.forwardedFromName ?? m.sender.fullName, copyAttachmentsOf: m.attachments.length ? id : undefined },
    );
  }

  async directHistory(user: AuthUser, otherId: string) {
    await this.assertCanDirect(user, otherId);
    return this.prisma.message.findMany({
      where: {
        groupId: null,
        OR: [
          { senderId: user.id, receiverId: otherId },
          { senderId: otherId, receiverId: user.id },
        ],
      },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async groupHistory(user: AuthUser, groupId: string, teacherId: string) {
    await this.assertCanWriteGroup(user, groupId, teacherId);
    return this.prisma.message.findMany({
      where: { groupId, teacherId },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  // Участники чата: в личном — двое, в групповом — преподаватель и студенты группы.
  async members(user: AuthUser, target: ChatTarget) {
    const select = { id: true, fullName: true, role: true } satisfies Prisma.UserSelect;
    await this.assertCanChat(user, target);
    if (target.receiverId) {
      return this.prisma.user.findMany({ where: { id: { in: [user.id, target.receiverId] } }, select });
    }
    const [teacher, students] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: target.teacherId! }, select }),
      this.prisma.user.findMany({ where: { groupId: target.groupId, role: Role.STUDENT }, select, orderBy: { fullName: 'asc' } }),
    ]);
    return [teacher, ...students];
  }

  // С кем пользователь может переписываться: собеседники для личных чатов и
  // групповые чаты (по одному на каждого преподавателя группы).
  async contacts(user: AuthUser) {
    const userSelect = {
      id: true,
      fullName: true,
      role: true,
      group: { select: { id: true, name: true } },
    } satisfies Prisma.UserSelect;
    const assignmentWhere: Prisma.AssignmentWhereInput | null =
      user.role === Role.STUDENT
        ? user.groupId
          ? { groupId: user.groupId }
          : null
        : user.role === Role.TEACHER
          ? { teacherId: user.id }
          : null;
    if (!assignmentWhere) return { users: [], groupChats: [] };

    const rows = await this.prisma.assignment.findMany({
      where: assignmentWhere,
      include: { teacher: { select: { id: true, fullName: true } }, group: true, discipline: true },
      orderBy: [{ group: { name: 'asc' } }, { teacher: { fullName: 'asc' } }],
    });
    const chats = new Map<string, { group: { id: string; name: string }; teacher: { id: string; fullName: string }; disciplines: string[] }>();
    for (const r of rows) {
      const key = `${r.groupId}:${r.teacherId}`;
      const chat = chats.get(key) ?? { group: r.group, teacher: r.teacher, disciplines: [] };
      chat.disciplines.push(r.discipline.name);
      chats.set(key, chat);
    }

    const users =
      user.role === Role.STUDENT
        ? await this.prisma.user.findMany({
            where: { id: { in: [...new Set(rows.map((r) => r.teacherId))] } },
            select: userSelect,
            orderBy: { fullName: 'asc' },
          })
        : await this.prisma.user.findMany({
            where: { role: Role.STUDENT, groupId: { in: [...new Set(rows.map((r) => r.groupId))] } },
            select: userSelect,
            orderBy: [{ group: { name: 'asc' } }, { fullName: 'asc' }],
          });
    return { users, groupChats: [...chats.values()] };
  }

  async assertCanChat(user: AuthUser, target: ChatTarget) {
    if (!!target.receiverId === !!target.groupId) {
      throw new BadRequestException('Нужно указать ровно одно: получателя или группу');
    }
    if (target.receiverId) return this.assertCanDirect(user, target.receiverId);
    return this.assertCanWriteGroup(user, target.groupId!, target.teacherId!);
  }

  // Личная переписка — только преподаватель ↔ студент группы, которую он ведёт.
  async assertCanDirect(user: AuthUser, otherId: string) {
    if (typeof otherId !== 'string') throw new BadRequestException('Не указан собеседник');
    if (otherId === user.id) throw new BadRequestException('Нельзя писать самому себе');
    const other = await this.prisma.user.findUnique({ where: { id: otherId } }).catch(() => null);
    if (!other) throw new NotFoundException('Собеседник не найден');

    const pair =
      user.role === Role.TEACHER && other.role === Role.STUDENT
        ? { teacherId: user.id, groupId: other.groupId }
        : user.role === Role.STUDENT && other.role === Role.TEACHER
          ? { teacherId: other.id, groupId: user.groupId }
          : null;
    if (!pair?.groupId || !(await this.assignments.teacherHasGroup(pair.teacherId, pair.groupId))) {
      throw new ForbiddenException('Переписка возможна только между преподавателем и студентом его группы');
    }
  }

  // Групповой чат «группа + преподаватель»: студенты этой группы и сам
  // преподаватель, если он у неё что-то ведёт.
  async assertCanWriteGroup(user: AuthUser, groupId: string, teacherId: string) {
    if (typeof groupId !== 'string' || typeof teacherId !== 'string') throw new BadRequestException('Не указан чат');
    const member =
      (user.role === Role.STUDENT && user.groupId === groupId) || (user.role === Role.TEACHER && user.id === teacherId);
    const exists = member && (await this.assignments.teacherHasGroup(teacherId, groupId).catch(() => false));
    if (!exists) throw new ForbiddenException('Нет доступа к этому чату');
  }

  // Сообщение, к чату которого у пользователя есть доступ.
  private async getAccessible(user: AuthUser, id: string): Promise<MessageWithAttachments> {
    const m = await this.prisma.message.findUnique({ where: { id }, include: messageInclude }).catch(() => null);
    if (!m) throw new NotFoundException('Сообщение не найдено');
    if (m.groupId) await this.assertCanWriteGroup(user, m.groupId, m.teacherId ?? '');
    else if (m.senderId !== user.id && m.receiverId !== user.id) throw new ForbiddenException('Нет доступа к сообщению');
    return m;
  }

  private normalizeAttachmentIds(ids: unknown) {
    if (ids === undefined || ids === null) return [];
    if (!Array.isArray(ids) || ids.length > MAX_ATTACHMENTS || ids.some((id) => typeof id !== 'string')) {
      throw new BadRequestException(`Можно прикрепить не больше ${MAX_ATTACHMENTS} файлов`);
    }
    return [...new Set(ids as string[])];
  }

  // Текст может быть пустым, если есть вложения.
  private normalizeContent(content: unknown, hasAttachments: boolean) {
    if (content === undefined || content === null || content === '') content = hasAttachments ? '' : content;
    if (typeof content !== 'string' || (!content.trim() && !hasAttachments)) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(`Сообщение длиннее ${MAX_MESSAGE_LENGTH} символов`);
    }
    return content.trim();
  }
}
