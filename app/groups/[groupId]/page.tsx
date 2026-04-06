'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getGroupById, getExpensesForGroup, getUserById,
  getCategoryById, formatAmount, calculateGroupBalances,
  getCategorySpendingForGroup, getPaletteById, CURRENT_USER
} from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

type Tab = 'gastos' | 'balance' | 'stats'

function mySplitOthers(expense: { paidById: string; splits: Array<{ userId: string; amount: number }> }): number {
  return expense.splits.find(s => s.userId === expense.paidById)?.amount ?? 0
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string
  const group = getGroupById(groupId)
  const [activeTab, setActiveTab] = useState<Tab>('gastos')
  const [paidFilter, setPaidFilter] = useState<'todos' | 'pendientes'>('todos')

  if (!group) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>😕</div>
        <p style={{ color: 'var(--color-text-2)', marginTop: 12 }}>Grupo no encontrado</p>
        <Link href="/groups" className="btn btn--primary" style={{ marginTop: 16, display: 'inline-flex' }}>Volver</Link>
      </div>
    </div>
  )

  const palette = getPaletteById(group.palette)
  const expenses = getExpensesForGroup(groupId)
  const balances = calculateGroupBalances(groupId)
  const spending = getCategorySpendingForGroup(groupId)
  const myMember = group.members.find(m => m.userId === CURRENT_USER.id)
  const pct = myMember ? Math.round((myMember.spent / myMember.budget) * 100) : 0
  const totalGroupSpent = group.members.reduce((s, m) => s + m.spent, 0)
  const filteredExpenses = paidFilter === 'pendientes'
    ? expenses.filter(e => e.splits.some(s => s.userId === CURRENT_USER.id && !s.isPaid && s.userId !== e.paidById))
    : expenses
  const iOwe = balances.filter(b => b.toUserId === CURRENT_USER.id)
  const myDebts = balances.filter(b => b.fromUserId === CURRENT_USER.id)

  return (
    <div className="page" data-theme={group.palette}>
      <header className="page-header" style={{ borderBottom: `1px solid ${palette.color}30` }}>
        <button id="btn-back-group" className="btn btn--icon btn--ghost" onClick={() => router.back()}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', lineHeight: 1 }}>{group.emoji}</div>
          <h1 className="page-header__title" style={{ color: palette.color }}>{group.name}</h1>
        </div>
        <Link href={`/groups/${groupId}/settings`} id="btn-group-settings" className="btn btn--icon btn--ghost">⚙️</Link>
      </header>

      {myMember && (
        <div className="budget-hero">
          <div className="bhs-row">
            <div className="bhs-item">
              <span className="bhs-label">Presupuesto</span>
              <span className="bhs-value">{formatAmount(myMember.budget, group.currency)}</span>
            </div>
            <div className="bhs-div" />
            <div className="bhs-item">
              <span className="bhs-label">Gastado</span>
              <span className="bhs-value" style={{ color: pct >= 90 ? 'var(--color-danger)' : undefined }}>
                {formatAmount(myMember.spent, group.currency)}
              </span>
            </div>
            <div className="bhs-div" />
            <div className="bhs-item">
              <span className="bhs-label">Disponible</span>
              <span className="bhs-value" style={{ color: 'var(--color-success)' }}>
                {formatAmount(myMember.budget - myMember.spent, group.currency)}
              </span>
            </div>
          </div>
          <div style={{ padding: '0 16px 8px' }}>
            <div className="progress-track">
              <div className={`progress-fill ${pct >= 90 ? 'progress-fill--danger' : pct >= 70 ? 'progress-fill--warning' : ''}`}
                style={{ width: `${Math.min(pct, 100)}%`, background: pct < 70 ? palette.color : undefined }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: '0.7rem' }}>
              <span style={{ color: 'var(--color-text-3)' }}>{pct}% utilizado</span>
              {pct >= 90 && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>⚠️ Menos del 10% restante</span>}
            </div>
          </div>
          <div className="members-strip">
            {group.members.map(m => {
              const u = getUserById(m.userId)
              if (!u) return null
              const mp = Math.round((m.spent / m.budget) * 100)
              return (
                <div key={m.userId} className="member-stat">
                  <div className="member-stat-ava" style={{ background: u.avatarColor, border: m.userId === CURRENT_USER.id ? `2px solid ${palette.color}` : '2px solid transparent' }}>
                    {u.avatarInitials}
                  </div>
                  <span className="member-stat-name">{u.firstName}</span>
                  <span className="member-stat-pct">{mp}%</span>
                </div>
              )
            })}
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
              <button id="filter-todos" className={`filter-btn ${paidFilter === 'todos' ? 'active' : ''}`} onClick={() => setPaidFilter('todos')}>Todos ({expenses.length})</button>
              <button id="filter-pendientes" className={`filter-btn ${paidFilter === 'pendientes' ? 'active' : ''}`} onClick={() => setPaidFilter('pendientes')}>Pendientes</button>
            </div>
            {filteredExpenses.map(expense => {
              const cat = getCategoryById(expense.categoryId)
              const paidBy = getUserById(expense.paidById)
              const mySplit = expense.splits.find(s => s.userId === CURRENT_USER.id)
              const isPaidByMe = expense.paidById === CURRENT_USER.id
              const splitLabel = isPaidByMe
                ? `Cobrás ${formatAmount(expense.amount - mySplitOthers(expense), group.currency)}`
                : mySplit?.isPaid ? `✓ Pagado ${formatAmount(mySplit.amount, group.currency)}`
                : `Debés ${formatAmount(mySplit?.amount ?? 0, group.currency)}`
              const splitClass = isPaidByMe ? 'paid' : mySplit?.isPaid ? 'paid' : 'pending'
              return (
                <div key={expense.id} id={`expense-${expense.id}`} className="expense-item">
                  <div className="expense-cat-icon" style={{ background: `${cat?.color}22`, color: cat?.color }}>{cat?.icon}</div>
                  <div className="expense-info">
                    <div className="expense-top">
                      <span className="expense-desc">{expense.description}{expense.isFixed && <span style={{ marginLeft: 4 }}>🔄</span>}</span>
                      <span className="expense-total">{formatAmount(expense.amount, group.currency)}</span>
                    </div>
                    <div className="expense-bottom">
                      <span className="expense-meta">{paidBy?.firstName} pagó · {new Date(expense.date).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}</span>
                      <span className={`expense-split ${splitClass}`}>{splitLabel}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredExpenses.length === 0 && (
              <div className="empty-state">
                <span style={{ fontSize: '2.5rem' }}>🎉</span>
                <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>No hay gastos pendientes</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'balance' && (
          <>
            <div className="balance-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: '2rem' }}>💰</span>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total del grupo</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.04em' }}>{formatAmount(totalGroupSpent, group.currency)}</div>
                </div>
              </div>
            </div>

            {iOwe.length > 0 && (
              <div>
                <h3 className="section-title">Te deben 💚</h3>
                {iOwe.map((b, i) => {
                  const u = getUserById(b.fromUserId)
                  return u ? (
                    <div key={i} id={`bal-owe-${i}`} className="balance-row balance-row--pos">
                      <div className="bal-ava" style={{ background: u.avatarColor }}>{u.avatarInitials}</div>
                      <div className="bal-info">
                        <span className="bal-name">{u.firstName} {u.lastName}</span>
                        <span className="bal-sub">Transferir a: {CURRENT_USER.email}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-success)' }}>+{formatAmount(b.amount, group.currency)}</div>
                        <button id={`btn-remind-${i}`} className="btn btn--sm btn--success" style={{ marginTop: 4, padding: '3px 10px', fontSize: '0.65rem' }}>🔔 Recordar</button>
                      </div>
                    </div>
                  ) : null
                })}
              </div>
            )}

            {myDebts.length > 0 && (
              <div>
                <h3 className="section-title">Debés ❤️</h3>
                {myDebts.map((b, i) => {
                  const u = getUserById(b.toUserId)
                  return u ? (
                    <div key={i} id={`bal-debt-${i}`} className="balance-row balance-row--neg">
                      <div className="bal-ava" style={{ background: u.avatarColor }}>{u.avatarInitials}</div>
                      <div className="bal-info">
                        <span className="bal-name">{u.firstName} {u.lastName}</span>
                        <span className="bal-sub">📱 {u.email}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-danger)' }}>-{formatAmount(b.amount, group.currency)}</div>
                        <button id={`btn-settle-${i}`} className="btn btn--sm btn--danger" style={{ marginTop: 4, padding: '3px 10px', fontSize: '0.65rem' }}>✓ Marcar pagado</button>
                      </div>
                    </div>
                  ) : null
                })}
              </div>
            )}

            {balances.length === 0 && (
              <div className="empty-state">
                <span style={{ fontSize: '2.5rem' }}>🤝</span>
                <h4 style={{ fontWeight: 700, marginTop: 8 }}>¡Estamos al día!</h4>
                <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>No hay deudas pendientes</p>
              </div>
            )}

            <div>
              <h3 className="section-title">Gasto por persona</h3>
              {group.members.map(m => {
                const u = getUserById(m.userId)
                if (!u) return null
                const mp = Math.round((m.spent / m.budget) * 100)
                return (
                  <div key={m.userId} className="member-spend-row">
                    <div className="bal-ava" style={{ background: u.avatarColor }}>{u.avatarInitials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{u.firstName}</span>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{formatAmount(m.spent, group.currency)}</span>
                      </div>
                      <div className="progress-track" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(mp, 100)}%`, background: palette.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'stats' && (
          <>
            <div className="pie-wrap">
              <div className="pie-visual">
                <div className="pie-ring" />
                <div className="pie-center">
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</span>
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>{formatAmount(totalGroupSpent, group.currency)}</span>
                </div>
              </div>
              <div className="pie-legend">
                {spending.slice(0, 5).map(s => (
                  <div key={s.categoryId} className="legend-row">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem' }}>{s.icon}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-2)', flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{Math.round((s.amount / totalGroupSpent) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="section-title">Por categoría</h3>
              {spending.map(s => (
                <div key={s.categoryId} className="cat-stat-row">
                  <div className="cat-icon" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{formatAmount(s.amount, group.currency)}</span>
                    </div>
                    <div className="progress-track" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${Math.round((s.amount / totalGroupSpent) * 100)}%`, background: s.color }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', minWidth: 32, textAlign: 'right' }}>
                    {Math.round((s.amount / totalGroupSpent) * 100)}%
                  </span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="section-title">Gastos Fijos 🔄</h3>
              {expenses.filter(e => e.isFixed).map(e => {
                const cat = getCategoryById(e.categoryId)
                return (
                  <div key={e.id} className="fixed-expense-row">
                    <span style={{ fontSize: '1.25rem' }}>{cat?.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{e.description}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>Se cobra el día {new Date(e.date).getDate()} de cada mes</div>
                    </div>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{formatAmount(e.amount, group.currency)}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
        <div style={{ height: 24 }} />
      </div>

      <button id="fab-add-expense-group" className="fab" onClick={() => router.push(`/expenses/add?group=${groupId}`)}
        aria-label="Agregar gasto" style={{ background: palette.color }}>+</button>

      <BottomNav notifCount={2} />

      <style jsx>{`
        .budget-hero { background: var(--color-surface); border-bottom: 1px solid var(--color-border-2); }
        .bhs-row { display: flex; align-items: center; justify-content: space-around; padding: 16px 16px 10px; }
        .bhs-item { text-align: center; flex: 1; }
        .bhs-label { display: block; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-3); margin-bottom: 4px; }
        .bhs-value { font-size: var(--text-sm); font-weight: 800; letter-spacing: -0.02em; color: var(--color-text); }
        .bhs-div { width: 1px; height: 28px; background: var(--color-border-2); }
        .members-strip { display: flex; gap: 16px; padding: 10px 16px 14px; overflow-x: auto; }
        .member-stat { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 44px; }
        .member-stat-ava { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white; }
        .member-stat-name { font-size: 0.6rem; color: var(--color-text-3); }
        .member-stat-pct { font-size: 0.65rem; font-weight: 700; color: var(--color-text-2); }
        .group-tabs { display: flex; background: var(--color-surface); border-bottom: 1px solid var(--color-border-2); }
        .group-tab { flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid transparent; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-3); cursor: pointer; transition: all 0.2s; }
        .group-tab:hover { color: var(--color-text-2); }
        .filter-row { display: flex; gap: 8px; }
        .filter-btn { padding: 6px 14px; background: var(--color-surface-2); border: 1px solid var(--color-border-2); border-radius: 999px; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-2); cursor: pointer; transition: all 0.15s; }
        .filter-btn.active { background: var(--color-accent-dim); border-color: var(--color-accent); color: var(--color-accent-light); }
        .expense-item { display: flex; align-items: flex-start; gap: 12px; padding: 14px; background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-lg); cursor: pointer; transition: all 0.15s; }
        .expense-item + .expense-item { margin-top: 8px; }
        .expense-item:hover { background: var(--color-surface-2); border-color: var(--color-border); }
        .expense-cat-icon { width: 40px; height: 40px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
        .expense-info { flex: 1; min-width: 0; }
        .expense-top { display: flex; justify-content: space-between; gap: 8px; }
        .expense-desc { font-size: var(--text-sm); font-weight: 600; color: var(--color-text); }
        .expense-total { font-size: var(--text-sm); font-weight: 700; flex-shrink: 0; }
        .expense-bottom { display: flex; justify-content: space-between; margin-top: 4px; align-items: center; }
        .expense-meta { font-size: 0.68rem; color: var(--color-text-3); }
        .expense-split { font-size: 0.68rem; font-weight: 600; border-radius: 999px; padding: 2px 8px; }
        .expense-split.paid { background: var(--color-success-dim); color: var(--color-success); }
        .expense-split.pending { background: var(--color-danger-dim); color: var(--color-danger); }
        .balance-card { background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-xl); padding: 20px; }
        .balance-row { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-lg); margin-bottom: 8px; border: 1px solid var(--color-border-2); }
        .balance-row--pos { background: var(--color-success-dim); border-color: rgba(16,185,129,0.2); }
        .balance-row--neg { background: var(--color-danger-dim); border-color: rgba(244,63,94,0.2); }
        .bal-ava { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
        .bal-info { flex: 1; }
        .bal-name { display: block; font-size: var(--text-sm); font-weight: 600; color: var(--color-text); }
        .bal-sub { font-size: 0.68rem; color: var(--color-text-3); }
        .member-spend-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .pie-wrap { background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-xl); padding: 20px; display: flex; gap: 20px; align-items: center; }
        .pie-visual { position: relative; width: 96px; height: 96px; flex-shrink: 0; }
        .pie-ring { width: 96px; height: 96px; border-radius: 50%; background: conic-gradient(#F59E0B 0% 25%, #7C3AED 25% 50%, #06B6D4 50% 68%, #F43F5E 68% 80%, #10B981 80% 100%); }
        .pie-center { position: absolute; inset: 14px; background: var(--color-surface); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .pie-legend { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .legend-row { display: flex; align-items: center; gap: 6px; }
        .cat-stat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .cat-icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .fixed-expense-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-lg); margin-bottom: 8px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 0; text-align: center; }
      `}</style>
    </div>
  )
}
