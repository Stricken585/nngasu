# Сайт вуза

Расписание, оценки и сообщения для студентов и преподавателей + админ-панель.
NestJS + Prisma + PostgreSQL на бэкенде, React + Vite + Mantine на фронтенде.

Документация: [DESIGN.md](DESIGN.md) — что делает продукт,
[ARCHITECTURE.md](ARCHITECTURE.md) — как устроен код, [TASKS.md](TASKS.md) — план реализации.

## Запуск (docker compose)

```sh
cp .env.example .env
cp backend/.env.example backend/.env   # поменяйте JWT_SECRET и ADMIN_PASSWORD
docker compose up --build              # или: podman compose up --build
```

- Сайт: http://localhost:5173
- Админ-панель: http://localhost:5173/admin (или напрямую http://localhost:3000/admin),
  вход — `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `backend/.env`

При старте backend сам применяет миграции и создаёт/обновляет админа (seed идемпотентный).

После изменения `package.json` пересоберите образы с обновлением анонимных
volume'ов, иначе контейнер останется со старыми `node_modules`:

```sh
docker compose up --build -V
```

## Первичная настройка

1. Пользователи регистрируются сами на `/register` — все получают роль «Студент».
2. В `/admin`: создать группы и дисциплины; преподавателям поменять роль,
   студентам назначить группу.
3. «Закрепления» — какой преподаватель какую дисциплину ведёт у какой группы.
   От них зависят права: выставлять оценки, переписываться лично, видеть групповой чат.
4. «Расписание» — пары создаются только для существующих закреплений и без пересечений
   по времени у группы и у преподавателя.

## Локальная разработка без docker

Нужен PostgreSQL. В `backend/.env` замените хост `postgres` на `localhost`.

```sh
cd backend && npm install && npx prisma migrate dev && npx prisma db seed && npm run start:dev
cd frontend && npm install && npm run dev
```

## Структура API

REST под `/api` (`/api/auth`, `/api/users`, `/api/groups`, `/api/disciplines`,
`/api/assignments`, `/api/schedule`, `/api/grades`, `/api/messages`), авторизация —
JWT в httpOnly-cookie. Реал-тайм — Socket.io на `/socket.io`: события `dm:join`,
`group:join`, `dm:send`, `group:send` (ответ в ack `{ ok, data | error }`),
входящие сообщения — событие `message`.
