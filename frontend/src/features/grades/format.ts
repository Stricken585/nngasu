import dayjs from 'dayjs'

export const formatGrade = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })

// Записи без оценки (только примечание) в средний не входят.
export const average = (values: (number | null)[]) => {
  const nums = values.filter((v): v is number => v !== null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

export const STATUS_PRESETS = ['Домашняя работа', 'Контрольная работа', 'Проверочная работа', 'Ответ на паре']

export const formatDay = (day: string) => dayjs(day).format('DD.MM.YYYY')
export const formatDayShort = (day: string) => dayjs(day).format('DD.MM')

export const gradeTone = (value: number) => (value >= 4.5 ? 'good' : value >= 3.5 ? 'ok' : value >= 2.5 ? 'low' : 'bad')

export const formatDate = (iso: string) => dayjs(iso).format('DD.MM.YYYY HH:mm')
