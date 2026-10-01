import type { DayOfWeek, LessonType, WeekParity } from '../../api/types'

export const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Понедельник', short: 'Пн' },
  { value: 'TUESDAY', label: 'Вторник', short: 'Вт' },
  { value: 'WEDNESDAY', label: 'Среда', short: 'Ср' },
  { value: 'THURSDAY', label: 'Четверг', short: 'Чт' },
  { value: 'FRIDAY', label: 'Пятница', short: 'Пт' },
  { value: 'SATURDAY', label: 'Суббота', short: 'Сб' },
]

export const LESSON_TYPES: Record<LessonType, { label: string; color: string }> = {
  LECTURE: { label: 'Лекция', color: 'blue' },
  PRACTICE: { label: 'Практика', color: 'teal' },
  LAB: { label: 'Лабораторная', color: 'grape' },
}

export const PARITY_LABELS: Record<WeekParity, string> = {
  ODD: 'Нечётная',
  EVEN: 'Чётная',
}

// Чётность по ISO-номеру недели в году. Привязки к началу семестра в MVP нет —
// это лишь подсказка, какую вкладку открыть по умолчанию.
export function currentWeekParity(date = new Date()): WeekParity {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return week % 2 === 0 ? 'EVEN' : 'ODD'
}

export function todayDayOfWeek(date = new Date()): DayOfWeek | null {
  const idx = date.getDay() // 0 = воскресенье
  return idx === 0 ? null : DAYS[idx - 1].value
}
