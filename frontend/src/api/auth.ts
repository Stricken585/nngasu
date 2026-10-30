import { api } from '../lib/axios'
import type { User } from './types'

// Вход и регистрация возвращают токен вместе с профилем.
export interface AuthResult {
  user: User
  token: string
}

export const authApi = {
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  login: (data: { email: string; password: string }) => api.post<AuthResult>('/auth/login', data).then((r) => r.data),
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post<AuthResult>('/auth/register', data).then((r) => r.data),
  logout: () => api.post('/auth/logout'),
}
