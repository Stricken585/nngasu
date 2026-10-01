import { HttpException, Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parseCookie } from 'cookie';
import type { Server, Socket } from 'socket.io';
import type { AuthUser, JwtPayload } from '../common/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { dmRoom, groupRoom, MessagesService } from './messages.service.js';
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
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookies = parseCookie(client.handshake.headers.cookie ?? '');
      const token = cookies[this.config.getOrThrow<string>('COOKIE_NAME')];
      if (!token) throw new Error('нет токена');
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
  joinGroup(@ConnectedSocket() client: Socket, @MessageBody() body: { groupId: string }) {
    return this.run(async () => {
      await this.messages.assertCanWriteGroup(client.data.user, body?.groupId);
      await client.join(groupRoom(body.groupId));
    });
  }

  @SubscribeMessage('dm:send')
  sendDirect(@ConnectedSocket() client: Socket, @MessageBody() body: { receiverId: string; content: string }) {
    return this.run(async () => {
      const user: AuthUser = client.data.user;
      const message = await this.messages.send(user, { receiverId: body?.receiverId, content: body?.content });
      this.server.to(dmRoom(user.id, body.receiverId)).emit('message', message);
      return message;
    });
  }

  @SubscribeMessage('group:send')
  sendGroup(@ConnectedSocket() client: Socket, @MessageBody() body: { groupId: string; content: string }) {
    return this.run(async () => {
      const message = await this.messages.send(client.data.user, { groupId: body?.groupId, content: body?.content });
      this.server.to(groupRoom(body.groupId)).emit('message', message);
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
