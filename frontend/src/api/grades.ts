import { api } from '../lib/axios'
import type { Grade } from './types'

export interface GradesFilter {
  studentId?: string
  groupId?: string
  disciplineId?: string
}

export const gradesApi = {
  list: (params: GradesFilter = {}) => api.get<Grade[]>('/grades', { params }).then((r) => r.data),
  create: (data: { studentId: string; disciplineId: string; value: number }) =>
    api.post<Grade>('/grades', data).then((r) => r.data),
  remove: (id: string) => api.delete(`/grades/${id}`),
}
