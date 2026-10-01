import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { GroupDto } from './dto/group.dto.js';
import { GroupsService } from './groups.service.js';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  findAll() {
    return this.groups.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.groups.findOne(id);
  }

  @Get(':id/students')
  students(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.groups.students(id, user);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: GroupDto) {
    return this.groups.create(dto.name);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: GroupDto) {
    return this.groups.update(id, dto.name);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.groups.remove(id);
  }
}
