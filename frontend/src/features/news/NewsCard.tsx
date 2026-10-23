import { Text, Title } from '@mantine/core'
import dayjs from 'dayjs'
import type { News } from '../../api/types'

const formatNewsDate = (iso: string) => dayjs(iso).format('D MMMM YYYY')

export function NewsCard({ item, clamp }: { item: News; clamp?: number }) {
  return (
    <article>
      <Text size="xs" c="dimmed" mb={4}>
        {formatNewsDate(item.createdAt)}
      </Text>
      <Title order={3} fz="lg" mb="xs">
        {item.title}
      </Title>
      <Text style={{ whiteSpace: 'pre-wrap' }} lineClamp={clamp}>
        {item.content}
      </Text>
    </article>
  )
}
