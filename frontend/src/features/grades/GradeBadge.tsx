import { Badge, Button, Divider, Group, Popover, Stack, Text } from '@mantine/core'
import type { Grade } from '../../api/types'
import { formatDate, formatDay, formatGrade, gradeTone } from './format'

// Бейдж оценки; по клику — дата, статус, комментарий и кто поставил.
// Запись без оценки (только примечание) показывается как «✎».
export function GradeBadge({ grade, onDelete }: { grade: Grade; onDelete?: () => void }) {
  return (
    <Popover width={260} position="bottom" withArrow shadow="md">
      <Popover.Target>
        <Badge
          size="lg"
          variant="light"
          className="grade-badge"
          data-tone={grade.value === null ? 'note' : gradeTone(grade.value)}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label={grade.value === null ? 'Примечание' : `Оценка ${formatGrade(grade.value)}`}
        >
          {grade.value === null ? '✎' : formatGrade(grade.value)}
        </Badge>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap={6}>
          <Group justify="space-between" align="baseline">
            <Text fw={600}>{grade.value === null ? 'Примечание' : `Оценка ${formatGrade(grade.value)}`}</Text>
            <Text size="xs" c="dimmed">
              {formatDay(grade.date)}
            </Text>
          </Group>
          {grade.status && <Text size="sm">Статус: {grade.status}</Text>}
          {grade.comment && (
            <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {grade.comment}
            </Text>
          )}
          {!grade.status && !grade.comment && (
            <Text size="sm" c="dimmed">
              Без примечания
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {grade.teacher.fullName} · выставлено {formatDate(grade.createdAt)}
          </Text>
          {onDelete && (
            <>
              <Divider />
              <Button size="xs" color="red" variant="light" onClick={onDelete}>
                Удалить
              </Button>
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
