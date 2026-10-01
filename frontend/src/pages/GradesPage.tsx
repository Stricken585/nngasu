import { Alert } from '@mantine/core'
import { PageHeader } from '../components/PageHeader'
import { useCurrentUser } from '../features/auth/AuthContext'
import { StudentGrades } from '../features/grades/StudentGrades'
import { TeacherGrades } from '../features/grades/TeacherGrades'

export function GradesPage() {
  const user = useCurrentUser()

  if (user.role === 'TEACHER') {
    return (
      <>
        <PageHeader title="Оценки" description="Выставление оценок по 5-балльной шкале, допускаются дробные (например, 4,6)" />
        <TeacherGrades />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Мои оценки" description="Текущий семестр" />
      {user.groupId ? (
        <StudentGrades />
      ) : (
        <Alert color="yellow">Вы ещё не состоите в группе — оценок пока нет.</Alert>
      )}
    </>
  )
}
