'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function NotificationsPage() {
  const [notifications] = useState([])

  return (
    <div className="page" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Notificaciones</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="all-read-banner">
          <span>✨</span>
          <span>Estás al día con todas las notificaciones</span>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: 100, opacity: 0.5 }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>🔔</span>
          <p>No tienes notificaciones nuevas</p>
        </div>
      </div>

      <BottomNav notifCount={0} />

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
      `}</style>
    </div>
  )
}
