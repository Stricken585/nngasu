import { api } from '../lib/axios'
import type { ScheduleEntry } from './types'

export const scheduleApi = {
  list: (params: { groupId?: string; teacherId?: string } = {}) =>
    api.get<ScheduleEntry[]>('/schedule', { params }).then((r) => r.data),
}
