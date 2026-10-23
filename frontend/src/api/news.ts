import { api } from '../lib/axios'
import type { News } from './types'

export const newsApi = {
  list: (params: { limit?: number } = {}) => api.get<News[]>('/news', { params }).then((r) => r.data),
}
