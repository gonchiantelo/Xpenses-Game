// Dashboard — SERVER COMPONENT (sin 'use client')
// Obtiene datos de Supabase en el servidor via SSR (Vercel Edge)
// Calcula balances netos y settlements ANTES de renderizar

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateNetBalances, getUserGlobalBalance } from '@/lib/finance/balances'
import { calculateSettlements } from '@/lib/finance/settlements'
import { filterByCurrentMonth, calculateBurnRate, getDaysRemainingInMonth } from '@/lib/finance/projections'
import NetBalanceCard from '@/components/dashboard/NetBalanceCard'
import GroupCardList from '@/components/dashboard/GroupCardList'
import FABAddExpense from '@/components/dashboard/FABAddExpense'
import ThemeToggle from '@/components/ui/ThemeToggle'
import type { GroupEnriched, Expense, GroupMember, Profile } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Verificar sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 2. Perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, theme_preference')
    .eq('id', user.id)
    .single()

  // Redirigir a onboarding de tema si nunca eligió preferencia
  if (profile && profile.theme_preference === null) {
    redirect('/onboarding/theme')
  }

  // 3. Grupos del usuario
  const { data: memberEntries, error: memberError } = await supabase
    .from('group_members')
    .select(`
      budget, role,
      groups (
        id, name, emoji, type, currency, palette, owner_id, invite_code, created_at
      )
    `)
    .eq('user_id', user.id)

  if (memberError) console.error('[Dashboard] Error fetching groups:', memberError)

  const enrichedGroups: GroupEnriched[] = []

  if (memberEntries && memberEntries.length > 0) {
    const { dayOfMonth, totalDays } = getDaysRemainingInMonth()

    await Promise.all(
      memberEntries.map(async (entry: any) => {
        const group = entry.groups
        if (!group) return

        const [expRes, memRes] = await Promise.all([
          supabase.from('expenses').select('*').eq('group_id', group.id).order('date', { ascending: false }),
          supabase.from('group_members')
            .select('user_id, budget, role, profiles(first_name, last_name, avatar_url)')
            .eq('group_id', group.id),
        ])

        const allExpenses: Expense[] = expRes.data ?? []
        // Tipado defensivo para Supabase profiles
        const members: any[] = (memRes.data ?? []).map((m: any) => ({
          ...m,
          profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        }))

        // FILTRO DE CIERRE: Solo tomamos los gastos NO liquidados para el balance actual
        const activeExpenses = allExpenses.filter(e => !e.is_settled)

        // Motor financiero — todo en servidor ──────────────
        const groupTotalBudget = members.reduce((s, m) => s + Number(m.budget || 0), 0)
        const groupTotalSpent  = activeExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
        const groupAvailable   = groupTotalBudget - groupTotalSpent
        const isOverBudget     = groupAvailable < 0
        const pct              = groupTotalBudget > 0
          ? Math.round((groupTotalSpent / groupTotalBudget) * 100)
          : groupTotalSpent > 0 ? 100 : 0

        const burnRate    = calculateBurnRate(groupTotalSpent, groupTotalBudget, dayOfMonth, totalDays)
        const netBalances = calculateNetBalances(members, activeExpenses)
        const settlements = calculateSettlements(netBalances)
        const myBalance   = netBalances.find(b => b.userId === user.id)
        const myBudget    = Number(entry.budget) || 0
        const mySpent     = activeExpenses
          .filter(e => e.paid_by_id === user.id)
          .reduce((s, e) => s + Number(e.amount), 0)

        enrichedGroups.push({
          ...group,
          role: entry.role,
          members,
          expenses: allExpenses, // Mantenemos todos para el historial si fuera necesario
          groupTotalBudget,
          groupTotalSpent,
          groupAvailable,
          isOverBudget,
          burnRate,
          daysRemaining: getDaysRemainingInMonth().daysRemaining,
          pct,
          netBalances,
          settlements,
          myBudget,
          mySpent,
          myNetBalance: myBalance?.netBalance ?? 0,
        } as GroupEnriched)
      })
    )
  }

  // 6. Balance neto global
  const globalBalance = getUserGlobalBalance(user.id, enrichedGroups)
  const mainCurrency  = enrichedGroups[0]?.currency ?? 'UYU'
  const firstName     = profile?.first_name ?? user.user_metadata?.first_name ?? 'jugador'

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-primary tracking-tight">Dashboard</h1>
          <p className="text-xs text-tertiary mt-0.5">
            {new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <Link href="/notifications" id="btn-notif-header"
            className="relative p-2 rounded-xl bg-surface-2 text-secondary hover:text-primary transition-colors"
            aria-label="Notificaciones">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {enrichedGroups.length === 0 ? (
        /* ── MODO BIENVENIDA ─────────────────────────── */
        <div className="flex flex-col items-center text-center py-12 animate-fade-in">
          <div className="text-6xl mb-6 animate-float">🎮</div>
          <h2 className="text-xl font-extrabold text-primary mb-3">
            ¡Bienvenido al juego, {firstName}!
          </h2>
          <p className="text-sm text-secondary mb-8 max-w-xs text-balance">
            Aún no sos miembro de ningún grupo. Creá uno nuevo o pedile a un amigo su código de invitación.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Link href="/groups/create"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl text-sm font-bold text-[#000F0A] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)', boxShadow: '0 4px 20px rgba(0,223,129,0.30)' }}>
              ✨ Crear mi primer grupo
            </Link>
            <div className="flex items-center gap-3 text-xs text-tertiary">
              <div className="flex-1 h-px" style={{ background: 'var(--border-2)' }} />
              <span className="uppercase tracking-wider">o</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-2)' }} />
            </div>
            <Link href="/invite"
              className="flex items-center justify-center w-full py-3 px-6 rounded-xl text-sm font-semibold text-secondary border border-subtle bg-surface hover:border-accent/30 hover:text-primary transition-all duration-150">
              Unirme con código de invitación
            </Link>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs mt-10">
            {[
              { icon: '💰', title: 'Dividí gastos', desc: 'Prorrateo automático y equitativo al instante.' },
              { icon: '🤝', title: 'Simplificá deudas', desc: 'Algoritmo Greedy que minimiza transferencias.' },
              { icon: '📊', title: 'Controlá tu presupuesto', desc: 'Proyecciones en tiempo real con alertas.' },
            ].map(card => (
              <div key={card.title} className="flex items-start gap-4 p-4 rounded-xl border border-subtle bg-surface text-left">
                <span className="text-2xl shrink-0">{card.icon}</span>
                <div>
                  <p className="text-sm font-bold text-primary">{card.title}</p>
                  <p className="text-xs text-tertiary mt-0.5">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── DASHBOARD ACTIVO ────────────────────────── */
        <div className="flex flex-col gap-6 animate-fade-in">
          <NetBalanceCard balance={globalBalance} currency={mainCurrency} userName={firstName} />
          <GroupCardList groups={enrichedGroups} />
          <div className="h-4 lg:h-0" />
        </div>
      )}

      <FABAddExpense />
    </>
  )
}
