# Диаграмма базы данных

Источник: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) (PostgreSQL).
Диаграмма в формате Mermaid — отображается на GitHub/GitLab и в VS Code (расширение Markdown Preview Mermaid).

```mermaid
erDiagram
    Group ||--o{ User : "студенты (groupId)"
    Group ||--o{ Assignment : ""
    Group ||--o{ ScheduleEntry : ""
    Group |o--o{ Message : "групповая рассылка"

    User ||--o{ Assignment : "преподаватель"
    User ||--o{ ScheduleEntry : "преподаватель"
    User ||--o{ Grade : "выставил (teacher)"
    User ||--o{ Grade : "получил (student)"
    User ||--o{ Message : "отправил (sender)"
    User |o--o{ Message : "получил (receiver)"

    Discipline ||--o{ Assignment : ""
    Discipline ||--o{ ScheduleEntry : ""
    Discipline ||--o{ Grade : ""

    User {
        uuid id PK
        string email UK
        string password "bcrypt-хэш"
        string fullName
        Role role "STUDENT | TEACHER | ADMIN"
        uuid groupId FK "nullable, только для STUDENT"
        datetime createdAt
    }

    Group {
        uuid id PK
        string name UK "например ИВТ-21-1"
    }

    Discipline {
        uuid id PK
        string name UK
    }

    Assignment {
        uuid id PK
        uuid teacherId FK
        uuid disciplineId FK
        uuid groupId FK
    }

    ScheduleEntry {
        uuid id PK
        DayOfWeek dayOfWeek "MONDAY..SATURDAY"
        WeekParity weekParity "EVEN | ODD"
        int pairNumber "1-6"
        string room
        LessonType lessonType "LECTURE | PRACTICE | LAB"
        uuid disciplineId FK
        uuid teacherId FK
        uuid groupId FK
    }

    Grade {
        uuid id PK
        decimal value "Decimal(3,2), 5-балльная"
        uuid studentId FK
        uuid teacherId FK
        uuid disciplineId FK
        datetime createdAt
    }

    Message {
        uuid id PK
        string content
        uuid senderId FK
        uuid receiverId FK "nullable, личное сообщение"
        uuid groupId FK "nullable, групповая рассылка"
        datetime createdAt
    }
```

## Перевод названий таблиц

| Таблица         | Перевод                        | Назначение                                        |
| --------------- | ------------------------------ | ------------------------------------------------- |
| `User`          | Пользователь                   | Студент, преподаватель или администратор          |
| `Group`         | Группа                         | Учебная группа                                    |
| `Discipline`    | Дисциплина                     | Учебный предмет                                   |
| `Assignment`    | Назначение (нагрузка)          | Какой преподаватель ведёт дисциплину у какой группы |
| `ScheduleEntry` | Запись расписания              | Одна пара: день, чётность недели, номер, аудитория |
| `Grade`         | Оценка                         | Оценка студента по дисциплине                     |
| `Message`       | Сообщение                      | Личное сообщение или рассылка группе              |

## Примечания

- `Assignment` — связь «многие-ко-многим» преподаватель ↔ дисциплина ↔ группа; уникальна по тройке `(teacherId, disciplineId, groupId)`. От расписания не зависит.
- `Message`: заполнен либо `receiverId` (личное), либо `groupId` (рассылка группе).
- Все внешние ключи, кроме `User.groupId`, имеют `ON DELETE CASCADE`; `User.groupId` — `ON DELETE SET NULL`.
- Перечисления: `Role`, `LessonType`, `WeekParity`, `DayOfWeek` (хранятся как enum PostgreSQL).
