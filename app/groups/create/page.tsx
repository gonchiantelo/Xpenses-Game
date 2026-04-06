'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CURRENCIES, COLOR_PALETTES, GROUP_TYPES, MOCK_USERS, CURRENT_USER } from '@/lib/mockData'

const STEPS = ['Grupo', 'Miembros', 'Presupuesto']

export default function CreateGroupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    emoji: '🏠',
    type: 'monthly',
    currency: '',
    palette: 'violet',
    members: [CURRENT_USER.id],
    budgets: {} as Record<string, string>,
  })

  const EMOJIS = ['🏠','✈️','🎉','🍔','💼','🏋️','🐾','📚','🎸','🏖️','🔥','⚡','🌿','🎮','💡']

  const update = (field: string, val: unknown) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const toggleMember = (uid: string) => {
    if (uid === CURRENT_USER.id) return // can't remove yourself
    const current = form.members
    if (current.includes(uid)) {
      update('members', current.filter(id => id !== uid))
    } else {
      if (current.length >= 4) {
        alert('La versión gratuita permite máximo 4 personas por grupo')
        return
      }
      update('members', [...current, uid])
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setLoading(true)
      setTimeout(() => router.push('/groups'), 1200)
    }
  }

  const selectedType = GROUP_TYPES.find(t => t.id === form.type)
  const selectedPalette = COLOR_PALETTES.find(p => p.id === form.palette)

  return (
    <div className="page">
      <header className="page-header">
        <button id="btn-back-create" className="btn btn--icon btn--ghost" onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}>
          ←
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-header__title">Nuevo Grupo</h1>
          <p className="page-header__subtitle">Paso {step + 1} de {STEPS.length}</p>
        </div>
        <div style={{ width: 44 }} />
      </header>

      {/* Progress */}
      <div className="create-progress">
        {STEPS.map((s, i) => (
          <div key={s} className={`create-step ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      <div className="page-content">
        {/* STEP 0: Grupo */}
        {step === 0 && (
          <div className="create-section">
            {/* Emoji picker */}
            <div className="input-group">
              <label className="input-label">Ícono del grupo</label>
              <div className="emoji-grid">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    id={`emoji-${e}`}
                    className={`emoji-btn ${form.emoji === e ? 'selected' : ''}`}
                    onClick={() => update('emoji', e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="group-name">Nombre del grupo</label>
              <input
                id="group-name"
                className="input"
                placeholder="Ej: Casa, Viaje Europa..."
                value={form.name}
                onChange={e => update('name', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Tipo de grupo</label>
              <div className="type-grid">
                {GROUP_TYPES.map(t => (
                  <button
                    key={t.id}
                    id={`type-${t.id}`}
                    className={`type-card ${form.type === t.id ? 'selected' : ''}`}
                    onClick={() => update('type', t.id)}
                  >
                    <span className="type-icon">{t.icon}</span>
                    <span className="type-name">{t.name}</span>
                  </button>
                ))}
              </div>
              {selectedType && (
                <p className="type-desc">{selectedType.description}</p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="currency-select">Moneda del grupo</label>
              <select
                id="currency-select"
                className="input"
                value={form.currency}
                onChange={e => update('currency', e.target.value)}
                style={{ appearance: 'none' }}
              >
                <option value="">Seleccioná una moneda...</option>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Color del grupo</label>
              <div className="palette-grid">
                {COLOR_PALETTES.map(p => (
                  <button
                    key={p.id}
                    id={`palette-${p.id}`}
                    className={`palette-swatch ${form.palette === p.id ? 'selected' : ''}`}
                    style={{ background: p.color }}
                    title={p.name}
                    onClick={() => update('palette', p.id)}
                  >
                    {form.palette === p.id && <span>✓</span>}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginTop: 4 }}>
                Paleta: <strong style={{ color: selectedPalette?.color }}>{selectedPalette?.name}</strong>
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: Miembros */}
        {step === 1 && (
          <div className="create-section">
            <div className="free-tier-notice">
              <span>🆓</span>
              <div>
                <strong>Plan Gratuito</strong>
                <p>Máximo 4 personas. <Link href="#" style={{ color: 'var(--color-accent-light)' }}>Upgradear →</Link></p>
              </div>
              <span className="badge badge--accent">{form.members.length}/4</span>
            </div>

            {MOCK_USERS.map(user => {
              const isMe = user.id === CURRENT_USER.id
              const isSelected = form.members.includes(user.id)
              return (
                <div
                  key={user.id}
                  id={`member-${user.id}`}
                  className={`member-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => !isMe && toggleMember(user.id)}
                >
                  <div className="member-row-ava" style={{ background: user.avatarColor }}>
                    {user.avatarInitials}
                  </div>
                  <div className="member-row-info">
                    <span className="member-row-name">
                      {user.firstName} {user.lastName}
                      {isMe && <span className="badge badge--accent" style={{ marginLeft: 8, fontSize: '0.65rem' }}>Vos</span>}
                    </span>
                    <span className="member-row-email">{user.email}</span>
                  </div>
                  <div className={`member-check ${isSelected ? 'checked' : ''}`}>
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
              )
            })}

            <button id="btn-invite-email" className="btn btn--ghost btn--full" style={{ marginTop: 8 }}>
              + Invitar por email
            </button>
          </div>
        )}

        {/* STEP 2: Presupuesto */}
        {step === 2 && (
          <div className="create-section">
            <div className="budget-header-card">
              <div style={{ fontSize: '2.5rem' }}>{form.emoji}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{form.name || 'Mi Grupo'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
                  {CURRENCIES.find(c => c.code === form.currency)?.flag} {form.currency || '—'} · {form.members.length} personas
                </div>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
              Asigná el presupuesto mensual de cada integrante. Podés dejarlo en blanco y configurarlo después.
            </p>

            {form.members.map(uid => {
              const user = MOCK_USERS.find(u => u.id === uid)
              if (!user) return null
              return (
                <div key={uid} className="budget-input-row">
                  <div className="member-row-ava" style={{ background: user.avatarColor }}>
                    {user.avatarInitials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 4 }}>
                      {user.firstName}
                    </div>
                    <div className="input-icon-wrapper">
                      <span className="input-icon" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-2)' }}>
                        {CURRENCIES.find(c => c.code === form.currency)?.symbol ?? '$'}
                      </span>
                      <input
                        id={`budget-${uid}`}
                        className="input"
                        type="number"
                        placeholder="Presupuesto..."
                        value={form.budgets[uid] ?? ''}
                        onChange={e => update('budgets', { ...form.budgets, [uid]: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="toggle-row">
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Presupuesto compartido</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>Sumar los presupuestos individuales</div>
              </div>
              <label className="toggle">
                <input type="checkbox" />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {step > 0 && (
            <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
              ← Atrás
            </button>
          )}
          <button
            id="btn-create-next"
            className={`btn btn--primary ${loading ? 'loading' : ''}`}
            style={{ flex: 2 }}
            onClick={handleNext}
            disabled={loading || (step === 0 && (!form.name || !form.currency))}
          >
            {loading ? <span className="spinner" /> :
              step === STEPS.length - 1 ? '🚀 Crear grupo' : 'Continuar →'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .create-progress {
          display: flex;
          gap: 4px;
          padding: 0 var(--space-4) var(--space-2);
        }
        .create-step {
          height: 3px;
          flex: 1;
          background: var(--color-surface-2);
          border-radius: var(--radius-full);
          transition: background 0.3s;
        }
        .create-step.active { background: var(--color-accent); }
        .create-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .emoji-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .emoji-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--color-border-2);
          background: var(--color-surface-2);
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .emoji-btn:hover { border-color: var(--color-border); transform: scale(1.1); }
        .emoji-btn.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-dim);
          transform: scale(1.15);
          box-shadow: 0 0 12px var(--color-accent-glow);
        }
        .type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
        }
        .type-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4);
          background: var(--color-surface-2);
          border: 1.5px solid var(--color-border-2);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.15s;
        }
        .type-card:hover { border-color: var(--color-border); }
        .type-card.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-dim);
        }
        .type-icon { font-size: 1.75rem; }
        .type-name { font-size: var(--text-sm); font-weight: 600; color: var(--color-text); }
        .type-desc {
          font-size: var(--text-xs);
          color: var(--color-text-2);
          background: var(--color-surface-2);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          border-left: 2px solid var(--color-accent);
        }
        .palette-grid {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
        .palette-swatch {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.15s;
        }
        .palette-swatch:hover { transform: scale(1.15); }
        .palette-swatch.selected {
          border-color: var(--color-text);
          transform: scale(1.2);
          box-shadow: 0 0 16px rgba(255,255,255,0.2);
        }
        .free-tier-notice {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: var(--color-accent-dim);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
        }
        .free-tier-notice > span:first-child { font-size: 1.25rem; }
        .free-tier-notice > div { flex: 1; }
        .free-tier-notice strong { display: block; font-weight: 600; color: var(--color-text); }
        .free-tier-notice p { color: var(--color-text-2); margin: 0; font-size: var(--text-xs); }
        .member-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: var(--color-surface);
          border: 1.5px solid var(--color-border-2);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.15s;
        }
        .member-row:hover { border-color: var(--color-border); background: var(--color-surface-2); }
        .member-row.selected {
          border-color: var(--color-accent);
          background: var(--color-accent-dim);
        }
        .member-row-ava {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .member-row-info { flex: 1; }
        .member-row-name { display: block; font-size: var(--text-sm); font-weight: 600; color: var(--color-text); }
        .member-row-email { font-size: var(--text-xs); color: var(--color-text-3); }
        .member-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid var(--color-border-2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          transition: all 0.15s;
        }
        .member-check.checked {
          background: var(--color-accent);
          border-color: var(--color-accent);
        }
        .budget-header-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          background: var(--color-surface-2);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
        }
        .budget-input-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          background: var(--color-surface-2);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }
        .btn.loading { opacity: 0.7; cursor: not-allowed; }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  )
}
