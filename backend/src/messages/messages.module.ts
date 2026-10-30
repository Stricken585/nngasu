import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module.js';
import { DisciplinesModule } from '../disciplines/disciplines.module.js';
import { AttachmentsController } from './attachments.controller.js';
import { AttachmentsService, MAX_FILE_SIZE, resolveUploadDir } from './attachments.service.js';
import { DiskStorage } from './disk-storage.js';
import { MessagesController } from './messages.controller.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [
    AuthModule,
    DisciplinesModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: new DiskStorage(resolveUploadDir(config.getOrThrow<string>('UPLOAD_DIR'))),
        limits: { fileSize: MAX_FILE_SIZE },
      }),
    }),
  ],
  controllers: [MessagesController, AttachmentsController],
  providers: [MessagesService, MessagesGateway, AttachmentsService],
})
export class MessagesModule {}
