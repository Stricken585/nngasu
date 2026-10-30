import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { messagesApi } from '../../api/messages'
import type { Message } from '../../api/types'
import { chatId, chatQueryKey, membersQueryKey, parseChatId, type ChatRef } from './chatKeys'
import { useSocket } from './SocketContext'

export function useContacts() {
  return useQuery({ queryKey: ['messages', 'contacts'], queryFn: messagesApi.contacts })
}

// История — REST при открытии чата, дальше новые сообщения приходят через
// сокет и дописываются в тот же кэш (см. SocketProvider).
export function useChat(chat: ChatRef) {
  const { joinChat, send, connected } = useSocket()
  const queryClient = useQueryClient()
  const [joinError, setJoinError] = useState<string | null>(null)

  const history = useQuery({
    queryKey: chatQueryKey(chat),
    queryFn: () => (chat.type === 'dm' ? messagesApi.direct(chat.id) : messagesApi.group(chat.id, chat.teacherId)),
    // Пропущенное за время разрыва соединения подтянется при переподключении.
    staleTime: Infinity,
  })

  const key = chatId(chat)
  useEffect(() => {
    if (!connected) return
    joinChat(parseChatId(key)!).then(
      () => setJoinError(null),
      (e: Error) => setJoinError(e.message),
    )
  }, [connected, joinChat, key])

  const sendMessage = async (content: string, attachmentIds: string[] = []) => {
    const message = await send(chat, content, attachmentIds)
    // На случай, если широковещательное событие разминулось с ack.
    queryClient.setQueryData<Message[]>(chatQueryKey(chat), (prev) =>
      prev && !prev.some((m) => m.id === message.id) ? [...prev, message] : prev,
    )
  }

  return { history, sendMessage, connected, joinError }
}

export function useChatMembers(chat: ChatRef, enabled: boolean) {
  return useQuery({
    queryKey: membersQueryKey(chat),
    queryFn: () => (chat.type === 'dm' ? messagesApi.directMembers(chat.id) : messagesApi.groupMembers(chat.id, chat.teacherId)),
    enabled,
  })
}
