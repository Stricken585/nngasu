import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DisciplinesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.discipline.findMany({ orderBy: { name: 'asc' } });
  }

  create(name: string) {
    return this.prisma.discipline.create({ data: { name: name.trim() } });
  }

  update(id: string, name: string) {
    return this.prisma.discipline.update({ where: { id }, data: { name: name.trim() } });
  }

  async remove(id: string) {
    await this.prisma.discipline.delete({ where: { id } });
  }
}
