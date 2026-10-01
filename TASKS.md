# План реализации — последовательные задачи

> Каждая задача опирается на решения из `ARCHITECTURE.md`. Делать по порядку —
> каждая следующая зависит от предыдущей (Prisma-схема нужна раньше модулей,
> модули — раньше фронтенда и т.д.).

## Backend

1. **Скаффолд NestJS** — `nest new backend`, зависимости: `@nestjs/config`,
   `@prisma/client` + `prisma`, `passport`, `passport-jwt`, `passport-local`,
   `@nestjs/passport`, `@nestjs/jwt`, `bcrypt`, `class-validator`,
   `class-transformer`, `@nestjs/websockets`, `@nestjs/platform-socket.io`,
   `@adminjs/nestjs`, `@adminjs/prisma`, `cookie-parser`, `joi`.
2. **Prisma schema + миграция** — `backend/prisma/schema.prisma` по модели из
   ARCHITECTURE.md, `npx prisma migrate dev --name init`, `backend/prisma/seed.ts`
   (upsert админа из `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
3. **Инфраструктурные модули** — `PrismaModule`/`PrismaService` (глобальный),
   `ConfigModule` с Joi-валидацией env, `common/`: `Role` enum, `@Roles()`
   decorator, `RolesGuard`, `JwtAuthGuard`, глобальный exception filter.
4. **Auth-модуль** — `POST /auth/register` (роль всегда STUDENT),
   `POST /auth/login` (LocalStrategy → JWT в httpOnly cookie), `JwtStrategy`
   читает токен из cookie, `GET /auth/me`.
5. **Users-модуль** — `GET /users/me`; админ-эндпоинты: смена роли/группы
   пользователя (используются AdminJS, но должны быть и в сервисе как API).
6. **Groups-модуль** — CRUD (ADMIN), `GET /groups` (для селектов на фронте).
7. **Disciplines + Assignment** — CRUD дисциплин (ADMIN), CRUD `Assignment`
   (ADMIN): привязка teacher↔discipline↔group.
8. **Schedule-модуль** — `pair-times.constant.ts`, CRUD `ScheduleEntry` (ADMIN,
   с валидацией на существующий `Assignment`), `GET /schedule?groupId=`/
   `?teacherId=` для просмотра своего расписания.
9. **Grades-модуль** — `POST /grades` (TEACHER, только если есть `Assignment`
   на эту дисциплину+группу и студент в этой группе), `GET /grades?studentId=`
   (студент видит свои, преподаватель — по своим дисциплинам).
10. **Messages-модуль** — `MessagesService` (сохранение, валидация «ровно один
    из receiverId/groupId», проверка права личной переписки через `Assignment`),
    `GET /messages/dm/:userId` и `GET /messages/group/:groupId` (история),
    `MessagesGateway` (Socket.io, `WsJwtGuard` из cookie в handshake, комнаты
    `dm:<sortedIds>` и `group:<id>`).
11. **Admin-модуль** — `@adminjs/nestjs` на `/admin`, ресурсы: User, Group,
    Discipline, Assignment, ScheduleEntry (Grade/Message — read-only ресурсы
    для модерации, по желанию).
12. **docker-compose.yml + entrypoint** — 3 сервиса (postgres/backend/frontend)
    по описанию из ARCHITECTURE.md, `.env`/`backend/.env` по шаблону оттуда же.

## Frontend

13. **Скаффолд Vite** — `npm create vite@latest frontend -- --template
    react-ts`, зависимости: `@tanstack/react-query`, `axios`,
    `socket.io-client`, `react-router-dom`. `vite.config.ts` — dev-proxy
    `/api`, `/socket.io` → backend.
14. **Инфраструктура** — `lib/axios.ts` (`withCredentials: true` для cookie),
    `lib/queryClient.ts`, `lib/socket.ts`; `router/` с `RequireRole`;
    `features/auth/` (AuthContext на `GET /auth/me`, LoginPage, RegisterPage).
15. **Schedule + Grades** — `features/schedule/` (таблица по дням/парам,
    `pairTimes.ts`), `features/grades/` (список оценок студента; форма
    выставления оценки для преподавателя).
16. **Messages** — `features/messages/` (список личных чатов + групповой чат
    группы, хук на сокет + TanStack Query для истории при первой загрузке).

## Финальная проверка

17. `docker compose up` — все три сервиса стартуют, `/admin` открывается,
    сидится админ. Сквозной путь: регистрация → логин → просмотр расписания
    своей группы (пусто, пока админ его не создал через `/admin`) → создание
    админом группы/дисциплины/assignment/расписания через `/admin` → студент
    видит расписание → преподаватель ставит оценку → студент видит оценку →
    обмен сообщениями в реальном времени (два браузера/вкладки).
