import { Badge, Card, Group, Paper, ScrollArea, Stack, Table, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import type { ScheduleEntry, WeekParity } from '../../api/types'
import { DAYS, LESSON_TYPES, todayDayOfWeek } from './labels'
import { PAIR_NUMBERS, PAIR_TIMES } from './pairTimes'

interface Props {
  entries: ScheduleEntry[]
  parity: WeekParity
  // Для преподавателя/админа в ячейке важнее группа, для студента — преподаватель.
  show: 'teacher' | 'group' | 'both'
}

function Lesson({ entry, show }: { entry: ScheduleEntry; show: Props['show'] }) {
  const type = LESSON_TYPES[entry.lessonType]
  return (
    <Stack gap={2}>
      <Text size="sm" fw={600} lh={1.25} style={{ overflowWrap: 'anywhere' }}>
        {entry.discipline.name}
      </Text>
      <Badge size="xs" variant="light" color={type.color} w="fit-content">
        {type.label}
      </Badge>
      {(show === 'teacher' || show === 'both') && (
        <Text size="xs" c="dimmed">
          {entry.teacher.fullName}
        </Text>
      )}
      {(show === 'group' || show === 'both') && (
        <Text size="xs" c="dimmed">
          {entry.group.name}
        </Text>
      )}
      <Text size="xs" c="dimmed">
        ауд. {entry.room}
      </Text>
    </Stack>
  )
}

// На телефоне сетка 6×6 не помещается — показываем список по дням.
function ScheduleByDay({ entries, show }: { entries: ScheduleEntry[]; show: Props['show'] }) {
  const today = todayDayOfWeek()
  const days = DAYS.map((d) => ({ ...d, lessons: entries.filter((e) => e.dayOfWeek === d.value) })).filter(
    (d) => d.lessons.length > 0,
  )
  if (days.length === 0) return <Text c="dimmed">На этой неделе пар нет.</Text>

  return (
    <Stack>
      {days.map((d) => (
        <Card key={d.value} withBorder radius="md" padding="sm" bg={d.value === today ? 'var(--mantine-color-blue-light)' : undefined}>
          <Text fw={700} mb="xs">
            {d.label}
          </Text>
          <Stack gap="sm">
            {d.lessons
              .sort((a, b) => a.pairNumber - b.pairNumber)
              .map((e) => (
                <Group key={e.id} align="flex-start" wrap="nowrap" gap="sm">
                  <Stack gap={0} w={70} style={{ flexShrink: 0 }}>
                    <Text fw={600} size="sm">
                      {e.pairNumber} пара
                    </Text>
                    <Text size="xs" c="dimmed">
                      {PAIR_TIMES[e.pairNumber].start}–{PAIR_TIMES[e.pairNumber].end}
                    </Text>
                  </Stack>
                  <Lesson entry={e} show={show} />
                </Group>
              ))}
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}

export function ScheduleTable({ entries, parity, show }: Props) {
  const today = todayDayOfWeek()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const visible = entries.filter((e) => e.weekParity === parity)
  const cell = (day: string, pair: number) => visible.filter((e) => e.dayOfWeek === day && e.pairNumber === pair)

  if (isMobile) return <ScheduleByDay entries={visible} show={show} />

  return (
    <Paper withBorder radius="md">
      <ScrollArea type="auto">
        <Table withColumnBorders layout="fixed" miw={900} verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={90}>Пара</Table.Th>
              {DAYS.map((d) => (
                <Table.Th key={d.value} bg={d.value === today ? 'var(--mantine-color-blue-light)' : undefined}>
                  {d.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {PAIR_NUMBERS.map((pair) => (
              <Table.Tr key={pair}>
                <Table.Td>
                  <Text fw={600}>{pair}</Text>
                  <Text size="xs" c="dimmed">
                    {PAIR_TIMES[pair].start}–{PAIR_TIMES[pair].end}
                  </Text>
                </Table.Td>
                {DAYS.map((d) => (
                  <Table.Td key={d.value} style={{ verticalAlign: 'top' }}>
                    <Stack gap="sm">
                      {cell(d.value, pair).map((e) => (
                        <Lesson key={e.id} entry={e} show={show} />
                      ))}
                    </Stack>
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  )
}
