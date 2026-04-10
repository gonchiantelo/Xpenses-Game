'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatAmount, getPaletteById, getCategoryById, CATEGORIES } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

type Tab = 'gastos' | 'balance' | 'stats'

import { useXpenses } from '@/hooks/useXpenses'

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { groups, loading, error, refresh } = useXpenses()
  const groupId = params.groupId as string

  const [activeTab, setActiveTab] = useState<Tab>('gastos')
  const [paidFilter, setPaidFilter] = useState<'todos' | 'pendientes'>('todos')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const group = groups.find(g => g.id === groupId)

  async function sendInvite() {
    if (!inviteEmail || !group || !user) return
    setInviting(true)
    try {
      const resp = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          groupName: group.name,
          inviteCode: (group as any).invite_code || 'CODE',
          inviterName: user.user_metadata?.first_name || 'Un amigo'
        })
      })
      if (resp.ok) {
        alert('¡Invitación enviada con éxito!')
        setShowInviteModal(false)
        setInviteEmail('')
      } else {
        alert('Error al enviar invitación. Verifica tu RESEND_API_KEY.')
      }
    } catch (err) {
      alert('Error de conexión al enviar invitación.')
    } finally {
      setInviting(false)
    }
  }

  if (loading) return <div className="page"><div className="spinner" /></div>
  
  if (!group || !user) {
    return <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>Grupo no encontrado</div>
  }

  const palette = getPaletteById(group.palette || 'violet')
  const currentUserId = user.id
  const { 
    members, expenses, memberContributions, settlements, 
    groupTotalBudget, groupTotalSpent, groupAvailable, 
    isOverBudget, burnRate, daysRemaining, categoryBreakdown,
    pct 
  } = group as any

  const filteredExpenses = paidFilter === 'pendientes'
    ? expenses.filter((e: any) => e.paid_by_id !== currentUserId)
    : expenses

  return (
    <div className="page" data-theme={group.palette}>
      <header className="page-header" style={{ borderBottom: `1px solid ${palette.color}30` }}>
        <button id="btn-back-group" className="btn btn--icon btn--ghost" onClick={() => router.back()}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', lineHeight: 1 }}>{group.emoji}</div>
          <h1 className="page-header__title" style={{ color: palette.color }}>{group.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button id="btn-quick-invite" className="btn btn--icon btn--ghost" title="Invitar amigos" onClick={() => setShowInviteModal(true)}>➕</button>
          <Link href={`/groups/${groupId}/settings`} id="btn-group-settings" className="btn btn--icon btn--ghost" title="Configuración">
            ⚙️
          </Link>
        </div>
      </header>

      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, border: `1px solid ${palette.color}40` }}>
            <h3 style={{ marginBottom: 16 }}>Invitar a un amigo</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', marginBottom: 20 }}>Le enviaremos un correo con el código de invitación al grupo.</p>
            <input 
              className="input" 
              placeholder="Email de tu amigo..." 
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              style={{ marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setShowInviteModal(false)}>Cancelar</button>
              <button className="btn btn--primary" style={{ flex: 1, background: palette.color }} onClick={sendInvite} disabled={inviting || !inviteEmail}>
                {inviting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {groupAvailable !== undefined && (
        <div className={`budget-hero ${isOverBudget ? 'budget-hero--over' : ''}`}>
          <div className="bhs-row">
            <div className="bhs-item">
              <span className="bhs-label">Presupuesto</span>
              <span className="bhs-value">{formatAmount(groupTotalBudget, group.currency)}</span>
            </div>
            <div className="bhs-div" />
            <div className="bhs-item bhs-item--main">
              <span className="bhs-label">{isOverBudget ? 'Excedido' : 'Disponible'}</span>
              <span className="bhs-value" style={{ color: isOverBudget ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {formatAmount(groupAvailable, group.currency)}
              </span>
            </div>
            <div className="bhs-div" />
            <div className="bhs-item">
              <span className="bhs-label">Gasto Total</span>
              <span className="bhs-value">{formatAmount(groupTotalSpent, group.currency)}</span>
            </div>
          </div>
          <div style={{ padding: '0 16px 8px' }}>
            <div className="progress-track" style={{ height: 8 }}>
              <div className={`progress-fill ${isOverBudget ? 'progress-fill--danger' : pct >= 85 ? 'progress-fill--warning' : ''}`}
                style={{ width: `${Math.min(pct, 100)}%`, background: !isOverBudget && pct < 85 ? palette.color : undefined }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-3)' }}>
                {burnRate === 'high' ? '⚠️ Gasto muy rápido' : burnRate === 'critical' ? '🚨 Presupuesto agotado' : '✅ Consumo estable'}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-3)' }}>
                {pct}% consumido
              </span>
            </div>
          </div>
          <div className="members-strip">
            {members.map((m: any) => (
              <div key={m.user_id} className="member-stat">
                <div className="member-stat-ava" style={{ background: 'var(--color-surface-3)', border: m.user_id === currentUserId ? `2px solid ${palette.color}` : '2px solid transparent' }}>
                  {m.profiles?.first_name?.substring(0, 1).toUpperCase() || '👤'}
                </div>
                <span className="member-stat-name">{m.user_id === currentUserId ? 'Yo' : m.profiles?.first_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="group-tabs">
        {(['gastos', 'balance', 'stats'] as Tab[]).map(tab => (
          <button key={tab} id={`tab-${tab}`}
            className={`group-tab ${activeTab === tab ? 'active' : ''}`}
            style={activeTab === tab ? { borderBottomColor: palette.color, color: palette.color } : {}}
            onClick={() => setActiveTab(tab)}>
            {tab === 'gastos' ? '📋 Gastos' : tab === 'balance' ? '⚖️ Balance' : '📊 Stats'}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ paddingTop: 'var(--space-3)' }}>
        {activeTab === 'gastos' && (
          <>
            <div className="filter-row">
              <button className={`filter-btn ${paidFilter === 'todos' ? 'active' : ''}`} onClick={() => setPaidFilter('todos')}>Todos ({expenses.length})</button>
              <button className={`filter-btn ${paidFilter === 'pendientes' ? 'active' : ''}`} onClick={() => setPaidFilter('pendientes')}>De otros</button>
            </div>
              {filteredExpenses.map((expense: any) => {
                const cat = getCategoryById(expense.category_id || '')
                const isPaidByMe = expense.paid_by_id === currentUserId
                const payerName = members.find((m: any) => m.user_id === expense.paid_by_id)?.profiles?.first_name || 'Alguien'
                
                return (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-cat-icon" style={{ background: `${cat?.color}22`, color: cat?.color }}>{cat?.icon || '💰'}</div>
                    <div className="expense-info">
                      <div className="expense-top">
                        <span className="expense-desc">{expense.description}</span>
                        <span className="expense-total">{formatAmount(expense.amount, group.currency)}</span>
                      </div>
                      <div className="expense-bottom">
                        <span className="expense-meta">{new Date(expense.date).toLocaleDateString()}</span>
                        <span className={`expense-split ${isPaidByMe ? 'paid' : 'pending'}`}>
                          {isPaidByMe ? 'Pagaste tú' : `Pagó ${payerName}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredExpenses.length === 0 && (
                <div className="empty-state">
                  <span style={{ fontSize: '2.5rem' }}>🎉</span>
                  <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>No hay gastos registrados</p>
                </div>
              )}
            </>
          )}
  
          {activeTab === 'balance' && (
            <>
              <div className="balance-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {memberContributions.map((mc: any) => (
                  <div key={mc.userId} className="balance-card" style={{ padding: '15px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{mc.userId === currentUserId ? 'Tú' : mc.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>Puso {formatAmount(mc.paid, group.currency)}</div>
                      </div>
                      <div style={{ 
                        textAlign: 'right', 
                        color: mc.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 800
                      }}>
                        {mc.balance >= 0 ? '+' : ''}{formatAmount(mc.balance, group.currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
  
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 12 }}>Liquidaciones</h4>
                {settlements.map((s: any, i: number) => (
                  <div key={i} className="settlement-item" style={{ 
                    background: 'var(--color-surface-2)', 
                    padding: '12px', 
                    borderRadius: '12px',
                    marginBottom: 8,
                    fontSize: 'var(--text-sm)',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span><b>{s.from}</b> le debe a <b>{s.to}</b></span>
                    <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatAmount(s.amount, group.currency)}</span>
                  </div>
                ))}
                {settlements.length === 0 && (
                  <div className="empty-state">
                    <span style={{ fontSize: '2.5rem' }}>🤝</span>
                    <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>¡Todo está saldado!</p>
                  </div>
                )}
              </div>
            </>
          )}
  
        {activeTab === 'stats' && (
          <div className="stats-container">
            <div className="pie-wrap" style={{ flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', width: '100%' }}>
                <div className="pie-visual">
                  <div className="pie-ring" style={{ background: palette.color }} />
                  <div className="pie-center">
                    <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)' }}>Total</span>
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>{formatAmount(groupTotalSpent, group.currency)}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Distribución</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>Gasto por categorías</p>
                </div>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categoryBreakdown.map((ct: any) => {
                  const cat = getCategoryById(ct.id)
                  return (
                    <div key={ct.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat?.color}22`, color: cat?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {cat?.icon || '💰'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>
                          <span>{cat?.name || 'Varios'}</span>
                          <span>{formatAmount(ct.amount, group.currency)}</span>
                        </div>
                        <div className="progress-track" style={{ height: 4 }}>
                          <div className="progress-fill" style={{ width: `${ct.pct}%`, background: cat?.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <button id="fab-add-expense-group" className="fab" onClick={() => router.push(`/expenses/add?group=${groupId}`)}
        style={{ background: palette.color }}>+</button>

      <BottomNav />

      <style jsx>{`
        .budget-hero { background: var(--color-surface); border-bottom: 1px solid var(--color-border-2); }
        .bhs-row { display: flex; align-items: center; justify-content: space-around; padding: 16px 16px 10px; }
        .bhs-item { text-align: center; flex: 1; }
        .bhs-label { display: block; font-size: 0.6rem; text-transform: uppercase; color: var(--color-text-3); margin-bottom: 4px; }
        .bhs-value { font-size: var(--text-sm); font-weight: 800; color: var(--color-text); }
        .bhs-div { width: 1px; height: 28px; background: var(--color-border-2); }
        .members-strip { display: flex; gap: 16px; padding: 10px 16px 14px; overflow-x: auto; }
        .member-stat { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 44px; }
        .member-stat-ava { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; }
        .member-stat-name { font-size: 0.6rem; color: var(--color-text-3); }
        .group-tabs { display: flex; background: var(--color-surface); border-bottom: 1px solid var(--color-border-2); }
        .group-tab { flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid transparent; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-3); cursor: pointer; transition: all 0.2s; }
        .group-tab.active { color: var(--color-text); }
        .filter-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .filter-btn { padding: 6px 14px; background: var(--color-surface-2); border: 1px solid var(--color-border-2); border-radius: 999px; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-2); cursor: pointer; }
        .filter-btn.active { background: var(--color-accent-dim); border-color: var(--color-accent); color: var(--color-accent-light); }
        .expense-item { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-lg); margin-bottom: 8px; }
        .expense-cat-icon { width: 40px; height: 40px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
        .expense-info { flex: 1; }
        .expense-top { display: flex; justify-content: space-between; }
        .expense-desc { font-size: var(--text-sm); font-weight: 600; }
        .expense-total { font-size: var(--text-sm); font-weight: 700; }
        .expense-bottom { display: flex; justify-content: space-between; margin-top: 4px; align-items: center; }
        .expense-meta { font-size: 0.68rem; color: var(--color-text-3); }
        .expense-split { font-size: 0.68rem; font-weight: 600; border-radius: 999px; padding: 2px 8px; }
        .expense-split.paid { background: var(--color-success-dim); color: var(--color-success); }
        .expense-split.pending { background: var(--color-danger-dim); color: var(--color-danger); }
        .balance-card { background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-xl); padding: 20px; margin-bottom: 16px; }
        .pie-wrap { background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-xl); padding: 20px; display: flex; gap: 20px; align-items: center; }
        .pie-visual { position: relative; width: 96px; height: 96px; flex-shrink: 0; }
        .pie-ring { width: 96px; height: 96px; border-radius: 50%; opacity: 0.2; }
        .pie-center { position: absolute; inset: 14px; background: var(--color-surface); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .empty-state { padding: 48px 0; text-align: center; }
        .fab { position: fixed; bottom: 84px; right: 20px; width: 56px; height: 56px; border-radius: 50%; border: none; color: white; font-size: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer; z-index: 10; }
        .spinner { width: 30px; height: 30px; border: 3px solid var(--color-surface-3); border-top-color: var(--color-accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 100px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
