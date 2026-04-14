'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-4 rounded-full skeleton" />

  const isDark = theme === 'dark'

  return (
    <button
      id="btn-theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="
        relative flex items-center w-11 h-6 rounded-full
        transition-colors duration-300 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60
      "
      style={{
        background: isDark ? 'rgba(0,223,129,0.25)' : 'rgba(0,168,90,0.20)',
      }}
      aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      title={`Modo ${isDark ? 'claro' : 'oscuro'}`}
    >
      <span
        className="
          absolute left-0.5 w-5 h-5 rounded-full flex items-center justify-center
          text-xs shadow-sm transition-transform duration-300
        "
        style={{
          transform: isDark ? 'translateX(0)' : 'translateX(20px)',
          background: isDark ? '#00DF81' : '#00A85A',
        }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
