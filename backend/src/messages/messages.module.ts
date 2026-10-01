import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DisciplinesModule } from '../disciplines/disciplines.module.js';
import { MessagesController } from './messages.controller.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [AuthModule, DisciplinesModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
