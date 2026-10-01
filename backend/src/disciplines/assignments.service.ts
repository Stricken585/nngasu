import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAssignmentDto } from './dto/assignment.dto.js';

const assignmentInclude = {
  teacher: { select: { id: true, fullName: true, email: true } },
  discipline: true,
  group: true,
} satisfies Prisma.AssignmentInclude;

// Assignment — источник прав «кто что у кого ведёт»; на него опираются
// расписание, оценки и личные сообщения.
@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(where: Prisma.AssignmentWhereInput) {
    return this.prisma.assignment.findMany({
      where,
      include: assignmentInclude,
      orderBy: [{ group: { name: 'asc' } }, { discipline: { name: 'asc' } }],
    });
  }

  async create(dto: CreateAssignmentDto) {
    const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new BadRequestException('Указанный пользователь не является преподавателем');
    }
    return this.prisma.assignment.create({ data: dto, include: assignmentInclude });
  }

  async remove(id: string) {
    await this.prisma.assignment.delete({ where: { id } });
  }

  async exists(teacherId: string, disciplineId: string, groupId: string) {
    const count = await this.prisma.assignment.count({ where: { teacherId, disciplineId, groupId } });
    return count > 0;
  }

  async teacherHasGroup(teacherId: string, groupId: string) {
    const count = await this.prisma.assignment.count({ where: { teacherId, groupId } });
    return count > 0;
  }

  async teacherGroupIds(teacherId: string) {
    const rows = await this.prisma.assignment.findMany({
      where: { teacherId },
      select: { groupId: true },
      distinct: ['groupId'],
    });
    return rows.map((r) => r.groupId);
  }
}
