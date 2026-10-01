import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { AssignmentsService } from '../disciplines/assignments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateScheduleEntryDto, ScheduleQuery, UpdateScheduleEntryDto } from './dto/schedule-entry.dto.js';

const entryInclude = {
  discipline: true,
  teacher: { select: { id: true, fullName: true } },
  group: true,
} satisfies Prisma.ScheduleEntryInclude;

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
  ) {}

  async find(query: ScheduleQuery, user: AuthUser) {
    const where = await this.resolveFilter(query, user);
    if (!where) return [];
    return this.prisma.scheduleEntry.findMany({
      where: { ...where, ...(query.weekParity && { weekParity: query.weekParity }) },
      include: entryInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { pairNumber: 'asc' }, { weekParity: 'asc' }],
    });
  }

  // Без параметров каждый видит «своё»: студент — свою группу, преподаватель —
  // свои пары. Чужое — только в пределах прав.
  private async resolveFilter(
    { groupId, teacherId }: ScheduleQuery,
    user: AuthUser,
  ): Promise<Prisma.ScheduleEntryWhereInput | null> {
    switch (user.role) {
      case Role.ADMIN:
        return { ...(groupId && { groupId }), ...(teacherId && { teacherId }) };
      case Role.STUDENT:
        if ((groupId && groupId !== user.groupId) || teacherId) {
          throw new ForbiddenException('Студент видит только расписание своей группы');
        }
        return user.groupId ? { groupId: user.groupId } : null;
      case Role.TEACHER:
        if (teacherId && teacherId !== user.id) {
          throw new ForbiddenException('Нет доступа к чужому расписанию');
        }
        if (groupId) {
          if (!(await this.assignments.teacherHasGroup(user.id, groupId))) {
            throw new ForbiddenException('Вы не ведёте занятия у этой группы');
          }
          return { groupId };
        }
        return { teacherId: user.id };
    }
  }

  async create(dto: CreateScheduleEntryDto) {
    await this.validate(dto);
    return this.prisma.scheduleEntry.create({ data: { ...dto, room: dto.room.trim() }, include: entryInclude });
  }

  async update(id: string, dto: UpdateScheduleEntryDto) {
    const current = await this.prisma.scheduleEntry.findUniqueOrThrow({ where: { id } });
    const { id: _id, ...merged } = { ...current, ...dto };
    await this.validate(merged, id);
    return this.prisma.scheduleEntry.update({ where: { id }, data: dto, include: entryInclude });
  }

  async remove(id: string) {
    await this.prisma.scheduleEntry.delete({ where: { id } });
  }

  private async validate(entry: CreateScheduleEntryDto, excludeId?: string) {
    if (!(await this.assignments.exists(entry.teacherId, entry.disciplineId, entry.groupId))) {
      throw new BadRequestException(
        'Преподаватель не закреплён за этой дисциплиной у этой группы — сначала создайте Assignment',
      );
    }
    const clash = await this.prisma.scheduleEntry.findFirst({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
        dayOfWeek: entry.dayOfWeek,
        weekParity: entry.weekParity,
        pairNumber: entry.pairNumber,
        OR: [{ groupId: entry.groupId }, { teacherId: entry.teacherId }],
      },
    });
    if (clash) {
      throw new ConflictException(
        clash.groupId === entry.groupId
          ? 'У группы уже есть пара в это время'
          : 'У преподавателя уже есть пара в это время',
      );
    }
  }
}
