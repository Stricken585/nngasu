import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { AssignmentsService } from '../disciplines/assignments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export const MAX_MESSAGE_LENGTH = 2000;

const messageInclude = {
  sender: { select: { id: true, fullName: true, role: true } },
} satisfies Prisma.MessageInclude;

export const dmRoom = (a: string, b: string) => `dm:${[a, b].sort().join(':')}`;
export const groupRoom = (groupId: string) => `group:${groupId}`;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
  ) {}

  // Ровно одно из receiverId/groupId (CHECK-констрейнт Prisma не умеет).
  async send(sender: AuthUser, input: { receiverId?: string; groupId?: string; content: unknown }) {
    if (!!input.receiverId === !!input.groupId) {
      throw new BadRequestException('Нужно указать ровно одно: получателя или группу');
    }
    const content = this.normalizeContent(input.content);
    if (input.receiverId) {
      await this.assertCanDirect(sender, input.receiverId);
    } else {
      await this.assertCanWriteGroup(sender, input.groupId!);
    }
    return this.prisma.message.create({
      data: {
        content,
        senderId: sender.id,
        receiverId: input.receiverId ?? null,
        groupId: input.groupId ?? null,
      },
      include: messageInclude,
    });
  }

  async directHistory(user: AuthUser, otherId: string) {
    await this.assertCanDirect(user, otherId);
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: otherId },
          { senderId: otherId, receiverId: user.id },
        ],
      },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async groupHistory(user: AuthUser, groupId: string) {
    await this.assertCanWriteGroup(user, groupId);
    return this.prisma.message.findMany({
      where: { groupId },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  // С кем пользователь может переписываться: собеседники для личных чатов и
  // групповые чаты.
  async contacts(user: AuthUser) {
    const userSelect = {
      id: true,
      fullName: true,
      role: true,
      group: { select: { id: true, name: true } },
    } satisfies Prisma.UserSelect;

    if (user.role === Role.STUDENT) {
      if (!user.groupId) return { users: [], groups: [] };
      const [users, groups] = await Promise.all([
        this.prisma.user.findMany({
          where: { role: Role.TEACHER, assignments: { some: { groupId: user.groupId } } },
          select: userSelect,
          orderBy: { fullName: 'asc' },
        }),
        this.prisma.group.findMany({ where: { id: user.groupId } }),
      ]);
      return { users, groups };
    }
    if (user.role === Role.TEACHER) {
      const groupIds = await this.assignments.teacherGroupIds(user.id);
      const [users, groups] = await Promise.all([
        this.prisma.user.findMany({
          where: { role: Role.STUDENT, groupId: { in: groupIds } },
          select: userSelect,
          orderBy: [{ group: { name: 'asc' } }, { fullName: 'asc' }],
        }),
        this.prisma.group.findMany({ where: { id: { in: groupIds } }, orderBy: { name: 'asc' } }),
      ]);
      return { users, groups };
    }
    return { users: [], groups: [] };
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

  // Групповой чат: студенты этой группы и преподаватели, которые у неё ведут.
  async assertCanWriteGroup(user: AuthUser, groupId: string) {
    if (typeof groupId !== 'string') throw new BadRequestException('Не указана группа');
    const allowed =
      (user.role === Role.STUDENT && user.groupId === groupId) ||
      (user.role === Role.TEACHER && (await this.assignments.teacherHasGroup(user.id, groupId).catch(() => false)));
    if (!allowed) throw new ForbiddenException('Нет доступа к чату этой группы');
  }

  private normalizeContent(content: unknown) {
    if (typeof content !== 'string' || !content.trim()) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(`Сообщение длиннее ${MAX_MESSAGE_LENGTH} символов`);
    }
    return content.trim();
  }
}
