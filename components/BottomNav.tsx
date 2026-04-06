'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',       icon: '⊞',  label: 'Inicio'  },
  { href: '/groups',          icon: '👥', label: 'Grupos'  },
  { href: '/notifications',   icon: '🔔', label: 'Alertas' },
  { href: '/profile',         icon: '👤', label: 'Perfil'  },
]

export default function BottomNav({ notifCount = 0 }: { notifCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            id={`nav-${item.label.toLowerCase()}`}
            className={`nav-item ${active ? 'active' : ''}`}
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              {item.icon}
              {item.href === '/notifications' && notifCount > 0 && (
                <span className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
              )}
            </span>
            <span className="nav-label">{item.label}</span>
            <span className="nav-dot" />
          </Link>
        )
      })}

      <style jsx>{`
        .notif-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          background: var(--color-danger);
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 999px;
          min-width: 16px;
          text-align: center;
          line-height: 14px;
        }
      `}</style>
    </nav>
  )
}
