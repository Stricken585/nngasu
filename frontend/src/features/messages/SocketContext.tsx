import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import type { Message } from '../../api/types'
import { createSocket, type Ack } from '../../lib/socket'
import { useCurrentUser } from '../auth/AuthContext'
import { chatId, chatOfMessage, chatQueryKey, type ChatRef } from './chatKeys'

interface SocketContextValue {
  connected: boolean
  joinChat: (chat: ChatRef) => Promise<void>
  send: (chat: ChatRef, content: string) => Promise<Message>
}

const SocketContext = createContext<SocketContextValue | null>(null)

const joinEvent = (chat: ChatRef) =>
  chat.type === 'dm' ? (['dm:join', { userId: chat.id }] as const) : (['group:join', { groupId: chat.id }] as const)

async function emit<T>(socket: Socket, event: string, payload: unknown): Promise<T | undefined> {
  const ack: Ack<T> = await socket.timeout(10_000).emitWithAck(event, payload)
  if (!ack.ok) throw new Error(ack.error)
  return ack.data
}

// Одно соединение на сессию. Новые сообщения из сокета дописываются прямо в
// кэш истории TanStack Query, так что компоненты чата остаются «чистым View».
export function SocketProvider({ children }: { children: ReactNode }) {
  const me = useCurrentUser()
  const queryClient = useQueryClient()
  const [socket] = useState(createSocket)
  const [connected, setConnected] = useState(false)
  // Комнаты теряются при переподключении — помним, куда входили.
  const joined = useRef(new Map<string, ChatRef>())

  useEffect(() => {
    let wasConnected = false
    const onConnect = () => {
      setConnected(true)
      // После разрыва история могла отстать — перечитываем открытые чаты.
      if (wasConnected) queryClient.invalidateQueries({ queryKey: ['messages'] })
      wasConnected = true
      for (const chat of joined.current.values()) {
        const [event, payload] = joinEvent(chat)
        socket.emit(event, payload)
      }
    }
    const onDisconnect = () => setConnected(false)
    const onMessage = (message: Message) => {
      queryClient.setQueryData<Message[]>(chatQueryKey(chatOfMessage(message, me.id)), (prev) =>
        prev && !prev.some((m) => m.id === message.id) ? [...prev, message] : prev,
      )
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onMessage)
    socket.connect()
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onMessage)
      socket.disconnect()
    }
  }, [socket, queryClient, me.id])

  const joinChat = useCallback(
    async (chat: ChatRef) => {
      if (joined.current.has(chatId(chat))) return
      const [event, payload] = joinEvent(chat)
      await emit(socket, event, payload)
      joined.current.set(chatId(chat), chat)
    },
    [socket],
  )

  const send = useCallback(
    async (chat: ChatRef, content: string) => {
      const [event, payload] =
        chat.type === 'dm'
          ? ['dm:send', { receiverId: chat.id, content }]
          : ['group:send', { groupId: chat.id, content }]
      return (await emit<Message>(socket, event, payload))!
    },
    [socket],
  )

  return <SocketContext.Provider value={{ connected, joinChat, send }}>{children}</SocketContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket вне SocketProvider')
  return ctx
}
