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
  // MOF: Caja Única (Solo gastos NO liquidados)
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
  activeExpenses: any[]
  settledExpenses: any[]
  memberContributions: MemberContribution[]
  settlements: Settlement[]
  // Retrocompatibilidad
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
        memberEntries.filter((e: any) => e.groups).map(async (entry: any) => {
          const group = entry.groups
          
          // 1. Datos crudos: Traemos todos los gastos e integrantes
          const [expRes, memRes] = await Promise.all([
            supabase.from('expenses').select('*').eq('group_id', group.id).order('date', { ascending: false }),
            supabase.from('group_members').select('user_id, budget, profiles(first_name, last_name, avatar_url)').eq('group_id', group.id)
          ])

          const allExpenses = expRes.data || []
          const safeMembers = memRes.data || []
          
          // FILTRO CLAVE: Solo tomamos los gastos NO liquidados para el balance actual
          const activeExpenses = allExpenses.filter(e => !e.is_settled)
          const settledExpenses = allExpenses.filter(e => e.is_settled)

          // 2. Lógica de Caja Única (Sobre gastos activos)
          const groupTotalBudget = safeMembers.reduce((sum, m) => sum + Number(m.budget || 0), 0)
          const groupTotalSpent = activeExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
          const groupAvailable = groupTotalBudget - groupTotalSpent
          const isOverBudget = groupAvailable < 0

          // 3. Burn Rate & Proyecciones
          const now = new Date()
          const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
          const dayOfMonth = now.getDate()
          const daysRemaining = Math.max(totalDaysInMonth - dayOfMonth, 1)
          
          const idealSpendRatio = dayOfMonth / totalDaysInMonth
          const actualSpendRatio = groupTotalBudget > 0 ? groupTotalSpent / groupTotalBudget : (groupTotalSpent > 0 ? 1.5 : 0)
          
          let burnRate: 'low' | 'normal' | 'high' | 'critical' = 'normal'
          if (actualSpendRatio > 1) burnRate = 'critical'
          else if (actualSpendRatio > idealSpendRatio + 0.15) burnRate = 'high'
          else if (actualSpendRatio < idealSpendRatio - 0.15) burnRate = 'low'

          // 4. Desglose por Categorías
          const catMap: Record<string, number> = {}
          activeExpenses.forEach((e: any) => {
            catMap[e.category_id] = (catMap[e.category_id] || 0) + Number(e.amount)
          })
          const categoryBreakdown: CategoryTotal[] = Object.entries(catMap).map(([id, amount]) => ({
            id,
            amount,
            pct: groupTotalSpent > 0 ? Math.round((amount / groupTotalSpent) * 100) : 0
          }))

          // 5. Liquidaciones (Sobre gastos activos)
          const sharePerPerson = safeMembers.length > 0 ? groupTotalSpent / safeMembers.length : 0
          const netBalances: MemberContribution[] = safeMembers.map((m: any) => {
            const paid = activeExpenses.filter(e => e.paid_by_id === m.user_id).reduce((s, e) => s + Number(e.amount), 0)
            return { userId: m.user_id, name: m.profiles?.first_name || 'Amigo', paid, balance: paid - sharePerPerson }
          })

          const settlements: Settlement[] = []
          const debtors = netBalances.filter(m => m.balance < -0.01).sort((a, b) => a.balance - b.balance)
          const creditors = netBalances.filter(m => m.balance > 0.01).sort((a, b) => b.balance - a.balance)
          const tDebtors = JSON.parse(JSON.stringify(debtors)), tCreditors = JSON.parse(JSON.stringify(creditors))
          let dIdx = 0, cIdx = 0
          while (dIdx < tDebtors.length && cIdx < tCreditors.length) {
            const amount = Math.min(Math.abs(tDebtors[dIdx].balance), tCreditors[cIdx].balance)
            settlements.push({ from: tDebtors[dIdx].name, to: tCreditors[cIdx].name, amount })
            tDebtors[dIdx].balance += amount; tCreditors[cIdx].balance -= amount
            if (Math.abs(tDebtors[dIdx].balance) < 0.01) dIdx++
            if (Math.abs(tCreditors[cIdx].balance) < 0.01) cIdx++
          }

          const myContribution = netBalances.find(c => c.userId === user.id)

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
            expenses: allExpenses, // Mantenemos todos para el historial
            activeExpenses,
            settledExpenses,
            memberContributions: netBalances,
            settlements,
            myBudget: Number(entry.budget) || 0,
            mySpent: myContribution?.paid || 0,
            pct: groupTotalBudget > 0 ? Math.min(100, Math.round((groupTotalSpent / groupTotalBudget) * 100)) : (groupTotalSpent > 0 ? 100 : 0)
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
