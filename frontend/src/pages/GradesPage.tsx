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
        <PageHeader title="Журнал" description="Оценки от 0 до 5 (допускаются дробные), отметки «н» и примечания по датам занятий" />
        <TeacherGrades />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Мои оценки и посещаемость" description="Нажмите на оценку, чтобы увидеть дату, статус и примечание" />
      {user.groupId ? (
        <StudentGrades />
      ) : (
        <Alert color="yellow">Вы ещё не состоите в группе — оценок пока нет.</Alert>
      )}
    </>
  )
}
