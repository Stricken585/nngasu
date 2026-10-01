import { api } from '../lib/axios'
import type { User } from './types'

export const authApi = {
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  login: (data: { email: string; password: string }) => api.post<User>('/auth/login', data).then((r) => r.data),
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post<User>('/auth/register', data).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
}
