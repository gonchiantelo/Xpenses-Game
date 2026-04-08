'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { CURRENCIES, COLOR_PALETTES, GROUP_TYPES } from '@/lib/mockData'

const STEPS = ['Grupo', 'Miembros', 'Presupuesto']

export default function CreateGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    emoji: '🏠',
    type: 'monthly',
    currency: 'UYU',
    palette: 'violet',
    members: [] as { id: string, name: string, email: string, isMe: boolean }[],
    budgets: {} as Record<string, string>,
  })

  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteInput, setShowInviteInput] = useState(false)

  // Initialize members with current user
  useEffect(() => {
    if (user && form.members.length === 0) {
      setForm(prev => ({
        ...prev,
        members: [{
          id: user.id,
          name: `${user.user_metadata?.first_name || 'Yo'} ${user.user_metadata?.last_name || ''}`.trim(),
          email: user.email || '',
          isMe: true
        }]
      }))
    }
  }, [user])

  const EMOJIS = ['🏠','✈️','🎉','🍔','🛒','🚗','🏠','💡','🏥','🎬','✈️','👗','💻','💪','🐾','📚','🎁','📦']

  const update = (field: string, val: unknown) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const addMemberByEmail = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Por favor ingresa un email válido')
      return
    }
    if (form.members.length >= 4) {
      alert('La versión gratuita permite máximo 4 personas')
      return
    }
    const newMember = {
      id: `temp-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      isMe: false
    }
    update('members', [...form.members, newMember])
    setInviteEmail('')
    setShowInviteInput(false)
  }

  const removeMember = (id: string) => {
    update('members', form.members.filter(m => m.id !== id))
  }

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      if (!user) return
      setLoading(true)
      
      try {
        const { data: group, error: gError } = await supabase
          .from('groups')
          .insert({
            name: form.name,
            emoji: form.emoji,
            type: form.type,
            currency: form.currency,
            palette: form.palette,
            owner_id: user.id
          })
          .select()
          .single()

        if (gError) throw gError

        const membersToInsert = form.members.map(m => ({
          group_id: group.id,
          user_id: m.isMe ? user.id : null,
          role: m.isMe ? 'admin' : 'member',
          budget: parseFloat(form.budgets[m.id] || '0')
        }))

        const { error: mError } = await supabase
          .from('group_members')
          .insert(membersToInsert)

        if (mError) throw mError

        router.push('/dashboard')
      } catch (err) {
        console.error('Error:', err)
        alert('Error al crear el grupo.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="page" style={{ background: 'var(--color-bg)' }}>
      <header className="page-header">
        <button className="btn btn--icon btn--ghost" onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-header__title">Nuevo Grupo</h1>
          <p className="page-header__subtitle">Paso {step + 1} de {STEPS.length}</p>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div className="create-progress">
        {STEPS.map((s, i) => (
          <div key={s} style={{ height: 3, flex: 1, background: i <= step ? 'var(--color-accent)' : 'var(--color-surface-2)', borderRadius: 999 }} />
        ))}
      </div>

      <div className="page-content">
        {step === 0 && (
          <div className="create-section">
            <div className="input-group">
              <label className="input-label">Ícono</label>
              <div className="emoji-grid">
                {EMOJIS.slice(0, 15).map(e => (
                  <button key={e} className={`emoji-btn ${form.emoji === e ? 'selected' : ''}`} onClick={() => update('emoji', e)}>{e}</button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Nombre del grupo</label>
              <input className="input" placeholder="Ej: Gastos Casa" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">Moneda</label>
              <select className="input" value={form.currency} onChange={e => update('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="create-section">
            <div className="member-list">
              {form.members.map(m => (
                <div key={m.id} className="member-row">
                  <div className="member-ava">{m.name.substring(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{m.name} {m.isMe && '(Vos)'}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{m.email}</div>
                  </div>
                  {!m.isMe && <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>✕</button>}
                </div>
              ))}
            </div>

            {showInviteInput ? (
              <div className="invite-box">
                <input className="input" placeholder="email@ejemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <button className="btn btn--primary btn--sm" onClick={addMemberByEmail}>Agregar</button>
              </div>
            ) : (
              <button className="btn btn--ghost btn--full" onClick={() => setShowInviteInput(true)}>+ Invitar por email</button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="create-section">
            {form.members.map(m => (
              <div key={m.id} className="budget-row">
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Presupuesto para {m.name}</span>
                <input className="input" type="number" placeholder="0" value={form.budgets[m.id] || ''} onChange={e => update('budgets', { ...form.budgets, [m.id]: e.target.value })} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {step > 0 && <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>Atrás</button>}
          <button className={`btn btn--primary ${loading ? 'loading' : ''}`} style={{ flex: 2 }} onClick={handleNext} disabled={loading || (step === 0 && !form.name)}>
            {loading ? '...' : step === 2 ? 'Crear Grupo' : 'Continuar'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .create-progress { display: flex; gap: 4px; padding: 0 16px 16px; }
        .create-section { display: flex; flex-direction: column; gap: 20px; }
        .emoji-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        .emoji-btn { font-size: 1.5rem; padding: 10px; border: 1.5px solid var(--color-border-2); background: var(--color-surface-2); border-radius: 8px; cursor: pointer; }
        .emoji-btn.selected { border-color: var(--color-accent); background: var(--color-accent-dim); }
        .member-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-surface-2); border-radius: 12px; }
        .member-ava { width: 32px; height: 32px; background: var(--color-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12px; }
        .invite-box { display: flex; gap: 8px; margin-top: 12px; }
        .budget-row { display: flex; flex-direction: column; gap: 8px; }
        .btn.loading { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
