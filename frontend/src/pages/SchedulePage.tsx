import { Alert, Group, SegmentedControl, Select } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { groupsApi } from '../api/groups'
import type { WeekParity } from '../api/types'
import { PageHeader } from '../components/PageHeader'
import { QueryState } from '../components/QueryState'
import { useCurrentUser } from '../features/auth/AuthContext'
import { useMyAssignments } from '../features/grades/useMyAssignments'
import { currentWeekParity, PARITY_LABELS } from '../features/schedule/labels'
import { ScheduleTable } from '../features/schedule/ScheduleTable'
import { useSchedule } from '../features/schedule/useSchedule'

const MY = 'my'

export function SchedulePage() {
  const user = useCurrentUser()
  const current = currentWeekParity()
  const [parity, setParity] = useState<WeekParity>(current)
  // Преподаватель: «моё» или расписание одной из своих групп; админ — любой группы.
  const [view, setView] = useState<string | null>(user.role === 'ADMIN' ? null : MY)

  const groups = useQuery({ queryKey: ['groups'], queryFn: groupsApi.list, enabled: user.role === 'ADMIN' })
  const assignments = useMyAssignments(user.role === 'TEACHER')

  const groupOptions =
    user.role === 'ADMIN'
      ? (groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))
      : user.role === 'TEACHER'
        ? [
            { value: MY, label: 'Моё расписание' },
            ...[...new Map((assignments.data ?? []).map((a) => [a.group.id, a.group])).values()].map((g) => ({
              value: g.id,
              label: `Группа ${g.name}`,
            })),
          ]
        : []

  const groupId = view && view !== MY ? view : undefined
  const enabled = user.role !== 'ADMIN' || !!groupId
  const schedule = useSchedule(groupId ? { groupId } : {}, enabled)

  const show = user.role === 'STUDENT' || groupId ? 'teacher' : 'group'

  return (
    <>
      <PageHeader
        title="Расписание"
        description={user.role === 'STUDENT' && user.group ? `Группа ${user.group.name}` : undefined}
        actions={
          <Group>
            {groupOptions.length > 0 && (
              <Select
                placeholder="Выберите группу"
                searchable
                allowDeselect={false}
                value={view}
                onChange={setView}
                data={groupOptions}
                w={240}
              />
            )}
            <SegmentedControl
              value={parity}
              onChange={(v) => setParity(v as WeekParity)}
              data={(['ODD', 'EVEN'] as const).map((p) => ({
                value: p,
                label: `${PARITY_LABELS[p]}${p === current ? ' (сейчас)' : ''}`,
              }))}
            />
          </Group>
        }
      />
      {user.role === 'STUDENT' && !user.groupId ? (
        <Alert color="yellow" title="Вы ещё не в группе">
          Администратор пока не добавил вас в учебную группу — после этого здесь появится расписание.
        </Alert>
      ) : !enabled ? (
        <Alert color="blue">Выберите группу, чтобы посмотреть её расписание.</Alert>
      ) : (
        <QueryState isLoading={schedule.isLoading} error={schedule.error}>
          <ScheduleTable entries={schedule.data ?? []} parity={parity} show={show} />
        </QueryState>
      )}
    </>
  )
}
