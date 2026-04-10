'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import BottomNav from '@/components/BottomNav'

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) {
        setNotifications(data || [])
      }
      setLoading(false)
    }

    fetchNotifications()
  }, [user])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="btn btn--icon btn--ghost" onClick={() => router.back()}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-header__title">Alertas</h1>
          <p className="page-header__subtitle">Historial de movimientos</p>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}><span className="spinner" /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '3rem' }}>🔔</span>
            <p style={{ marginTop: 16, color: 'var(--color-text-3)' }}>No tienes alertas pendientes</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`notif-card ${n.is_read ? 'read' : 'unread'}`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="notif-icon">
                  {n.type === 'overbudget' ? '🚨' : n.type === 'expense' ? '💰' : '🔔'}
                </div>
                <div className="notif-main">
                  <div className="notif-top">
                    <span className="notif-title">{n.title}</span>
                    <span className="notif-time">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="notif-msg">{n.message}</p>
                </div>
                <button className="notif-del" onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav notifCount={notifications.filter(n => !n.is_read).length} />

      <style jsx>{`
        .notif-list { display: flex; flex-direction: column; gap: 12px; }
        .notif-card {
          display: flex; gap: 16px; padding: 16px; background: var(--color-surface);
          border: 1px solid var(--color-border-2); border-radius: var(--radius-xl);
          position: relative; transition: all 0.2s; cursor: pointer;
        }
        .notif-card.unread { border-left: 4px solid var(--color-accent); }
        .notif-card.read { opacity: 0.7; }
        .notif-icon { font-size: 1.5rem; }
        .notif-main { flex: 1; min-width: 0; }
        .notif-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .notif-title { font-size: var(--text-sm); font-weight: 700; color: var(--color-text); }
        .notif-time { font-size: 0.65rem; color: var(--color-text-3); }
        .notif-msg { font-size: var(--text-xs); color: var(--color-text-2); line-height: 1.4; }
        .notif-del {
          background: none; border: none; color: var(--color-text-3);
          font-size: 1.2rem; cursor: pointer; padding: 4px; line-height: 1;
        }
        .empty-state { text-align: center; padding: 60px 20px; }
        .spinner { width: 30px; height: 30px; border: 3px solid var(--color-surface-3); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
