import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AssignmentsService } from './assignments.service.js';
import { CreateAssignmentDto, ListAssignmentsQuery } from './dto/assignment.dto.js';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  // Что ведёт текущий преподаватель — для форм оценок и списка групп.
  @Get('my')
  @Roles(Role.TEACHER)
  my(@CurrentUser() user: AuthUser) {
    return this.assignments.findAll({ teacherId: user.id });
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: ListAssignmentsQuery) {
    return this.assignments.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateAssignmentDto) {
    return this.assignments.create(dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignments.remove(id);
  }
}
