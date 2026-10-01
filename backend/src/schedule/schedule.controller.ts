import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CreateScheduleEntryDto, ScheduleQuery, UpdateScheduleEntryDto } from './dto/schedule-entry.dto.js';
import { PAIR_TIMES } from './pair-times.constant.js';
import { ScheduleService } from './schedule.service.js';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  find(@Query() query: ScheduleQuery, @CurrentUser() user: AuthUser) {
    return this.schedule.find(query, user);
  }

  @Get('pair-times')
  pairTimes() {
    return PAIR_TIMES;
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateScheduleEntryDto) {
    return this.schedule.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScheduleEntryDto) {
    return this.schedule.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schedule.remove(id);
  }
}
