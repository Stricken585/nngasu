export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'
export type WeekParity = 'EVEN' | 'ODD'
export type LessonType = 'LECTURE' | 'PRACTICE' | 'LAB'

export interface Group {
  id: string
  name: string
}

export interface Discipline {
  id: string
  name: string
}

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  groupId: string | null
  group: Group | null
  createdAt: string
}

export interface UserShort {
  id: string
  fullName: string
}

export interface Assignment {
  id: string
  teacher: UserShort & { email: string }
  discipline: Discipline
  group: Group
}

export interface ScheduleEntry {
  id: string
  dayOfWeek: DayOfWeek
  weekParity: WeekParity
  pairNumber: number
  room: string
  lessonType: LessonType
  discipline: Discipline
  teacher: UserShort
  group: Group
}

export interface Grade {
  id: string
  value: number
  createdAt: string
  student: UserShort & { groupId: string | null }
  teacher: UserShort
  discipline: Discipline
}

export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string | null
  groupId: string | null
  createdAt: string
  sender: UserShort & { role: Role }
}

export interface Contact extends UserShort {
  role: Role
  group: Group | null
}

export interface Contacts {
  users: Contact[]
  groups: Group[]
}
