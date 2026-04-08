'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { CURRENCIES } from '@/lib/mockData'

const STEPS = ['Grupo', 'Miembros', 'Presupuesto']

export default function CreateGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    emoji: '🏠',
    currency: 'UYU',
    members: [] as { id: string, name: string, email: string, isMe: boolean }[],
    budgets: {} as Record<string, string>,
  })

  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteInput, setShowInviteInput] = useState(false)

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

  const EMOJIS = ['🏠','✈️','🎉','🍔','🛒','🚗','💡','🏥','🎬','👗','💻','💪','🐾','📚','🎁']

  const update = (field: string, val: unknown) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const addMemberByEmail = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('Email inválido')
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

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setLoading(true)
      try {
        const { data: group, error: gError } = await supabase
          .from('groups')
          .insert({
            name: form.name,
            emoji: form.emoji,
            currency: form.currency,
            owner_id: user?.id
          })
          .select().single()

        if (gError) throw gError

        const membersToInsert = form.members.map(m => ({
          group_id: group.id,
          user_id: m.isMe ? user?.id : null,
          role: m.isMe ? 'admin' : 'member',
          budget: parseFloat(form.budgets[m.id] || '0')
        }))

        await supabase.from('group_members').insert(membersToInsert)
        router.push('/dashboard')
      } catch (err) {
        alert('Error al crear grupo')
        setLoading(false)
      }
    }
  }

  return (
    <div className="page" style={{ background: '#0E0B1A', minHeight: '100vh', color: 'white' }}>
      <header className="page-header" style={{ padding: '20px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nuevo Grupo</h1>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Paso {step + 1} de 3</p>
        </div>
      </header>

      <div style={{ padding: '0 20px 20px' }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => update('emoji', e)} style={{ fontSize: '1.5rem', padding: '10px', background: form.emoji === e ? '#7C3AED' : '#1A1625', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
            <input className="input" style={{ background: '#1A1625', border: '1px solid #332D41', color: 'white', padding: '15px', borderRadius: '12px' }} placeholder="Nombre del grupo" value={form.name} onChange={e => update('name', e.target.value)} />
            <select className="input" style={{ background: '#1A1625', border: '1px solid #332D41', color: 'white', padding: '15px', borderRadius: '12px' }} value={form.currency} onChange={e => update('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {form.members.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: '#1A1625', borderRadius: '12px', border: '1px solid #332D41' }}>
                <div style={{ width: '40px', height: '40px', background: '#7C3AED', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{m.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.name} {m.isMe && '(Vos)'}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{m.email}</div>
                </div>
              </div>
            ))}
            {showInviteInput ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="input" style={{ flex: 1, background: '#1A1625', border: '1px solid #332D41', color: 'white', padding: '12px', borderRadius: '12px' }} placeholder="email@ejemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <button className="btn" style={{ background: '#7C3AED', color: 'white', padding: '0 20px', borderRadius: '12px', border: 'none' }} onClick={addMemberByEmail}>Add</button>
              </div>
            ) : (
              <button onClick={() => setShowInviteInput(true)} style={{ background: 'none', border: '1px dashed #332D41', color: '#7C3AED', padding: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>+ Invitar por email</button>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {form.members.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', opacity: 0.6 }}>Presupuesto para {m.name}</label>
                <input className="input" type="number" style={{ background: '#1A1625', border: '1px solid #332D41', color: 'white', padding: '15px', borderRadius: '12px' }} placeholder="0" value={form.budgets[m.id] || ''} onChange={e => update('budgets', { ...form.budgets, [m.id]: e.target.value })} />
              </div>
            ))}
          </div>
        )}

        <button onClick={handleNext} disabled={loading || (step === 0 && !form.name)} style={{ width: '100%', marginTop: '30px', background: '#7C3AED', color: 'white', padding: '18px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Creando...' : step === 2 ? '🚀 Crear Grupo' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}
