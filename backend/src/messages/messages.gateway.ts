import { HttpException, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { AuthUser, JwtPayload } from '../common/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { dmRoom, groupRoom, MessagesService, roomOfMessage } from './messages.service.js';
import { WsJwtGuard } from './ws-jwt.guard.js';

type Ack<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

// Клиент сначала «входит» в чат (dm:join / group:join — с проверкой прав),
// затем получает событие `message` для всех чатов, в которые вошёл.
@WebSocketGateway()
@UseGuards(WsJwtGuard)
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly messages: MessagesService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth as { token?: unknown } | undefined)?.token;
      if (typeof token !== 'string' || !token) throw new Error('нет токена');
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user: AuthUser | null = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, fullName: true, role: true, groupId: true },
      });
      if (!user) throw new Error('пользователь не найден');
      client.data.user = user;
    } catch (e) {
      this.logger.debug(`WS-подключение отклонено: ${(e as Error).message}`);
      client.emit('auth_error', 'Не авторизован');
      client.disconnect(true);
    }
  }

  @SubscribeMessage('dm:join')
  joinDirect(@ConnectedSocket() client: Socket, @MessageBody() body: { userId: string }) {
    return this.run(async () => {
      const user: AuthUser = client.data.user;
      await this.messages.assertCanDirect(user, body?.userId);
      await client.join(dmRoom(user.id, body.userId));
    });
  }

  @SubscribeMessage('group:join')
  joinGroup(@ConnectedSocket() client: Socket, @MessageBody() body: { groupId: string; teacherId: string }) {
    return this.run(async () => {
      await this.messages.assertCanWriteGroup(client.data.user, body?.groupId, body?.teacherId);
      await client.join(groupRoom(body.groupId, body.teacherId));
    });
  }

  @SubscribeMessage('dm:send')
  sendDirect(@ConnectedSocket() client: Socket, @MessageBody() body: { receiverId: string; content: string; attachmentIds?: string[] }) {
    return this.run(async () => {
      const message = await this.messages.send(client.data.user, {
        receiverId: body?.receiverId,
        content: body?.content,
        attachmentIds: body?.attachmentIds,
      });
      this.server.to(roomOfMessage(message)).emit('message', message);
      return message;
    });
  }

  @SubscribeMessage('group:send')
  sendGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { groupId: string; teacherId: string; content: string; attachmentIds?: string[] },
  ) {
    return this.run(async () => {
      const message = await this.messages.send(client.data.user, {
        groupId: body?.groupId,
        teacherId: body?.teacherId,
        content: body?.content,
        attachmentIds: body?.attachmentIds,
      });
      this.server.to(roomOfMessage(message)).emit('message', message);
      return message;
    });
  }

  @SubscribeMessage('message:edit')
  edit(@ConnectedSocket() client: Socket, @MessageBody() body: { id: string; content: string }) {
    return this.run(async () => {
      const message = await this.messages.edit(client.data.user, body?.id, body?.content);
      this.server.to(roomOfMessage(message)).emit('message:updated', message);
      return message;
    });
  }

  @SubscribeMessage('message:delete')
  delete(@ConnectedSocket() client: Socket, @MessageBody() body: { id: string }) {
    return this.run(async () => {
      const message = await this.messages.remove(client.data.user, body?.id);
      this.server.to(roomOfMessage(message)).emit('message:deleted', {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        groupId: message.groupId,
        teacherId: message.teacherId,
      });
    });
  }

  @SubscribeMessage('message:pin')
  pin(@ConnectedSocket() client: Socket, @MessageBody() body: { id: string; pinned: boolean }) {
    return this.run(async () => {
      const message = await this.messages.setPinned(client.data.user, body?.id, !!body?.pinned);
      this.server.to(roomOfMessage(message)).emit('message:updated', message);
      return message;
    });
  }

  // Пересылка в другой чат: получатель задаётся так же, как при отправке.
  @SubscribeMessage('message:forward')
  forward(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { id: string; receiverId?: string; groupId?: string; teacherId?: string },
  ) {
    return this.run(async () => {
      const message = await this.messages.forward(client.data.user, body?.id, {
        receiverId: body?.receiverId,
        groupId: body?.groupId,
        teacherId: body?.teacherId,
      });
      this.server.to(roomOfMessage(message)).emit('message', message);
      return message;
    });
  }

  // Ошибки прав/валидации возвращаются клиенту в ack, а не роняют соединение.
  private async run<T>(fn: () => Promise<T>): Promise<Ack<T>> {
    try {
      const data = await fn();
      return { ok: true, data };
    } catch (e) {
      if (e instanceof HttpException) return { ok: false, error: e.message };
      this.logger.error(e);
      return { ok: false, error: 'Внутренняя ошибка сервера' };
    }
  }
}
