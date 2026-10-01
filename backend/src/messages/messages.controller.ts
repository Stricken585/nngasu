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

  @Get('group/:groupId')
  group(@Param('groupId', ParseUUIDPipe) groupId: string, @CurrentUser() user: AuthUser) {
    return this.messages.groupHistory(user, groupId);
  }
}
