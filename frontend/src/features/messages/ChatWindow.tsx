import { ActionIcon, Alert, Box, Button, Center, Group, Loader, Menu, Modal, Paper, ScrollArea, Stack, Text, Textarea, UnstyledButton } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconArrowForwardUp, IconDotsVertical, IconEdit, IconPaperclip, IconPin, IconPinnedOff, IconSend, IconTrash, IconUsers, IconX } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { messagesApi } from '../../api/messages'
import type { Attachment, Message } from '../../api/types'
import { getErrorMessage } from '../../lib/axios'
import { useCurrentUser } from '../auth/AuthContext'
import { AttachmentView } from './AttachmentView'
import type { ChatRef } from './chatKeys'
import { formatSize, MAX_FILE_SIZE, MAX_FILES } from './files'
import { ForwardModal, MembersModal } from './ChatDialogs'
import { useSocket } from './SocketContext'
import { useChat } from './useChat'

const MAX_LENGTH = 2000

interface BubbleActions {
  onEdit?: () => void
  onForward: () => void
  onPin?: () => void
  onDelete?: () => void
}

function Bubble({ message, mine, showAuthor, actions }: { message: Message; mine: boolean; showAuthor: boolean; actions: BubbleActions }) {
  return (
    <Group id={`msg-${message.id}`} justify={mine ? 'flex-end' : 'flex-start'} gap={4} wrap="nowrap" align="flex-start">
      <Paper
        px="sm"
        py={6}
        radius="lg"
        maw="75%"
        style={{ order: mine ? 1 : 0 }}
        bg={mine ? 'var(--ink)' : 'var(--surface-2)'}
        c={mine ? 'var(--bg)' : undefined}
      >
        {showAuthor && !mine && (
          <Text size="xs" fw={600} c="var(--soft-ink)">
            {message.sender.fullName}
            {message.sender.role === 'TEACHER' && ' · преподаватель'}
          </Text>
        )}
        {message.forwardedFromName && (
          <Text size="xs" fs="italic" opacity={0.8}>
            Переслано от {message.forwardedFromName}
          </Text>
        )}
        {message.attachments?.map((a) => (
          <AttachmentView key={a.id} attachment={a} />
        ))}
        {message.content && (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Text>
        )}
        <Group gap={4} justify="flex-end">
          {message.pinnedAt && <IconPin size={11} style={{ opacity: 0.7 }} />}
          <Text size="10px" opacity={0.7}>
            {message.editedAt && 'изменено · '}
            {dayjs(message.createdAt).format('DD.MM HH:mm')}
          </Text>
        </Group>
      </Paper>
      <Menu position={mine ? 'bottom-end' : 'bottom-start'} withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Действия с сообщением">
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {actions.onEdit && (
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={actions.onEdit}>
              Редактировать
            </Menu.Item>
          )}
          <Menu.Item leftSection={<IconArrowForwardUp size={14} />} onClick={actions.onForward}>
            Переслать
          </Menu.Item>
          {actions.onPin && (
            <Menu.Item leftSection={message.pinnedAt ? <IconPinnedOff size={14} /> : <IconPin size={14} />} onClick={actions.onPin}>
              {message.pinnedAt ? 'Открепить' : 'Закрепить'}
            </Menu.Item>
          )}
          {actions.onDelete && (
            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={actions.onDelete}>
              Удалить
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </Group>
  )
}

export function ChatWindow({ chat, title }: { chat: ChatRef; title: string }) {
  const me = useCurrentUser()
  const { history, sendMessage, connected, joinError } = useChat(chat)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const { editMessage, deleteMessage, pinMessage, forwardMessage } = useSocket()
  const [editing, setEditing] = useState<Message | null>(null)
  const [deleting, setDeleting] = useState<Message | null>(null)
  const [forwarding, setForwarding] = useState<Message | null>(null)
  const [membersOpen, setMembersOpen] = useState(false)
  const messages = history.data ?? []
  const pinned = messages.filter((m) => m.pinnedAt).sort((a, b) => b.pinnedAt!.localeCompare(a.pinnedAt!))
  const [pinnedIndex, setPinnedIndex] = useState(0)
  const pinnedShown = pinned[pinnedIndex % Math.max(pinned.length, 1)]
  // В личном чате закрепляет любой из двоих, в групповом — только его преподаватель.
  const isChatTeacher = chat.type === 'group' && chat.teacherId === me.id
  const canPin = chat.type === 'dm' || isChatTeacher

  const run = async (action: () => Promise<unknown>, errorTitle: string) => {
    try {
      await action()
      return true
    } catch (e) {
      notifications.show({ color: 'red', title: errorTitle, message: getErrorMessage(e) })
      return false
    }
  }

  const startEdit = (m: Message) => {
    setEditing(m)
    setDraft(m.content)
    setPending([])
  }
  const cancelEdit = () => {
    setEditing(null)
    setDraft('')
  }

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight })
  }, [messages.length])

  const attach = async (picked: File[]) => {
    if (picked.length === 0) return
    if (pending.length + picked.length > MAX_FILES) {
      notifications.show({ color: 'red', message: `Можно прикрепить не больше ${MAX_FILES} файлов` })
      return
    }
    const tooBig = picked.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      notifications.show({ color: 'red', message: `«${tooBig.name}» больше ${formatSize(MAX_FILE_SIZE)}` })
      return
    }
    setUploading(true)
    try {
      const uploaded = await messagesApi.upload(picked)
      setPending((prev) => [...prev, ...uploaded])
    } catch (e) {
      notifications.show({ color: 'red', title: 'Файл не загружен', message: getErrorMessage(e) })
    } finally {
      setUploading(false)
    }
  }

  const canSend = (!!draft.trim() || pending.length > 0 || (!!editing && editing.attachments.length > 0)) && !uploading

  const submit = async () => {
    const content = draft.trim()
    if (!canSend || sending) return
    setSending(true)
    if (editing) {
      if (await run(() => editMessage(editing.id, content), 'Не удалось изменить')) cancelEdit()
    } else if (await run(() => sendMessage(content, pending.map((a) => a.id)), 'Сообщение не отправлено')) {
      setDraft('')
      setPending([])
    }
    setSending(false)
  }

  return (
    <Stack
      h="100%"
      gap={0}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        attach([...e.dataTransfer.files])
      }}
    >
      <Group px="md" py="sm" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Text fw={600}>{title}</Text>
        <Group gap="xs">
          {!connected && (
            <Text size="xs" c="orange">
              Нет соединения…
            </Text>
          )}
          <ActionIcon variant="subtle" color="gray" onClick={() => setMembersOpen(true)} aria-label="Участники чата">
            <IconUsers size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {pinnedShown && (
        <UnstyledButton
          px="md"
          py={6}
          onClick={() => {
            document.getElementById(`msg-${pinnedShown.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
            setPinnedIndex((i) => i + 1)
          }}
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <Group gap="xs" wrap="nowrap">
            <IconPin size={14} />
            <Text size="xs" truncate flex={1}>
              {pinnedShown.content || pinnedShown.attachments[0]?.fileName || 'Вложение'}
            </Text>
            {pinned.length > 1 && (
              <Text size="xs" c="dimmed">
                {(pinnedIndex % pinned.length) + 1}/{pinned.length}
              </Text>
            )}
          </Group>
        </UnstyledButton>
      )}

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
                actions={{
                  onEdit: m.senderId === me.id ? () => startEdit(m) : undefined,
                  onForward: () => setForwarding(m),
                  onPin: canPin ? () => run(() => pinMessage(m.id, !m.pinnedAt), 'Не удалось закрепить') : undefined,
                  onDelete: m.senderId === me.id || isChatTeacher ? () => setDeleting(m) : undefined,
                }}
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
        {editing && (
          <Group gap="xs" mb="xs" wrap="nowrap">
            <IconEdit size={14} />
            <Text size="xs" flex={1} truncate>
              Редактирование: {editing.content || 'сообщение с вложением'}
            </Text>
            <ActionIcon size="xs" variant="subtle" onClick={cancelEdit} aria-label="Отменить редактирование">
              <IconX size={14} />
            </ActionIcon>
          </Group>
        )}
        {pending.length > 0 && (
          <Group gap={6} mb="xs">
            {pending.map((a) => (
              <span key={a.id} className="pending-file">
                <span className="pending-name">{a.fileName}</span>
                <span className="pending-size">{formatSize(a.size)}</span>
                <button
                  type="button"
                  aria-label={`Убрать ${a.fileName}`}
                  onClick={() => setPending((prev) => prev.filter((x) => x.id !== a.id))}
                >
                  <IconX size={14} />
                </button>
              </span>
            ))}
          </Group>
        )}
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            attach([...(e.currentTarget.files ?? [])])
            e.currentTarget.value = ''
          }}
        />
        <Group gap="xs" align="flex-end" wrap="nowrap">
          <ActionIcon
            size="lg"
            variant="default"
            onClick={() => fileInput.current?.click()}
            loading={uploading}
            disabled={!connected || !!editing}
            aria-label="Прикрепить файл"
          >
            <IconPaperclip size={18} />
          </ActionIcon>
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
              if (e.key === 'Escape' && editing) cancelEdit()
            }}
          />
          <ActionIcon
            size="lg"
            onClick={submit}
            loading={sending}
            disabled={!canSend || !connected}
            aria-label="Отправить"
          >
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </Box>

      <Modal opened={!!deleting} onClose={() => setDeleting(null)} title="Удалить сообщение?" size="sm">
        <Text size="sm">Сообщение исчезнет у всех участников чата.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDeleting(null)}>
            Отмена
          </Button>
          <Button
            color="red"
            onClick={async () => {
              const m = deleting!
              setDeleting(null)
              await run(() => deleteMessage(m.id), 'Не удалось удалить')
            }}
          >
            Удалить
          </Button>
        </Group>
      </Modal>
      <MembersModal chat={chat} title={title} opened={membersOpen} onClose={() => setMembersOpen(false)} />
      <ForwardModal
        opened={!!forwarding}
        onClose={() => setForwarding(null)}
        onPick={async (to) => {
          const m = forwarding!
          setForwarding(null)
          if (await run(() => forwardMessage(m.id, to), 'Не удалось переслать')) {
            notifications.show({ color: 'green', message: 'Сообщение переслано' })
          }
        }}
      />
    </Stack>
  )
}
