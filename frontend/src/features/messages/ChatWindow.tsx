import { ActionIcon, Alert, Box, Center, Group, Loader, Paper, ScrollArea, Stack, Text, Textarea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconSend } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import type { Message } from '../../api/types'
import { getErrorMessage } from '../../lib/axios'
import { useCurrentUser } from '../auth/AuthContext'
import type { ChatRef } from './chatKeys'
import { useChat } from './useChat'

const MAX_LENGTH = 2000

function Bubble({ message, mine, showAuthor }: { message: Message; mine: boolean; showAuthor: boolean }) {
  return (
    <Group justify={mine ? 'flex-end' : 'flex-start'}>
      <Paper
        px="sm"
        py={6}
        radius="lg"
        maw="75%"
        bg={mine ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-gray-1)'}
        c={mine ? 'white' : undefined}
      >
        {showAuthor && !mine && (
          <Text size="xs" fw={700} c="blue">
            {message.sender.fullName}
            {message.sender.role === 'TEACHER' && ' · преподаватель'}
          </Text>
        )}
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Text>
        <Text size="10px" ta="right" opacity={0.7}>
          {dayjs(message.createdAt).format('DD.MM HH:mm')}
        </Text>
      </Paper>
    </Group>
  )
}

export function ChatWindow({ chat, title }: { chat: ChatRef; title: string }) {
  const me = useCurrentUser()
  const { history, sendMessage, connected, joinError } = useChat(chat)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  const messages = history.data ?? []

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight })
  }, [messages.length])

  const submit = async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    try {
      await sendMessage(content)
      setDraft('')
    } catch (e) {
      notifications.show({ color: 'red', title: 'Сообщение не отправлено', message: getErrorMessage(e) })
    } finally {
      setSending(false)
    }
  }

  return (
    <Stack h="100%" gap={0}>
      <Group px="md" py="sm" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Text fw={600}>{title}</Text>
        {!connected && (
          <Text size="xs" c="orange">
            Нет соединения…
          </Text>
        )}
      </Group>

      <ScrollArea flex={1} viewportRef={viewport} px="md" py="sm">
        {history.isLoading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : history.error ? (
          <Alert color="red">{getErrorMessage(history.error)}</Alert>
        ) : messages.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed" size="sm">
              Сообщений пока нет — напишите первым.
            </Text>
          </Center>
        ) : (
          <Stack gap={6}>
            {messages.map((m, i) => (
              <Bubble
                key={m.id}
                message={m}
                mine={m.senderId === me.id}
                showAuthor={chat.type === 'group' && messages[i - 1]?.senderId !== m.senderId}
              />
            ))}
          </Stack>
        )}
      </ScrollArea>

      {joinError && (
        <Alert color="red" mx="md" mb="xs">
          {joinError}
        </Alert>
      )}
      <Box p="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <Textarea
            flex={1}
            autosize
            minRows={1}
            maxRows={5}
            maxLength={MAX_LENGTH}
            placeholder="Сообщение… (Enter — отправить, Shift+Enter — перенос)"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
          />
          <ActionIcon
            size="lg"
            onClick={submit}
            loading={sending}
            disabled={!draft.trim() || !connected}
            aria-label="Отправить"
          >
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </Box>
    </Stack>
  )
}
