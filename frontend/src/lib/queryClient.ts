import { QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // 4xx не лечатся повтором.
      retry: (failureCount, error) =>
        !(error instanceof AxiosError && error.response && error.response.status < 500) && failureCount < 2,
    },
  },
})
