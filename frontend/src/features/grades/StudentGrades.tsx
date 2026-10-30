import { Badge, Group, Paper, Popover, Table, Text } from '@mantine/core'
import type { Absence, Grade } from '../../api/types'
import { QueryState } from '../../components/QueryState'
import { GradeBadge } from './GradeBadge'
import { average, formatDay, formatGrade } from './format'
import { useAttendance, useGrades } from './useGrades'

export function StudentGrades() {
  const { data = [], isLoading, error } = useGrades()
  const absences = useAttendance()

  const byDiscipline = new Map<string, { name: string; grades: Grade[]; absences: Absence[] }>()
  const row = (d: { id: string; name: string }) => {
    const r = byDiscipline.get(d.id) ?? { name: d.name, grades: [], absences: [] }
    byDiscipline.set(d.id, r)
    return r
  }
  for (const g of data) row(g.discipline).grades.push(g)
  for (const a of absences.data ?? []) row(a.discipline).absences.push(a)
  const rows = [...byDiscipline.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  return (
    <QueryState isLoading={isLoading || absences.isLoading} error={error ?? absences.error}>
      {rows.length === 0 ? (
        <Text c="dimmed">Оценок и отметок пока нет.</Text>
      ) : (
        <Paper withBorder radius="md">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Дисциплина</Table.Th>
                <Table.Th>Оценки</Table.Th>
                <Table.Th>Пропуски (н)</Table.Th>
                <Table.Th w={110} ta="right">
                  Средний
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.name}>
                  <Table.Td fw={500}>{row.name}</Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      {row.grades.map((g) => (
                        <GradeBadge key={g.id} grade={g} />
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      {row.absences.map((a) => (
                        <Popover key={a.id} width={200} withArrow>
                          <Popover.Target>
                            <Badge size="lg" variant="light" className="absence-badge" role="button" tabIndex={0}>
                              н
                            </Badge>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Text size="sm">Неявка · {formatDay(a.date)}</Text>
                          </Popover.Dropdown>
                        </Popover>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right" fw={700}>
                    {average(row.grades.map((g) => g.value)) === null ? '—' : formatGrade(average(row.grades.map((g) => g.value))!)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </QueryState>
  )
}
