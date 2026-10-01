import { Badge, CloseButton, Tooltip } from '@mantine/core'
import type { Grade } from '../../api/types'
import { formatDate, formatGrade, gradeColor } from './format'

export function GradeBadge({ grade, onDelete }: { grade: Grade; onDelete?: () => void }) {
  return (
    <Tooltip label={`${formatDate(grade.createdAt)} · ${grade.teacher.fullName}`} withArrow>
      <Badge
        size="lg"
        variant="light"
        color={gradeColor(grade.value)}
        rightSection={
          onDelete && <CloseButton size="xs" aria-label="Удалить оценку" onClick={onDelete} />
        }
      >
        {formatGrade(grade.value)}
      </Badge>
    </Tooltip>
  )
}
