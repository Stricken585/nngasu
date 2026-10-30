import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, gradesApi, type GradesFilter } from '../../api/grades'

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

export function useAttendance(filter: GradesFilter = {}, enabled = true) {
  return useQuery({
    queryKey: ['attendance', filter],
    queryFn: () => attendanceApi.list(filter),
    enabled,
  })
}

export function useMarkAbsence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: attendanceApi.mark,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  })
}

export function useRemoveAbsence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: attendanceApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  })
}
