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
  value: number | null // null — запись только с примечанием
  date: string // YYYY-MM-DD, день занятия
  status: string | null
  comment: string | null
  createdAt: string
  student: UserShort & { groupId: string | null }
  teacher: UserShort
  discipline: Discipline
}

// Отметка «н» (неявка) студента на занятии.
export interface Absence {
  id: string
  date: string
  student: UserShort & { groupId: string | null }
  discipline: Discipline
}

export interface Attachment {
  id: string
  fileName: string
  mimeType: string
  size: number
}

export interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string | null
  groupId: string | null
  teacherId: string | null
  createdAt: string
  editedAt: string | null
  pinnedAt: string | null
  forwardedFromName: string | null
  sender: UserShort & { role: Role }
  attachments: Attachment[]
}

export interface Contact extends UserShort {
  role: Role
  group: Group | null
}

// Групповой чат = группа + один её преподаватель.
export interface GroupChat {
  group: Group
  teacher: UserShort
  disciplines: string[]
}

export interface Contacts {
  users: Contact[]
  groupChats: GroupChat[]
}

export interface ChatMember extends UserShort {
  role: Role
}

export interface DeletedMessage {
  id: string
  senderId: string
  receiverId: string | null
  groupId: string | null
  teacherId: string | null
}

export interface News {
  id: string
  title: string
  content: string
  createdAt: string
}
