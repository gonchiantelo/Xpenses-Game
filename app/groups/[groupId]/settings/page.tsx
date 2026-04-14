'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

const PALETTES = [
  { id: 'green',   color: '#00DF81' },
  { id: 'violet',  color: '#8B5CF6' },
  { id: 'cyan',    color: '#06B6D4' },
  { id: 'rose',    color: '#F43F5E' },
  { id: 'amber',   color: '#F59E0B' },
  { id: 'slate',   color: '#64748B' },
]

export default function GroupSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createClient()
  
  const action = searchParams.get('action') 
  const groupId = params.groupId as string
  
  const [group,           setGroup]           = useState<any>(null)
  const [members,         setMembers]         = useState<any[]>([])
  const [budgets,         setBudgets]         = useState<Record<string, number>>({})
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [copied,          setCopied]          = useState(false)
  const [selectedPalette, setSelectedPalette] = useState('green')
  const [formName,        setFormName]        = useState('')

  useEffect(() => {
    async function fetchGroupData() {
      if (!groupId) return
      
      const { data: gData } = await supabase.from('groups').select('*').eq('id', groupId).single()
      if (gData) {
        setGroup(gData)
        setFormName(gData.name)
        setSelectedPalette(gData.palette || 'green')
      }

      const { data: mData } = await supabase
        .from('group_members')
        .select(`user_id, role, budget, profiles (first_name, last_name, email)`)
        .eq('group_id', groupId)

      if (mData) {
        setMembers(mData)
        const initialBudgets: Record<string, number> = {}
        mData.forEach(m => initialBudgets[m.user_id] = Number(m.budget) || 0)
        setBudgets(initialBudgets)
      }
      setLoading(false)
    }
    fetchGroupData()
  }, [groupId, supabase])

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?invite=${groupId}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!group || !user) return
    setSaving(true)
    
    try {
      // 1. Update Group Info
      await supabase.from('groups').update({
        name:    formName,
        palette: selectedPalette
      }).eq('id', groupId)

      // 2. Update Budgets
      const myRole = members.find(m => m.user_id === user.id)?.role
      const isAdmin = myRole === 'admin'

      for (const m of members) {
        const hasPermission = isAdmin || m.user_id === user.id
        if (hasPermission && budgets[m.user_id] !== m.budget) {
          await supabase
            .from('group_members')
            .update({ budget: budgets[m.user_id] })
            .eq('group_id', groupId)
            .eq('user_id', m.user_id)
        }
      }
      router.refresh()
      router.back()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSettleMonth = async () => {
    if (!confirm('¿Estás seguro de cerrar el periodo? Se saldarán todas las deudas actuales y el contador volverá a cero.')) return
    setSaving(true)
    try {
      // 1. Mark all expenses as settled
      await supabase
        .from('expenses')
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('is_settled', false)

      // 2. Create historical settlement record
      // (En una versión avanzada aquí guardaríamos el JSON de settlements)
      await supabase.from('monthly_settlements').insert({
        group_id: groupId,
        settled_by: user?.id,
        total_amount: members.reduce((sum, m) => sum + (budgets[m.user_id] || 0), 0)
      })

      alert('¡Periodo cerrado con éxito! Las deudas actuales han sido archivadas.')
      router.push('/dashboard')
    } catch (err) {
      alert('Error al cerrar periodo')
    } finally {
      setSaving(false)
    }
  }

  const handleManualInvite = async () => {
    setSaving(true)
    const email = prompt('Introduce el email de tu amigo:')
    if (!email) { setSaving(false); return }

    const res = await fetch('/api/invite', {
      method: 'POST',
      body: JSON.stringify({
        email,
        groupName: group.name,
        inviteCode: groupId, // Usamos el ID como código de invitación simplificado
        inviterName: user?.user_metadata?.first_name || 'Un amigo',
        groupColor: PALETTES.find(p => p.id === selectedPalette)?.color
      })
    })

    if (res.ok) alert('Invitación enviada!')
    else alert('Error al enviar invitación')
    setSaving(false)
  }

  if (loading) return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="h-40 bg-surface-2 rounded-2xl" />
      <div className="h-60 bg-surface-2 rounded-2xl" />
    </div>
  )

  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin'
  const groupColor = PALETTES.find(p => p.id === selectedPalette)?.color || '#00DF81'

  return (
    <>
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl bg-surface-2 border border-subtle text-secondary hover:text-primary transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-lg font-black text-primary tracking-tight">Configuración</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="text-xs font-black px-4 py-2 rounded-xl bg-accent text-[#000F0A] shadow-lg disabled:opacity-50"
          style={{ background: groupColor }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </header>

      <div className="flex flex-col gap-5 animate-fade-in pb-20">
        
        {/* Group Info */}
        <section className="p-6 rounded-2xl border border-subtle bg-surface flex flex-col gap-4">
          <h3 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-1">Info del grupo</h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Nombre</label>
            <input 
              type="text" 
              value={formName} 
              onChange={e => setFormName(e.target.value)} 
              disabled={!isAdmin}
              className="w-full bg-surface-2 border border-subtle rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:border-accent disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5 opacity-60">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-widest pl-1">Moneda (No editable)</label>
            <div className="w-full bg-surface-3 border border-subtle rounded-xl px-4 py-3 text-sm font-bold text-tertiary uppercase">
              {group?.currency}
            </div>
          </div>
        </section>

        {/* Palette Selection */}
        <section className="p-6 rounded-2xl border border-subtle bg-surface">
          <h3 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-4 text-center">Color del grupo</h3>
          <div className="flex justify-around items-center">
            {PALETTES.map(p => (
              <button 
                key={p.id}
                onClick={() => isAdmin && setSelectedPalette(p.id)}
                className={`
                  w-8 h-8 rounded-full border-4 transition-all
                  ${selectedPalette === p.id ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-40'}
                `}
                style={{ background: p.color }}
              />
            ))}
          </div>
        </section>

        {/* Invite Friends */}
        <section className={`p-6 rounded-2xl border bg-surface flex flex-col gap-4 transition-all ${action === 'invite' ? 'border-accent shadow-lg shadow-accent/10 scale-[1.02]' : 'border-subtle'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">🔗 Invitar amigos</h3>
            <button onClick={handleManualInvite} className="text-[10px] font-black text-accent uppercase tracking-widest border border-accent/20 px-3 py-1 rounded-lg hover:bg-accent/5">
              Enviar Email
            </button>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-surface-2 rounded-xl border border-subtle">
            <code className="flex-1 text-[10px] font-mono font-bold text-tertiary overflow-hidden truncate px-2">
              {inviteLink}
            </code>
            <button 
              onClick={handleCopy}
              className={`text-[10px] font-black px-4 py-2 rounded-lg transition-all ${copied ? 'bg-accent text-[#000F0A]' : 'bg-surface-3 text-secondary'}`}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </section>

        {/* Members Management */}
        <section className="p-6 rounded-2xl border border-subtle bg-surface flex flex-col gap-4">
          <h3 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-2 px-1">Integrantes ({members.length})</h3>
          <div className="flex flex-col gap-4">
            {members.map(m => (
              <div key={m.user_id} className="flex flex-col gap-2 p-4 rounded-xl bg-surface-2 border border-subtle">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center text-[10px] font-black text-secondary border border-subtle">
                      {m.profiles?.first_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">
                        {m.profiles?.first_name} {m.profiles?.last_name}
                        {m.user_id === user?.id && <span className="ml-2 text-[8px] font-black bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase">Vos</span>}
                      </p>
                      <p className="text-[9px] text-tertiary truncate max-w-[140px]">{m.profiles?.email}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-tertiary border border-subtle px-2 py-1 rounded-md uppercase tracking-widest">{m.role}</span>
                </div>
                
                <div className="flex items-center justify-between pt-1 border-t border-subtle/50 mt-1">
                  <span className="text-[9px] font-bold text-tertiary uppercase tracking-tight">Presupuesto Sugerido:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-tertiary">{group?.currency}</span>
                    <input 
                      type="number"
                      disabled={!isAdmin && m.user_id !== user?.id}
                      value={budgets[m.user_id] || ''} 
                      onChange={e => setBudgets(b => ({ ...b, [m.user_id]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 bg-surface border border-subtle rounded-lg px-2 py-1.5 text-xs font-black text-primary text-right focus:outline-none focus:border-accent disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        {isAdmin && (
          <section className="p-6 rounded-2xl border border-danger-500/20 bg-danger-500/5 flex flex-col gap-4 mt-4">
            <h3 className="text-[10px] font-black text-danger-500 uppercase tracking-[0.2em]">Zona de Peligro</h3>
            <p className="text-[10px] text-secondary">Estas acciones afectan a todos los integrantes del grupo.</p>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleSettleMonth}
                className="w-full py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-black hover:bg-accent/20 transition-all uppercase tracking-widest"
              >
                Cerrar Periodo Actual 🏦
              </button>
              
              <button 
                onClick={() => confirm('¿Seguro que querés eliminar el grupo?') && alert('Función de borrado en desarrollo')}
                className="w-full py-3 rounded-xl border border-danger-500/20 text-danger-500 text-xs font-black hover:bg-danger-500 hover:text-white transition-all uppercase tracking-widest"
              >
                Eliminar Grupo Forever 🗑️
              </button>
            </div>
          </section>
        )}

      </div>
    </>
  )
}
