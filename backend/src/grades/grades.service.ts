import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { AssignmentsService } from '../disciplines/assignments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGradeDto, ListGradesQuery } from './dto/grade.dto.js';

const gradeInclude = {
  student: { select: { id: true, fullName: true, groupId: true } },
  teacher: { select: { id: true, fullName: true } },
  discipline: true,
} satisfies Prisma.GradeInclude;

type GradeRow = Prisma.GradeGetPayload<{ include: typeof gradeInclude }>;

// Decimal из Prisma сериализуется в JSON строкой — наружу отдаём число.
const serialize = (g: GradeRow) => ({ ...g, value: g.value.toNumber() });

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
  ) {}

  async create(dto: CreateGradeDto, teacher: AuthUser) {
    const student = await this.prisma.user.findUnique({ where: { id: dto.studentId } });
    if (!student || student.role !== Role.STUDENT || !student.groupId) {
      throw new BadRequestException('Студент не найден или не состоит в группе');
    }
    if (!(await this.assignments.exists(teacher.id, dto.disciplineId, student.groupId))) {
      throw new ForbiddenException('Вы не ведёте эту дисциплину у группы студента');
    }
    const grade = await this.prisma.grade.create({
      data: { ...dto, teacherId: teacher.id },
      include: gradeInclude,
    });
    return serialize(grade);
  }

  async find(query: ListGradesQuery, user: AuthUser) {
    const where: Prisma.GradeWhereInput = {
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.disciplineId && { disciplineId: query.disciplineId }),
      ...(query.groupId && { student: { groupId: query.groupId } }),
    };

    if (user.role === Role.STUDENT) {
      if (query.studentId && query.studentId !== user.id) {
        throw new ForbiddenException('Студент видит только свои оценки');
      }
      where.studentId = user.id;
    } else if (user.role === Role.TEACHER) {
      // Только пары (дисциплина, группа), которые преподаватель ведёт —
      // включая оценки, поставленные коллегами по той же дисциплине.
      const own = await this.prisma.assignment.findMany({ where: { teacherId: user.id } });
      if (own.length === 0) return [];
      where.AND = [
        { OR: own.map((a) => ({ disciplineId: a.disciplineId, student: { groupId: a.groupId } })) },
      ];
    }

    const grades = await this.prisma.grade.findMany({
      where,
      include: gradeInclude,
      orderBy: { createdAt: 'asc' },
    });
    return grades.map(serialize);
  }

  async remove(id: string, user: AuthUser) {
    const grade = await this.prisma.grade.findUniqueOrThrow({ where: { id } });
    if (user.role !== Role.ADMIN && grade.teacherId !== user.id) {
      throw new ForbiddenException('Удалить можно только выставленную вами оценку');
    }
    await this.prisma.grade.delete({ where: { id } });
  }
}
