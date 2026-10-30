import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AttachmentsService, MAX_FILES_PER_MESSAGE, type UploadedFileInfo } from './attachments.service.js';

// Файл сначала загружается сюда (получаем id), потом id уходят вместе с
// сообщением через сокет.
@Controller('messages/attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_PER_MESSAGE))
  upload(@UploadedFiles() files: UploadedFileInfo[] | undefined, @CurrentUser() user: AuthUser) {
    if (!files?.length) throw new BadRequestException('Файлы не переданы');
    return this.attachments.register(user, files);
  }

  @Get(':id')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('inline') inline: string | undefined,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const file = await this.attachments.open(user, id, inline === '1');
    const encoded = encodeURIComponent(file.fileName);
    res.set({
      'Content-Type': file.inline ? file.mimeType : 'application/octet-stream',
      'Content-Disposition': `${file.inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encoded}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': 'sandbox',
      'Cache-Control': 'private, max-age=3600',
    });
    // sendFile умеет Range — видео и аудио можно перематывать.
    res.sendFile(file.path);
  }
}
