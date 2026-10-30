import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CreateAbsenceDto, ListAttendanceQuery } from './attendance.dto.js';
import { AttendanceService } from './attendance.service.js';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get()
  find(@Query() query: ListAttendanceQuery, @CurrentUser() user: AuthUser) {
    return this.attendance.find(query, user);
  }

  @Post()
  @Roles(Role.TEACHER)
  mark(@Body() dto: CreateAbsenceDto, @CurrentUser() user: AuthUser) {
    return this.attendance.mark(dto, user);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.attendance.remove(id, user);
  }
}
