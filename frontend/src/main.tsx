import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import 'dayjs/locale/ru'
import dayjs from 'dayjs'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

dayjs.locale('ru')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
