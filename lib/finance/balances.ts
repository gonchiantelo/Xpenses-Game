import type { Expense, GroupMember, NetBalance, UserGlobalBalance, GroupEnriched } from '@/lib/types/database'

/**
 * Calcula el balance neto de cada miembro dentro de un grupo.
 * 
 * Balance neto = lo que pagó - su parte del gasto total
 * 
 * Positivo → acreedor (le deben dinero)
 * Negativo → deudor (debe dinero)
 * Cero     → al día
 * 
 * @param members - Miembros del grupo (con perfil)
 * @param expenses - Gastos del grupo (ya filtrados por período)
 * @returns Array de balances netos ordenado mayor a menor
 */
export function calculateNetBalances(
  members: (GroupMember & { profiles: any })[],
  expenses: Expense[]
): NetBalance[] {
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const sharePerPerson = members.length > 0 ? totalSpent / members.length : 0

  const balances: NetBalance[] = members.map(member => {
    const paid = expenses
      .filter(e => e.paid_by_id === member.user_id)
      .reduce((sum, e) => sum + Number(e.amount), 0)

    const netBalance = paid - sharePerPerson

    return {
      userId:    member.user_id,
      name:      member.profiles?.first_name || 'Miembro',
      avatarUrl: member.profiles?.avatar_url ?? null,
      netBalance: parseFloat(netBalance.toFixed(2)),
    }
  })

  return balances.sort((a, b) => b.netBalance - a.netBalance)
}

/**
 * Calcula el balance neto GLOBAL del usuario activo
 * sumando sobre todos sus grupos.
 * 
 * Regla 3 del requerimiento:
 *   positivo → "Te deben $X" (Verde)
 *   negativo → "Debés $X" (Rojo)
 *   cero     → "Estás al día" (Gris)
 */
export function getUserGlobalBalance(
  userId: string,
  groups: GroupEnriched[]
): UserGlobalBalance {
  let totalOwed  = 0 // cuánto le deben
  let totalOwing = 0 // cuánto debe

  for (const group of groups) {
    const myBalance = group.netBalances.find(b => b.userId === userId)
    if (!myBalance) continue

    if (myBalance.netBalance > 0.01) {
      totalOwed += myBalance.netBalance
    } else if (myBalance.netBalance < -0.01) {
      totalOwing += Math.abs(myBalance.netBalance)
    }
  }

  return {
    totalOwed:  parseFloat(totalOwed.toFixed(2)),
    totalOwing: parseFloat(totalOwing.toFixed(2)),
    netBalance: parseFloat((totalOwed - totalOwing).toFixed(2)),
  }
}

/**
 * Determina el estado semántico del balance para mostrar en UI
 */
export function getBalanceStatus(netBalance: number): 'positive' | 'negative' | 'zero' {
  if (netBalance > 0.01)  return 'positive'
  if (netBalance < -0.01) return 'negative'
  return 'zero'
}
