import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { envValidationSchema } from './config/env.validation.js';
import { DisciplinesModule } from './disciplines/disciplines.module.js';
import { GradesModule } from './grades/grades.module.js';
import { GroupsModule } from './groups/groups.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ScheduleModule } from './schedule/schedule.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GroupsModule,
    DisciplinesModule,
    ScheduleModule,
    GradesModule,
    MessagesModule,
  ],
  providers: [
    // Порядок важен: сначала аутентификация (кладёт req.user), потом роли.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
