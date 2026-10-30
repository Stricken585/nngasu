import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import type { DeletedMessage, Message } from '../../api/types'
import { createSocket, type Ack } from '../../lib/socket'
import { useCurrentUser } from '../auth/AuthContext'
import { chatId, chatOfMessage, chatQueryKey, type ChatRef } from './chatKeys'

interface SocketContextValue {
  connected: boolean
  joinChat: (chat: ChatRef) => Promise<void>
  send: (chat: ChatRef, content: string, attachmentIds: string[]) => Promise<Message>
  editMessage: (id: string, content: string) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  pinMessage: (id: string, pinned: boolean) => Promise<void>
  forwardMessage: (id: string, to: ChatRef) => Promise<void>
}

const SocketContext = createContext<SocketContextValue | null>(null)

const joinEvent = (chat: ChatRef) =>
  chat.type === 'dm'
    ? (['dm:join', { userId: chat.id }] as const)
    : (['group:join', { groupId: chat.id, teacherId: chat.teacherId }] as const)

// Получатель в формате, который ждут dm:send / message:forward на бэкенде.
const target = (chat: ChatRef) =>
  chat.type === 'dm' ? { receiverId: chat.id } : { groupId: chat.id, teacherId: chat.teacherId }

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

    const onUpdated = (message: Message) => {
      queryClient.setQueryData<Message[]>(chatQueryKey(chatOfMessage(message, me.id)), (prev) =>
        prev?.map((m) => (m.id === message.id ? message : m)),
      )
    }
    const onDeleted = (message: DeletedMessage) => {
      queryClient.setQueryData<Message[]>(chatQueryKey(chatOfMessage(message, me.id)), (prev) =>
        prev?.filter((m) => m.id !== message.id),
      )
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onMessage)
    socket.on('message:updated', onUpdated)
    socket.on('message:deleted', onDeleted)
    socket.connect()
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onMessage)
      socket.off('message:updated', onUpdated)
      socket.off('message:deleted', onDeleted)
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
    async (chat: ChatRef, content: string, attachmentIds: string[]) =>
      (await emit<Message>(socket, chat.type === 'dm' ? 'dm:send' : 'group:send', { ...target(chat), content, attachmentIds }))!,
    [socket],
  )

  const editMessage = useCallback(
    async (id: string, content: string) => void (await emit(socket, 'message:edit', { id, content })),
    [socket],
  )
  const deleteMessage = useCallback(async (id: string) => void (await emit(socket, 'message:delete', { id })), [socket])
  const pinMessage = useCallback(
    async (id: string, pinned: boolean) => void (await emit(socket, 'message:pin', { id, pinned })),
    [socket],
  )
  const forwardMessage = useCallback(
    async (id: string, to: ChatRef) => void (await emit(socket, 'message:forward', { id, ...target(to) })),
    [socket],
  )

  return <SocketContext.Provider value={{ connected, joinChat, send, editMessage, deleteMessage, pinMessage, forwardMessage }}>{children}</SocketContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket вне SocketProvider')
  return ctx
}
