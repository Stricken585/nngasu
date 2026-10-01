import { io, type Socket } from 'socket.io-client'

// Same-origin через Vite-прокси: браузер сам отправит httpOnly-cookie в handshake.
export function createSocket(): Socket {
  return io({ path: '/socket.io', withCredentials: true, autoConnect: false })
}

export type Ack<T> = { ok: true; data?: T } | { ok: false; error: string }
