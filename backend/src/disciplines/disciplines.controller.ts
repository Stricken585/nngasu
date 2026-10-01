import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator.js';
import { DisciplinesService } from './disciplines.service.js';
import { DisciplineDto } from './dto/discipline.dto.js';

@Controller('disciplines')
export class DisciplinesController {
  constructor(private readonly disciplines: DisciplinesService) {}

  @Get()
  findAll() {
    return this.disciplines.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: DisciplineDto) {
    return this.disciplines.create(dto.name);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DisciplineDto) {
    return this.disciplines.update(id, dto.name);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplines.remove(id);
  }
}
