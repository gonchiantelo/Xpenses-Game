'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatAmount, getCurrencySymbol, getPaletteById } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchDashboardData() {
      // 1. Fetch user's groups
      const { data: members, error } = await supabase
        .from('group_members')
        .select('*, groups(*)')
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error fetching groups:', error)
      } else {
        const enrichedGroups = (members || []).map(m => ({
          ...m.groups,
          myBudget: m.budget,
          mySpent: m.spent,
          myAvailable: m.budget - m.spent,
          pct: m.budget > 0 ? Math.round((m.spent / m.budget) * 100) : 0,
        }))
        setGroups(enrichedGroups)
      }
      setLoading(false)
    }

    fetchDashboardData()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <span className="spinner" />
      </div>
    )
  }

  // Calculate totals
  const totals = groups.reduce((acc, g) => {
    acc[g.currency] = (acc[g.currency] || 0) + g.myAvailable
    return acc
  }, {} as Record<string, number>)

  const mainCurrency = 'UYU'
  const mainTotal = totals[mainCurrency] || 0

  return (
    <div className="page">
      <header className="page-header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
        <div>
          <p className="page-header__subtitle">Hola, {user?.user_metadata?.first_name || 'jugador'} 👋</p>
        </div>
        <Link href="/notifications" id="btn-notif-header">
          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
          </div>
        </Link>
      </header>

      <div className="page-content" style={{ paddingTop: 0 }}>
        
        {groups.length === 0 ? (
          /* --- MODO: BIENVENIDA (Usuario nuevo) --- */
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 12 }}>¡Bienvenido al juego!</h2>
            <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', marginBottom: 32 }}>
              Aún no eres miembro de ningún grupo. Podés empezar uno nuevo o pedirle a un amigo que te pase su código de invitación.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              <Link href="/groups/create" className="btn btn--primary btn--full btn--lg">
                ✨ Crear mi primer grupo
              </Link>
              <div className="auth-divider"><span>o</span></div>
              <div className="input-group">
                <input className="input" placeholder="Pegá el código de invitación..." style={{ textAlign: 'center' }} />
                <button className="btn btn--secondary btn--full btn--sm" style={{ marginTop: 8 }}>
                  Unirme con código
                </button>
              </div>
            </div>

            <div className="onboarding-cards">
              <div className="ob-card">
                <span className="ob-icon">💰</span>
                <div>
                  <strong>Dividí gastos</strong>
                  <p>Repartí cuentas de forma equitativa o manual.</p>
                </div>
              </div>
              <div className="ob-card">
                <span className="ob-icon">🏆</span>
                <div>
                  <strong>Mantené el balance</strong>
                  <p>Enterate de quién debe a quién al instante.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* --- MODO: DASHBOARD ACTIVO --- */
          <>
            <section id="dashboard-hero" className="saldo-hero">
              <div className="saldo-hero__top">
                <span className="saldo-hero__label">Saldo disponible total</span>
                <div className="saldo-hero__main">
                  <span className="saldo-hero__symbol">{getCurrencySymbol(mainCurrency)}</span>
                  <span className="saldo-hero__value">{(mainTotal / 1000).toFixed(1)}k</span>
                </div>
              </div>
              <div className="saldo-hero__footer">
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: '0%', background: 'white' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span className="saldo-hero__meta">Empezá a registrar gastos</span>
                  <span className="saldo-hero__meta">0% del presupuesto</span>
                </div>
              </div>
            </section>

            <section id="section-groups" style={{ marginTop: 8 }}>
              <div className="section-header">
                <h2 className="section-title">Tus Grupos ({groups.length})</h2>
                <Link href="/groups/create" className="btn btn--sm btn--ghost">+ Nuevo</Link>
              </div>

              <div className="groups-list">
                {groups.map(group => {
                  const palette = getPaletteById(group.palette)
                  return (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      id={`card-group-${group.id}`}
                      className="group-card-new"
                      data-theme={group.palette}
                    >
                      <div className="gc-head">
                        <span className="gc-emoji">{group.emoji}</span>
                        <div className="gc-info">
                          <span className="gc-name">{group.name}</span>
                          <span className="gc-member-count">{group.type}</span>
                        </div>
                        <div className="gc-available-box" style={{ borderColor: palette.color }}>
                          <span className="gc-available-label">Disponible</span>
                          <span className="gc-available-val">{formatAmount(group.myAvailable, group.currency)}</span>
                        </div>
                      </div>
                      <div className="progress-track">
                        <div 
                          className={`progress-fill ${group.pct >= 90 ? 'progress-fill--danger' : group.pct >= 70 ? 'progress-fill--warning' : ''}`}
                          style={{ width: `${Math.min(group.pct, 100)}%`, background: group.pct < 70 ? palette.color : undefined }}
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          </>
        )}
        
        <div style={{ height: 16 }} />
      </div>

      <button id="fab-add-expense" className="fab" onClick={() => router.push('/expenses/add')}>+</button>
      <BottomNav notifCount={0} />

      <style jsx>{`
        .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 20px; }
        .empty-icon { font-size: 5rem; margin-bottom: 24px; animation: bounce 2s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .onboarding-cards { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 40px; }
        .ob-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--color-surface-2); border-radius: var(--radius-xl); text-align: left; }
        .ob-icon { font-size: 1.5rem; }
        .ob-card strong { display: block; font-size: var(--text-sm); }
        .ob-card p { font-size: var(--text-xs); color: var(--color-text-3); margin-top: 2px; }

        .saldo-hero {
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-600) 100%);
          color: white; border-radius: var(--radius-2xl); padding: 24px; margin-bottom: 24px;
          box-shadow: 0 12px 24px -8px var(--color-accent-dim); position: relative; overflow: hidden;
        }
        .saldo-hero__label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; opacity: 0.8; }
        .saldo-hero__main { display: flex; align-items: baseline; gap: 8px; margin: 8px 0 16px; }
        .saldo-hero__value { font-size: 3.5rem; font-weight: 900; letter-spacing: -0.05em; }
        .saldo-hero__meta { font-size: 0.7rem; font-weight: 600; opacity: 0.9; }

        .group-card-new {
          display: block; background: var(--color-surface); border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl); padding: 16px; text-decoration: none; margin-bottom: 12px;
        }
        .gc-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .gc-emoji { font-size: 1.5rem; }
        .gc-info { flex: 1; min-width: 0; }
        .gc-name { display: block; font-size: var(--text-base); font-weight: 700; color: var(--color-text); }
        .gc-available-box { text-align: right; border-left: 1px solid var(--color-border-2); padding-left: 12px; }
        .gc-available-label { display: block; font-size: 0.6rem; color: var(--color-text-3); text-transform: uppercase; }
        .gc-available-val { font-size: var(--text-sm); font-weight: 800; }

        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 12px 0; color: var(--color-text-3); font-size: 10px; text-transform: uppercase; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--color-border-2); }
        
        .spinner { width: 30px; height: 30px; border: 3px solid var(--color-surface-3); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
