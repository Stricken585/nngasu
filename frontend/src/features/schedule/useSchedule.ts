import { useQuery } from '@tanstack/react-query'
import { scheduleApi } from '../../api/schedule'

export function useSchedule(params: { groupId?: string; teacherId?: string } = {}, enabled = true) {
  return useQuery({
    queryKey: ['schedule', params],
    queryFn: () => scheduleApi.list(params),
    enabled,
  })
}
