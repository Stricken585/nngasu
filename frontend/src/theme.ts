import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Оранжевый акцент из front_test (#F26A1B светлая тема, #FF8040 тёмная).
const brand: MantineColorsTuple = [
  '#FFF3EB',
  '#FDE9DC',
  '#FBD0B3',
  '#F9B488',
  '#FF9558',
  '#FF8040',
  '#F26A1B',
  '#D45510',
  '#B0430A',
  '#8A3A0B',
]

export const theme = createTheme({
  colors: { brand },
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: 'sm',
  radius: { xs: '6px', sm: '10px', md: '16px', lg: '22px', xl: '32px' },
  fontFamily: "Onest, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  headings: {
    fontFamily: "Unbounded, Onest, system-ui, sans-serif",
    fontWeight: '500',
  },
  components: {
    Button: { defaultProps: { fw: 500 } },
    Card: { defaultProps: { radius: 'lg' } },
    Paper: { defaultProps: { radius: 'lg' } },
  },
})
