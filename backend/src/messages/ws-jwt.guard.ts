import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

// Пользователь кладётся в socket.data при подключении (MessagesGateway.handleConnection),
// гард лишь не пускает к обработчикам неаутентифицированный сокет.
@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    if (!client.data.user) throw new WsException('Не авторизован');
    return true;
  }
}
