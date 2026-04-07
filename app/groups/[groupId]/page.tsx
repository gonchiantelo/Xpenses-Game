'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatAmount, getPaletteById, getCategoryById, CATEGORIES } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

type Tab = 'gastos' | 'balance' | 'stats'

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const groupId = params.groupId as string

  const [group, setGroup] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('gastos')
  const [paidFilter, setPaidFilter] = useState<'todos' | 'pendientes'>('todos')

  useEffect(() => {
    if (!groupId || !user) return

    async function fetchData() {
      const { data: gData } = await supabase.from('groups').select('*').eq('id', groupId).single()
      if (gData) setGroup(gData)

      const { data: mData } = await supabase.from('group_members')
        .select(`*, profiles(first_name, last_name, avatar_url)`)
        .eq('group_id', groupId)
      if (mData) setMembers(mData)

      const { data: eData } = await supabase.from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: false })
      if (eData) setExpenses(eData || [])

      setLoading(false)
    }

    fetchData()
  }, [groupId, user])

  if (loading) return <div className="page"><div className="spinner" /></div>
  if (!group) return <div className="page" style={{ textAlign: 'center', paddingTop: 100 }}>Grupo no encontrado</div>

  const palette = getPaletteById(group.palette)
  const myMember = members.find(m => m.user_id === user?.id)
  const pct = myMember ? Math.round(((myMember.spent || 0) / (myMember.budget || 1)) * 100) : 0
  const totalGroupSpent = members.reduce((s, m) => s + (m.spent || 0), 0)

  const filteredExpenses = paidFilter === 'pendientes'
    ? expenses.filter(e => e.paid_by_id !== user?.id)
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
          <button id="btn-quick-invite" className="btn btn--icon btn--ghost" title="Invitar amigos" onClick={() => {}}>➕</button>
          <Link href={`/groups/${groupId}/settings`} id="btn-group-settings" className="btn btn--icon btn--ghost" title="Configuración">
            ⚙️
          </Link>
        </div>
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
                {formatAmount(myMember.spent || 0, group.currency)}
              </span>
            </div>
            <div className="bhs-div" />
            <div className="bhs-item">
              <span className="bhs-label">Disponible</span>
              <span className="bhs-value" style={{ color: 'var(--color-success)' }}>
                {formatAmount(myMember.budget - (myMember.spent || 0), group.currency)}
              </span>
            </div>
          </div>
          <div style={{ padding: '0 16px 8px' }}>
            <div className="progress-track">
              <div className={`progress-fill ${pct >= 90 ? 'progress-fill--danger' : pct >= 70 ? 'progress-fill--warning' : ''}`}
                style={{ width: `${Math.min(pct, 100)}%`, background: pct < 70 ? palette.color : undefined }} />
            </div>
          </div>
          <div className="members-strip">
            {members.map(m => (
              <div key={m.user_id} className="member-stat">
                <div className="member-stat-ava" style={{ background: 'var(--color-surface-3)', border: m.user_id === user?.id ? `2px solid ${palette.color}` : '2px solid transparent' }}>
                  {m.profiles?.first_name?.substring(0, 1).toUpperCase() || '👤'}
                </div>
                <span className="member-stat-name">{m.user_id === user?.id ? 'Yo' : m.profiles?.first_name}</span>
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
              <button id="filter-todos" className={`filter-btn ${paidFilter === 'todos' ? 'active' : ''}`} onClick={() => setPaidFilter('todos')}>Todos ({expenses.length})</button>
              <button id="filter-pendientes" className={`filter-btn ${paidFilter === 'pendientes' ? 'active' : ''}`} onClick={() => setPaidFilter('pendientes')}>Pendientes</button>
            </div>
            {filteredExpenses.map(expense => {
              const cat = getCategoryById(expense.category_id || '')
              const isPaidByMe = expense.paid_by_id === user?.id
              return (
                <div key={expense.id} id={`expense-${expense.id}`} className="expense-item">
                  <div className="expense-cat-icon" style={{ background: `${cat?.color}22`, color: cat?.color }}>{cat?.icon || '💰'}</div>
                  <div className="expense-info">
                    <div className="expense-top">
                      <span className="expense-desc">{expense.description}</span>
                      <span className="expense-total">{formatAmount(expense.amount, group.currency)}</span>
                    </div>
                    <div className="expense-bottom">
                      <span className="expense-meta">{new Date(expense.date).toLocaleDateString()}</span>
                      <span className={`expense-split ${isPaidByMe ? 'paid' : 'pending'}`}>
                        {isPaidByMe ? 'Pagaste tú' : 'Pendiente'}
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
            <div className="balance-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: '2rem' }}>💰</span>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-3)', textTransform: 'uppercase' }}>Total del grupo</div>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{formatAmount(totalGroupSpent, group.currency)}</div>
                </div>
              </div>
            </div>
            <div className="empty-state">
              <span style={{ fontSize: '2.5rem' }}>🤝</span>
              <h4 style={{ fontWeight: 700, marginTop: 8 }}>¡Estamos al día!</h4>
              <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>No hay deudas pendientes</p>
            </div>
          </>
        )}

        {activeTab === 'stats' && (
          <div className="stats-container">
            <div className="pie-wrap">
              <div className="pie-visual">
                <div className="pie-ring" style={{ background: palette.color }} />
                <div className="pie-center">
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)' }}>Total</span>
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>{formatAmount(totalGroupSpent, group.currency)}</span>
                </div>
              </div>
              <div className="pie-legend">
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>Próximamente verás aquí el desglose por categorías reales.</p>
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
