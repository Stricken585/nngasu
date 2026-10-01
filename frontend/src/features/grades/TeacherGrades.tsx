import { ActionIcon, Alert, Group, NumberInput, Paper, Select, Stack, Table, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { groupsApi } from '../../api/groups'
import type { Assignment, Grade, User } from '../../api/types'
import { QueryState } from '../../components/QueryState'
import { getErrorMessage } from '../../lib/axios'
import { useCurrentUser } from '../auth/AuthContext'
import { GradeBadge } from './GradeBadge'
import { average, formatGrade } from './format'
import { useCreateGrade, useDeleteGrade, useGrades } from './useGrades'
import { useMyAssignments } from './useMyAssignments'

function AddGrade({ student, disciplineId }: { student: User; disciplineId: string }) {
  const [value, setValue] = useState<string | number>('')
  const create = useCreateGrade()

  const submit = async () => {
    if (typeof value !== 'number') return
    try {
      await create.mutateAsync({ studentId: student.id, disciplineId, value })
      setValue('')
    } catch (e) {
      notifications.show({ color: 'red', title: 'Оценка не выставлена', message: getErrorMessage(e) })
    }
  }

  return (
    <Group gap={6} wrap="nowrap">
      <NumberInput
        size="xs"
        w={90}
        placeholder="4,5"
        min={1}
        max={5}
        step={0.1}
        decimalScale={2}
        decimalSeparator=","
        hideControls
        value={value}
        onChange={setValue}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        aria-label={`Оценка для ${student.fullName}`}
      />
      <ActionIcon
        variant="light"
        onClick={submit}
        loading={create.isPending}
        disabled={typeof value !== 'number'}
        aria-label="Поставить оценку"
      >
        <IconPlus size={16} />
      </ActionIcon>
    </Group>
  )
}

function GroupGrades({ assignment }: { assignment: Assignment }) {
  const me = useCurrentUser()
  const students = useQuery({
    queryKey: ['groups', assignment.group.id, 'students'],
    queryFn: () => groupsApi.students(assignment.group.id),
  })
  const grades = useGrades({ groupId: assignment.group.id, disciplineId: assignment.discipline.id })
  const remove = useDeleteGrade()

  const byStudent = new Map<string, Grade[]>()
  for (const g of grades.data ?? []) byStudent.set(g.student.id, [...(byStudent.get(g.student.id) ?? []), g])

  return (
    <QueryState isLoading={students.isLoading || grades.isLoading} error={students.error ?? grades.error}>
      {students.data?.length === 0 ? (
        <Text c="dimmed">В группе пока нет студентов.</Text>
      ) : (
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={640}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Студент</Table.Th>
                <Table.Th>Оценки</Table.Th>
                <Table.Th w={90} ta="right">
                  Средний
                </Table.Th>
                <Table.Th w={150}>Новая оценка</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {students.data?.map((s) => {
                const list = byStudent.get(s.id) ?? []
                const avg = average(list.map((g) => g.value))
                return (
                  <Table.Tr key={s.id}>
                    <Table.Td fw={500}>{s.fullName}</Table.Td>
                    <Table.Td>
                      <Group gap={6}>
                        {list.map((g) => (
                          <GradeBadge
                            key={g.id}
                            grade={g}
                            // Удалить можно только свою оценку.
                            onDelete={g.teacher.id === me.id ? () => remove.mutate(g.id) : undefined}
                          />
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td ta="right" fw={700}>
                      {avg === null ? '—' : formatGrade(avg)}
                    </Table.Td>
                    <Table.Td>
                      <AddGrade student={s} disciplineId={assignment.discipline.id} />
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
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
