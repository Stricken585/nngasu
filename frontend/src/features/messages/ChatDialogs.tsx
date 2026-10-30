import { Avatar, Group, Loader, Modal, NavLink, ScrollArea, Stack, Text } from '@mantine/core'
import { IconUsersGroup } from '@tabler/icons-react'
import { ROLE_LABELS } from '../../components/roleLabels'
import { getErrorMessage } from '../../lib/axios'
import { useCurrentUser } from '../auth/AuthContext'
import { chatId, groupChatTitle, type ChatRef } from './chatKeys'
import { useChatMembers, useContacts } from './useChat'

export function MembersModal({ chat, title, opened, onClose }: { chat: ChatRef; title: string; opened: boolean; onClose: () => void }) {
  const members = useChatMembers(chat, opened)
  return (
    <Modal opened={opened} onClose={onClose} title={`Участники · ${title}`} size="sm">
      {members.isLoading ? (
        <Loader size="sm" />
      ) : members.error ? (
        <Text c="red" size="sm">
          {getErrorMessage(members.error)}
        </Text>
      ) : (
        <ScrollArea.Autosize mah={400}>
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              Всего: {members.data?.length ?? 0}
            </Text>
            {members.data?.map((m) => (
              <Group key={m.id} gap="sm" wrap="nowrap">
                <Avatar radius="xl" size="sm">
                  {m.fullName[0]}
                </Avatar>
                <div>
                  <Text size="sm">{m.fullName}</Text>
                  <Text size="xs" c="dimmed">
                    {ROLE_LABELS[m.role]}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Modal>
  )
}

// Куда переслать: любой чат из доступных пользователю (в том числе текущий).
export function ForwardModal({ opened, onClose, onPick }: { opened: boolean; onClose: () => void; onPick: (chat: ChatRef) => void }) {
  const me = useCurrentUser()
  const contacts = useContacts()
  const data = contacts.data
  return (
    <Modal opened={opened} onClose={onClose} title="Переслать в…" size="sm">
      {contacts.isLoading && <Loader size="sm" />}
      <ScrollArea.Autosize mah={400}>
        {data?.groupChats.map((gc) => {
          const chat: ChatRef = { type: 'group', id: gc.group.id, teacherId: gc.teacher.id }
          return (
            <NavLink
              key={chatId(chat)}
              label={groupChatTitle(gc, me.role)}
              description={gc.disciplines.join(', ')}
              leftSection={<IconUsersGroup size={18} />}
              onClick={() => onPick(chat)}
            />
          )
        })}
        {data?.users.map((u) => (
          <NavLink
            key={u.id}
            label={u.fullName}
            description={u.role === 'STUDENT' && u.group ? u.group.name : ROLE_LABELS[u.role]}
            onClick={() => onPick({ type: 'dm', id: u.id })}
          />
        ))}
      </ScrollArea.Autosize>
    </Modal>
  )
}
