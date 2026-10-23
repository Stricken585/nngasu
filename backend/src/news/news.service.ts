import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(limit?: number) {
    return this.prisma.news.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  }

  async findOne(id: string) {
    const item = await this.prisma.news.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Новость не найдена');
    return item;
  }
}
