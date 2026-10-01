import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { messagesApi } from '../../api/messages'
import type { Message } from '../../api/types'
import { chatQueryKey, type ChatRef } from './chatKeys'
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
    queryFn: () => (chat.type === 'dm' ? messagesApi.direct(chat.id) : messagesApi.group(chat.id)),
    // Пропущенное за время разрыва соединения подтянется при переподключении.
    staleTime: Infinity,
  })

  const { type, id } = chat
  useEffect(() => {
    if (!connected) return
    joinChat({ type, id } as ChatRef).then(
      () => setJoinError(null),
      (e: Error) => setJoinError(e.message),
    )
  }, [connected, joinChat, type, id])

  const sendMessage = async (content: string) => {
    const message = await send(chat, content)
    // На случай, если широковещательное событие разминулось с ack.
    queryClient.setQueryData<Message[]>(chatQueryKey(chat), (prev) =>
      prev && !prev.some((m) => m.id === message.id) ? [...prev, message] : prev,
    )
  }

  return { history, sendMessage, connected, joinError }
}
