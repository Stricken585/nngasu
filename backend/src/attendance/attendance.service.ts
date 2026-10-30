import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { formatDay, parseDay } from '../common/date.js';
import { AssignmentsService } from '../disciplines/assignments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAbsenceDto, ListAttendanceQuery } from './attendance.dto.js';

const include = {
  student: { select: { id: true, fullName: true, groupId: true } },
  discipline: true,
} satisfies Prisma.AttendanceInclude;

type Row = Prisma.AttendanceGetPayload<{ include: typeof include }>;
const serialize = (a: Row) => ({ ...a, date: formatDay(a.date) });

// Журнал посещаемости: хранятся только отметки «н» и «б»; всё остальное — присутствовал.
@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
  ) {}

  async mark(dto: CreateAbsenceDto, teacher: AuthUser) {
    const student = await this.prisma.user.findUnique({ where: { id: dto.studentId } });
    if (!student || student.role !== Role.STUDENT || !student.groupId) {
      throw new BadRequestException('Студент не найден или не состоит в группе');
    }
    if (!(await this.assignments.exists(teacher.id, dto.disciplineId, student.groupId))) {
      throw new ForbiddenException('Вы не ведёте эту дисциплину у группы студента');
    }
    const key = { studentId: dto.studentId, disciplineId: dto.disciplineId, date: parseDay(dto.date) };
    const row = await this.prisma.attendance.upsert({
      where: { studentId_disciplineId_date: key },
      create: { ...key, teacherId: teacher.id, status: dto.status },
      update: { status: dto.status ?? 'ABSENT', teacherId: teacher.id },
      include,
    });
    return serialize(row);
  }

  async find(query: ListAttendanceQuery, user: AuthUser) {
    const where: Prisma.AttendanceWhereInput = {
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.disciplineId && { disciplineId: query.disciplineId }),
      ...(query.groupId && { student: { groupId: query.groupId } }),
    };
    if (user.role === Role.STUDENT) {
      if (query.studentId && query.studentId !== user.id) {
        throw new ForbiddenException('Студент видит только свою посещаемость');
      }
      where.studentId = user.id;
    } else if (user.role === Role.TEACHER) {
      const scope = await this.assignments.teacherScope(user.id);
      if (!scope) return [];
      where.AND = [scope];
    }
    const rows = await this.prisma.attendance.findMany({ where, include, orderBy: { date: 'asc' } });
    return rows.map(serialize);
  }

  // Снять отметку «н» может любой преподаватель этой пары (дисциплина, группа).
  async remove(id: string, user: AuthUser) {
    const row = await this.prisma.attendance.findUniqueOrThrow({ where: { id }, include });
    if (user.role === Role.TEACHER) {
      const ok = row.student.groupId && (await this.assignments.exists(user.id, row.disciplineId, row.student.groupId));
      if (!ok) throw new ForbiddenException('Вы не ведёте эту дисциплину у группы студента');
    }
    await this.prisma.attendance.delete({ where: { id } });
  }
}
