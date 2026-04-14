'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const STEPS = ['Grupo', 'Miembros', 'Presupuesto']
const EMOJIS = ['🏠','✈️','🎉','🍔','🛒','🚗','💡','🏥','🎬','👗','💻','💪','🐾','📚','🎁']
const PALETTES = [
  { id: 'green',   color: '#00DF81' },
  { id: 'violet',  color: '#8B5CF6' },
  { id: 'cyan',    color: '#06B6D4' },
  { id: 'rose',    color: '#F43F5E' },
  { id: 'amber',   color: '#F59E0B' },
  { id: 'slate',   color: '#64748B' },
]

const CURRENCIES = [
  { code: 'UYU', name: 'Pesos Uruguayos', flag: '🇺🇾' },
  { code: 'ARS', name: 'Pesos Argentinos', flag: '🇦🇷' },
  { code: 'USD', name: 'Dólares', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euros', flag: '🇪🇺' },
]

export default function CreateGroupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
      </div>
    }>
      <CreateGroupContent />
    </Suspense>
  )
}

function CreateGroupContent() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    name:     '',
    emoji:    '🏠',
    currency: 'UYU',
    palette:  'green',
    members:  [] as { id: string, name: string, email: string, isMe: boolean }[],
    budgets:  {} as Record<string, string>,
  })

  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    if (user && form.members.length === 0) {
      setForm(prev => ({
        ...prev,
        members: [{
          id:     user.id,
          name:   user.user_metadata?.first_name || 'Yo',
          email:  user.email || '',
          isMe:   true
        }]
      }))
    }
  }, [user, form.members.length])

  const update = (field: string, val: unknown) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const addMember = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) return
    const newMember = {
      id:    `temp-${Date.now()}`,
      name:  inviteEmail.split('@')[0],
      email: inviteEmail,
      isMe:  false
    }
    update('members', [...form.members, newMember])
    setInviteEmail('')
  }

  const removeMember = (id: string) => {
    update('members', form.members.filter(m => m.id !== id))
  }

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setLoading(true)
      try {
        // 1. Crear el grupo
        const { data: group, error: gError } = await supabase
          .from('groups')
          .insert({
            name:     form.name,
            emoji:    form.emoji,
            currency: form.currency,
            palette:  form.palette,
            type:     'monthly',
            owner_id: user?.id
          })
          .select().single()

        if (gError) throw gError

        // 2. Insertar al dueño con su presupuesto
        const { error: mError } = await supabase
          .from('group_members')
          .insert({
            group_id: group.id,
            user_id:  user?.id,
            role:     'admin',
            budget:   parseFloat(form.budgets[user?.id || ''] || '0')
          })

        if (mError) throw mError

        // 3. (Opcional) Las invitaciones a terceros se manejarían vía invitaciones de Supabase o email
        // Por ahora, solo creamos el grupo con el dueño.

        router.push('/dashboard')
      } catch (err: any) {
        alert('Error: ' + err.message)
        setLoading(false)
      }
    }
  }

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="p-2 rounded-xl bg-surface-2 border border-subtle text-secondary hover:text-primary transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-tertiary uppercase tracking-widest leading-none mb-1">Paso {step + 1} de 3</span>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${i <= step ? 'bg-accent' : 'bg-surface-3'}`} />
            ))}
          </div>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex flex-col gap-6 animate-fade-in pb-20">
        
        {/* STEP 1: IDENTIDAD */}
        {step === 0 && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-2">Elegí un icono</label>
              <div className="flex flex-wrap gap-2 justify-center p-4 bg-surface-2 rounded-2xl border border-subtle">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => update('emoji', e)}
                    className={`
                      w-11 h-11 flex items-center justify-center text-xl rounded-xl transition-all
                      ${form.emoji === e ? 'bg-accent shadow-lg shadow-accent/20 scale-110' : 'bg-surface hover:bg-surface-3'}
                    `}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-2">Color del grupo</label>
              <div className="flex justify-around p-4 bg-surface-2 rounded-2xl border border-subtle">
                {PALETTES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => update('palette', p.id)}
                    className={`
                      w-8 h-8 rounded-full transition-all border-4
                      ${form.palette === p.id ? 'border-white scale-125' : 'border-transparent opacity-60'}
                    `}
                    style={{ background: p.color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Nombre del grupo</label>
                <input
                  type="text"
                  placeholder="Ej: Viaje a Brazil, Gastos Hogar..."
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="w-full bg-surface border border-subtle rounded-xl px-4 py-3.5 text-sm font-bold text-primary focus:outline-none focus:border-accent shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Moneda</label>
                <select
                  value={form.currency}
                  onChange={e => update('currency', e.target.value)}
                  className="w-full bg-surface border border-subtle rounded-xl px-4 py-3.5 text-sm font-bold text-primary focus:outline-none focus:border-accent cursor-pointer appearance-none"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MIEMBROS */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest px-2">Integrantes</label>
              {form.members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-subtle bg-surface shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent border border-accent/20">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{m.name} {m.isMe && <span className="text-tertiary font-normal">(Vos)</span>}</p>
                      <p className="text-[10px] text-tertiary font-medium">{m.email}</p>
                    </div>
                  </div>
                  {!m.isMe && (
                    <button onClick={() => removeMember(m.id)} className="p-2 text-tertiary hover:text-danger-500">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Invitar un amigo</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="amigo@email.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="flex-1 bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-accent"
                />
                <button
                  onClick={addMember}
                  className="px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-black uppercase hover:bg-accent/20 transition-all"
                >
                  Agregar
                </button>
              </div>
              <p className="text-[10px] text-tertiary px-1">Le enviaremos un link de invitación al crear el grupo.</p>
            </div>
          </div>
        )}

        {/* STEP 3: PRESUPUESTO */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <h3 className="text-xs font-black text-tertiary uppercase tracking-widest text-center">Presupuesto Sugerido</h3>
            <p className="text-[10px] text-secondary text-center px-6">Xpenses usará esto para proyectar tus finanzas y avisarte si se exceden.</p>
            
            <div className="flex flex-col gap-4">
              {form.members.map(m => (
                <div key={m.id} className="flex flex-col gap-1.5 p-5 rounded-3xl bg-surface border border-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-bold text-accent">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-secondary uppercase tracking-wider">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-tertiary">{form.currency}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.budgets[m.id] || ''}
                      onChange={e => update('budgets', { ...form.budgets, [m.id]: e.target.value })}
                      className="flex-1 bg-transparent text-3xl font-black text-primary placeholder:text-surface-3 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Action Button */}
        <div className="fixed bottom-6 left-0 right-0 px-6 max-w-lg mx-auto z-10">
          <button
            onClick={handleNext}
            disabled={loading || (step === 0 && !form.name)}
            className={`
              w-full py-4 rounded-2xl text-sm font-bold text-[#000F0A] shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50
              ${step === 2 ? 'bg-[#00DF81]' : 'bg-surface text-primary border border-subtle'}
            `}
            style={step === 2 ? { background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)' } : {}}
          >
            {loading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Creando...</div> :
              step === 2 ? '🚀 Crear Grupo' : 'Continuar'}
          </button>
        </div>

      </div>
    </>
  )
}
