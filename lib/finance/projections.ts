import type { Expense, BurnRate } from '@/lib/types/database'

/**
 * BURN RATE (Regla de Velocidad de Gasto)
 * 
 * Compara el ratio de gasto real vs el ratio de tiempo transcurrido en el período.
 * Usado para el semáforo de presupuesto en los grupos mensuales.
 */
export function calculateBurnRate(
  spent: number,
  budget: number,
  dayOfMonth: number,
  totalDaysInMonth: number
): BurnRate {
  if (budget <= 0) {
    return spent > 0 ? 'critical' : 'normal'
  }

  const actualRatio  = spent / budget
  const idealRatio   = dayOfMonth / totalDaysInMonth

  if (actualRatio >= 1)                          return 'critical'
  if (actualRatio > idealRatio + 0.20)           return 'high'
  if (actualRatio < Math.max(idealRatio - 0.20, 0)) return 'low'
  return 'normal'
}

/**
 * PROYECCIÓN DE GASTOS FIJOS (Regla 4)
 * 
 * Los gastos marcados como is_fixed = true se proyectan mensualmente
 * sin que el usuario los vuelva a cargar.
 * 
 * @param expenses    - Todos los gastos del grupo (históricos)
 * @param targetMonth - Mes objetivo para la proyección
 * @returns Monto proyectado de gastos fijos para ese mes
 */
export function projectFixedExpenses(expenses: Expense[], targetMonth: Date): number {
  const fixedExpenses = expenses.filter(e => e.is_fixed)

  // Agrupa por description para evitar duplicados proyectados
  const uniqueFixed = new Map<string, number>()

  fixedExpenses.forEach(expense => {
    const key = `${expense.group_id}-${expense.description.toLowerCase().trim()}`
    // Tomar el más reciente para cada gasto fijo único
    if (!uniqueFixed.has(key) || new Date(expense.date) > new Date(expenses.find(e => e.description.toLowerCase().trim() === expense.description.toLowerCase().trim())?.date || 0)) {
      uniqueFixed.set(key, Number(expense.amount))
    }
  })

  const total = Array.from(uniqueFixed.values()).reduce((sum, amount) => sum + amount, 0)
  return parseFloat(total.toFixed(2))
}

/**
 * Filtra gastos por mes/año para grupos de tipo 'monthly'
 */
export function filterByCurrentMonth(expenses: Expense[]): Expense[] {
  const now = new Date()
  return expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
}

/**
 * Calcula días restantes en el mes actual
 */
export function getDaysRemainingInMonth(): { dayOfMonth: number; totalDays: number; daysRemaining: number } {
  const now = new Date()
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  return {
    dayOfMonth,
    totalDays,
    daysRemaining: Math.max(totalDays - dayOfMonth, 1),
  }
}

/**
 * Label semántico del burn rate para la UI
 */
export function getBurnRateLabel(rate: BurnRate): { emoji: string; label: string; color: string } {
  switch (rate) {
    case 'critical': return { emoji: '🔥', label: 'Crítico',       color: 'text-danger-500' }
    case 'high':     return { emoji: '⚡', label: 'Veloz',          color: 'text-warning-500' }
    case 'low':      return { emoji: '🐢', label: 'Bajo consumo',   color: 'text-accent' }
    default:         return { emoji: '✅', label: 'Proyección estable', color: 'text-[#7AB89A]' }
  }
}
