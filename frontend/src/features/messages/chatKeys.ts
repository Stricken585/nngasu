import type { GroupChat, Message, Role } from '../../api/types'

export type ChatRef = { type: 'dm'; id: string } | { type: 'group'; id: string; teacherId: string }

export const chatQueryKey = (chat: ChatRef) => ['messages', 'history', ...chatIdParts(chat)] as const
export const membersQueryKey = (chat: ChatRef) => ['messages', 'members', ...chatIdParts(chat)] as const

const chatIdParts = (chat: ChatRef) => (chat.type === 'dm' ? ['dm', chat.id] : ['group', chat.id, chat.teacherId])

// В какой чат (с точки зрения текущего пользователя) относится сообщение.
export function chatOfMessage(
  message: Pick<Message, 'senderId' | 'receiverId' | 'groupId' | 'teacherId'>,
  meId: string,
): ChatRef {
  if (message.groupId) return { type: 'group', id: message.groupId, teacherId: message.teacherId! }
  return { type: 'dm', id: message.senderId === meId ? message.receiverId! : message.senderId }
}

export const chatId = (chat: ChatRef) => chatIdParts(chat).join(':')

export function parseChatId(value: string | null): ChatRef | null {
  const [type, id, teacherId] = value?.split(':') ?? []
  if (type === 'dm' && id) return { type, id }
  if (type === 'group' && id && teacherId) return { type, id, teacherId }
  return null
}

// Чат группы с преподавателем: студенту важнее, кто преподаёт, преподавателю — какая группа.
export function groupChatTitle(gc: GroupChat, meRole: Role) {
  return meRole === 'TEACHER' ? `Чат группы ${gc.group.name}` : `${gc.teacher.fullName} · ${gc.group.name}`
}
