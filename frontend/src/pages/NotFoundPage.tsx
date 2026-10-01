import { Button, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <Stack align="center" py="xl">
      <Title order={2}>Страница не найдена</Title>
      <Text c="dimmed">Такой страницы нет или у вас нет к ней доступа.</Text>
      <Button component={Link} to="/" variant="light">
        На главную
      </Button>
    </Stack>
  )
}
