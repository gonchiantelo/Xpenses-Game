'use client'

import Link from 'next/link'
import { MOCK_GROUPS, CURRENT_USER, formatAmount, getPaletteById, getUserById } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

export default function GroupsPage() {
  const myGroups = MOCK_GROUPS.filter(g =>
    g.members.some(m => m.userId === CURRENT_USER.id)
  )

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Mis Grupos</h1>
          <p className="page-header__subtitle">{myGroups.length} grupos activos</p>
        </div>
        <Link href="/groups/create" id="btn-create-group" className="btn btn--primary btn--sm">
          + Nuevo grupo
        </Link>
      </header>

      <div className="page-content">
        {myGroups.map(group => {
          const palette = getPaletteById(group.palette)
          const myMember = group.members.find(m => m.userId === CURRENT_USER.id)
          const pct = myMember ? Math.round((myMember.spent / myMember.budget) * 100) : 0

          return (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              id={`group-card-${group.id}`}
              className="group-full-card"
              style={{ '--accent': palette.color } as React.CSSProperties}
            >
              {/* Top stripe */}
              <div className="gfc-stripe" style={{ background: palette.color }} />

              <div className="gfc-body">
                {/* Header */}
                <div className="gfc-header">
                  <div className="gfc-emoji">{group.emoji}</div>
                  <div className="gfc-info">
                    <span className="gfc-name">{group.name}</span>
                    <div className="gfc-tags">
                      <span className="badge badge--neutral">
                        {group.type === 'monthly' ? '📅 Hogar' : group.type === 'travel' ? '✈️ Viaje' : '🎉 Evento'}
                      </span>
                      <span className="badge badge--neutral">{group.currency}</span>
                    </div>
                  </div>
                  {myMember?.role === 'admin' && (
                    <span className="badge badge--accent">Admin</span>
                  )}
                </div>

                {/* Members */}
                <div className="gfc-members">
                  {group.members.map(m => {
                    const u = getUserById(m.userId)
                    return u ? (
                      <div
                        key={m.userId}
                        className="member-pill"
                        title={`${u.firstName} ${u.lastName}`}
                      >
                        <div className="member-ava" style={{ background: u.avatarColor }}>
                          {u.avatarInitials}
                        </div>
                        <span>{u.firstName}</span>
                      </div>
                    ) : null
                  })}
                </div>

                {/* Budget */}
                {myMember && (
                  <div className="gfc-budget">
                    <div className="gfc-budget-row">
                      <span className="text-dim" style={{ fontSize: '0.75rem' }}>Mi presupuesto</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-2)' }}>
                        {formatAmount(myMember.budget, group.currency)}
                      </span>
                    </div>
                    <div className="gfc-budget-row" style={{ marginTop: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        {formatAmount(myMember.spent, group.currency)} gastado
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pct >= 90 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {formatAmount(myMember.budget - myMember.spent, group.currency)} libre
                      </span>
                    </div>
                    <div className="progress-track" style={{ marginTop: 8 }}>
                      <div
                        className={`progress-fill ${pct >= 90 ? 'progress-fill--danger' : pct >= 70 ? 'progress-fill--warning' : ''}`}
                        style={{ width: `${Math.min(pct, 100)}%`, background: pct < 70 ? palette.color : undefined }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>{pct}% utilizado</span>
                      {pct >= 90 && <span className="badge badge--danger" style={{ fontSize: '0.65rem' }}>⚠️ Cerca del límite</span>}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          )
        })}

        {/* Empty state */}
        {myGroups.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No tenés grupos</h3>
            <p>Creá tu primer grupo para empezar a dividir gastos</p>
            <Link href="/groups/create" id="btn-create-first-group" className="btn btn--primary">
              Crear grupo
            </Link>
          </div>
        )}
      </div>

      <BottomNav notifCount={2} />

      <style jsx>{`
        .group-full-card {
          display: block;
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl);
          overflow: hidden;
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
        }
        .group-full-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .gfc-stripe {
          height: 3px;
          width: 100%;
        }
        .gfc-body {
          padding: var(--space-4) var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .gfc-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }
        .gfc-emoji { font-size: 2rem; flex-shrink: 0; }
        .gfc-info { flex: 1; }
        .gfc-name {
          display: block;
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 6px;
        }
        .gfc-tags { display: flex; gap: var(--space-2); flex-wrap: wrap; }
        .gfc-members {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        .member-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-full);
          padding: 4px 10px 4px 4px;
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-2);
        }
        .member-ava {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: white;
        }
        .gfc-budget {}
        .gfc-budget-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-16) var(--space-6);
          text-align: center;
        }
        .empty-icon { font-size: 4rem; }
        .empty-state h3 { font-size: var(--text-xl); font-weight: 700; }
        .empty-state p { font-size: var(--text-sm); color: var(--color-text-2); }
      `}</style>
    </div>
  )
}
