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

  // Calculate totals for Hero section
  const totals = MOCK_GROUPS.reduce((acc, g) => {
    const myM = g.members.find(m => m.userId === CURRENT_USER.id)
    const avail = (myM?.budget ?? 0) - (myM?.spent ?? 0)
    acc[g.currency] = (acc[g.currency] || 0) + avail
    return acc
  }, {} as Record<string, number>)

  const mainCurrency = 'UYU' // For multi-currency display logic
  const mainTotal = totals[mainCurrency] || 0

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
      <header className="page-header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
        <div>
          <p className="page-header__subtitle">Hola, {CURRENT_USER.firstName} 👋</p>
        </div>
        <Link href="/notifications" id="btn-notif-header">
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
          </div>
        </Link>
      </header>

      <div className="page-content" style={{ paddingTop: 0 }}>
        
        {/* 🔥 SALDO HERO SECTION — CRITICAL UX IMPROVEMENT */}
        <section id="dashboard-hero" className="saldo-hero">
          <div className="saldo-hero__top">
            <span className="saldo-hero__label">Saldo disponible total</span>
            <div className="saldo-hero__main">
              <span className="saldo-hero__symbol">{getCurrencySymbol(mainCurrency)}</span>
              <span className="saldo-hero__value">{(mainTotal / 1000).toFixed(1)}k</span>
            </div>
          </div>
          
          <div className="saldo-hero__others">
            {Object.entries(totals).filter(([curr]) => curr !== mainCurrency).map(([curr, val]) => (
              <div key={curr} className="saldo-hero__other-pill">
                {getCurrencySymbol(curr)} {val.toLocaleString()}
              </div>
            ))}
          </div>

          <div className="saldo-hero__footer">
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: '68%', background: 'white' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="saldo-hero__meta">Gastaste {formatAmount(24300, 'UYU')} este mes</span>
              <span className="saldo-hero__meta">68% del presupuesto</span>
            </div>
          </div>
        </section>

        {/* Recent Alert */}
        {unreadCount > 0 && (
          <Link href="/notifications" id="link-alert-banner" className="alert-banner">
            <span className="alert-banner__icon">⚠️</span>
            <div className="alert-banner__text">
              <strong>Presupuesto casi agotado</strong>
              <span>Menos del 10% en Grupo "Casa"</span>
            </div>
            <span className="alert-banner__arrow">›</span>
          </Link>
        )}

        <section id="section-groups" style={{ marginTop: 8 }}>
          <div className="section-header">
            <h2 className="section-title">Grupos ({MOCK_GROUPS.length})</h2>
            <Link href="/groups/create" className="btn btn--sm btn--ghost">+ Nuevo</Link>
          </div>

          <div className="groups-list">
            {groupSummaries.map(group => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                id={`card-group-${group.id}`}
                className="group-card-new"
                data-theme={group.palette.id}
              >
                <div className="gc-head">
                  <span className="gc-emoji">{group.emoji}</span>
                  <div className="gc-info">
                    <span className="gc-name">{group.name}</span>
                    <span className="gc-member-count">{group.membersCount} participantes</span>
                  </div>
                  <div className="gc-available-box" style={{ borderColor: group.palette.color }}>
                    <span className="gc-available-label">Disponible</span>
                    <span className="gc-available-val">{formatAmount(group.myAvailable, group.currency)}</span>
                  </div>
                </div>
                
                <div className="progress-track">
                  <div 
                    className={`progress-fill ${group.pct >= 90 ? 'progress-fill--danger' : group.pct >= 70 ? 'progress-fill--warning' : ''}`}
                    style={{ width: `${Math.min(group.pct, 100)}%`, background: group.pct < 70 ? group.palette.color : undefined }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="section-debts-preview">
          <div className="section-header">
            <h2 className="section-title">Me deben 💚</h2>
          </div>
          <div className="debt-card">
            <div className="debt-row">
              <div className="debt-avatar" style={{ background: '#10B981' }}>ML</div>
              <div className="debt-info">
                <span className="debt-name">Matías te debe</span>
                <span className="debt-reason">Casa Uruguay</span>
              </div>
              <span className="debt-amount">$U 5.200</span>
            </div>
          </div>
        </section>
        
        <div style={{ height: 16 }} />
      </div>

      <button id="fab-add-expense" className="fab" onClick={() => router.push('/expenses/add')}>+</button>
      <BottomNav notifCount={unreadCount} />

      <style jsx>{`
        .saldo-hero {
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-600) 100%);
          color: white;
          border-radius: var(--radius-2xl);
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 12px 24px -8px var(--color-accent-dim);
          position: relative;
          overflow: hidden;
        }
        .saldo-hero::after {
          content: ''; position: absolute; top: -50px; right: -50px; width: 150px; height: 150px;
          background: rgba(255,255,255,0.1); border-radius: 50%;
        }
        .saldo-hero__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.8; }
        .saldo-hero__main { display: flex; align-items: baseline; gap: 8px; margin: 8px 0 16px; }
        .saldo-hero__symbol { font-size: 1.5rem; font-weight: 700; opacity: 0.8; }
        .saldo-hero__value { font-size: 3.5rem; font-weight: 900; letter-spacing: -0.05em; }
        .saldo-hero__others { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .saldo-hero__other-pill { 
          background: rgba(255,255,255,0.15); border-radius: 99px; padding: 4px 12px; 
          font-size: 0.7rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.1);
        }
        .saldo-hero__meta { font-size: 0.7rem; font-weight: 600; opacity: 0.9; }

        .group-card-new {
          display: block; background: var(--color-surface); border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl); padding: 16px; text-decoration: none; transition: all 0.2s;
          margin-bottom: 12px;
        }
        .group-card-new:hover { transform: translateY(-2px); border-color: var(--color-border); }
        .gc-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .gc-emoji { font-size: 1.5rem; }
        .gc-info { flex: 1; min-width: 0; }
        .gc-name { display: block; font-size: var(--text-base); font-weight: 700; color: var(--color-text); }
        .gc-member-count { font-size: 0.7rem; color: var(--color-text-3); }
        .gc-available-box { 
          text-align: right; border-left: 1px solid var(--color-border-2); padding-left: 12px;
        }
        .gc-available-label { display: block; font-size: 0.6rem; color: var(--color-text-3); text-transform: uppercase; }
        .gc-available-val { font-size: var(--text-sm); font-weight: 800; color: var(--color-text); }

        .alert-banner {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; 
          background: var(--color-warning-dim); border: 1px solid rgba(245,158,11,0.2);
          border-radius: var(--radius-lg); margin-bottom: 24px; text-decoration: none;
        }
        .alert-banner__text strong { display: block; font-size: var(--text-sm); color: var(--color-warning); }
        .alert-banner__text span { font-size: var(--text-xs); color: var(--color-text-2); }
        
        .debt-card { background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-xl); }
        .debt-row { display: flex; align-items: center; gap: 12px; padding: 16px; }
        .debt-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: 700; }
        .debt-name { display: block; font-size: var(--text-sm); font-weight: 600; }
        .debt-reason { font-size: 0.7rem; color: var(--color-text-3); }
        .debt-amount { font-size: var(--text-sm); font-weight: 800; color: var(--color-success); margin-left: auto; }
      `}</style>
    </div>
  )
}
