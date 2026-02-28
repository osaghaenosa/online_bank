'use client'
import { useEffect } from 'react'
import { useStore } from '@/store'

export function ThemeInjector() {
  const { state } = useStore()
  const { theme } = state

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-accent', theme.accentColor)
    root.style.setProperty('--color-primary', theme.primaryColor)

    if (theme.darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    document.title = `${theme.appName} — Personal Banking`
  }, [theme])

  return null
}
