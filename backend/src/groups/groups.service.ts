import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { AssignmentsService } from '../disciplines/assignments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { publicUserSelect } from '../users/users.service.js';

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assignments: AssignmentsService,
  ) {}

  findAll() {
    return this.prisma.group.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.group.findUniqueOrThrow({ where: { id } });
  }

  create(name: string) {
    return this.prisma.group.create({ data: { name: name.trim() } });
  }

  update(id: string, name: string) {
    return this.prisma.group.update({ where: { id }, data: { name: name.trim() } });
  }

  async remove(id: string) {
    await this.prisma.group.delete({ where: { id } });
  }

  // Состав группы: админу — любой, преподавателю — только группы, где он ведёт,
  // студенту — только своя.
  async students(groupId: string, user: AuthUser) {
    const allowed =
      user.role === Role.ADMIN ||
      (user.role === Role.STUDENT && user.groupId === groupId) ||
      (user.role === Role.TEACHER && (await this.assignments.teacherHasGroup(user.id, groupId)));
    if (!allowed) throw new ForbiddenException('Нет доступа к этой группе');

    return this.prisma.user.findMany({
      where: { groupId, role: Role.STUDENT },
      select: publicUserSelect,
      orderBy: { fullName: 'asc' },
    });
  }
}
