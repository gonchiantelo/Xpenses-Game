'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/groups',
    label: 'Grupos',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/notifications',
    label: 'Alertas',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      className="flex flex-col h-full py-6 px-4 border-r border-subtle"
      style={{ background: 'var(--surface)' }}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 12l10 10 10-10L12 2z" stroke="#00DF81" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" fill="#00DF81" />
          </svg>
        </div>
        <span className="font-black text-lg tracking-tight text-primary">
          Xpenses<span className="text-accent">Game</span>
        </span>
      </div>

      {/* Nav Items */}
      <ul className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                id={`sidebar-nav-${item.label.toLowerCase()}`}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${active
                    ? 'bg-accent/10 text-accent'
                    : 'text-secondary hover:bg-surface-2 hover:text-primary'
                  }
                `}
              >
                <span className={active ? 'text-accent' : 'text-tertiary'}>
                  {item.icon(active)}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Bottom: Theme Toggle + Sign Out */}
      <div className="flex flex-col gap-2 pt-4 border-t border-subtle">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-tertiary">Tema</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-secondary hover:text-danger-DEFAULT hover:bg-danger/5
            transition-all duration-150 w-full text-left
          "
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
