'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import ThemeToggle from '@/components/ui/ThemeToggle'

function formatCurrency(amount: number, currency = 'UYU'): string {
  const symbols: Record<string, string> = { UYU: '$U', USD: 'US$', EUR: '€', ARS: '$' }
  const sym = symbols[currency] ?? '$'
  return `${sym}${Math.round(amount).toLocaleString('es-UY')}`
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const supabase = createClient()

  const [activeSection, setActiveSection] = useState<'profile' | 'subscription' | 'settings'>('profile')
  const [editMode,      setEditMode]      = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [groupsCount,   setGroupsCount]   = useState(0)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: '', birthdate: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.user_metadata?.first_name || '',
        lastName:  user.user_metadata?.last_name || '',
        email:     user.email || '',
        phone:     user.user_metadata?.phone || '',
        country:   user.user_metadata?.country || 'Uruguay 🇺🇾',
        birthdate: user.user_metadata?.birthdate || '',
      })

      supabase.from('group_members').select('id', { count: 'exact' }).eq('user_id', user.id)
        .then(({ count }) => setGroupsCount(count || 0))
    }
  }, [user, supabase])

  async function handleSave() {
    if (!user) return
    setLoading(true)

    // 1. Update Auth Metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: { 
        first_name: form.firstName, 
        last_name:  form.lastName,
        country:    form.country,
        phone:      form.phone,
        birthdate:  form.birthdate
      }
    })

    // 2. Update Profiles table
    const { error: profErr } = await supabase
      .from('profiles')
      .upsert({
        id:         user.id,
        first_name: form.firstName,
        last_name:  form.lastName,
        country:    form.country,
        phone:      form.phone,
        updated_at: new Date().toISOString()
      })

    if (authErr || profErr) {
      console.error('Error al guardar:', authErr || profErr)
    } else {
      setEditMode(false)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await signOut()
    router.push('/login')
  }

  const initial = form.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-primary tracking-tight">Mi Perfil</h1>
        <button
          onClick={handleLogout}
          className="text-xs font-bold px-3 py-1.5 rounded-lg text-danger-500 border border-danger-500/10 hover:bg-danger-500/5 transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="flex flex-col gap-5 animate-fade-in">
        
        {/* Profile Hero */}
        <section className="flex items-center gap-4 p-5 rounded-2xl border border-subtle bg-surface">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-[#000F0A] shrink-0"
            style={{ background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)' }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-primary truncate">
              {form.firstName} {form.lastName}
            </h2>
            <p className="text-xs text-secondary truncate">{form.email}</p>
            <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
              ✨ PLAN GRATUITO
            </span>
          </div>
        </section>

        {/* Stats */}
        <div className="flex items-center justify-around p-4 rounded-xl border border-subtle bg-surface-2">
          <div className="text-center flex-1">
            <span className="block text-xl font-black text-primary">{groupsCount}</span>
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Grupos</span>
          </div>
          <div className="w-px h-8 bg-subtle" />
          <div className="text-center flex-1">
            <span className="block text-xl font-black text-primary">{formatCurrency(0)}</span>
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">Invertido</span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex p-1 bg-surface-2 rounded-xl gap-1">
          {(['profile', 'subscription', 'settings'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`
                flex-1 py-2 rounded-lg text-xs font-bold transition-all
                ${activeSection === s ? 'bg-surface text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}
              `}
            >
              {s === 'profile' ? 'Datos' : s === 'subscription' ? 'Plan' : 'Config'}
            </button>
          ))}
        </div>

        {/* Section Content */}
        {activeSection === 'profile' && (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-primary">Información personal</h3>
              <button
                onClick={editMode ? handleSave : () => setEditMode(true)}
                disabled={loading}
                className={`
                  text-xs font-bold px-3 py-1.5 rounded-lg transition-all
                  ${editMode ? 'bg-accent text-[#000F0A]' : 'text-accent border border-accent/20 hover:bg-accent/5'}
                `}
              >
                {loading ? '...' : editMode ? '✓ Guardar' : '✏️ Editar'}
              </button>
            </div>

            {[
              { label: 'Nombre', field: 'firstName', icon: '👤' },
              { label: 'Apellido', field: 'lastName', icon: '👤' },
              { label: 'País', field: 'country', icon: '🌍' },
              { label: 'Teléfono', field: 'phone', icon: '📱' },
            ].map(({ label, field, icon }) => (
              <div key={field} className="flex flex-col gap-1.5 p-4 rounded-xl border border-subtle bg-surface">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs">{icon}</span>
                  <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{label}</span>
                </div>
                {editMode ? (
                  <input
                    className="w-full bg-surface-2 border border-subtle rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  />
                ) : (
                  <span className="text-sm font-medium text-secondary">{form[field as keyof typeof form] || '—'}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="flex flex-col gap-3 animate-slide-up">
            <h3 className="text-sm font-bold text-primary mb-1">Preferencia de tema</h3>
            <div className="flex items-center justify-between p-4 rounded-xl border border-subtle bg-surface">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary">Modo Oscuro / Claro</span>
                <p className="text-[10px] text-tertiary font-medium">Cambia la estética visual de la app</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        )}

        {activeSection === 'subscription' && (
          <div className="flex flex-col gap-4 p-8 items-center text-center rounded-2xl border border-dashed border-accent/30 bg-accent/5">
            <span className="text-4xl">💎</span>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-primary">Xpenses Premium</h3>
              <p className="text-xs text-secondary max-w-[200px]">Estadísticas avanzadas, exportación a Excel y grupos ilimitados.</p>
            </div>
            <button className="text-xs font-bold py-2.5 px-6 rounded-xl bg-accent text-[#000F0A] hover:scale-105 transition-transform">
              Próximamente
            </button>
          </div>
        )}

      </div>
    </>
  )
}
