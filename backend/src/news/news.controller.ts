import { Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Query } from '@nestjs/common';
import { NewsService } from './news.service.js';

// Новости читают все авторизованные; создаёт и правит администратор в AdminJS.
@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  findAll(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.news.findAll(limit && limit > 0 ? Math.min(limit, 100) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.news.findOne(id);
  }
}
