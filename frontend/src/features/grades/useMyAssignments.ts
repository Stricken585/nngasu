import { useQuery } from '@tanstack/react-query'
import { assignmentsApi } from '../../api/assignments'

export function useMyAssignments(enabled = true) {
  return useQuery({ queryKey: ['assignments', 'my'], queryFn: assignmentsApi.my, enabled })
}
