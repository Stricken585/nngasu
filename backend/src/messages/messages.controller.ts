import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { MessagesService } from './messages.service.js';

// История при открытии чата; новые сообщения идут через MessagesGateway.
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('contacts')
  contacts(@CurrentUser() user: AuthUser) {
    return this.messages.contacts(user);
  }

  @Get('dm/:userId')
  direct(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() user: AuthUser) {
    return this.messages.directHistory(user, userId);
  }

  @Get('dm/:userId/members')
  directMembers(@Param('userId', ParseUUIDPipe) userId: string, @CurrentUser() user: AuthUser) {
    return this.messages.members(user, { receiverId: userId });
  }

  @Get('group/:groupId/:teacherId')
  group(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messages.groupHistory(user, groupId, teacherId);
  }

  @Get('group/:groupId/:teacherId/members')
  groupMembers(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messages.members(user, { groupId, teacherId });
  }
}
