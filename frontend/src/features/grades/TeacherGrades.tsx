import {
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  Popover,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState } from 'react'
import { groupsApi } from '../../api/groups'
import type { Absence, Assignment, Grade, User } from '../../api/types'
import { QueryState } from '../../components/QueryState'
import { getErrorMessage } from '../../lib/axios'
import { useCurrentUser } from '../auth/AuthContext'
import { GradeBadge } from './GradeBadge'
import { average, formatDay, formatDayShort, formatGrade, STATUS_PRESETS } from './format'
import { useAttendance, useCreateGrade, useDeleteGrade, useGrades, useMarkAbsence, useRemoveAbsence } from './useGrades'
import { useMyAssignments } from './useMyAssignments'

// Форма записи на конкретную дату: «н», оценка и/или примечание со статусом.
function CellEditor({
  student,
  disciplineId,
  date,
  absence,
}: {
  student: User
  disciplineId: string
  date: string
  absence: Absence | undefined
}) {
  const [opened, setOpened] = useState(false)
  const [value, setValue] = useState<string | number>('')
  const [status, setStatus] = useState('')
  const [comment, setComment] = useState('')
  const create = useCreateGrade()
  const mark = useMarkAbsence()
  const unmark = useRemoveAbsence()

  const fail = (title: string) => (e: unknown) =>
    notifications.show({ color: 'red', title, message: getErrorMessage(e) })

  const canSubmit = typeof value === 'number' || !!status.trim() || !!comment.trim()
  const submit = async () => {
    try {
      await create.mutateAsync({
        studentId: student.id,
        disciplineId,
        date,
        value: typeof value === 'number' ? value : undefined,
        status: status.trim() || undefined,
        comment: comment.trim() || undefined,
      })
      setValue('')
      setStatus('')
      setComment('')
      setOpened(false)
    } catch (e) {
      fail('Запись не добавлена')(e)
    }
  }
  const toggleAbsence = async () => {
    try {
      if (absence) await unmark.mutateAsync(absence.id)
      else await mark.mutateAsync({ studentId: student.id, disciplineId, date })
      setOpened(false)
    } catch (e) {
      fail('Отметка не изменена')(e)
    }
  }

  return (
    <Popover opened={opened} onChange={setOpened} width={280} position="bottom" withArrow shadow="md" trapFocus>
      <Popover.Target>
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          onClick={() => setOpened((o) => !o)}
          aria-label={`Запись: ${student.fullName}, ${formatDay(date)}`}
        >
          <IconPlus size={14} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            {student.fullName} · {formatDay(date)}
          </Text>
          <Button
            size="xs"
            variant={absence ? 'filled' : 'light'}
            color="red"
            onClick={toggleAbsence}
            loading={mark.isPending || unmark.isPending}
          >
            {absence ? 'Снять отметку «н»' : 'Отметить «н» (неявка)'}
          </Button>
          <Divider label="Оценка / примечание" labelPosition="center" />
          <NumberInput
            size="xs"
            label="Оценка (необязательно)"
            placeholder="от 0 до 5, например 4,5"
            min={0}
            max={5}
            step={0.1}
            decimalScale={2}
            decimalSeparator=","
            value={value}
            onChange={setValue}
          />
          <Autocomplete
            size="xs"
            label="Статус"
            placeholder="Выберите или впишите свой"
            data={STATUS_PRESETS}
            maxLength={60}
            value={status}
            onChange={setStatus}
          />
          <Textarea
            size="xs"
            label="Примечание"
            autosize
            minRows={2}
            maxRows={5}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
          />
          <Button size="xs" onClick={submit} loading={create.isPending} disabled={!canSubmit}>
            Добавить
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

function AbsenceBadge({ absence, onRemove }: { absence: Absence; onRemove: () => void }) {
  return (
    <Popover width={220} withArrow shadow="md">
      <Popover.Target>
        <Badge size="lg" variant="light" className="absence-badge" role="button" tabIndex={0} aria-label="Неявка">
          н
        </Badge>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={6}>
          <Text size="sm">Неявка · {formatDay(absence.date)}</Text>
          <Button size="xs" color="red" variant="light" onClick={onRemove}>
            Снять отметку
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

// Журнал: строки — студенты, столбцы — даты занятий. Столбец появляется,
// когда в нём есть записи, или когда преподаватель добавил дату вручную.
function GroupGrades({ assignment }: { assignment: Assignment }) {
  const me = useCurrentUser()
  const filter = { groupId: assignment.group.id, disciplineId: assignment.discipline.id }
  const students = useQuery({
    queryKey: ['groups', assignment.group.id, 'students'],
    queryFn: () => groupsApi.students(assignment.group.id),
  })
  const grades = useGrades(filter)
  const absences = useAttendance(filter)
  const remove = useDeleteGrade()
  const unmark = useRemoveAbsence()
  const [extraDates, setExtraDates] = useState<string[]>([dayjs().format('YYYY-MM-DD')])
  const [newDate, setNewDate] = useState(dayjs().format('YYYY-MM-DD'))

  const cell = new Map<string, Grade[]>()
  const absenceAt = new Map<string, Absence>()
  const dates = new Set(extraDates)
  for (const g of grades.data ?? []) {
    const k = `${g.student.id}:${g.date}`
    cell.set(k, [...(cell.get(k) ?? []), g])
    dates.add(g.date)
  }
  for (const a of absences.data ?? []) {
    absenceAt.set(`${a.student.id}:${a.date}`, a)
    dates.add(a.date)
  }
  const columns = [...dates].sort()

  return (
    <QueryState
      isLoading={students.isLoading || grades.isLoading || absences.isLoading}
      error={students.error ?? grades.error ?? absences.error}
    >
      <Stack>
        <Group align="flex-end" gap="xs">
          <TextInput
            type="date"
            label="Новая дата занятия"
            size="xs"
            value={newDate}
            onChange={(e) => setNewDate(e.currentTarget.value)}
          />
          <Button
            size="xs"
            variant="default"
            disabled={!newDate}
            onClick={() => setExtraDates((prev) => (prev.includes(newDate) ? prev : [...prev, newDate]))}
          >
            Добавить столбец
          </Button>
        </Group>
        {students.data?.length === 0 ? (
          <Text c="dimmed">В группе пока нет студентов.</Text>
        ) : (
          <Paper withBorder radius="md">
            <Table.ScrollContainer minWidth={640}>
              <Table verticalSpacing="xs" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Студент</Table.Th>
                    {columns.map((d) => (
                      <Table.Th key={d} ta="center" title={formatDay(d)}>
                        {formatDayShort(d)}
                      </Table.Th>
                    ))}
                    <Table.Th ta="right">Средний</Table.Th>
                    <Table.Th ta="right">Н</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {students.data?.map((s) => {
                    const own = columns.flatMap((d) => cell.get(`${s.id}:${d}`) ?? [])
                    const avg = average(own.map((g) => g.value))
                    const missed = columns.filter((d) => absenceAt.has(`${s.id}:${d}`)).length
                    return (
                      <Table.Tr key={s.id}>
                        <Table.Td fw={500} style={{ whiteSpace: 'nowrap' }}>
                          {s.fullName}
                        </Table.Td>
                        {columns.map((d) => {
                          const absence = absenceAt.get(`${s.id}:${d}`)
                          return (
                            <Table.Td key={d} ta="center">
                              <Group gap={4} justify="center" wrap="nowrap">
                                {absence && <AbsenceBadge absence={absence} onRemove={() => unmark.mutate(absence.id)} />}
                                {cell.get(`${s.id}:${d}`)?.map((g) => (
                                  <GradeBadge
                                    key={g.id}
                                    grade={g}
                                    // Удалить можно только свою оценку.
                                    onDelete={g.teacher.id === me.id ? () => remove.mutate(g.id) : undefined}
                                  />
                                ))}
                                <CellEditor student={s} disciplineId={assignment.discipline.id} date={d} absence={absence} />
                              </Group>
                            </Table.Td>
                          )
                        })}
                        <Table.Td ta="right" fw={700}>
                          {avg === null ? '—' : formatGrade(avg)}
                        </Table.Td>
                        <Table.Td ta="right">{missed || '—'}</Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>
    </QueryState>
  )
}

export function TeacherGrades() {
  const { data: assignments = [], isLoading, error } = useMyAssignments()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = assignments.find((a) => a.id === selectedId) ?? assignments[0]

  return (
    <QueryState isLoading={isLoading} error={error}>
      {assignments.length === 0 ? (
        <Alert color="yellow">
          За вами пока не закреплено ни одной дисциплины. Обратитесь к администратору.
        </Alert>
      ) : (
        <Stack>
          <Select
            label="Дисциплина и группа"
            maw={480}
            allowDeselect={false}
            value={selected?.id ?? null}
            onChange={setSelectedId}
            data={assignments.map((a) => ({ value: a.id, label: `${a.discipline.name} — ${a.group.name}` }))}
          />
          {selected && <GroupGrades key={selected.id} assignment={selected} />}
        </Stack>
      )}
    </QueryState>
  )
}
