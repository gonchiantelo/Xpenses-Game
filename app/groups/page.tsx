'use client'

import Link from 'next/link'
import { useXpenses } from '@/hooks/useXpenses'
import { useAuth } from '@/hooks/useAuth'
import FABAddExpense from '@/components/dashboard/FABAddExpense'

const PALETTE_COLORS: Record<string, string> = {
  green: '#00DF81', emerald: '#10B981', cyan: '#06B6D4',
  violet: '#8B5CF6', rose: '#F43F5E', amber: '#F59E0B', slate: '#64748B',
}

const TYPE_LABELS: Record<string, string> = {
  monthly: '📅 Hogar', travel: '✈️ Viaje', event: '🎉 Evento',
}

export default function GroupsPage() {
  const { user }              = useAuth()
  const { groups, loading }   = useXpenses()

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="skeleton h-7 w-32 rounded-lg" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-28 w-full rounded-2xl" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-primary tracking-tight">Mis Grupos</h1>
          <p className="text-xs text-tertiary mt-0.5">
            {groups.length} grupo{groups.length !== 1 ? 's' : ''} activo{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/groups/create" id="btn-create-group"
          className="text-xs font-bold px-3 py-2 rounded-xl text-[#000F0A] transition-all duration-200 hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)' }}>
          + Nuevo
        </Link>
      </header>

      {/* Group Cards */}
      {groups.length > 0 ? (
        <div className="flex flex-col gap-3">
          {groups.map(group => {
            const color = PALETTE_COLORS[group.palette] ?? '#00DF81'
            return (
              <Link key={group.id} href={`/groups/${group.id}`}
                id={`group-card-${group.id}`}
                className="block rounded-2xl border border-subtle bg-surface overflow-hidden hover:border-accent/20 hover:-translate-y-0.5 hover:shadow-card-md active:scale-[0.99] transition-all duration-150">
                {/* Color stripe */}
                <div className="h-0.5 w-full" style={{ background: color }} />

                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `${color}15` }}>
                      {group.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-primary truncate">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-2 border border-subtle text-secondary">
                          {TYPE_LABELS[group.type] ?? '📦 Grupo'}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-2 border border-subtle text-secondary">
                          {group.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Members */}
                  {group.members && group.members.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {group.members.map((m: any) => (
                        <div key={m.user_id}
                          className="flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border border-subtle bg-surface-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ background: color }}>
                            {m.profiles?.first_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-xs font-medium text-secondary">
                            {m.user_id === user?.id ? 'Yo' : m.profiles?.first_name || 'Invitado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center text-center py-16 animate-fade-in">
          <div className="text-5xl mb-5">👥</div>
          <h3 className="text-lg font-bold text-primary mb-2">No tenés grupos aún</h3>
          <p className="text-sm text-secondary mb-8 max-w-xs">
            Creá tu primer grupo para empezar a dividir gastos con amigos o familia.
          </p>
          <Link href="/groups/create" id="btn-create-first-group"
            className="flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-[#000F0A] transition-all duration-200 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)', boxShadow: '0 4px 20px rgba(0,223,129,0.25)' }}>
            ✨ Crear grupo
          </Link>
        </div>
      )}

      <FABAddExpense />
    </>
  )
}
