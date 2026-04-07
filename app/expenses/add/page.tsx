'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  CATEGORIES,
  formatAmount, getCurrencySymbol, getPaletteById
} from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

type Step = 'monto' | 'categoria' | 'detalles' | 'split'

import { Suspense } from 'react'

export default function AddExpensePage() {
  return (
    <Suspense fallback={<div className="page-content">Cargando...</div>}>
      <AddExpenseContent />
    </Suspense>
  )
}

function AddExpenseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const preGroupId = searchParams.get('group') ?? ''

  const [step, setStep] = useState<Step>('monto')
  const [loading, setLoading] = useState(false)
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [form, setForm] = useState({
    groupId: preGroupId,
    amount: '',
    categoryId: '',
    description: '',
    notes: '',
    paidById: '',
    date: new Date().toISOString().slice(0, 10),
    isFixed: false,
  })
  const [splits, setSplits] = useState<Record<string, number>>({})
  const [splitMode, setSplitMode] = useState<'equal' | 'manual'>('equal')

  // Initial setup when user or group changes
  useEffect(() => {
    if (!user) return
    setForm(p => ({ ...p, paidById: user.id }))
  }, [user])

  useEffect(() => {
    if (!form.groupId) return

    async function fetchGroupInfo() {
      const { data: gData } = await supabase.from('groups').select('*').eq('id', form.groupId).single()
      if (gData) setGroup(gData)

      const { data: mData } = await supabase.from('group_members')
        .select(`*, profiles(first_name, last_name, avatar_url)`)
        .eq('group_id', form.groupId)
      if (mData) {
        const enriched = mData.map(m => ({
          id: m.user_id,
          firstName: m.profiles?.first_name || 'Usuario',
          lastName: m.profiles?.last_name || '',
          avatarColor: getPaletteById(gData?.palette || 'violet').color,
          avatarInitials: m.profiles?.first_name?.substring(0, 1) || '👤'
        }))
        setMembers(enriched)
      }
    }

    fetchGroupInfo()
  }, [form.groupId])

  const currency = group?.currency ?? 'UYU'
  const symbol = getCurrencySymbol(currency)

  useEffect(() => {
    if (!members.length || !form.amount) return
    const amt = parseFloat(form.amount)
    if (isNaN(amt)) return
    const n = members.length
    const equal = Math.round((amt / n) * 100) / 100
    const s: Record<string, number> = {}
    members.forEach(m => { s[m.id] = equal })
    setSplits(s)
  }, [members, form.amount])

  const STEPS: Step[] = ['monto', 'categoria', 'detalles', 'split']
  const stepIdx = STEPS.indexOf(step)
  
  const canGoNext = () => {
    if (step === 'monto') return !!form.amount && parseFloat(form.amount) > 0 && !!form.groupId
    if (step === 'categoria') return !!form.categoryId
    return true
  }

  const handleNext = async () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
    } else {
      setLoading(true)
      const { error } = await supabase.from('expenses').insert([{
        group_id: form.groupId,
        paid_by_id: form.paidById,
        amount: parseFloat(form.amount),
        description: form.description,
        category_id: form.categoryId,
        date: form.date,
        is_fixed: form.isFixed,
        notes: form.notes
      }])
      
      if (error) {
        alert('Error al guardar el gasto: ' + error.message)
        setLoading(false)
      } else {
        router.push(`/groups/${form.groupId}`)
      }
    }
  }

  const updateSplit = (userId: string, val: number) => {
    setSplits(prev => ({ ...prev, [userId]: val }))
  }

  const totalSplit = Object.values(splits).reduce((s, v) => s + v, 0)
  const amount = parseFloat(form.amount) || 0

  return (
    <div className="page" style={{ background: 'var(--color-bg)' }}>
      <header className="page-header">
        <button id="btn-back-expense" className="btn btn--icon btn--ghost"
          onClick={() => stepIdx > 0 ? setStep(STEPS[stepIdx - 1]) : router.back()}>
          ←
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-header__title">Nuevo Gasto</h1>
          <p className="page-header__subtitle">Paso {stepIdx + 1} de {STEPS.length}</p>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div style={{ display: 'flex', gap: 4, padding: '0 16px 4px' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            height: 3, flex: 1, borderRadius: 999,
            background: i <= stepIdx ? 'var(--color-accent)' : 'var(--color-surface-2)',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>

      <div className="page-content">
        {step === 'monto' && (
          <div className="step-section">
            <div className="amount-block">
              <div className="currency-symbol">{symbol}</div>
              <input
                id="input-amount"
                className="amount-input"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">¿Quién pagó?</label>
              <div className="payer-row">
                {members.map(u => (
                  <button key={u.id} id={`payer-${u.id}`}
                    className={`payer-btn ${form.paidById === u.id ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, paidById: u.id }))}>
                    <div className="payer-ava" style={{ background: u.avatarColor }}>{u.avatarInitials}</div>
                    <span>{u.id === user?.id ? 'Yo' : u.firstName}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Fecha</label>
              <input id="input-date" className="input" type="date"
                value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
        )}

        {step === 'categoria' && (
          <div className="step-section">
            <div className="amount-preview">
              <span style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>Monto</span>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', letterSpacing: '-0.04em' }}>
                {formatAmount(amount, currency)}
              </span>
            </div>
            <div className="input-group">
              <label className="input-label">Rubro</label>
              <div className="cat-grid">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} id={`cat-${cat.id}`}
                    className={`cat-btn ${form.categoryId === cat.id ? 'selected' : ''}`}
                    style={form.categoryId === cat.id ? { borderColor: cat.color, background: `${cat.color}15` } : {}}
                    onClick={() => setForm(p => ({ ...p, categoryId: cat.id }))}>
                    <span className="cat-btn-icon">{cat.icon}</span>
                    <span className="cat-btn-name">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'detalles' && (
          <div className="step-section">
            <div className="amount-preview">
              <span style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>
                {CATEGORIES.find(c => c.id === form.categoryId)?.icon} {CATEGORIES.find(c => c.id === form.categoryId)?.name}
              </span>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', letterSpacing: '-0.04em' }}>
                {formatAmount(amount, currency)}
              </span>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="input-desc">Descripción</label>
              <input id="input-desc" className="input" placeholder="Ej: Supermercado Disco..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="input-notes">Comentarios (opcional)</label>
              <textarea id="input-notes" className="input" placeholder="Notas adicionales..."
                rows={3} value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                style={{ resize: 'none', fontFamily: 'inherit' }} />
            </div>
          </div>
        )}

        {step === 'split' && (
          <div className="step-section">
            <div className="amount-preview">
              <span style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>{form.description || 'Gasto'}</span>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', letterSpacing: '-0.04em' }}>
                {formatAmount(amount, currency)}
              </span>
            </div>

            <div className="split-mode-row">
              <button id="split-equal" className={`split-mode-btn ${splitMode === 'equal' ? 'active' : ''}`}
                onClick={() => setSplitMode('equal')}>⚖️ Equitativo</button>
              <button id="split-manual" className={`split-mode-btn ${splitMode === 'manual' ? 'active' : ''}`}
                onClick={() => setSplitMode('manual')}>✏️ Manual</button>
            </div>

            {members.map(u => (
              <div key={u.id} className="split-row">
                <div className="split-ava" style={{ background: u.avatarColor }}>{u.avatarInitials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {u.id === user?.id ? 'Yo' : `${u.firstName} ${u.lastName}`}
                  </div>
                </div>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
                  {symbol} {(splits[u.id] ?? 0).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {stepIdx > 0 && (
            <button className="btn btn--ghost" style={{ flex: 1 }}
              onClick={() => setStep(STEPS[stepIdx - 1])}>← Atrás</button>
          )}
          <button
            id="btn-expense-next"
            className={`btn btn--primary ${loading ? 'loading' : ''}`}
            style={{ flex: 2 }}
            onClick={handleNext}
            disabled={!canGoNext() || loading}>
            {loading ? <span className="spinner" /> :
              step === 'split' ? '✅ Guardar gasto' : 'Continuar →'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .step-section { display: flex; flex-direction: column; gap: var(--space-5); }
        .amount-block { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 32px 0; }
        .currency-symbol { font-size: 2rem; font-weight: 700; color: var(--color-text-3); }
        .amount-input { background: none; border: none; outline: none; font-size: 4rem; font-weight: 900; letter-spacing: -0.06em; color: var(--color-text); width: 200px; text-align: center; }
        .payer-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .payer-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 14px; background: var(--color-surface-2); border: 1.5px solid var(--color-border-2); border-radius: var(--radius-lg); cursor: pointer; transition: all 0.15s; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-2); }
        .payer-btn.selected { border-color: var(--color-accent); background: var(--color-accent-dim); color: var(--color-accent-light); }
        .payer-ava { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
        .amount-preview { background: var(--color-surface-2); border-radius: var(--radius-xl); padding: 20px; text-align: center; display: flex; flex-direction: column; gap: 4px; }
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .cat-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; background: var(--color-surface-2); border: 1.5px solid var(--color-border-2); border-radius: var(--radius-lg); cursor: pointer; }
        .cat-btn.selected { transform: scale(1.05); }
        .cat-btn-icon { font-size: 1.5rem; }
        .cat-btn-name { font-size: 0.65rem; font-weight: 600; text-align: center; }
        .split-mode-row { display: flex; gap: 8px; }
        .split-mode-btn { flex: 1; padding: 10px; background: var(--color-surface-2); border: 1.5px solid var(--color-border-2); border-radius: var(--radius-lg); font-size: var(--text-sm); font-weight: 600; cursor: pointer; }
        .split-mode-btn.active { background: var(--color-accent-dim); border-color: var(--color-accent); color: var(--color-accent-light); }
        .split-row { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-lg); }
        .split-ava { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
