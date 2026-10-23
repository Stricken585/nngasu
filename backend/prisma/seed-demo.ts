import { DayOfWeek, LessonType, PrismaClient, Role, WeekParity } from '@prisma/client';
import bcrypt from 'bcrypt';

// Демо-данные: группа ПРИ23/1 (программисты), преподаватели, студенты и
// пятидневное расписание. Запуск: npx tsx prisma/seed-demo.ts
// Идемпотентно по email/названиям; расписание группы пересоздаётся целиком.
// В обычный `prisma db seed` намеренно не входит.
const prisma = new PrismaClient();

const TEACHER_PASSWORD = 'teacher123';
const STUDENT_PASSWORD = 'student123';
const GROUP = 'ПРИ23/1';

const teachers = {
  cpp: { email: 'kozlov@uni.ru', fullName: 'Козлов Дмитрий Андреевич', discipline: 'Программирование на C++' },
  db: { email: 'morozova@uni.ru', fullName: 'Морозова Елена Викторовна', discipline: 'Базы данных' },
  web: { email: 'volkov@uni.ru', fullName: 'Волков Сергей Петрович', discipline: 'Веб-разработка' },
  algo: { email: 'lebedeva@uni.ru', fullName: 'Лебедева Ольга Николаевна', discipline: 'Алгоритмы и структуры данных' },
  os: { email: 'novikov@uni.ru', fullName: 'Новиков Артём Игоревич', discipline: 'Операционные системы' },
  math: { email: 'sokolova@uni.ru', fullName: 'Соколова Марина Алексеевна', discipline: 'Дискретная математика' },
  eng: { email: 'orlova@uni.ru', fullName: 'Орлова Наталья Юрьевна', discipline: 'Английский язык' },
} as const;
type TeacherKey = keyof typeof teachers;

const students = [
  ['Абрамов Кирилл Денисович', 'abramov@uni.ru'],
  ['Белова Алиса Романовна', 'belova@uni.ru'],
  ['Васильев Максим Олегович', 'vasilev@uni.ru'],
  ['Громова Дарья Сергеевна', 'gromova@uni.ru'],
  ['Дмитриев Артур Ильич', 'dmitriev@uni.ru'],
  ['Егорова Полина Андреевна', 'egorova@uni.ru'],
  ['Жуков Тимур Русланович', 'zhukov@uni.ru'],
  ['Зайцева Кристина Павловна', 'zaitseva@uni.ru'],
  ['Исаев Никита Валерьевич', 'isaev@uni.ru'],
  ['Крылова Вера Михайловна', 'krylova@uni.ru'],
];

// [номер пары, преподаватель, тип, аудитория]
type Slot = [number, TeacherKey, LessonType, string];
const L = LessonType.LECTURE;
const P = LessonType.PRACTICE;
const B = LessonType.LAB;

const week: Record<WeekParity, Record<DayOfWeek, Slot[]>> = {
  ODD: {
    MONDAY: [[1, 'algo', L, '301'], [2, 'cpp', P, '412'], [3, 'math', L, '305']],
    TUESDAY: [[2, 'db', L, '210'], [3, 'db', B, '415'], [4, 'eng', P, '118']],
    WEDNESDAY: [[1, 'os', L, '301'], [2, 'web', B, '413'], [3, 'web', L, '210']],
    THURSDAY: [[2, 'algo', P, '412'], [3, 'cpp', L, '301'], [4, 'cpp', B, '414']],
    FRIDAY: [[1, 'math', P, '305'], [2, 'os', B, '414'], [3, 'eng', P, '118']],
    SATURDAY: [],
  },
  EVEN: {
    MONDAY: [[1, 'algo', L, '301'], [2, 'algo', B, '412'], [3, 'math', L, '305']],
    TUESDAY: [[2, 'db', L, '210'], [3, 'web', P, '413'], [4, 'eng', P, '118']],
    WEDNESDAY: [[1, 'os', L, '301'], [2, 'os', P, '414'], [3, 'web', L, '210']],
    THURSDAY: [[2, 'cpp', P, '412'], [3, 'cpp', L, '301'], [4, 'db', B, '415']],
    FRIDAY: [[1, 'math', P, '305'], [2, 'web', B, '413'], [3, 'eng', P, '118']],
    SATURDAY: [],
  },
};

async function main() {
  const teacherHash = await bcrypt.hash(TEACHER_PASSWORD, 10);
  const studentHash = await bcrypt.hash(STUDENT_PASSWORD, 10);

  const group = await prisma.group.upsert({ where: { name: GROUP }, update: {}, create: { name: GROUP } });

  const teacherIds = {} as Record<TeacherKey, string>;
  const disciplineIds = {} as Record<TeacherKey, string>;
  for (const key of Object.keys(teachers) as TeacherKey[]) {
    const t = teachers[key];
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { role: Role.TEACHER, groupId: null },
      create: { email: t.email, fullName: t.fullName, password: teacherHash, role: Role.TEACHER },
    });
    const discipline = await prisma.discipline.upsert({
      where: { name: t.discipline },
      update: {},
      create: { name: t.discipline },
    });
    await prisma.assignment.upsert({
      where: { teacherId_disciplineId_groupId: { teacherId: user.id, disciplineId: discipline.id, groupId: group.id } },
      update: {},
      create: { teacherId: user.id, disciplineId: discipline.id, groupId: group.id },
    });
    teacherIds[key] = user.id;
    disciplineIds[key] = discipline.id;
  }

  for (const [fullName, email] of students) {
    await prisma.user.upsert({
      where: { email },
      update: { groupId: group.id },
      create: { email, fullName, password: studentHash, role: Role.STUDENT, groupId: group.id },
    });
  }

  await prisma.scheduleEntry.deleteMany({ where: { groupId: group.id } });
  const entries = (Object.keys(week) as WeekParity[]).flatMap((weekParity) =>
    (Object.keys(week[weekParity]) as DayOfWeek[]).flatMap((dayOfWeek) =>
      week[weekParity][dayOfWeek].map(([pairNumber, key, lessonType, room]) => ({
        dayOfWeek,
        weekParity,
        pairNumber,
        room,
        lessonType,
        groupId: group.id,
        teacherId: teacherIds[key],
        disciplineId: disciplineIds[key],
      })),
    ),
  );
  await prisma.scheduleEntry.createMany({ data: entries });

  console.log(
    `Демо: группа ${GROUP}, преподавателей ${Object.keys(teachers).length}, новых студентов ${students.length}, пар ${entries.length}`,
  );
  console.log(`Пароли: преподаватели ${TEACHER_PASSWORD}, студенты ${STUDENT_PASSWORD}`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
