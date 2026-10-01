import { Alert, Anchor, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../lib/axios'
import { AuthCard } from './AuthCard'
import { useAuth } from './AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const form = useForm({
    initialValues: { fullName: '', email: '', password: '', confirm: '' },
    validate: {
      fullName: (v) => (v.trim().length >= 2 ? null : 'Укажите ФИО'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Некорректный email'),
      password: (v) => (v.length >= 6 ? null : 'Не короче 6 символов'),
      confirm: (v, values) => (v === values.password ? null : 'Пароли не совпадают'),
    },
  })

  const submit = form.onSubmit(async ({ confirm: _confirm, ...values }) => {
    setError(null)
    try {
      await register(values)
      navigate('/', { replace: true })
    } catch (e) {
      setError(getErrorMessage(e))
    }
  })

  return (
    <AuthCard
      title="Регистрация"
      subtitle={
        <>
          Уже есть аккаунт?{' '}
          <Anchor component={Link} to="/login" size="sm">
            Войти
          </Anchor>
        </>
      }
    >
      <form onSubmit={submit}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <TextInput label="ФИО" placeholder="Иванов Иван Иванович" {...form.getInputProps('fullName')} />
          <TextInput label="Email" type="email" autoComplete="email" {...form.getInputProps('email')} />
          <PasswordInput label="Пароль" autoComplete="new-password" {...form.getInputProps('password')} />
          <PasswordInput label="Повторите пароль" autoComplete="new-password" {...form.getInputProps('confirm')} />
          <Button type="submit" loading={form.submitting}>
            Зарегистрироваться
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
