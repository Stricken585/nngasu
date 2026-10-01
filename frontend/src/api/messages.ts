import { api } from '../lib/axios'
import type { Contacts, Message } from './types'

export const messagesApi = {
  contacts: () => api.get<Contacts>('/messages/contacts').then((r) => r.data),
  direct: (userId: string) => api.get<Message[]>(`/messages/dm/${userId}`).then((r) => r.data),
  group: (groupId: string) => api.get<Message[]>(`/messages/group/${groupId}`).then((r) => r.data),
}
