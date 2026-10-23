import { Card, Stack, Text } from '@mantine/core'
import { PageHeader } from '../components/PageHeader'
import { QueryState } from '../components/QueryState'
import { NewsCard } from '../features/news/NewsCard'
import { useNews } from '../features/news/useNews'

export function NewsPage() {
  const { data = [], isLoading, error } = useNews()

  return (
    <>
      <PageHeader title="Новости вуза" />
      <QueryState isLoading={isLoading} error={error}>
        {data.length === 0 ? (
          <Text c="dimmed">Новостей пока нет.</Text>
        ) : (
          <Stack maw={760}>
            {data.map((item) => (
              <Card key={item.id} withBorder padding="lg">
                <NewsCard item={item} />
              </Card>
            ))}
          </Stack>
        )}
      </QueryState>
    </>
  )
}
