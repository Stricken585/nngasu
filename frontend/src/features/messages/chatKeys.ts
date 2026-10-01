import type { Message } from '../../api/types'

export type ChatRef = { type: 'dm'; id: string } | { type: 'group'; id: string }

export const chatQueryKey = (chat: ChatRef) => ['messages', chat.type, chat.id] as const

// В какой чат (с точки зрения текущего пользователя) относится сообщение.
export function chatOfMessage(message: Message, meId: string): ChatRef {
  if (message.groupId) return { type: 'group', id: message.groupId }
  return { type: 'dm', id: message.senderId === meId ? message.receiverId! : message.senderId }
}

export const chatId = (chat: ChatRef) => `${chat.type}:${chat.id}`

export function parseChatId(value: string | null): ChatRef | null {
  const [type, id] = value?.split(':') ?? []
  return (type === 'dm' || type === 'group') && id ? { type, id } : null
}
