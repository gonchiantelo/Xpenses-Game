'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useXpenses } from '@/hooks/useXpenses'
import { calculateEqualSplit } from '@/lib/finance/splits'

const CATEGORIES = [
  { id: 'food',      name: 'Comida',    icon: '🍕', color: '#F87171' },
  { id: 'home',      name: 'Hogar',     icon: '🏠', color: '#60A5FA' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#FBBF24' },
  { id: 'leisure',   name: 'Ocio',      icon: '🎮', color: '#A78BFA' },
  { id: 'services',  name: 'Servicios', icon: '🔋', color: '#34D399' },
  { id: 'others',    name: 'Otros',     icon: '📦', color: '#9CA3AF' },
]

type Step = 'monto' | 'categoria' | 'detalles' | 'split'
const STEPS_LIST: Step[] = ['monto', 'categoria', 'detalles', 'split']

export default function AddExpensePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
        <p className="text-xs text-tertiary">Preparando billetera...</p>
      </div>
    }>
      <AddExpenseContent />
    </Suspense>
  )
}

function AddExpenseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { groups, loading: loadingGroups } = useXpenses()
  const supabase = createClient()

  const preGroupId = searchParams.get('group') ?? ''

  const [step,    setStep]    = useState<Step>('monto')
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    groupId:     preGroupId,
    amount:      '',
    categoryId:  '',
    description: '',
    notes:       '',
    paidById:    user?.id || '',
    date:        new Date().toISOString().slice(0, 10),
    isFixed:     false,
  })

  const [splits, setSplits] = useState<Record<string, number>>({})

  const currentGroup = groups.find(g => g.id === form.groupId)
  const currency     = currentGroup?.currency ?? 'UYU'
  const symbol       = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$'

  const groupMembers = currentGroup?.members || []
  const stepIdx      = STEPS_LIST.indexOf(step)

  // Actualizar splits automáticamente al cambiar el monto o el pagador
  useEffect(() => {
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0 || groupMembers.length === 0 || !form.paidById) return
    
    const memberIds = groupMembers.map(m => m.user_id)
    const splitArray = calculateEqualSplit(amt, memberIds, form.paidById)
    
    // Convertimos el array de la librería a nuestro mapa local de visualización
    const splitMap: Record<string, number> = {}
    splitArray.forEach(s => { splitMap[s.memberId] = s.amount })
    
    // El pagador "no se debe a sí mismo" en el mapa de deudas, 
    // pero para la UI queremos mostrar cuánto pone cada uno
    const share = amt / memberIds.length
    memberIds.forEach(id => {
      splitMap[id] = id === form.paidById ? share : (splitMap[id] || share)
    })

    setSplits(splitMap)
  }, [form.amount, groupMembers, form.paidById])

  // Asegurar que el pagador sea el usuario actual por defecto
  useEffect(() => {
    if (user && !form.paidById) updateForm('paidById', user.id)
  }, [user, form.paidById])

  const updateForm = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const canGoNext = () => {
    if (step === 'monto')     return !!form.amount && parseFloat(form.amount) > 0 && !!form.groupId
    if (step === 'categoria') return !!form.categoryId
    return true
  }

  const handleNext = async () => {
    if (stepIdx < STEPS_LIST.length - 1) {
      setStep(STEPS_LIST[stepIdx + 1])
    } else {
      setLoading(true)
      const amtNum = parseFloat(form.amount)

      // 1. Insertar Gasto
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .insert([{
          group_id:    form.groupId,
          paid_by_id:  form.paidById,
          amount:      amtNum,
          description: form.description || CATEGORIES.find(c => c.id === form.categoryId)?.name || 'Gasto',
          category_id: form.categoryId,
          date:        form.date,
          is_fixed:    form.isFixed,
          notes:       form.notes
        }])
        .select()
        .single()
      
      if (expErr) {
        alert('Error: ' + expErr.message)
        setLoading(false)
        return
      }

      // 2. Insertar Splits (Deuda trazable)
      const splitInserts = Object.entries(splits).map(([uid, debt]) => ({
        expense_id: expData.id,
        user_id:    uid,
        amount:     debt
      }))

      const { error: splitErr } = await supabase.from('expense_splits').insert(splitInserts)
      if (splitErr) console.error('Error insertando splits:', splitErr)

      // 3. Notificaciones (Asíncrono)
      const payerName = groupMembers.find(m => m.user_id === form.paidById)?.profiles?.first_name || 'Alguien'
      const notifs    = groupMembers.map(m => ({
        user_id:  m.user_id,
        group_id: form.groupId,
        type:     'expense',
        title:    '💰 Nuevo Gasto',
        message:  `${payerName} cargó ${symbol}${amtNum.toLocaleString()} en ${currentGroup?.name}`
      }))
      await supabase.from('notifications').insert(notifs)

      router.push(`/groups/${form.groupId}`)
    }
  }

  return (
    <>
      {/* Mini Stepper Header */}
      <header className="flex items-center justify-between mb-4">
        <button onClick={() => stepIdx > 0 ? setStep(STEPS_LIST[stepIdx - 1]) : router.back()}
          className="p-2 rounded-xl bg-surface-2 border border-subtle text-secondary hover:text-primary transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-tertiary uppercase tracking-widest leading-none mb-1">Nuevo Gasto</span>
          <div className="flex gap-1">
            {STEPS_LIST.map((s, i) => (
              <div key={s} className={`h-1 w-6 rounded-full transition-all duration-300 ${i <= stepIdx ? 'bg-accent' : 'bg-surface-3'}`} />
            ))}
          </div>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex flex-col gap-6 animate-fade-in pb-20">
        
        {/* STEP 1: MONTO Y GRUPO */}
        {step === 'monto' && (
          <div className="flex flex-col gap-8 animate-slide-up">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-tertiary uppercase tracking-wider text-center">Seleccionar Grupo</label>
              <select 
                value={form.groupId} 
                onChange={e => updateForm('groupId', e.target.value)}
                className="w-full bg-surface-2 border border-subtle rounded-2xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent transition-all cursor-pointer shadow-sm"
              >
                <option value="">-- ¿En qué grupo fue? --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col items-center py-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-tertiary">{symbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.amount}
                  onChange={e => updateForm('amount', e.target.value)}
                  autoFocus
                  className="w-48 bg-transparent text-6xl font-black text-primary placeholder:text-surface-3 focus:outline-none text-center tracking-tighter"
                />
              </div>
            </div>

            {form.groupId && (
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-tertiary uppercase tracking-wider text-center">¿Quién pagó?</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {groupMembers.map(m => (
                    <button
                      key={m.user_id}
                      onClick={() => updateForm('paidById', m.user_id)}
                      className={`
                        flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200
                        ${form.paidById === m.user_id ? 'bg-accent/10 border-accent text-accent scale-105' : 'bg-surface border-subtle text-secondary'}
                      `}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${form.paidById === m.user_id ? 'bg-accent text-[#000F0A]' : 'bg-surface-3 text-tertiary'}`}>
                        {m.profiles?.first_name?.charAt(0) || '?'}
                      </div>
                      <span className="text-[10px] font-bold uppercase">{m.user_id === user?.id ? 'Yo' : m.profiles?.first_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CATEGORÍA */}
        {step === 'categoria' && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="text-center">
              <p className="text-4xl font-black text-primary">{symbol}{form.amount}</p>
              <p className="text-[10px] font-bold text-tertiary uppercase mt-1">Total a dividir</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => updateForm('categoryId', cat.id)}
                  className={`
                    flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all
                    ${form.categoryId === cat.id ? 'bg-surface shadow-card-md border-accent' : 'bg-surface-2 border-subtle opacity-60'}
                  `}
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DETALLES */}
        {step === 'detalles' && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="bg-surface-2 p-5 rounded-2xl border border-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{CATEGORIES.find(c => c.id === form.categoryId)?.icon}</span>
                <div>
                  <p className="text-sm font-bold text-primary">{CATEGORIES.find(c => c.id === form.categoryId)?.name}</p>
                  <p className="text-[10px] text-tertiary font-bold uppercase">{form.date}</p>
                </div>
              </div>
              <p className="text-xl font-black text-accent">{symbol}{form.amount}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Supermercado, Cena..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  className="w-full bg-surface border border-subtle rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Notas (opcional)</label>
                <textarea
                  placeholder="Detalles adicionales..."
                  rows={3}
                  value={form.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  className="w-full bg-surface border border-subtle rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SPLIT / RESUMEN */}
        {step === 'split' && (
          <div className="flex flex-col gap-6 animate-slide-up">
            <div className="text-center p-6 rounded-3xl bg-accent text-[#000F0A]">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Resumen del Gasto</p>
              <p className="text-4xl font-black">{symbol}{form.amount}</p>
              <p className="text-xs font-bold mt-1 opacity-80">{form.description || 'Nuevo gasto'}</p>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest text-center mb-1">División Equitativa</h3>
              {groupMembers.map(m => (
                <div key={m.user_id} className="flex items-center justify-between p-4 rounded-xl border border-subtle bg-surface">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-bold text-secondary">
                      {m.profiles?.first_name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-bold text-primary">{m.user_id === user?.id ? 'Yo' : m.profiles?.first_name}</span>
                  </div>
                  <span className="text-sm font-black text-accent">{symbol}{(splits[m.user_id] || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="fixed bottom-6 left-0 right-0 px-6 max-w-lg mx-auto z-10">
          <button
            onClick={handleNext}
            disabled={!canGoNext() || loading}
            className={`
              w-full py-4 rounded-2xl text-sm font-bold text-[#000F0A] shadow-lg transition-all duration-200
              disabled:opacity-50 disabled:scale-95 active:scale-95
              ${step === 'split' ? 'bg-[#00DF81]' : 'bg-surface text-primary border border-subtle'}
            `}
            style={step === 'split' ? { background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)' } : {}}
          >
            {loading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Guardando...</div> :
              step === 'split' ? '✅ Confirmar y Guardar' : 'Siguiente'}
          </button>
        </div>

      </div>
    </>
  )
}
