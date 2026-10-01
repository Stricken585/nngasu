import { Alert, Anchor, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../lib/axios'
import { AuthCard } from './AuthCard'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Некорректный email'),
      password: (v) => (v ? null : 'Введите пароль'),
    },
  })

  const submit = form.onSubmit(async (values) => {
    setError(null)
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (e) {
      setError(getErrorMessage(e))
    }
  })

  return (
    <AuthCard
      title="Вход"
      subtitle={
        <>
          Нет аккаунта?{' '}
          <Anchor component={Link} to="/register" size="sm">
            Зарегистрироваться
          </Anchor>
        </>
      }
    >
      <form onSubmit={submit}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <TextInput label="Email" type="email" autoComplete="email" {...form.getInputProps('email')} />
          <PasswordInput label="Пароль" autoComplete="current-password" {...form.getInputProps('password')} />
          <Button type="submit" loading={form.submitting}>
            Войти
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
