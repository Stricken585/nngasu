import dayjs from 'dayjs'

export const formatGrade = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })

export const average = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null

export const gradeColor = (value: number) => (value >= 4.5 ? 'green' : value >= 3.5 ? 'blue' : value >= 2.5 ? 'yellow' : 'red')

export const formatDate = (iso: string) => dayjs(iso).format('DD.MM.YYYY HH:mm')
