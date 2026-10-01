# Сайт вуза — архитектура проекта

> Дополняет `DESIGN.md`. Здесь зафиксировано, как организован код (модульная
> архитектура backend/frontend), а не что делает продукт.

## Почему не классический MVC

NestJS-бэкенд — чистый API без серверного рендеринга, View рисует отдельный
React SPA. Поэтому вместо буквального MVC используется **модульная
архитектура NestJS** (Module → Controller → Service → Repository/Prisma) —
по сути та же идея MVC, адаптированная под связку API + SPA:

- **Controller** — маршрутизация, валидация DTO, ничего больше
- **Service** — бизнес-логика (аналог "толстой модели" в классическом MVC,
  вынесенный в отдельный слой ради тестируемости)
- **Prisma-модели** — Model (доступ к данным)
- **View** — отдельный React SPA, общается с backend только через REST/WS

На фронтенде роль "Model"-слоя играет **TanStack Query** поверх REST-клиентов:
кэширование, статусы загрузки/ошибок из коробки, компоненты остаются чистым
View.

## Структура репозитория (монорепо)

```
/
├── docker-compose.yml
├── .gitignore
├── backend/
│   ├── package.json, tsconfig.json, nest-cli.json, Dockerfile, .env.example
│   ├── prisma/schema.prisma
│   └── src/
│       ├── main.ts, app.module.ts
│       ├── config/           # ConfigModule + валидация env
│       ├── prisma/           # PrismaModule/PrismaService (глобальный провайдер)
│       ├── common/           # RolesGuard, JwtAuthGuard, @Roles(), Role enum, exception filter
│       ├── auth/             # регистрация/логин, JWT (passport-jwt, passport-local)
│       ├── users/            # профиль, назначение ролей
│       ├── groups/           # CRUD групп
│       ├── disciplines/      # CRUD дисциплин + Assignment (teacher↔discipline↔group)
│       ├── schedule/         # CRUD записей расписания, чтение по группе/преподавателю
│       ├── grades/           # выставление и просмотр оценок
│       ├── messages/         # REST история + messages.gateway.ts (Socket.io: личные + групповые)
│       └── admin/            # монтирование AdminJS (@adminjs/nestjs) на /admin
└── frontend/
    ├── package.json, tsconfig.json, vite.config.ts, Dockerfile
    └── src/
        ├── main.tsx, App.tsx
        ├── lib/               # axios-инстанс с JWT-интерцептором, queryClient, socket.ts
        ├── api/                # REST-клиенты по доменам (auth, schedule, grades, messages...)
        ├── features/<domain>/  # компоненты + TanStack Query hooks по каждому домену
        ├── pages/              # роуты, компонуют features
        ├── components/         # общий UI (Layout, Navbar, ProtectedRoute)
        └── router/             # react-router + RequireRole-обёртка
```

## Ключевые архитектурные решения

- **RBAC:** `Role` enum (`STUDENT`, `TEACHER`, `ADMIN`) в Prisma-модели `User`.
  `@Roles(Role.TEACHER)` + `RolesGuard` на контроллерах.
- **Auth:** JWT в httpOnly cookie (проще и безопаснее localStorage), без
  refresh-токена для MVP — один access-токен с TTL ~7 дней. `LocalStrategy`
  для логина, `JwtStrategy` для защищённых роутов.
- **Дополнение к модели данных из DESIGN.md:** отдельная join-таблица
  `Assignment` (teacherId, disciplineId, groupId), не привязанная к
  конкретным парам в расписании. Нужна, чтобы:
  1. проверять, что преподаватель вправе ставить оценку по дисциплине этой
     группе, даже если сейчас нет записи в расписании;
  2. проверять, что студент может писать личное сообщение именно тем
     преподавателям, которые ведут его группу.

  `ScheduleEntry` продолжает хранить discipline+teacher+group напрямую (как в
  DESIGN.md), но при создании валидируется на соответствие существующему
  `Assignment`.
- **Real-time:** `MessagesGateway` (Socket.io) с JWT из handshake
  (`WsJwtGuard`), комнаты `group:<id>` для группового чата и `dm:<sortedIds>`
  для личных сообщений; сообщения сохраняются в БД через `MessagesService` и
  отдаются REST-эндпоинтом истории при первой загрузке страницы (без
  реал-тайма для истории — оговорено в DESIGN.md).
- **AdminJS:** монтируется внутри того же Nest-процесса на `/admin`
  (`@adminjs/nestjs` + `@adminjs/prisma`), отдельный контейнер не нужен —
  сходится с docker-compose на 3 сервиса (postgres/backend/frontend).
- **Frontend data layer:** TanStack Query поверх `api/*.ts` (fetch/axios);
  отдельно лёгкий React Context только для auth-сессии и socket-соединения
  (то, что не является серверным кэшем и не подходит под TanStack Query).

## Модель данных (Prisma)

Уточняет `DESIGN.md` до уровня полей. Точки, закрытые отдельно (не следуют
напрямую из DESIGN.md):

- `Grade` — без поля семестра: MVP отслеживает только текущий семестр, порядок
  оценок — по `createdAt`.
- `Message` — без read/unread-статуса; ровно одно из `receiverId`/`groupId`
  заполнено (личное сообщение либо групповая рассылка), проверяется в
  `MessagesService`, т.к. Prisma не поддерживает CHECK-констрейнты нативно.
- `User` — одна таблица с nullable `groupId` (используется только при
  `role = STUDENT`), без отдельных `StudentProfile`/`TeacherProfile`.
- `ScheduleEntry.pairNumber` — просто `Int` (1–6), время пары не хранится в БД,
  а берётся из константы `PAIR_TIMES` (см. ниже).

```prisma
enum Role       { STUDENT TEACHER ADMIN }
enum LessonType { LECTURE PRACTICE LAB }
enum WeekParity { EVEN ODD }
enum DayOfWeek  { MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY }

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String                // bcrypt-хэш
  fullName  String
  role      Role     @default(STUDENT)
  groupId   String?                // только для role = STUDENT
  group     Group?   @relation(fields: [groupId], references: [id])
  createdAt DateTime @default(now())

  assignments      Assignment[]
  scheduleEntries  ScheduleEntry[]
  gradesGiven      Grade[]         @relation("GradesGivenByTeacher")
  gradesReceived   Grade[]         @relation("GradesReceivedByStudent")
  sentMessages     Message[]       @relation("SentMessages")
  receivedMessages Message[]       @relation("ReceivedMessages")
}

model Group {
  id              String          @id @default(uuid())
  name            String          @unique   // "ИВТ-21-1"
  students        User[]
  assignments     Assignment[]
  scheduleEntries ScheduleEntry[]
  groupMessages   Message[]
}

model Discipline {
  id              String          @id @default(uuid())
  name            String          @unique
  assignments     Assignment[]
  scheduleEntries ScheduleEntry[]
  grades          Grade[]
}

// многие-ко-многим teacher↔discipline↔group, не завязана на расписание
model Assignment {
  id           String     @id @default(uuid())
  teacherId    String
  teacher      User       @relation(fields: [teacherId], references: [id])
  disciplineId String
  discipline   Discipline @relation(fields: [disciplineId], references: [id])
  groupId      String
  group        Group      @relation(fields: [groupId], references: [id])

  @@unique([teacherId, disciplineId, groupId])
}

model ScheduleEntry {
  id           String     @id @default(uuid())
  dayOfWeek    DayOfWeek
  weekParity   WeekParity
  pairNumber   Int                 // 1-6, время — см. PAIR_TIMES в коде
  room         String
  lessonType   LessonType
  disciplineId String
  discipline   Discipline @relation(fields: [disciplineId], references: [id])
  teacherId    String
  teacher      User       @relation(fields: [teacherId], references: [id])
  groupId      String
  group        Group      @relation(fields: [groupId], references: [id])
}

model Grade {
  id           String     @id @default(uuid())
  value        Decimal    @db.Decimal(3, 2)   // 5-балльная, дробная (напр. 4.60)
  studentId    String
  student      User       @relation("GradesReceivedByStudent", fields: [studentId], references: [id])
  teacherId    String
  teacher      User       @relation("GradesGivenByTeacher", fields: [teacherId], references: [id])
  disciplineId String
  discipline   Discipline @relation(fields: [disciplineId], references: [id])
  createdAt    DateTime   @default(now())
}

model Message {
  id         String   @id @default(uuid())
  content    String
  senderId   String
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiverId String?                          // личное сообщение
  receiver   User?    @relation("ReceivedMessages", fields: [receiverId], references: [id])
  groupId    String?                          // групповая рассылка
  group      Group?   @relation(fields: [groupId], references: [id])
  createdAt  DateTime @default(now())
}
```

`PAIR_TIMES` — константа-справочник (1 → "9:00–10:30", 2 → "10:40–12:10", ...),
не хранится в БД, дублируется в `backend/src/schedule/pair-times.constant.ts`
и `frontend/src/features/schedule/pairTimes.ts` (для 6 записей дублирование
дешевле отдельного эндпоинта).

## Переменные окружения

`.env` в корне (читает `docker-compose.yml`, задаёт Postgres):

```
POSTGRES_USER=university
POSTGRES_PASSWORD=change-me
POSTGRES_DB=university
```

`backend/.env`:

```
DATABASE_URL=postgresql://university:change-me@postgres:5432/university?schema=public
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
COOKIE_NAME=access_token
PORT=3000
ADMIN_EMAIL=admin@university.local
ADMIN_PASSWORD=change-me
```

`frontend/.env` — не нужен: Vite dev-proxy делает API same-origin, отдельный
`VITE_API_URL` не требуется.

## Docker-compose (dev-режим)

Три сервиса, без nginx — прод-сборка (multi-stage build + nginx) остаётся
отдельной задачей на будущее, если/когда понадобится деплой:

- **postgres** — `postgres:16-alpine`, именованный volume для данных, env из
  корневого `.env`.
- **backend** — bind-mount `./backend:/app` (+ анонимный volume на
  `/app/node_modules`, чтобы не затирался хостовым), entrypoint:
  `npx prisma migrate deploy && npx prisma db seed && npm run start:dev`.
  Seed (`backend/prisma/seed.ts`) — идемпотентный upsert админа из
  `ADMIN_EMAIL`/`ADMIN_PASSWORD`, поэтому безопасно гонять на каждый старт.
- **frontend** — bind-mount `./frontend:/app`, команда `npm run dev -- --host
  0.0.0.0`. В `vite.config.ts` — `server.proxy`: `/api` и `/socket.io` →
  `http://backend:3000` (внутри docker-сети по имени сервиса; локально без
  compose — `http://localhost:3000`), `/socket.io` с `ws: true`.

## Критичные файлы (ориентир для будущей реализации)

- `backend/prisma/schema.prisma` — вся модель данных одним файлом, основа для
  всего остального.
- `backend/src/common/guards/roles.guard.ts` + `common/decorators/roles.decorator.ts`
  — переиспользуются во всех модулях с ограничением доступа.
- `backend/src/messages/messages.gateway.ts` — единственная WS-точка,
  структурно отличается от остальных REST-модулей.
- `backend/src/admin/admin.module.ts` — интеграция AdminJS с Prisma-ресурсами.
- `frontend/src/lib/queryClient.ts`, `frontend/src/lib/axios.ts` —
  инфраструктура, от которой зависят все `features/*`.
- `docker-compose.yml` — связывает три сервиса и общую сеть/volume для
  Postgres.

## Дальнейшие шаги

Реализация разбита на последовательные задачи — см. `TASKS.md`.
