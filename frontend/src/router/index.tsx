import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { GradesPage } from '../pages/GradesPage'
import { HomePage } from '../pages/HomePage'
import { MessagesPage } from '../pages/MessagesPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SchedulePage } from '../pages/SchedulePage'
import { GuestOnly, RequireRole } from './RequireRole'

export const router = createBrowserRouter([
  { path: '/login', element: <GuestOnly><LoginPage /></GuestOnly> },
  { path: '/register', element: <GuestOnly><RegisterPage /></GuestOnly> },
  {
    path: '/',
    element: <RequireRole><Layout /></RequireRole>,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'grades', element: <RequireRole roles={['STUDENT', 'TEACHER']}><GradesPage /></RequireRole> },
      { path: 'messages', element: <RequireRole roles={['STUDENT', 'TEACHER']}><MessagesPage /></RequireRole> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
