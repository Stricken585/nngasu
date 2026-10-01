import { api } from '../lib/axios'
import type { Assignment } from './types'

export const assignmentsApi = {
  my: () => api.get<Assignment[]>('/assignments/my').then((r) => r.data),
}
