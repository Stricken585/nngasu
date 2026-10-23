import { Alert, Button, Card, Group, List, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import type { Grade } from '../api/types'
import { QueryState } from '../components/QueryState'
import { useCurrentUser } from '../features/auth/AuthContext'
import { GradeBadge } from '../features/grades/GradeBadge'
import { useMyAssignments } from '../features/grades/useMyAssignments'
import { useGrades } from '../features/grades/useGrades'
import { NewsCard } from '../features/news/NewsCard'
import { useNews } from '../features/news/useNews'
import { currentWeekParity, DAYS, LESSON_TYPES, upcomingStudyDays } from '../features/schedule/labels'
import { PAIR_TIMES } from '../features/schedule/pairTimes'
import { useSchedule } from '../features/schedule/useSchedule'

const LAST_GRADES = 6

function DayCard({ date, day, isToday }: ReturnType<typeof upcomingStudyDays>[number]) {
  const user = useCurrentUser()
  const { data = [], isLoading, error } = useSchedule()
  const parity = currentWeekParity(date)
  const lessons = data
    .filter((e) => e.dayOfWeek === day && e.weekParity === parity)
    .sort((a, b) => a.pairNumber - b.pairNumber)
  const dayLabel = DAYS.find((d) => d.value === day)!.label
  const tomorrow = dayjs(date).diff(dayjs().startOf('day'), 'day') === 1

  return (
    <Card withBorder padding="lg" className={isToday ? 'is-today' : undefined}>
      <Group justify="space-between" align="baseline" mb="xs" wrap="nowrap">
        <Title order={4} fz="md">
          {isToday ? 'Сегодня' : tomorrow ? 'Завтра' : dayLabel}
        </Title>
        <Text size="sm" c="dimmed">
          {isToday || tomorrow ? `${dayLabel}, ` : ''}
          {dayjs(date).format('D MMMM')}
        </Text>
      </Group>
      <QueryState isLoading={isLoading} error={error}>
        {lessons.length === 0 ? (
          <Text c="dimmed">Пар нет.</Text>
        ) : (
          <div>
            {lessons.map((e) => (
              <div key={e.id} className="lesson-row">
                <time>{PAIR_TIMES[e.pairNumber].start}</time>
                <div>
                  <b>{e.discipline.name}</b>
                  <small>
                    {LESSON_TYPES[e.lessonType].label} · ауд. {e.room} ·{' '}
                    {user.role === 'STUDENT' ? e.teacher.fullName : e.group.name}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </Card>
  )
}

function LastGradesCard() {
  const { data = [], isLoading, error } = useGrades()
  const last: Grade[] = [...data]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LAST_GRADES)

  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" align="baseline" mb="xs">
        <Title order={4} fz="md">
          Последние оценки
        </Title>
        <Text size="sm" c="dimmed" component={Link} to="/grades" td="none">
          Все оценки
        </Text>
      </Group>
      <QueryState isLoading={isLoading} error={error}>
        {last.length === 0 ? (
          <Text c="dimmed">Оценок пока нет.</Text>
        ) : (
          <div>
            {last.map((g) => (
              <div key={g.id} className="grade-row">
                <div>
                  <b>{g.discipline.name}</b>
                  <small>
                    {dayjs(g.createdAt).format('D MMMM')} · {g.teacher.fullName}
                  </small>
                </div>
                <GradeBadge grade={g} />
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </Card>
  )
}

function TeacherGroupsCard() {
  const { data = [], isLoading, error } = useMyAssignments()

  const groups = new Map<string, { id: string; name: string; disciplines: string[] }>()
  for (const a of data) {
    const row = groups.get(a.group.id) ?? { id: a.group.id, name: a.group.name, disciplines: [] }
    row.disciplines.push(a.discipline.name)
    groups.set(a.group.id, row)
  }
  const rows = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  return (
    <Card withBorder padding="lg">
      <Title order={4} fz="md" mb="xs">
        Мои группы
      </Title>
      <QueryState isLoading={isLoading} error={error}>
        {rows.length === 0 ? (
          <Text c="dimmed">Администратор пока не закрепил за вами ни одной группы.</Text>
        ) : (
          <div>
            {rows.map((g) => (
              <div key={g.id} className="grade-row">
                <div>
                  <b>{g.name}</b>
                  <small>{g.disciplines.join(', ')}</small>
                </div>
                <Button component={Link} to={`/messages?chat=group:${g.id}`} variant="default" size="xs">
                  Чат
                </Button>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </Card>
  )
}

function LatestNewsCard() {
  const { data, isLoading, error } = useNews({ limit: 1 })
  const item = data?.[0]

  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" align="baseline" mb="xs">
        <Title order={4} fz="md">
          Новости вуза
        </Title>
        <Text size="sm" c="dimmed" component={Link} to="/news" td="none">
          Все новости
        </Text>
      </Group>
      <QueryState isLoading={isLoading} error={error}>
        {item ? <NewsCard item={item} clamp={6} /> : <Text c="dimmed">Новостей пока нет.</Text>}
      </QueryState>
    </Card>
  )
}

export function HomePage() {
  const user = useCurrentUser()
  const firstName = user.fullName.split(/\s+/)[1] ?? user.fullName

  if (user.role === 'ADMIN') {
    return (
      <Stack>
        <Title order={2} className="page-title">
          Здравствуйте, {firstName}!
        </Title>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Card withBorder padding="lg">
            <Title order={4} fz="md" mb="sm">
              Администрирование
            </Title>
            <Text mb="sm">Данные вуза настраиваются в админ-панели, по порядку:</Text>
            <List spacing={4} mb="md">
              <List.Item>Группы и дисциплины</List.Item>
              <List.Item>Пользователи: роль «Преподаватель», студентам — группа</List.Item>
              <List.Item>Закрепления: какой преподаватель какую дисциплину ведёт у какой группы</List.Item>
              <List.Item>Расписание (только по существующим закреплениям)</List.Item>
              <List.Item>Новости вуза (раздел «Контент»)</List.Item>
            </List>
            <Button component="a" href="/admin" target="_blank" rightSection={<IconExternalLink size={16} />}>
              Открыть админ-панель
            </Button>
          </Card>
          <LatestNewsCard />
        </SimpleGrid>
      </Stack>
    )
  }

  const days = upcomingStudyDays(3)

  return (
    <Stack>
      <Title order={2} className="page-title">
        Здравствуйте, {firstName}!
      </Title>
      {user.role === 'STUDENT' && !user.groupId && (
        <Alert color="yellow" title="Вы ещё не в группе">
          Администратор добавит вас в учебную группу — после этого появятся расписание, оценки и чаты.
        </Alert>
      )}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {days.map((d) => (
          <DayCard key={d.date.toISOString()} {...d} />
        ))}
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {user.role === 'STUDENT' && user.groupId && <LastGradesCard />}
        {user.role === 'TEACHER' && <TeacherGroupsCard />}
        <LatestNewsCard />
      </SimpleGrid>
    </Stack>
  )
}
