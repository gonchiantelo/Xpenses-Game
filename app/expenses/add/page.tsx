'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  MOCK_GROUPS, CATEGORIES, MOCK_USERS,
  formatAmount, getCurrencySymbol, getGroupById
} from '@/lib/mockData'

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
  const [form, setForm] = useState({
    groupId: preGroupId || (MOCK_GROUPS[0]?.id ?? ''),
    amount: '',
    categoryId: '',
    description: '',
    notes: '',
    paidById: user?.id,
    date: new Date().toISOString().slice(0, 10),
    isFixed: false,
  })
  const [splits, setSplits] = useState<Record<string, number>>({})
  const [splitMode, setSplitMode] = useState<'equal' | 'manual'>('equal')

  const group = getGroupById(form.groupId)
  const currency = group?.currency ?? 'UYU'
  const symbol = getCurrencySymbol(currency)
  const members = group?.members.map(m => MOCK_USERS.find(u => u.id === m.userId)!).filter(Boolean) ?? []

  // Initialize equal splits when group or amount changes
  useEffect(() => {
    if (!group || !form.amount) return
    const amt = parseFloat(form.amount)
    if (isNaN(amt)) return
    const n = group.members.length
    const equal = Math.round((amt / n) * 100) / 100
    const s: Record<string, number> = {}
    group.members.forEach(m => { s[m.userId] = equal })
    setSplits(s)
  }, [form.groupId, form.amount, group])

  const STEPS: Step[] = ['monto', 'categoria', 'detalles', 'split']
  const stepIdx = STEPS.indexOf(step)
  const canGoNext = () => {
    if (step === 'monto') return !!form.amount && parseFloat(form.amount) > 0 && !!form.groupId
    if (step === 'categoria') return !!form.categoryId
    return true
  }

  const handleNext = () => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
    } else {
      setLoading(true)
      setTimeout(() => router.push(`/groups/${form.groupId}`), 1000)
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

      {/* Step progress */}
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

        {/* ─── STEP: MONTO ─── */}
        {step === 'monto' && (
          <div className="step-section">
            {/* Group selector */}
            <div className="input-group">
              <label className="input-label">¿En qué grupo?</label>
              <div className="group-selector">
                {MOCK_GROUPS.map(g => (
                  <button key={g.id} id={`sel-group-${g.id}`}
                    className={`group-sel-btn ${form.groupId === g.id ? 'selected' : ''}`}
                    onClick={() => setForm(p => ({ ...p, groupId: g.id }))}>
                    <span>{g.emoji}</span>
                    <span>{g.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Big amount input */}
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

            {/* Who paid */}
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

            {/* Date */}
            <div className="input-group">
              <label className="input-label">Fecha</label>
              <input id="input-date" className="input" type="date"
                value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
        )}

        {/* ─── STEP: CATEGORÍA ─── */}
        {step === 'categoria' && (
          <div className="step-section">
            <div className="amount-preview">
              <span style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>Monto</span>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', letterSpacing: '-0.04em' }}>
                {symbol} {form.amount}
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

        {/* ─── STEP: DETALLES ─── */}
        {step === 'detalles' && (
          <div className="step-section">
            <div className="amount-preview">
              <span style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>
                {CATEGORIES.find(c => c.id === form.categoryId)?.icon} {CATEGORIES.find(c => c.id === form.categoryId)?.name}
              </span>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', letterSpacing: '-0.04em' }}>
                {symbol} {form.amount}
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

            <div className="toggle-row">
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>🔄 Gasto fijo</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>Se registra automáticamente cada mes</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={form.isFixed}
                  onChange={e => setForm(p => ({ ...p, isFixed: e.target.checked }))} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        )}

        {/* ─── STEP: SPLIT ─── */}
        {step === 'split' && (
          <div className="step-section">
            <div className="amount-preview">
              <span style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>{form.description || 'Gasto'}</span>
              <span style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', letterSpacing: '-0.04em' }}>
                {symbol} {form.amount}
              </span>
            </div>

            <div className="split-mode-row">
              <button id="split-equal" className={`split-mode-btn ${splitMode === 'equal' ? 'active' : ''}`}
                onClick={() => {
                  setSplitMode('equal')
                  const n = members.length
                  const eq = Math.round((amount / n) * 100) / 100
                  const s: Record<string, number> = {}
                  members.forEach(m => { s[m.id] = eq })
                  setSplits(s)
                }}>
                ⚖️ Equitativo
              </button>
              <button id="split-manual" className={`split-mode-btn ${splitMode === 'manual' ? 'active' : ''}`}
                onClick={() => setSplitMode('manual')}>
                ✏️ Manual
              </button>
            </div>

            {members.map(u => (
              <div key={u.id} className="split-row">
                <div className="split-ava" style={{ background: u.avatarColor }}>{u.avatarInitials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {u.id === user?.id ? 'Yo' : `${u.firstName} ${u.lastName}`}
                  </div>
                  {amount > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>
                      {Math.round(((splits[u.id] ?? 0) / amount) * 100)}% del total
                    </div>
                  )}
                </div>
                {splitMode === 'manual' ? (
                  <div className="input-icon-wrapper" style={{ width: 120 }}>
                    <span className="input-icon" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-2)' }}>{symbol}</span>
                    <input
                      id={`split-input-${u.id}`}
                      className="input"
                      type="number"
                      inputMode="decimal"
                      value={splits[u.id] ?? ''}
                      onChange={e => updateSplit(u.id, parseFloat(e.target.value) || 0)}
                      style={{ textAlign: 'right', paddingRight: 12 }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>
                    {symbol} {(splits[u.id] ?? 0).toFixed(0)}
                  </span>
                )}
              </div>
            ))}

            {splitMode === 'manual' && (
              <div className={`split-check ${Math.abs(totalSplit - amount) < 0.5 ? 'ok' : 'error'}`}>
                {Math.abs(totalSplit - amount) < 0.5
                  ? '✓ Los montos cierran perfectamente'
                  : `⚠️ Diferencia: ${symbol} ${(amount - totalSplit).toFixed(0)}`}
              </div>
            )}

            {/* Summary */}
            <div className="split-summary">
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Resumen
              </div>
              {members.map(u => (
                <div key={u.id} className="summary-row">
                  <span style={{ fontSize: 'var(--text-sm)' }}>
                    {u.id === user?.id ? 'Yo' : u.firstName}
                    {u.id === form.paidById && <span className="badge badge--accent" style={{ marginLeft: 6, fontSize: '0.65rem' }}>Pagó</span>}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                    {u.id === form.paidById
                      ? <span style={{ color: 'var(--color-success)' }}>cobra {symbol} {(amount - (splits[u.id] ?? 0)).toFixed(0)}</span>
                      : <span style={{ color: 'var(--color-danger)' }}>debe {symbol} {(splits[u.id] ?? 0).toFixed(0)}</span>
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav buttons */}
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
        .group-selector { display: flex; flex-direction: column; gap: 8px; }
        .group-sel-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border-2);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm); font-weight: 600; color: var(--color-text);
          cursor: pointer; transition: all 0.15s; text-align: left;
        }
        .group-sel-btn:hover { border-color: var(--color-border); background: var(--color-surface-2); }
        .group-sel-btn.selected { border-color: var(--color-accent); background: var(--color-accent-dim); }
        .amount-block {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; padding: 32px 0;
        }
        .currency-symbol {
          font-size: 2rem; font-weight: 700; color: var(--color-text-3);
        }
        .amount-input {
          background: none; border: none; outline: none;
          font-size: 4rem; font-weight: 900; letter-spacing: -0.06em;
          color: var(--color-text); width: 200px; text-align: center;
          font-family: inherit;
        }
        .amount-input::placeholder { color: var(--color-surface-3); }
        .payer-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .payer-btn {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 12px 14px; background: var(--color-surface-2);
          border: 1.5px solid var(--color-border-2); border-radius: var(--radius-lg);
          cursor: pointer; transition: all 0.15s;
          font-size: var(--text-xs); font-weight: 600; color: var(--color-text-2);
        }
        .payer-btn:hover { border-color: var(--color-border); }
        .payer-btn.selected { border-color: var(--color-accent); background: var(--color-accent-dim); color: var(--color-accent-light); }
        .payer-ava { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; }
        .amount-preview { background: var(--color-surface-2); border-radius: var(--radius-xl); padding: 20px; text-align: center; display: flex; flex-direction: column; gap: 4px; }
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .cat-btn {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 12px 8px; background: var(--color-surface-2);
          border: 1.5px solid var(--color-border-2); border-radius: var(--radius-lg);
          cursor: pointer; transition: all 0.15s;
        }
        .cat-btn:hover { border-color: var(--color-border); transform: scale(1.03); }
        .cat-btn.selected { transform: scale(1.05); }
        .cat-btn-icon { font-size: 1.5rem; }
        .cat-btn-name { font-size: 0.65rem; font-weight: 600; color: var(--color-text-2); text-align: center; }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: var(--color-surface-2); border: 1px solid var(--color-border-2); border-radius: var(--radius-lg); padding: 16px; }
        .split-mode-row { display: flex; gap: 8px; }
        .split-mode-btn { flex: 1; padding: 10px; background: var(--color-surface-2); border: 1.5px solid var(--color-border-2); border-radius: var(--radius-lg); font-size: var(--text-sm); font-weight: 600; color: var(--color-text-2); cursor: pointer; transition: all 0.15s; }
        .split-mode-btn.active { background: var(--color-accent-dim); border-color: var(--color-accent); color: var(--color-accent-light); }
        .split-row { display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--color-surface); border: 1px solid var(--color-border-2); border-radius: var(--radius-lg); }
        .split-row + .split-row { margin-top: 8px; }
        .split-ava { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white; flex-shrink: 0; }
        .split-check { padding: 10px 16px; border-radius: var(--radius-md); font-size: var(--text-xs); font-weight: 600; }
        .split-check.ok { background: var(--color-success-dim); color: var(--color-success); border: 1px solid rgba(16,185,129,0.2); }
        .split-check.error { background: var(--color-warning-dim); color: var(--color-warning); border: 1px solid rgba(245,158,11,0.2); }
        .split-summary { background: var(--color-surface-2); border: 1px solid var(--color-border-2); border-radius: var(--radius-xl); padding: 16px; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--color-border-2); }
        .summary-row:last-child { border-bottom: none; }
        .btn.loading { opacity: 0.7; cursor: not-allowed; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
      `}</style>
    </div>
  )
}
