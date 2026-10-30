import { Anchor, Button, Group, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDownload, IconFile } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { fetchAttachment } from '../../api/messages'
import type { Attachment } from '../../api/types'
import { getErrorMessage } from '../../lib/axios'
import { formatSize, kindOf } from './files'

// blob: URL файла для показа в чате; освобождается при размонтировании.
function useInlineUrl(attachment: Attachment, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let objectUrl: string | null = null
    let cancelled = false
    fetchAttachment(attachment.id, true).then(
      (blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      },
      () => !cancelled && setError(true),
    )
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment.id, enabled])
  return { url, error }
}

// Файл в сообщении: картинка/видео/аудио показываются прямо в чате, остальное —
// плашкой со скачиванием. Картинки грузятся сразу, видео и аудио — по кнопке
// (до 25 МБ на файл). У любого типа есть кнопка «скачать».
export function AttachmentView({ attachment }: { attachment: Attachment }) {
  const kind = kindOf(attachment.mimeType)
  const [play, setPlay] = useState(false)
  const { url, error } = useInlineUrl(attachment, kind === 'image' || (play && (kind === 'video' || kind === 'audio')))

  const download = async () => {
    try {
      const blob = await fetchAttachment(attachment.id)
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = attachment.fileName
      a.click()
      setTimeout(() => URL.revokeObjectURL(href), 10_000)
    } catch (e) {
      notifications.show({ color: 'red', title: 'Файл не скачан', message: getErrorMessage(e) })
    }
  }

  return (
    <div className="attachment">
      {kind === 'image' && url && (
        <a href={url} target="_blank" rel="noreferrer" aria-label={`Открыть ${attachment.fileName}`}>
          <img src={url} alt={attachment.fileName} className="attachment-img" />
        </a>
      )}
      {kind === 'video' && url && <video src={url} controls autoPlay className="attachment-media" />}
      {kind === 'audio' && url && <audio src={url} controls autoPlay className="attachment-audio" />}
      {(kind === 'video' || kind === 'audio') && !play && (
        <Button size="xs" variant="default" onClick={() => setPlay(true)}>
          {kind === 'video' ? 'Загрузить видео' : 'Загрузить аудио'}
        </Button>
      )}
      {error && (
        <Text size="xs" c="red">
          Не удалось загрузить файл
        </Text>
      )}
      <Group gap={8} wrap="nowrap" className="attachment-file">
        <IconFile size={18} stroke={1.8} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <Text size="sm" fw={500} lineClamp={1} style={{ wordBreak: 'break-all' }}>
            {attachment.fileName}
          </Text>
          <Text size="xs" opacity={0.7}>
            {formatSize(attachment.size)}
          </Text>
        </div>
        <Anchor component="button" type="button" onClick={download} aria-label={`Скачать ${attachment.fileName}`} className="attachment-dl">
          <IconDownload size={18} stroke={1.8} />
        </Anchor>
      </Group>
    </div>
  )
}
