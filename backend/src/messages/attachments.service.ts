import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isAbsolute, join } from 'node:path';
import type { AuthUser } from '../common/auth-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MessagesService } from './messages.service.js';

export const resolveUploadDir = (dir: string) => (isAbsolute(dir) ? dir : join(process.cwd(), dir));

export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_FILES_PER_MESSAGE = 5;

// Только эти типы показываются в браузере прямо в чате; всё остальное
// (включая svg и html) отдаётся только как скачивание.
const INLINE_MIME = /^(image\/(png|jpeg|gif|webp)|video\/(mp4|webm)|audio\/(mpeg|ogg|wav|webm|mp4))$/;

export interface UploadedFileInfo {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

// multer отдаёт имя как latin1-строку из байтов UTF-8.
const decodeName = (raw: string) => {
  const name = Buffer.from(raw, 'latin1').toString('utf8');
  return (name.split(/[\\/]/).pop() ?? '').replace(/\p{Cc}/gu, '').trim().slice(0, 200) || 'file';
};

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessagesService,
    private readonly config: ConfigService,
  ) {}

  get uploadDir() {
    return resolveUploadDir(this.config.getOrThrow<string>('UPLOAD_DIR'));
  }

  async register(user: AuthUser, files: UploadedFileInfo[]) {
    return this.prisma.$transaction(
      files.map((f) =>
        this.prisma.attachment.create({
          data: {
            fileName: decodeName(f.originalname),
            mimeType: f.mimetype || 'application/octet-stream',
            size: f.size,
            storageName: f.filename,
            uploaderId: user.id,
          },
          select: { id: true, fileName: true, mimeType: true, size: true },
        }),
      ),
    );
  }

  // Файл видит тот, кто имеет доступ к чату сообщения; пока файл не прикреплён
  // к сообщению — только загрузивший.
  async open(user: AuthUser, id: string, wantInline: boolean) {
    const a = await this.prisma.attachment.findUnique({ where: { id }, include: { message: true } });
    if (!a) throw new NotFoundException('Файл не найден');
    const m = a.message;
    if (!m) {
      if (a.uploaderId !== user.id) throw new ForbiddenException('Нет доступа к файлу');
    } else if (m.groupId) {
      await this.messages.assertCanWriteGroup(user, m.groupId, m.teacherId ?? '');
    } else if (m.senderId !== user.id && m.receiverId !== user.id) {
      throw new ForbiddenException('Нет доступа к файлу');
    }
    return {
      path: join(this.uploadDir, a.storageName),
      fileName: a.fileName,
      mimeType: a.mimeType,
      inline: wantInline && INLINE_MIME.test(a.mimeType),
    };
  }
}
