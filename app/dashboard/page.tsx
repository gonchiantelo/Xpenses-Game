'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MOCK_GROUPS, MOCK_NOTIFICATIONS, CURRENT_USER,
  formatAmount, getCurrencySymbol, getPaletteById
} from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

export default function DashboardPage() {
  const router = useRouter()
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length

  // Total spent this month across all groups (in original currencies)
  const groupSummaries = MOCK_GROUPS.map(g => {
    const myMember = g.members.find(m => m.userId === CURRENT_USER.id)
    const palette = getPaletteById(g.palette)
    return {
      ...g,
      myBudget: myMember?.budget ?? 0,
      mySpent: myMember?.spent ?? 0,
      myAvailable: (myMember?.budget ?? 0) - (myMember?.spent ?? 0),
      membersCount: g.members.length,
      palette,
      pct: myMember ? Math.round((myMember.spent / myMember.budget) * 100) : 0,
    }
  })

  return (
    <div className="page">
      {/* Header */}
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Hola, {CURRENT_USER.firstName} 👋</p>
          <h1 className="page-header__title">Mi resumen</h1>
        </div>
        <Link href="/notifications" id="btn-notif-header" aria-label="Ver notificaciones">
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            {unreadCount > 0 && (
              <span className="header-badge">{unreadCount}</span>
            )}
          </div>
        </Link>
      </header>

      <div className="page-content">

        {/* Recent Alert */}
        {unreadCount > 0 && (
          <Link href="/notifications" id="link-alert-banner" style={{ textDecoration: 'none' }}>
            <div className="alert-banner">
              <span className="alert-banner__icon">⚠️</span>
              <div className="alert-banner__text">
                <strong>Presupuesto casi agotado</strong>
                <span>Te queda menos del 10% en Casa este mes</span>
              </div>
              <span className="alert-banner__arrow">›</span>
            </div>
          </Link>
        )}

        {/* Groups Section */}
        <section aria-label="Mis grupos" id="section-groups">
          <div className="section-header">
            <h2 className="section-title">Mis grupos</h2>
            <Link href="/groups/create" id="btn-create-group-dash" className="btn btn--sm btn--ghost">
              + Nuevo
            </Link>
          </div>

          <div className="groups-list">
            {groupSummaries.map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                id={`card-group-${group.id}`}
                className="group-card"
                data-theme={group.palette.id}
                style={{
                  '--card-accent': group.palette.color,
                } as React.CSSProperties}
              >
                <div className="group-card__top">
                  <div className="group-card__emoji">{group.emoji}</div>
                  <div className="group-card__info">
                    <span className="group-card__name">{group.name}</span>
                    <div className="group-card__meta">
                      <span>{group.membersCount} {group.membersCount === 1 ? 'persona' : 'personas'}</span>
                      <span>·</span>
                      <span>{group.currency}</span>
                      <span>·</span>
                      <span>{group.type === 'monthly' ? '📅 Mensual' : group.type === 'travel' ? '✈️ Viaje' : '🎉 Evento'}</span>
                    </div>
                  </div>
                  <span className="group-card__arrow">›</span>
                </div>

                {/* Budget bar */}
                <div className="group-card__budget">
                  <div className="group-card__amounts">
                    <span className="group-card__spent">{formatAmount(group.mySpent, group.currency)} gastado</span>
                    <span className="group-card__available">{formatAmount(group.myAvailable, group.currency)} disponible</span>
                  </div>
                  <div className="progress-track" style={{ marginTop: '8px' }}>
                    <div
                      className={`progress-fill ${group.pct >= 90 ? 'progress-fill--danger' : group.pct >= 70 ? 'progress-fill--warning' : ''}`}
                      style={{
                        width: `${Math.min(group.pct, 100)}%`,
                        background: group.pct >= 90 ? undefined : `var(--card-accent)`,
                      }}
                    />
                  </div>
                  <div className="group-card__pct">
                    <span className={group.pct >= 90 ? 'text-danger' : group.pct >= 70 ? 'text-warning' : 'text-dim'}>
                      {group.pct}% del presupuesto
                    </span>
                    {group.pct >= 90 && <span className="badge badge--danger">⚠️ Límite</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick action */}
        <Link href="/groups" id="btn-view-all-groups" className="btn btn--ghost btn--full" style={{ marginTop: -8 }}>
          Ver todos los grupos →
        </Link>

        {/* Pending debts sneak peek */}
        <section aria-label="Deudas pendientes" id="section-debts-preview">
          <div className="section-header">
            <h2 className="section-title">Deudas pendientes</h2>
          </div>
          <div className="debt-card">
            <div className="debt-row">
              <div className="debt-avatar" style={{ background: '#10B981' }}>ML</div>
              <div className="debt-info">
                <span className="debt-name">Matías te debe</span>
                <span className="debt-reason">Alquiler + Internet + Luz · Casa</span>
              </div>
              <span className="debt-amount">$U 15.025</span>
            </div>
            <div className="debt-row">
              <div className="debt-avatar" style={{ background: '#F43F5E' }}>SM</div>
              <div className="debt-info">
                <span className="debt-name">Sofía te debe</span>
                <span className="debt-reason">Hotel La Barra + Restaurante · Viaje</span>
              </div>
              <span className="debt-amount">US$ 180</span>
            </div>
          </div>
        </section>

        <div style={{ height: 16 }} />
      </div>

      {/* FAB */}
      <button
        id="fab-add-expense"
        className="fab"
        onClick={() => router.push('/expenses/add')}
        aria-label="Agregar gasto"
        title="Agregar gasto"
      >
        +
      </button>

      <BottomNav notifCount={unreadCount} />

      <style jsx>{`
        .header-badge {
          position: absolute;
          top: -4px;
          right: -6px;
          background: var(--color-danger);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 999px;
          min-width: 18px;
          text-align: center;
          line-height: 16px;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }
        .alert-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: var(--color-warning-dim);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s;
        }
        .alert-banner:hover { background: rgba(245,158,11,0.2); }
        .alert-banner__icon { font-size: 1.25rem; flex-shrink: 0; }
        .alert-banner__text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .alert-banner__text strong {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-warning);
        }
        .alert-banner__text span {
          font-size: var(--text-xs);
          color: var(--color-text-2);
        }
        .alert-banner__arrow {
          color: var(--color-text-3);
          font-size: 1.25rem;
        }
        .groups-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .group-card {
          display: block;
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl);
          padding: var(--space-4) var(--space-5);
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .group-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--card-accent);
          opacity: 0.8;
        }
        .group-card:hover {
          border-color: rgba(255,255,255,0.12);
          background: var(--color-surface-2);
          transform: translateY(-1px);
        }
        .group-card__top {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }
        .group-card__emoji {
          font-size: 1.75rem;
          flex-shrink: 0;
        }
        .group-card__info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .group-card__name {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--color-text);
        }
        .group-card__meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: var(--color-text-3);
        }
        .group-card__arrow {
          font-size: 1.25rem;
          color: var(--color-text-3);
        }
        .group-card__budget {}
        .group-card__amounts {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-xs);
        }
        .group-card__spent { color: var(--color-text-2); }
        .group-card__available { font-weight: 600; color: var(--color-text); }
        .group-card__pct {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
          font-size: var(--text-xs);
        }
        /* Debt section */
        .debt-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .debt-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          cursor: pointer;
          transition: background 0.15s;
        }
        .debt-row:hover { background: var(--color-surface-2); }
        .debt-row + .debt-row { border-top: 1px solid var(--color-border-2); }
        .debt-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .debt-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .debt-name {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text);
        }
        .debt-reason {
          font-size: var(--text-xs);
          color: var(--color-text-3);
        }
        .debt-amount {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--color-success);
        }
      `}</style>
    </div>
  )
}
