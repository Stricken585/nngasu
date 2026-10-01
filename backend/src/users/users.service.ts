import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

// Все выборки пользователей наружу идут через этот select — без хэша пароля.
export const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  groupId: true,
  group: { select: { id: true, name: true } },
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: publicUserSelect });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  create(data: { email: string; password: string; fullName: string }) {
    return this.prisma.user.create({ data, select: publicUserSelect });
  }

  findAll(filter: { role?: Role; groupId?: string }) {
    return this.prisma.user.findMany({
      where: filter,
      select: publicUserSelect,
      orderBy: { fullName: 'asc' },
    });
  }

  setRole(id: string, role: Role) {
    // Группа имеет смысл только у студента — при смене роли её сбрасываем.
    return this.prisma.user.update({
      where: { id },
      data: { role, ...(role !== Role.STUDENT && { groupId: null }) },
      select: publicUserSelect,
    });
  }

  async setGroup(id: string, groupId: string | null) {
    const user = await this.findById(id);
    if (groupId && user.role !== Role.STUDENT) {
      throw new NotFoundException('Группу можно назначить только студенту');
    }
    return this.prisma.user.update({ where: { id }, data: { groupId }, select: publicUserSelect });
  }
}
