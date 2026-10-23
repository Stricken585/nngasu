import { ActionIcon, Menu, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCalendar,
  IconExternalLink,
  IconHome,
  IconLogout,
  IconMenu2,
  IconMessages,
  IconNews,
  IconStar,
  IconX,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { NavLink as RouterNavLink, Outlet, useNavigate } from 'react-router-dom'
import type { Role } from '../api/types'
import { useAuth, useCurrentUser } from '../features/auth/AuthContext'
import { SocketProvider } from '../features/messages/SocketContext'
import { BrandMark } from './BrandMark'
import { ROLE_LABELS } from './roleLabels'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  roles?: Role[]
}

const NAV: NavItem[] = [
  { to: '/', label: 'Главная', icon: <IconHome size={18} stroke={1.8} /> },
  { to: '/news', label: 'Новости', icon: <IconNews size={18} stroke={1.8} /> },
  { to: '/schedule', label: 'Расписание', icon: <IconCalendar size={18} stroke={1.8} /> },
  { to: '/grades', label: 'Оценки', icon: <IconStar size={18} stroke={1.8} />, roles: ['STUDENT', 'TEACHER'] },
  { to: '/messages', label: 'Сообщения', icon: <IconMessages size={18} stroke={1.8} />, roles: ['STUDENT', 'TEACHER'] },
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
      <header className="site-header">
        <div className="bar">
          <RouterNavLink to="/" className="brand" aria-label="ННГАСУ — на главную" onClick={close}>
            <BrandMark />
            <span className="brand-name">ННГАСУ</span>
          </RouterNavLink>

          <nav className={`nav${opened ? ' open' : ''}`} id="nav" aria-label="Основное меню">
            {items.map((item) => (
              <RouterNavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link" onClick={close}>
                {item.icon}
                {item.label}
              </RouterNavLink>
            ))}
            {user.role === 'ADMIN' && (
              <a className="nav-link" href="/admin" target="_blank" rel="noreferrer">
                <IconExternalLink size={18} stroke={1.8} />
                Админ-панель
              </a>
            )}
          </nav>

          <div className="bar-actions">
            <ThemeToggle />
            <Menu position="bottom-end" width={220}>
              <Menu.Target>
                <button type="button" className="user-btn" aria-label="Меню пользователя">
                  <span className="user-avatar">{initials(user.fullName)}</span>
                  <span className="user-meta">
                    <Text className="user-name" lineClamp={1}>
                      {user.fullName}
                    </Text>
                    <span className="user-role">
                      {ROLE_LABELS[user.role]}
                      {user.group && ` · ${user.group.name}`}
                    </span>
                  </span>
                </button>
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
            <ActionIcon
              className="burger"
              variant="default"
              size={38}
              aria-label={opened ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={opened}
              aria-controls="nav"
              onClick={toggle}
            >
              {opened ? <IconX size={20} stroke={1.8} /> : <IconMenu2 size={20} stroke={1.8} />}
            </ActionIcon>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </SocketProvider>
  )
}
