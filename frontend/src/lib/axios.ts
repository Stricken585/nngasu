import axios, { AxiosError } from 'axios'
import { getToken } from './session'

// Авторизация — JWT из sessionStorage вкладки в заголовке Authorization.
export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let onUnauthorized: (() => void) | null = null

// AuthProvider регистрирует сюда сброс сессии: истёкшая cookie на любом
// запросе возвращает пользователя на страницу входа.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? ''
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

// Текст ошибки для пользователя: Nest отдаёт message строкой или массивом
// (ошибки class-validator).
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message
    if (Array.isArray(message)) return message.join('; ')
    if (message) return message
    if (!error.response) return 'Сервер недоступен'
  }
  if (error instanceof Error) return error.message
  return 'Что-то пошло не так'
}
