import { api } from '../lib/axios'
import type { Group, User } from './types'

export const groupsApi = {
  list: () => api.get<Group[]>('/groups').then((r) => r.data),
  students: (groupId: string) => api.get<User[]>(`/groups/${groupId}/students`).then((r) => r.data),
}
