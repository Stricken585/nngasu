import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

// Переводит типовые ошибки Prisma в HTTP-ответы вместо 500.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (host.getType() !== 'http') return super.catch(exception, host);

    const mapping: Record<string, [number, string]> = {
      P2002: [HttpStatus.CONFLICT, 'Запись с такими данными уже существует'],
      P2003: [HttpStatus.BAD_REQUEST, 'Связанная запись не найдена'],
      P2025: [HttpStatus.NOT_FOUND, 'Запись не найдена'],
    };
    const mapped = mapping[exception.code];
    if (!mapped) return super.catch(exception, host);

    const [statusCode, message] = mapped;
    host.switchToHttp().getResponse<Response>().status(statusCode).json({ statusCode, message });
  }
}
