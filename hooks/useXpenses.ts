import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface Settlement {
  from: string
  to: string
  amount: number
}

export interface MemberContribution {
  userId: string
  name: string
  paid: number
  balance: number
}

export interface CategoryTotal {
  id: string
  amount: number
  pct: number
}

export interface EnrichedGroup {
  id: string
  name: string
  emoji: string
  type: 'monthly' | 'travel' | 'event'
  currency: string
  palette: string
  role: string
  // MOF: Caja Única
  groupTotalBudget: number
  groupTotalSpent: number
  groupAvailable: number
  isOverBudget: boolean
  // Proyecciones
  burnRate: 'low' | 'normal' | 'high' | 'critical'
  daysRemaining: number
  // Desglose
  categoryBreakdown: CategoryTotal[]
  // Datos crudos
  members: any[]
  expenses: any[]
  memberContributions: MemberContribution[]
  settlements: Settlement[]
  // Retrocompatibilidad per-user
  myBudget: number
  mySpent: number
  pct: number
}

export function useXpenses() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<EnrichedGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: memberEntries, error: memberError } = await supabase
        .from('group_members')
        .select(`
          budget,
          role,
          groups (
            id, name, emoji, type, currency, palette, owner_id, created_at
          )
        `)
        .eq('user_id', user.id)

      if (memberError) throw memberError

      if (!memberEntries || memberEntries.length === 0) {
        setGroups([])
        return
      }

      const enriched: EnrichedGroup[] = await Promise.all(
        memberEntries.map(async (entry: any) => {
          const group = entry.groups
          if (!group) return null

          // 1. Datos crudos
          const [expRes, memRes] = await Promise.all([
            supabase.from('expenses').select('*').eq('group_id', group.id).order('date', { ascending: false }),
            supabase.from('group_members').select('user_id, budget, profiles(first_name, last_name, avatar_url)').eq('group_id', group.id)
          ])

          const safeExpenses = expRes.data || []
          const safeMembers = memRes.data || []
          
          // LÓGICA DE CICLO (Punto 5 del plan): Filtrar por mes actual si es 'monthly'
          const now = new Date()
          const currentMonthExpenses = group.type === 'monthly' 
            ? safeExpenses.filter(e => {
                const d = new Date(e.date)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              })
            : safeExpenses

          // 2. Lógica MOF: Caja Única
          const groupTotalBudget = safeMembers.reduce((sum, m) => sum + Number(m.budget || 0), 0)
          const groupTotalSpent = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
          const groupAvailable = groupTotalBudget - groupTotalSpent
          const isOverBudget = groupAvailable < 0

          // 3. Burn Rate & Proyecciones (Asumiendo ciclo mensual por ahora)
          const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
          const dayOfMonth = now.getDate()
          const daysRemaining = Math.max(totalDaysInMonth - dayOfMonth, 1)
          
          const idealSpendRatio = dayOfMonth / totalDaysInMonth
          const actualSpendRatio = groupTotalBudget > 0 ? groupTotalSpent / groupTotalBudget : 0
          
          let burnRate: 'low' | 'normal' | 'high' | 'critical' = 'normal'
          if (actualSpendRatio > 1) burnRate = 'critical'
          else if (actualSpendRatio > idealSpendRatio + 0.2) burnRate = 'high'
          else if (actualSpendRatio < idealSpendRatio - 0.2) burnRate = 'low'

          // 4. Desglose por Categorías
          const catMap: Record<string, number> = {}
          currentMonthExpenses.forEach((e: any) => {
            catMap[e.category_id] = (catMap[e.category_id] || 0) + Number(e.amount)
          })
          const categoryBreakdown: CategoryTotal[] = Object.entries(catMap).map(([id, amount]) => ({
            id,
            amount,
            pct: groupTotalSpent > 0 ? Math.round((amount / groupTotalSpent) * 100) : 0
          }))

          // 5. Liquidaciones (Deuda Técnica)
          const sharePerPerson = safeMembers.length > 0 ? groupTotalSpent / safeMembers.length : 0
          const contributions: MemberContribution[] = safeMembers.map((m: any) => {
            const paid = currentMonthExpenses.filter(e => e.paid_by_id === m.user_id).reduce((s, e) => s + Number(e.amount), 0)
            return { userId: m.user_id, name: m.profiles?.first_name || 'Amigo', paid, balance: paid - sharePerPerson }
          })

          const settlements: Settlement[] = []
          const debtors = contributions.filter(m => m.balance < -0.01).sort((a, b) => a.balance - b.balance)
          const creditors = contributions.filter(m => m.balance > 0.01).sort((a, b) => b.balance - a.balance)
          const tDebtors = JSON.parse(JSON.stringify(debtors)), tCreditors = JSON.parse(JSON.stringify(creditors))
          let dIdx = 0, cIdx = 0
          while (dIdx < tDebtors.length && cIdx < tCreditors.length) {
            const amount = Math.min(Math.abs(tDebtors[dIdx].balance), tCreditors[cIdx].balance)
            settlements.push({ from: tDebtors[dIdx].name, to: tCreditors[cIdx].name, amount })
            tDebtors[dIdx].balance += amount; tCreditors[cIdx].balance -= amount
            if (Math.abs(tDebtors[dIdx].balance) < 0.01) dIdx++
            if (Math.abs(tCreditors[cIdx].balance) < 0.01) cIdx++
          }

          const myContribution = contributions.find(c => c.userId === user.id)

          return {
            ...group,
            role: entry.role,
            groupTotalBudget,
            groupTotalSpent,
            groupAvailable,
            isOverBudget,
            burnRate,
            daysRemaining,
            categoryBreakdown,
            members: safeMembers,
            expenses: safeExpenses,
            memberContributions: contributions,
            settlements,
            myBudget: Number(entry.budget) || 0,
            mySpent: myContribution?.paid || 0,
            pct: groupTotalBudget > 0 ? Math.round((groupTotalSpent / groupTotalBudget) * 100) : 0
          }
        })
      )

      setGroups(enriched.filter(g => g !== null) as EnrichedGroup[])
    } catch (err: any) {
      console.error('Error in useXpenses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { groups, loading, error, refresh: fetchData }
}

