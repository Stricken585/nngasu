import { Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { BrandMark } from '../../components/BrandMark'
import { ThemeToggle } from '../../components/ThemeToggle'

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <div className="auth-box">
        <div className="auth-brand">
          <span className="brand">
            <BrandMark />
            <span className="brand-name">ННГАСУ</span>
          </span>
        </div>
        <div className="auth-card">
          <h1>{title}</h1>
          <Text c="dimmed" size="sm" mt={6} mb="lg">
            {subtitle}
          </Text>
          {children}
        </div>
      </div>
    </div>
  )
}
