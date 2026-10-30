import { api } from '../lib/axios'
import type { Absence, Grade } from './types'

export interface GradesFilter {
  studentId?: string
  groupId?: string
  disciplineId?: string
}

export const gradesApi = {
  list: (params: GradesFilter = {}) => api.get<Grade[]>('/grades', { params }).then((r) => r.data),
  create: (data: NewGrade) => api.post<Grade>('/grades', data).then((r) => r.data),
  remove: (id: string) => api.delete(`/grades/${id}`),
}

export interface NewGrade {
  studentId: string
  disciplineId: string
  value?: number
  date?: string
  status?: string
  comment?: string
}

export const attendanceApi = {
  list: (params: GradesFilter = {}) => api.get<Absence[]>('/attendance', { params }).then((r) => r.data),
  mark: (data: { studentId: string; disciplineId: string; date: string }) =>
    api.post<Absence>('/attendance', data).then((r) => r.data),
  remove: (id: string) => api.delete(`/attendance/${id}`),
}
