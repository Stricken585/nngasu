import { getToken } from './session'
import { io, type Socket } from 'socket.io-client'

// Токен берётся из sessionStorage при каждом (пере)подключении.
export function createSocket(): Socket {
  return io({ path: '/socket.io', autoConnect: false, auth: (cb) => cb({ token: getToken() }) })
}

export type Ack<T> = { ok: true; data?: T } | { ok: false; error: string }
