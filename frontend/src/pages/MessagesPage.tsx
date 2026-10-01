import { Box, Button, Center, Group, Paper, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconArrowLeft } from '@tabler/icons-react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { QueryState } from '../components/QueryState'
import { ChatList } from '../features/messages/ChatList'
import { ChatWindow } from '../features/messages/ChatWindow'
import { chatId, parseChatId } from '../features/messages/chatKeys'
import { useContacts } from '../features/messages/useChat'

export function MessagesPage() {
  const contacts = useContacts()
  const [params, setParams] = useSearchParams()
  const active = parseChatId(params.get('chat'))
  const isMobile = useMediaQuery('(max-width: 48em)')

  const title = !active
    ? ''
    : active.type === 'group'
      ? `Чат группы ${contacts.data?.groups.find((g) => g.id === active.id)?.name ?? ''}`
      : (contacts.data?.users.find((u) => u.id === active.id)?.fullName ?? 'Личные сообщения')

  // На телефоне — либо список, либо открытый чат.
  const showList = !isMobile || !active
  const showChat = !isMobile || !!active

  return (
    <>
      <PageHeader title="Сообщения" />
      <QueryState isLoading={contacts.isLoading} error={contacts.error}>
        {contacts.data && (
          <Paper withBorder radius="md" h="calc(100dvh - 190px)" mih={420} style={{ overflow: 'hidden' }}>
            <Group h="100%" gap={0} wrap="nowrap" align="stretch">
              {showList && (
                <Box
                  w={isMobile ? '100%' : 300}
                  style={{ flexShrink: 0, borderRight: isMobile ? undefined : '1px solid var(--mantine-color-default-border)' }}
                >
                  <ChatList
                    contacts={contacts.data}
                    active={active}
                    onSelect={(chat) => setParams({ chat: chatId(chat) })}
                  />
                </Box>
              )}
              {showChat && (
                <Box flex={1} miw={0}>
                  {active ? (
                    <>
                      {isMobile && (
                        <Button variant="subtle" size="xs" m={4} leftSection={<IconArrowLeft size={14} />} onClick={() => setParams({})}>
                          К списку
                        </Button>
                      )}
                      <Box h={isMobile ? 'calc(100% - 38px)' : '100%'}>
                        <ChatWindow key={chatId(active)} chat={active} title={title} />
                      </Box>
                    </>
                  ) : (
                    <Center h="100%">
                      <Text c="dimmed">Выберите чат слева</Text>
                    </Center>
                  )}
                </Box>
              )}
            </Group>
          </Paper>
        )}
      </QueryState>
    </>
  )
}
