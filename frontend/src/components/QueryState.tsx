import { Alert, Center, Loader } from '@mantine/core'
import type { ReactNode } from 'react'
import { getErrorMessage } from '../lib/axios'

// Единое отображение загрузки/ошибки для useQuery.
export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean
  error: unknown
  children: ReactNode
}) {
  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (error) return <Alert color="red" title="Не удалось загрузить данные">{getErrorMessage(error)}</Alert>
  return <>{children}</>
}
