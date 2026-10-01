import { Avatar, Divider, NavLink, ScrollArea, Text } from '@mantine/core'
import { IconUsersGroup } from '@tabler/icons-react'
import type { Contacts } from '../../api/types'
import { ROLE_LABELS } from '../../components/roleLabels'
import { chatId, type ChatRef } from './chatKeys'

interface Props {
  contacts: Contacts
  active: ChatRef | null
  onSelect: (chat: ChatRef) => void
}

export function ChatList({ contacts, active, onSelect }: Props) {
  const activeId = active && chatId(active)
  return (
    <ScrollArea h="100%">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" pt="sm" pb={4}>
        Групповые чаты
      </Text>
      {contacts.groups.length === 0 && (
        <Text size="sm" c="dimmed" px="sm">
          Нет групп
        </Text>
      )}
      {contacts.groups.map((g) => (
        <NavLink
          key={g.id}
          label={g.name}
          description="Чат группы"
          leftSection={
            <Avatar radius="xl" size="sm" color="teal">
              <IconUsersGroup size={16} />
            </Avatar>
          }
          active={activeId === chatId({ type: 'group', id: g.id })}
          onClick={() => onSelect({ type: 'group', id: g.id })}
        />
      ))}
      <Divider my="xs" />
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" pb={4}>
        Личные сообщения
      </Text>
      {contacts.users.length === 0 && (
        <Text size="sm" c="dimmed" px="sm">
          Нет собеседников
        </Text>
      )}
      {contacts.users.map((u) => (
        <NavLink
          key={u.id}
          label={u.fullName}
          description={u.role === 'STUDENT' && u.group ? u.group.name : ROLE_LABELS[u.role]}
          leftSection={
            <Avatar radius="xl" size="sm" color="blue">
              {u.fullName[0]}
            </Avatar>
          }
          active={activeId === chatId({ type: 'dm', id: u.id })}
          onClick={() => onSelect({ type: 'dm', id: u.id })}
        />
      ))}
    </ScrollArea>
  )
}
