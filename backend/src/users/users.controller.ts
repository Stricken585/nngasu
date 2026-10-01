import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ListUsersQuery } from './dto/list-users.query.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.findById(user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: ListUsersQuery) {
    return this.users.findAll(query);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  setRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.users.setRole(id, dto.role);
  }

  @Patch(':id/group')
  @Roles(Role.ADMIN)
  setGroup(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGroupDto) {
    return this.users.setGroup(id, dto.groupId);
  }
}
