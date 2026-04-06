'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_NOTIFICATIONS, getGroupById, getUserById, formatAmount } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const unread = notifications.filter(n => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'debt': return '💸'
      case 'budget_warning': return '⚠️'
      case 'budget_exceeded': return '🚨'
      case 'fixed_expense': return '🔄'
      case 'payment_received': return '✅'
      case 'group_invite': return '👥'
      default: return '🔔'
    }
  }

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'debt': return 'rgba(124,58,237,0.3)'
      case 'budget_warning': return 'rgba(245,158,11,0.3)'
      case 'budget_exceeded': return 'rgba(244,63,94,0.3)'
      case 'payment_received': return 'rgba(16,185,129,0.3)'
      default: return 'var(--color-border-2)'
    }
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d > 0) return `hace ${d}d`
    if (h > 0) return `hace ${h}h`
    return `hace ${m}m`
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Notificaciones</h1>
          {unread > 0 && <p className="page-header__subtitle">{unread} sin leer</p>}
        </div>
        {unread > 0 && (
          <button id="btn-mark-all-read" className="btn btn--sm btn--ghost" onClick={markAllRead}>
            Marcar todo leído
          </button>
        )}
      </header>

      <div className="page-content">
        {unread === 0 && (
          <div className="all-read-banner">
            <span>✨</span>
            <span>Estás al día con todas las notificaciones</span>
          </div>
        )}

        {notifications.map(notif => {
          const group = notif.groupId ? getGroupById(notif.groupId) : null
          return (
            <div
              key={notif.id}
              id={`notif-${notif.id}`}
              className={`notif-card ${notif.read ? 'read' : 'unread'}`}
              style={{ borderLeftColor: notif.read ? 'transparent' : getBorderColor(notif.type) }}
              onClick={() => {
                markRead(notif.id)
                if (notif.groupId) router.push(`/groups/${notif.groupId}?tab=balance`)
              }}
            >
              <div className="notif-icon">{getIcon(notif.type)}</div>
              <div className="notif-body">
                <div className="notif-title">{notif.title}</div>
                <div className="notif-text">{notif.body}</div>
                <div className="notif-meta">
                  {group && (
                    <span className="notif-group">
                      {group.emoji} {group.name}
                    </span>
                  )}
                  <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                </div>
              </div>
              {!notif.read && <div className="notif-dot" />}
            </div>
          )
        })}
      </div>

      <BottomNav notifCount={unread} />

      <style jsx>{`
        .all-read-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: var(--color-success-dim);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          color: var(--color-success);
          font-weight: 500;
        }
        .notif-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-left: 3px solid transparent;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }
        .notif-card + .notif-card { margin-top: 8px; }
        .notif-card:hover { background: var(--color-surface-2); }
        .notif-card.unread { background: var(--color-surface-2); }
        .notif-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: var(--color-surface-3);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notif-body { flex: 1; min-width: 0; }
        .notif-title {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 4px;
        }
        .notif-text {
          font-size: var(--text-xs);
          color: var(--color-text-2);
          line-height: 1.5;
          margin-bottom: 6px;
        }
        .notif-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .notif-group {
          font-size: 0.68rem;
          color: var(--color-accent-light);
          background: var(--color-accent-dim);
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 600;
        }
        .notif-time {
          font-size: 0.68rem;
          color: var(--color-text-3);
        }
        .notif-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-accent);
          flex-shrink: 0;
          margin-top: 4px;
        }
      `}</style>
    </div>
  )
}
