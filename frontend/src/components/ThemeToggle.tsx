import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: false })
  const dark = scheme === 'dark'

  return (
    <ActionIcon
      variant="default"
      size={38}
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      aria-pressed={dark}
      onClick={() => setColorScheme(dark ? 'light' : 'dark')}
    >
      {dark ? <IconSun size={20} stroke={1.8} /> : <IconMoon size={20} stroke={1.8} />}
    </ActionIcon>
  )
}
