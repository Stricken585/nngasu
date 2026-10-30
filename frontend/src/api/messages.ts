import { api } from '../lib/axios'
import type { Attachment, ChatMember, Contacts, Message } from './types'

export const messagesApi = {
  contacts: () => api.get<Contacts>('/messages/contacts').then((r) => r.data),
  direct: (userId: string) => api.get<Message[]>(`/messages/dm/${userId}`).then((r) => r.data),
  group: (groupId: string, teacherId: string) =>
    api.get<Message[]>(`/messages/group/${groupId}/${teacherId}`).then((r) => r.data),
  directMembers: (userId: string) => api.get<ChatMember[]>(`/messages/dm/${userId}/members`).then((r) => r.data),
  groupMembers: (groupId: string, teacherId: string) =>
    api.get<ChatMember[]>(`/messages/group/${groupId}/${teacherId}/members`).then((r) => r.data),
  upload: (files: File[]) => {
    const body = new FormData()
    files.forEach((f) => body.append('files', f))
    return api.post<Attachment[]>('/messages/attachments', body).then((r) => r.data)
  },
}

// Файл отдаёт бэкенд с проверкой доступа; <img>/<a> не умеют слать заголовок
// Authorization, поэтому забираем blob через axios.
export const fetchAttachment = (id: string, inline = false) =>
  api
    .get<Blob>(`/messages/attachments/${id}`, { params: inline ? { inline: 1 } : undefined, responseType: 'blob' })
    .then((r) => r.data)
