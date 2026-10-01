import { AppShell, Avatar, Burger, Group, Menu, NavLink, Text, UnstyledButton } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCalendar,
  IconChevronDown,
  IconExternalLink,
  IconHome,
  IconLogout,
  IconMessages,
  IconSchool,
  IconStar,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { NavLink as RouterNavLink, Outlet, useNavigate } from 'react-router-dom'
import type { Role } from '../api/types'
import { useAuth, useCurrentUser } from '../features/auth/AuthContext'
import { SocketProvider } from '../features/messages/SocketContext'
import { ROLE_LABELS } from './roleLabels'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  roles?: Role[]
}

const NAV: NavItem[] = [
  { to: '/', label: 'Главная', icon: <IconHome size={18} /> },
  { to: '/schedule', label: 'Расписание', icon: <IconCalendar size={18} /> },
  { to: '/grades', label: 'Оценки', icon: <IconStar size={18} />, roles: ['STUDENT', 'TEACHER'] },
  { to: '/messages', label: 'Сообщения', icon: <IconMessages size={18} />, roles: ['STUDENT', 'TEACHER'] },
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export function Layout() {
  const user = useCurrentUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [opened, { toggle, close }] = useDisclosure()

  const items = NAV.filter((i) => !i.roles || i.roles.includes(user.role))

  return (
    <SocketProvider>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <IconSchool size={26} color="var(--mantine-color-blue-6)" />
              <Text fw={700} visibleFrom="xs">
                Сайт вуза
              </Text>
            </Group>
            <Menu position="bottom-end" width={220}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs" wrap="nowrap">
                    <Avatar color="blue" radius="xl" size="sm">
                      {initials(user.fullName)}
                    </Avatar>
                    <div style={{ lineHeight: 1.1 }}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {user.fullName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {ROLE_LABELS[user.role]}
                        {user.group && ` · ${user.group.name}`}
                      </Text>
                    </div>
                    <IconChevronDown size={14} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user.email}</Menu.Label>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={async () => {
                    await logout()
                    navigate('/login')
                  }}
                >
                  Выйти
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="xs">
          {items.map((item) => (
            <NavLink
              key={item.to}
              component={RouterNavLink}
              to={item.to}
              end={item.to === '/'}
              label={item.label}
              leftSection={item.icon}
              onClick={close}
            />
          ))}
          {user.role === 'ADMIN' && (
            <NavLink
              href="/admin"
              target="_blank"
              label="Админ-панель"
              leftSection={<IconExternalLink size={18} />}
            />
          )}
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </SocketProvider>
  )
}
