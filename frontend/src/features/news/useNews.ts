import { useQuery } from '@tanstack/react-query'
import { newsApi } from '../../api/news'

export function useNews(params: { limit?: number } = {}) {
  return useQuery({ queryKey: ['news', params], queryFn: () => newsApi.list(params) })
}
