import { AdminModule as AdminJsModule } from '@adminjs/nestjs';
import { Database, getModelByName, Resource } from '@adminjs/prisma';
import { HttpException, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import AdminJS, { ActionRequest, ActionContext, ResourceWithOptions, ValidationError } from 'adminjs';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { ruTranslations } from './locale.ru.js';
import { ScheduleModule } from '../schedule/schedule.module.js';
import { ScheduleService } from '../schedule/schedule.service.js';

AdminJS.registerAdapter({ Database, Resource });

// AdminJS пишет в БД напрямую через адаптер, минуя сервисы, поэтому бизнес-
// правила (хэш пароля, роль/группа, Assignment для расписания) продублированы
// здесь хуками. Поля-связи в payload называются по relation (teacher, group…).

const toValidationError = (e: unknown) =>
  e instanceof HttpException ? new ValidationError({}, { message: e.message }) : e;

const readOnly = { new: { isAccessible: false }, edit: { isAccessible: false } };

function userResource(prisma: PrismaService): ResourceWithOptions {
  const hashPassword = async (request: ActionRequest, context: ActionContext) => {
    if (request.method !== 'post' || !request.payload) return request;
    const { newPassword, ...payload } = request.payload;
    if (newPassword) {
      payload.password = await bcrypt.hash(String(newPassword), 10);
    } else if (context.action.name === 'new') {
      throw new ValidationError({ newPassword: { message: 'Укажите пароль' } });
    }
    // Группа имеет смысл только у студента.
    if (payload.role && payload.role !== Role.STUDENT) payload.group = null;
    return { ...request, payload };
  };

  return {
    resource: { model: getModelByName('User'), client: prisma },
    options: {
      navigation: { name: 'Люди' },
      listProperties: ['fullName', 'email', 'role', 'group', 'createdAt'],
      filterProperties: ['fullName', 'email', 'role', 'group'],
      properties: {
        password: { isVisible: false },
        newPassword: {
          type: 'password',
          isVisible: { list: false, filter: false, show: false, edit: true },
        },
      },
      actions: {
        new: { before: hashPassword },
        edit: { before: hashPassword },
      },
    },
  };
}

function scheduleResource(prisma: PrismaService, schedule: ScheduleService): ResourceWithOptions {
  const validate = async (request: ActionRequest, context: ActionContext) => {
    if (request.method !== 'post' || !request.payload) return request;
    const current = context.record?.params ?? {};
    const merged = { ...current, ...request.payload };
    try {
      await schedule.validate(
        {
          dayOfWeek: merged.dayOfWeek,
          weekParity: merged.weekParity,
          pairNumber: Number(merged.pairNumber),
          room: merged.room,
          lessonType: merged.lessonType,
          disciplineId: merged.discipline,
          teacherId: merged.teacher,
          groupId: merged.group,
        },
        context.record?.id(),
      );
    } catch (e) {
      throw toValidationError(e);
    }
    return request;
  };

  return {
    resource: { model: getModelByName('ScheduleEntry'), client: prisma },
    options: {
      navigation: { name: 'Учебный процесс' },
      listProperties: ['group', 'dayOfWeek', 'weekParity', 'pairNumber', 'discipline', 'lessonType', 'teacher', 'room'],
      filterProperties: ['group', 'teacher', 'discipline', 'dayOfWeek', 'weekParity'],
      properties: {
        pairNumber: { description: 'Номер пары, 1–6' },
      },
      actions: {
        new: { before: validate },
        edit: { before: validate },
      },
    },
  };
}

function assignmentResource(prisma: PrismaService): ResourceWithOptions {
  const checkTeacher = async (request: ActionRequest) => {
    if (request.method !== 'post' || !request.payload?.teacher) return request;
    const teacher = await prisma.user.findUnique({ where: { id: String(request.payload.teacher) } });
    if (teacher?.role !== Role.TEACHER) {
      throw new ValidationError({ teacher: { message: 'Пользователь не является преподавателем' } });
    }
    return request;
  };

  return {
    resource: { model: getModelByName('Assignment'), client: prisma },
    options: {
      navigation: { name: 'Учебный процесс' },
      actions: {
        new: { before: checkTeacher },
        edit: { before: checkTeacher },
      },
    },
  };
}

@Module({
  imports: [
    AdminJsModule.createAdminAsync({
      imports: [ScheduleModule],
      inject: [PrismaService, ScheduleService, ConfigService],
      useFactory: (prisma: PrismaService, schedule: ScheduleService, config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_SECRET');
        return {
          adminJsOptions: {
            rootPath: '/admin',
            branding: { companyName: 'Сайт вуза — администрирование', withMadeWithLove: false },
            locale: {
              language: 'ru',
              availableLanguages: ['ru'],
              translations: { ru: ruTranslations },
            },
            resources: [
              userResource(prisma),
              {
                resource: { model: getModelByName('Group'), client: prisma },
                options: { navigation: { name: 'Учебный процесс' } },
              },
              {
                resource: { model: getModelByName('Discipline'), client: prisma },
                options: { navigation: { name: 'Учебный процесс' } },
              },
              assignmentResource(prisma),
              scheduleResource(prisma, schedule),
              // Оценки и сообщения — только просмотр/удаление, для модерации.
              {
                resource: { model: getModelByName('Grade'), client: prisma },
                options: { navigation: { name: 'Модерация' }, actions: readOnly },
              },
              {
                resource: { model: getModelByName('Message'), client: prisma },
                options: { navigation: { name: 'Модерация' }, actions: readOnly },
              },
            ],
          },
          auth: {
            cookieName: 'adminjs',
            cookiePassword: secret,
            // В админку пускаем только пользователей с ролью ADMIN.
            authenticate: async (email: string, password: string) => {
              const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
              if (!user || user.role !== Role.ADMIN || !(await bcrypt.compare(password, user.password))) {
                return null;
              }
              return { id: user.id, email: user.email, title: user.fullName };
            },
          },
          sessionOptions: { resave: false, saveUninitialized: false, secret },
        };
      },
    }),
  ],
})
export class AdminModule {}
