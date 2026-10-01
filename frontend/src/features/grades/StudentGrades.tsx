import { Group, Paper, Table, Text } from '@mantine/core'
import type { Grade } from '../../api/types'
import { QueryState } from '../../components/QueryState'
import { GradeBadge } from './GradeBadge'
import { average, formatGrade } from './format'
import { useGrades } from './useGrades'

export function StudentGrades() {
  const { data = [], isLoading, error } = useGrades()

  const byDiscipline = new Map<string, { name: string; grades: Grade[] }>()
  for (const g of data) {
    const row = byDiscipline.get(g.discipline.id) ?? { name: g.discipline.name, grades: [] }
    row.grades.push(g)
    byDiscipline.set(g.discipline.id, row)
  }
  const rows = [...byDiscipline.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))

  return (
    <QueryState isLoading={isLoading} error={error}>
      {rows.length === 0 ? (
        <Text c="dimmed">Оценок пока нет.</Text>
      ) : (
        <Paper withBorder radius="md">
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Дисциплина</Table.Th>
                <Table.Th>Оценки</Table.Th>
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
                  <Table.Td ta="right" fw={700}>
                    {formatGrade(average(row.grades.map((g) => g.value))!)}
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
