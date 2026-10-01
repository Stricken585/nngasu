import { Alert, Badge, Button, Card, Group, List, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconCalendar, IconExternalLink, IconMessages, IconStar } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { QueryState } from '../components/QueryState'
import { useCurrentUser } from '../features/auth/AuthContext'
import { currentWeekParity, DAYS, LESSON_TYPES, PARITY_LABELS, todayDayOfWeek } from '../features/schedule/labels'
import { PAIR_TIMES } from '../features/schedule/pairTimes'
import { useSchedule } from '../features/schedule/useSchedule'

function TodayLessons() {
  const user = useCurrentUser()
  const { data = [], isLoading, error } = useSchedule()
  const day = todayDayOfWeek()
  const parity = currentWeekParity()
  const lessons = data
    .filter((e) => e.dayOfWeek === day && e.weekParity === parity)
    .sort((a, b) => a.pairNumber - b.pairNumber)

  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Сегодня</Title>
        <Text size="sm" c="dimmed">
          {day ? DAYS.find((d) => d.value === day)!.label : 'Воскресенье'} · {PARITY_LABELS[parity].toLowerCase()} неделя
        </Text>
      </Group>
      <QueryState isLoading={isLoading} error={error}>
        {lessons.length === 0 ? (
          <Text c="dimmed">Пар нет.</Text>
        ) : (
          <Stack gap="sm">
            {lessons.map((e) => (
              <Group key={e.id} wrap="nowrap" align="flex-start">
                <Badge variant="outline" w={110} style={{ flexShrink: 0 }}>
                  {e.pairNumber} · {PAIR_TIMES[e.pairNumber].start}
                </Badge>
                <div>
                  <Text fw={500} lh={1.3}>
                    {e.discipline.name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {LESSON_TYPES[e.lessonType].label} · ауд. {e.room} ·{' '}
                    {user.role === 'STUDENT' ? e.teacher.fullName : e.group.name}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>
        )}
      </QueryState>
    </Card>
  )
}

function QuickLink({ to, icon, title, text }: { to: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Card withBorder radius="md" padding="lg" component={Link} to={to}>
      <Group gap="sm" mb={4}>
        {icon}
        <Text fw={600}>{title}</Text>
      </Group>
      <Text size="sm" c="dimmed">
        {text}
      </Text>
    </Card>
  )
}

export function HomePage() {
  const user = useCurrentUser()
  const firstName = user.fullName.split(/\s+/)[1] ?? user.fullName

  if (user.role === 'ADMIN') {
    return (
      <Stack maw={720}>
        <Title order={2}>Здравствуйте, {firstName}!</Title>
        <Card withBorder radius="md" padding="lg">
          <Title order={4} mb="sm">
            Администрирование
          </Title>
          <Text mb="sm">Данные вуза настраиваются в админ-панели, по порядку:</Text>
          <List spacing={4} mb="md">
            <List.Item>Группы и дисциплины</List.Item>
            <List.Item>Пользователи: роль «Преподаватель», студентам — группа</List.Item>
            <List.Item>Закрепления: какой преподаватель какую дисциплину ведёт у какой группы</List.Item>
            <List.Item>Расписание (только по существующим закреплениям)</List.Item>
          </List>
          <Button component="a" href="/admin" target="_blank" rightSection={<IconExternalLink size={16} />}>
            Открыть админ-панель
          </Button>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack>
      <Title order={2}>Здравствуйте, {firstName}!</Title>
      {user.role === 'STUDENT' && !user.groupId && (
        <Alert color="yellow" title="Вы ещё не в группе">
          Администратор добавит вас в учебную группу — после этого появятся расписание, оценки и чаты.
        </Alert>
      )}
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <TodayLessons />
        <Stack>
          <QuickLink
            to="/schedule"
            icon={<IconCalendar size={20} />}
            title="Расписание"
            text={user.role === 'STUDENT' ? 'Пары вашей группы на неделю' : 'Ваши пары и расписание групп'}
          />
          <QuickLink
            to="/grades"
            icon={<IconStar size={20} />}
            title="Оценки"
            text={user.role === 'STUDENT' ? 'Оценки по дисциплинам и средний балл' : 'Выставить оценки студентам'}
          />
          <QuickLink
            to="/messages"
            icon={<IconMessages size={20} />}
            title="Сообщения"
            text={user.role === 'STUDENT' ? 'Написать преподавателю или в чат группы' : 'Личные сообщения и чаты групп'}
          />
        </Stack>
      </SimpleGrid>
    </Stack>
  )
}
