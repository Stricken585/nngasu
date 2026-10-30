import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CreateGradeDto, ListGradesQuery, UpdateGradeDto } from './dto/grade.dto.js';
import { GradesService } from './grades.service.js';

@Controller('grades')
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Get()
  find(@Query() query: ListGradesQuery, @CurrentUser() user: AuthUser) {
    return this.grades.find(query, user);
  }

  @Post()
  @Roles(Role.TEACHER)
  create(@Body() dto: CreateGradeDto, @CurrentUser() user: AuthUser) {
    return this.grades.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGradeDto, @CurrentUser() user: AuthUser) {
    return this.grades.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.grades.remove(id, user);
  }
}
