'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatAmount, getCurrencySymbol, getPaletteById } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

import { useXpenses } from '@/hooks/useXpenses'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { groups, loading: groupsLoading, error } = useXpenses()

  if (authLoading || groupsLoading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <span className="spinner" />
      </div>
    )
  }

  const mainCurrency = 'UYU'
  
  // LÓGICA MOF: Totales agregados de la Caja Única
  const totalBudget = groups.reduce((acc, g) => acc + (g.currency === mainCurrency ? g.groupTotalBudget : 0), 0)
  const totalSpent = groups.reduce((acc, g) => acc + (g.currency === mainCurrency ? g.groupTotalSpent : 0), 0)
  const totalAvailableRemaining = totalBudget - totalSpent
  const globalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  
  const isGlobalOver = totalAvailableRemaining < 0
  const overallBurnRate = groups.some(g => g.burnRate === 'high' || g.burnRate === 'critical') ? 'high' : 'normal'

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
            <section id="dashboard-hero" className={`saldo-hero ${isGlobalOver ? 'saldo-hero--over' : ''}`}>
              <div className="saldo-hero__top">
                <span className="saldo-hero__label">
                  {isGlobalOver ? '🔔 EXCESO DE PRESUPUESTO' : 'Saldo disponible total'}
                </span>
                <div className="saldo-hero__main">
                  <span className="saldo-hero__symbol">{getCurrencySymbol(mainCurrency)}</span>
                  <span className="saldo-hero__value">
                    {totalAvailableRemaining < 1000 && totalAvailableRemaining > -1000 
                      ? Math.round(totalAvailableRemaining) 
                      : (totalAvailableRemaining / 1000).toFixed(1) + 'k'}
                  </span>
                </div>
              </div>

              <div className="saldo-hero__footer">
                <div className="progress-track" style={{ height: 8, background: 'rgba(255,255,255,0.2)' }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(globalPct, 100)}%`, 
                      background: isGlobalOver ? '#fff' : globalPct > 85 ? '#ff4d4d' : '#fff' 
                    }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <span className="saldo-hero__meta">
                    {overallBurnRate === 'high' ? '⚠️ Gasto veloz' : 'Proyección estable'}
                  </span>
                  <span className="saldo-hero__meta" style={{ fontWeight: 800 }}>
                    {globalPct}% consumido
                  </span>
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
                      className="group-card-mof"
                      data-theme={group.palette}
                    >
                      <div className="gc-mof-body">
                        <div className="gc-mof-icon" style={{ background: `${palette.color}15`, color: palette.color }}>
                          {group.emoji}
                        </div>
                        <div className="gc-mof-main">
                          <h3 className="gc-mof-name">{group.name}</h3>
                          <p className="gc-mof-status">
                            {group.burnRate === 'critical' ? '🔥 Crítico' : group.burnRate === 'high' ? '⚡ Veloz' : '✅ Estable'}
                          </p>
                        </div>
                        <div className="gc-mof-amount" style={{ color: group.isOverBudget ? 'var(--color-danger)' : 'inherit' }}>
                          <span className="gc-mof-label">Quedan</span>
                          <span className="gc-mof-val">{formatAmount(group.groupAvailable, group.currency)}</span>
                        </div>
                      </div>
                      <div className="progress-track" style={{ height: 4 }}>
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${Math.min(group.pct, 100)}%`, 
                            background: group.isOverBudget ? 'var(--color-danger)' : group.pct > 80 ? 'var(--color-warning)' : palette.color 
                          }}
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
          transition: all 0.5s ease;
        }
        .saldo-hero--over {
          background: linear-gradient(135deg, #ff4d4d 0%, #cc0000 100%);
          box-shadow: 0 12px 24px -8px rgba(255, 77, 77, 0.4);
          animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .saldo-hero__label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; opacity: 0.9; letter-spacing: 0.05em; }
        .saldo-hero__main { display: flex; align-items: baseline; gap: 8px; margin: 8px 0 16px; }
        .saldo-hero__value { font-size: 3.8rem; font-weight: 900; letter-spacing: -0.05em; }
        .saldo-hero__meta { font-size: 0.75rem; font-weight: 600; opacity: 0.9; }

        .group-card-mof {
          display: block; background: var(--color-surface); border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl); padding: 16px; text-decoration: none; margin-bottom: 12px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .group-card-mof:active { transform: scale(0.98); }
        .gc-mof-body { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .gc-mof-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justifyContent: center; font-size: 1.5rem; }
        .gc-mof-main { flex: 1; min-width: 0; }
        .gc-mof-name { font-size: 1rem; font-weight: 700; color: var(--color-text); margin: 0; }
        .gc-mof-status { font-size: 0.7rem; color: var(--color-text-3); margin: 2px 0 0; font-weight: 600; }
        .gc-mof-amount { text-align: right; }
        .gc-mof-label { display: block; font-size: 0.6rem; color: var(--color-text-3); text-transform: uppercase; font-weight: 700; }
        .gc-mof-val { font-size: 0.95rem; font-weight: 800; }

        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 12px 0; color: var(--color-text-3); font-size: 10px; text-transform: uppercase; }
        .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--color-border-2); }
        
        .spinner { width: 30px; height: 30px; border: 3px solid var(--color-surface-3); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
