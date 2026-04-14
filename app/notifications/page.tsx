'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const TYPE_ICONS: Record<string, string> = {
  overbudget: '🚨', expense: '💰', invite: '✉️', settlement: '🤝', system: '🔔',
}

export default function NotificationsPage() {
  const router   = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setNotifications(data || [])
        setLoading(false)
      })
  }, [user]) // eslint-disable-line

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl bg-surface-2 border border-subtle text-secondary hover:text-primary transition-colors"
          aria-label="Volver">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-primary tracking-tight">Alertas</h1>
          <p className="text-xs text-tertiary mt-0.5">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
          </p>
        </div>
      </header>

      {loading ? (
        /* Skeleton */
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-20 w-full rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center text-center py-16 animate-fade-in">
          <div className="text-5xl mb-4">🔔</div>
          <h3 className="text-base font-bold text-primary mb-1">Sin alertas pendientes</h3>
          <p className="text-sm text-tertiary">Cuando haya actividad en tus grupos aparecerá aquí.</p>
        </div>
      ) : (
        /* Notification list */
        <div className="flex flex-col gap-2.5 animate-fade-in">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`
                flex items-start gap-3 p-4 rounded-xl border bg-surface cursor-pointer
                transition-all duration-150 hover:border-accent/20
                ${n.is_read
                  ? 'border-subtle opacity-70'
                  : 'border-l-[3px] border-l-accent border-subtle/60'
                }
              `}
            >
              <span className="text-2xl shrink-0 mt-0.5" aria-hidden="true">
                {TYPE_ICONS[n.type] ?? '🔔'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-primary leading-tight">{n.title}</p>
                  <span className="text-[10px] text-tertiary shrink-0 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-secondary mt-0.5 leading-snug">{n.message}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); deleteNotif(n.id) }}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-tertiary hover:text-danger-DEFAULT hover:bg-danger/5 transition-colors text-base leading-none"
                aria-label="Eliminar notificación"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
