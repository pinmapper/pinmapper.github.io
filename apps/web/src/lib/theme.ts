import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const THEME_COLOR: Record<Theme, string> = { dark: '#0b0d12', light: '#f4f5f8' }

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme) ?? 'dark',
  )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
    try {
      localStorage.setItem('pm-theme', theme)
    } catch {
      // storage unavailable (private mode)
    }
  }, [theme])
  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}
