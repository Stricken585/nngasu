import { Avatar, Box, Divider, NavLink, ScrollArea, Text, TextInput } from '@mantine/core'
import { IconSearch, IconUsersGroup } from '@tabler/icons-react'
import { useState } from 'react'
import type { Contacts } from '../../api/types'
import { ROLE_LABELS } from '../../components/roleLabels'
import { useCurrentUser } from '../auth/AuthContext'
import { chatId, groupChatTitle, type ChatRef } from './chatKeys'

interface Props {
  contacts: Contacts
  active: ChatRef | null
  onSelect: (chat: ChatRef) => void
}

export function ChatList({ contacts, active, onSelect }: Props) {
  const activeId = active && chatId(active)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const me = useCurrentUser()
  const groups = contacts.groupChats.filter(
    (gc) =>
      gc.group.name.toLowerCase().includes(q) ||
      gc.teacher.fullName.toLowerCase().includes(q) ||
      gc.disciplines.some((d) => d.toLowerCase().includes(q)),
  )
  const users = contacts.users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(q) ||
      (u.role === 'STUDENT' && u.group?.name.toLowerCase().includes(q)),
  )

  return (
    <Box h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box p="xs" style={{ flexShrink: 0, borderBottom: '1px solid var(--line)' }}>
        <TextInput
          placeholder="Поиск по имени, группе или предмету"
          aria-label="Поиск по чатам"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          styles={{ input: { height: 38 } }}
        />
      </Box>
      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" pt="sm" pb={4}>
          Групповые чаты
        </Text>
        {groups.length === 0 && (
          <Text size="sm" c="dimmed" px="sm">
            {q ? 'Ничего не найдено' : 'Нет групп'}
          </Text>
        )}
        {groups.map((gc) => (
          <NavLink
            key={`${gc.group.id}:${gc.teacher.id}`}
            label={groupChatTitle(gc, me.role)}
            description={gc.disciplines.join(', ')}
            leftSection={
              <Avatar radius="xl" size="sm" color="var(--t3-ink)" bg="var(--t3)">
                <IconUsersGroup size={16} />
              </Avatar>
            }
            active={activeId === chatId({ type: 'group', id: gc.group.id, teacherId: gc.teacher.id })}
            onClick={() => onSelect({ type: 'group', id: gc.group.id, teacherId: gc.teacher.id })}
          />
        ))}
        <Divider my="xs" />
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" pb={4}>
          Личные сообщения
        </Text>
        {users.length === 0 && (
          <Text size="sm" c="dimmed" px="sm">
            {q ? 'Ничего не найдено' : 'Нет собеседников'}
          </Text>
        )}
        {users.map((u) => (
          <NavLink
            key={u.id}
            label={u.fullName}
            description={u.role === 'STUDENT' && u.group ? u.group.name : ROLE_LABELS[u.role]}
            leftSection={
              <Avatar radius="xl" size="sm" color="var(--t4-ink)" bg="var(--t4)">
                {u.fullName[0]}
              </Avatar>
            }
            active={activeId === chatId({ type: 'dm', id: u.id })}
            onClick={() => onSelect({ type: 'dm', id: u.id })}
          />
        ))}
      </ScrollArea>
    </Box>
  )
}
