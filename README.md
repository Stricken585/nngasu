# Сайт вуза

Веб-приложение для студентов и преподавателей: расписание, оценки и сообщения
(личные и групповой чат в реальном времени), плюс админ-панель для управления данными.

## Содержание

- [Возможности](#возможности)
- [Стек](#стек)
- [Архитектура](#архитектура)
- [Структура репозитория](#структура-репозитория)
- [Модель данных](#модель-данных)
- [Запуск](#запуск)
- [Первичная настройка](#первичная-настройка)
- [API](#api)
- [Документация](#документация)

## Возможности

| Роль | Что может |
|------|-----------|
| **Студент** (по умолчанию после регистрации) | смотреть расписание своей группы и свои оценки; писать преподавателям; участвовать в чате группы |
| **Преподаватель** | смотреть своё расписание; ставить оценки; писать студентам лично и в чат группы |
| **Администратор** | через `/admin`: группы, дисциплины, закрепления, расписание, пользователи и их роли |

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | NestJS 12, TypeScript, Passport (JWT + local), class-validator, Joi |
| База данных | PostgreSQL 16, Prisma ORM |
| Реал-тайм | Socket.io (NestJS WebSocket Gateway) |
| Админ-панель | AdminJS (встроена в процесс backend) |
| Frontend | React 19, Vite, TypeScript, Mantine UI, React Router, TanStack Query, Axios |
| Инфраструктура | Docker / Podman Compose |
| Инструменты | Vitest, oxlint, Prettier |

## Архитектура

```
┌────────────┐   REST /api + cookie (JWT)    ┌──────────────────────┐    ┌────────────┐
│  Браузер   │ ────────────────────────────▶ │  Backend (NestJS)    │───▶│ PostgreSQL │
│ React SPA  │ ◀──────────────────────────── │  :3000               │    │  (Prisma)  │
│  :5173     │   Socket.io /socket.io        │  + AdminJS на /admin │    └────────────┘
└────────────┘                               └──────────────────────┘
```

- **Backend** — модульный NestJS: `Module → Controller → Service → Prisma`.
  Controller только маршрутизирует и валидирует DTO, вся логика — в Service.
  Классический MVC здесь не нужен: сервер отдаёт только API, «View» — отдельное SPA.
- **Авторизация** — JWT в httpOnly-cookie (без refresh-токена). Роли проверяются
  через `@Roles()` + `RolesGuard`, публичные эндпоинты помечены `@Public()`.
- **Закрепления (`Assignment`)** — связка «преподаватель — дисциплина — группа».
  От неё зависят права: кто может ставить оценки, кому студент может писать,
  какие пары можно добавить в расписание.
- **Чат** — `MessagesGateway` аутентифицирует сокет по JWT из handshake; комнаты
  `group:<id>` и `dm:<id1>:<id2>`. Сообщения сохраняются в БД, история отдаётся по REST.
- **Frontend** — код разбит по доменам (`features/<домен>`), серверное состояние
  кэширует TanStack Query, сессия и сокет живут в React Context, доступ к страницам
  ограничивает `RequireRole`.
- **Dev-проксирование** — Vite проксирует `/api`, `/admin` и `/socket.io` на backend
  (`API_PROXY_TARGET`), поэтому в браузере всё идёт с одного origin.

## Структура репозитория

```
.
├── docker-compose.yml        # postgres + backend + frontend
├── backend/
│   ├── prisma/               # schema.prisma, миграции, seed админа
│   └── src/
│       ├── auth/             # регистрация, логин, JWT
│       ├── users/            # профиль, роли, привязка к группе
│       ├── groups/           # группы
│       ├── disciplines/      # дисциплины и закрепления (Assignment)
│       ├── schedule/         # расписание, время пар
│       ├── grades/           # оценки
│       ├── messages/         # история (REST) + Socket.io gateway
│       ├── admin/            # AdminJS (русская локализация)
│       ├── common/           # guards, декораторы, фильтр ошибок Prisma
│       ├── config/           # валидация переменных окружения
│       └── prisma/           # PrismaService
└── frontend/src/
    ├── api/                  # REST-клиенты и типы
    ├── features/             # auth, schedule, grades, messages
    ├── pages/                # страницы-роуты
    ├── components/           # общий UI (Layout и др.)
    ├── router/               # маршруты и RequireRole
    └── lib/                  # axios, queryClient, socket
```

## Модель данных

`User` (роль `STUDENT` / `TEACHER` / `ADMIN`, у студента есть `groupId`) ·
`Group` · `Discipline` · `Assignment` (преподаватель + дисциплина + группа) ·
`ScheduleEntry` (день недели, номер пары, чётность недели, аудитория, тип занятия) ·
`Grade` (дробная оценка по 5-балльной шкале, история по дисциплине) ·
`Message` (личное или групповое, только текст).

Полная схема — `backend/prisma/schema.prisma`.

## Запуск

### Docker Compose

```sh
cp .env.example .env
cp backend/.env.example backend/.env   # поменяйте JWT_SECRET и ADMIN_PASSWORD
docker compose up --build              # или: podman compose up --build
```

- Сайт: http://localhost:5173
- Админ-панель: http://localhost:5173/admin (или http://localhost:3000/admin),
  вход — `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `backend/.env`

При старте backend сам применяет миграции и создаёт/обновляет админа (seed идемпотентный).

После изменения `package.json` пересоберите образы с обновлением volume'ов,
иначе контейнер останется со старыми `node_modules`:

```sh
docker compose up --build -V
```

### Без Docker

Нужен PostgreSQL. В `backend/.env` замените хост `postgres` на `localhost`.

```sh
cd backend && npm install && npx prisma migrate dev && npx prisma db seed && npm run start:dev
cd frontend && npm install && npm run dev
```

### Полезные команды

| Где | Команда | Что делает |
|-----|---------|-----------|
| `backend` | `npm test` / `npm run test:e2e` | unit- и e2e-тесты (Vitest) |
| `backend` | `npm run lint` | oxlint |
| `frontend` | `npm run build` | проверка типов и сборка |
| `frontend` | `npm run lint` | oxlint |

## Первичная настройка

1. Пользователи регистрируются сами на `/register` — все получают роль «Студент».
2. В `/admin`: создать группы и дисциплины; преподавателям поменять роль,
   студентам назначить группу.
3. «Закрепления» — какой преподаватель какую дисциплину ведёт у какой группы.
4. «Расписание» — пары создаются только для существующих закреплений и без
   пересечений по времени у группы и у преподавателя.

## API

REST под префиксом `/api`:

| Префикс | Назначение |
|---------|-----------|
| `/api/auth` | регистрация, вход, выход, текущий пользователь |
| `/api/users` | профиль, список, смена роли и группы |
| `/api/groups` | группы и их студенты |
| `/api/disciplines` | дисциплины |
| `/api/assignments` | закрепления (в т.ч. `my` — свои) |
| `/api/schedule` | расписание, `pair-times` — время пар |
| `/api/grades` | оценки |
| `/api/messages` | контакты, история личных и групповых сообщений |

Реал-тайм — Socket.io на `/socket.io`. События клиента: `dm:join`, `group:join`,
`dm:send`, `group:send` (ответ в ack: `{ ok, data | error }`). Входящие сообщения
приходят событием `message`.

## Документация

- [DESIGN.md](DESIGN.md) — что делает продукт: роли, сущности, объём MVP
- [ARCHITECTURE.md](ARCHITECTURE.md) — как устроен код и почему
- [TASKS.md](TASKS.md) — план реализации
