'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useXpenses } from '@/hooks/useXpenses'
import FABAddExpense from '@/components/dashboard/FABAddExpense'

const CATEGORIES = [
  { id: 'food',      name: 'Comida',    icon: '🍕', color: '#F87171' },
  { id: 'home',      name: 'Hogar',     icon: '🏠', color: '#60A5FA' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#FBBF24' },
  { id: 'leisure',   name: 'Ocio',      icon: '🎮', color: '#A78BFA' },
  { id: 'services',  name: 'Servicios', icon: '🔋', color: '#34D399' },
  { id: 'others',    name: 'Otros',     icon: '📦', color: '#9CA3AF' },
]

const PALETTE_COLORS: Record<string, string> = {
  green: '#00DF81', emerald: '#10B981', cyan: '#06B6D4',
  violet: '#8B5CF6', rose: '#F43F5E', amber: '#F59E0B', slate: '#64748B',
}

type Tab = 'gastos' | 'balance' | 'stats'

function formatAmount(amt: number, currency = 'UYU'): string {
  const sym = currency === 'USD' ? 'US$' : '$'
  return `${sym}${Math.round(amt).toLocaleString('es-UY')}`
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { groups, loading } = useXpenses()
  const supabase = createClient()
  
  const groupId = params.groupId as string
  const group = groups.find(g => g.id === groupId)

  const [activeTab,       setActiveTab]       = useState<Tab>('gastos')
  const [paidFilter,     setPaidFilter]     = useState<'todos' | 'otros'>('todos')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail,     setInviteEmail]     = useState('')
  const [inviting,        setInviting]        = useState(false)

  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-40 bg-surface-2 rounded-3xl" />
      <div className="h-10 bg-surface-2 rounded-xl" />
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-2 rounded-2xl" />)}
    </div>
  )

  if (!group || !user) return (
    <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
      <span className="text-5xl">🔭</span>
      <h2 className="text-lg font-bold text-primary">Grupo no encontrado</h2>
      <button onClick={() => router.push('/dashboard')} className="text-accent font-bold text-sm">Volver al inicio</button>
    </div>
  )

  const color = PALETTE_COLORS[group.palette] || '#00DF81'
  const {
    members, expenses, settlements, netBalances,
    groupTotalBudget, groupTotalSpent, groupAvailable,
    isOverBudget, pct, burnRate, categoryBreakdown
  } = group as any

  const filteredExpenses = paidFilter === 'otros'
    ? expenses.filter((e: any) => e.paid_by_id !== user.id)
    : expenses

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    // En producción esto iría a una API de Resend
    setTimeout(() => {
      alert('¡Invitación enviada con éxito!')
      setInviteEmail('')
      setShowInviteModal(false)
      setInviting(false)
    }, 1000)
  }

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl bg-surface-2 border border-subtle text-secondary hover:text-primary transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-2xl" aria-hidden="true">{group.emoji}</span>
          <h1 className="text-lg font-black text-primary tracking-tight leading-tight">{group.name}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowInviteModal(true)}
            className="p-2 rounded-xl bg-surface-2 border border-subtle text-accent hover:bg-accent/5 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>
            </svg>
          </button>
          <Link href={`/groups/${groupId}/settings`} className="p-2 rounded-xl bg-surface-2 border border-subtle text-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="relative overflow-hidden mb-6 rounded-3xl border border-subtle bg-surface shadow-card-md">
        <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: color }} />
        
        <div className="flex items-center justify-around p-5 pt-8">
          <div className="text-center flex-1">
            <span className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-1 block">Presupuesto</span>
            <span className="text-sm font-bold text-primary">{formatAmount(groupTotalBudget, group.currency)}</span>
          </div>
          <div className="w-px h-10 bg-subtle/50" />
          <div className="text-center flex-1">
            <span className={isOverBudget ? 'text-danger-500 text-[10px] font-black uppercase mb-1 block' : 'text-accent text-[10px] font-black uppercase mb-1 block'}>
              {isOverBudget ? 'Excedido' : 'Disponible'}
            </span>
            <span className={`text-xl font-black ${isOverBudget ? 'text-danger-500' : 'text-accent'}`}>
              {formatAmount(groupAvailable, group.currency)}
            </span>
          </div>
          <div className="w-px h-10 bg-subtle/50" />
          <div className="text-center flex-1">
            <span className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-1 block">Gastado</span>
            <span className="text-sm font-bold text-primary">{formatAmount(groupTotalSpent, group.currency)}</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="relative h-2.5 w-full bg-surface-3 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-700 ${isOverBudget ? 'bg-danger-500' : 'bg-accent'}`}
              style={{ width: `${Math.min(pct, 100)}%`, background: !isOverBudget ? color : undefined }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-tight">
            <span className={burnRate === 'high' ? 'text-orange-400' : burnRate === 'critical' ? 'text-danger-500' : 'text-accent'}>
              {burnRate === 'high' ? '⚠️ Gasto Muy Rápido' : burnRate === 'critical' ? '🚨 Agotado' : '✅ Consumo Estable'}
            </span>
            <span className="text-tertiary">{pct}% consumido</span>
          </div>
        </div>

        {/* Member list strip */}
        <div className="flex gap-4 p-4 bg-surface-2 border-t border-subtle overflow-x-auto no-scrollbar">
          {members.map((m: any) => (
            <div key={m.user_id} className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 transition-all ${m.user_id === user.id ? 'scale-110 shadow-lg' : 'opacity-60 border-transparent'}`}
                style={{ background: m.user_id === user.id ? color : 'var(--surface-3)', borderColor: m.user_id === user.id ? 'white' : 'transparent' }}
              >
                {m.profiles?.first_name?.charAt(0) || '?'}
              </div>
              <span className="text-[9px] font-bold text-tertiary uppercase truncate max-w-[44px]">
                {m.user_id === user.id ? 'Yo' : m.profiles?.first_name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex p-1 bg-surface-2 rounded-xl mb-6 sticky top-2 z-10 shadow-lg border border-subtle">
        {(['gastos', 'balance', 'stats'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all
              ${activeTab === tab ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}
            `}
          >
            {tab === 'gastos' ? '📋 Gastos' : tab === 'balance' ? '⚖️ Balance' : '📊 Stats'}
          </button>
        ))}
      </div>

      <div className="animate-fade-in mb-24">
        {/* TAB GASTOS */}
        {activeTab === 'gastos' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 mb-2">
              <button 
                onClick={() => setPaidFilter('todos')}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${paidFilter === 'todos' ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-subtle text-tertiary'}`}>
                Todos ({expenses.length})
              </button>
              <button 
                onClick={() => setPaidFilter('otros')}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${paidFilter === 'otros' ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-subtle text-tertiary'}`}>
                Pagó otro
              </button>
            </div>

            {filteredExpenses.map((exp: any) => {
              const cat        = CATEGORIES.find(c => c.id === exp.category_id) || CATEGORIES[5]
              const isPaidByMe = exp.paid_by_id === user.id
              const payer = members.find((m: any) => m.user_id === exp.paid_by_id)?.profiles
              
              return (
                <div key={exp.id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-subtle hover:border-accent/20 transition-all group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: `${cat.color}15`, color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-primary truncate leading-tight mb-0.5">{exp.description}</p>
                      <p className="text-sm font-black text-primary">{formatAmount(exp.amount, group.currency)}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-tertiary font-bold uppercase tracking-wider">{new Date(exp.date).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' })}</span>
                      <span className={`font-black uppercase tracking-tighter ${isPaidByMe ? 'text-accent' : 'text-danger-500'}`}>
                        {isPaidByMe ? '✅ Pagaste tú' : `💸 Pagó ${payer?.first_name || 'Alguien'}`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {filteredExpenses.length === 0 && (
              <div className="flex flex-col items-center py-20 opacity-40">
                <span className="text-5xl mb-4">🌪️</span>
                <p className="text-sm font-bold uppercase tracking-widest">Nada por aquí</p>
              </div>
            )}
          </div>
        )}

        {/* TAB BALANCE */}
        {activeTab === 'balance' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] px-2">Estado de Cuentas</h4>
              {netBalances.map((nb: any) => (
                <div key={nb.userId} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-secondary bg-surface-2">
                      {nb.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">{nb.userId === user.id ? 'Yo' : nb.name}</span>
                      <span className="text-[10px] text-tertiary font-bold">Puso {formatAmount(nb.totalPaid, group.currency)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-black ${nb.netBalance >= 0 ? 'text-accent' : 'text-danger-500'}`}>
                      {nb.netBalance >= 0 ? '+' : ''}{formatAmount(nb.netBalance, group.currency)}
                    </span>
                    <p className="text-[9px] font-black uppercase text-tertiary">Balance Neto</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] px-2">Liquidación Greedy (Saldos)</h4>
              <div className="p-5 rounded-3xl bg-surface-2 border border-dashed border-subtle">
                {settlements.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 border-b last:border-0 border-subtle/50">
                    <div className="flex flex-col">
                      <p className="text-xs text-secondary font-medium"><span className="font-black text-primary">{s.from}</span> le debe a</p>
                      <p className="text-sm font-black text-primary">{s.to}</p>
                    </div>
                    <span className="text-base font-black text-accent" style={{ color }}>{formatAmount(s.amount, group.currency)}</span>
                  </div>
                ))}
                {settlements.length === 0 && (
                  <div className="flex flex-col items-center py-4 text-center">
                    <span className="text-3xl mb-2">🤝</span>
                    <p className="text-xs font-bold text-secondary">¡Todo está saldado!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB STATS */}
        {activeTab === 'stats' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] px-2 text-center">Distribución Gastada</h4>
              <div className="flex flex-col gap-4">
                {categoryBreakdown.map((item: any) => {
                  const cat = CATEGORIES.find(c => c.id === item.id) || CATEGORIES[5]
                  return (
                    <div key={item.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-xs font-extrabold text-primary uppercase tracking-tight">{cat.name}</span>
                        </div>
                        <span className="text-sm font-black text-primary">{formatAmount(item.amount, group.currency)}</span>
                      </div>
                      <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-1000" style={{ width: `${item.pct}%`, background: cat.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <FABAddExpense />

      {/* Modal de Invitación */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-subtle rounded-3xl p-7 shadow-2xl animate-scale-up">
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-3xl">✉️</div>
              <div>
                <h3 className="text-xl font-black text-primary">Invitar Jugador</h3>
                <p className="text-xs text-secondary mt-1">Sumá a alguien más a {group.name}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Email del invitado</label>
              <input 
                type="email" 
                placeholder="amigo@email.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 text-xs font-bold text-tertiary hover:text-secondary">
                Cerrar
              </button>
              <button onClick={handleInvite} disabled={inviting || !inviteEmail}
                className="flex-[2] py-3 rounded-xl bg-accent text-[#000F0A] text-xs font-black shadow-lg disabled:opacity-50"
                style={{ background: color }}>
                {inviting ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
