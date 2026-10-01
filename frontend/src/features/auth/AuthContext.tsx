import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { authApi } from '../../api/auth'
import type { User } from '../../api/types'
import { setUnauthorizedHandler } from '../../lib/axios'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (data: { email: string; password: string }) => Promise<User>
  register: (data: { email: string; password: string; fullName: string }) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ME_KEY = ['auth', 'me'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  // Сессия — это просто ответ GET /auth/me: 401 означает «не вошёл».
  const { data: user = null, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await authApi.me()
      } catch (e) {
        if (e instanceof AxiosError && e.response?.status === 401) return null
        throw e
      }
    },
    staleTime: Infinity,
  })

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.clear()
      queryClient.setQueryData(ME_KEY, null)
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const onAuthenticated = (u: User) => {
    queryClient.clear()
    queryClient.setQueryData(ME_KEY, u)
  }
  const loginMutation = useMutation({ mutationFn: authApi.login, onSuccess: onAuthenticated })
  const registerMutation = useMutation({ mutationFn: authApi.register, onSuccess: onAuthenticated })

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: async () => {
        await authApi.logout()
        queryClient.clear()
        queryClient.setQueryData(ME_KEY, null)
      },
    }),
    [user, isLoading, loginMutation.mutateAsync, registerMutation.mutateAsync, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}

// Для мест, где пользователь гарантированно есть (за RequireRole).
// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser без авторизации')
  return user
}
