import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gradesApi, type GradesFilter } from '../../api/grades'

export function useGrades(filter: GradesFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ['grades', filter],
    queryFn: () => gradesApi.list(filter),
    enabled,
  })
}

export function useCreateGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradesApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grades'] }),
  })
}

export function useDeleteGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gradesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grades'] }),
  })
}
