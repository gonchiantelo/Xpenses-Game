import type { NetBalance, Settlement } from '@/lib/types/database'

/**
 * ALGORITMO GREEDY DE SIMPLIFICACIÓN DE DEUDAS
 * 
 * Minimiza el número de transacciones para saldar cuentas entre N personas.
 * 
 * Ejemplo:
 *   A le debe $100 a B, B le debe $100 a C
 *   → Resultado: A le debe $100 a C (1 transacción en vez de 2)
 * 
 * Complejidad: O(n log n) — ordenamiento + dos punteros
 * 
 * @param balances - Array de balances netos por usuario
 *   balance > 0 → acreedor (le deben)
 *   balance < 0 → deudor (debe)
 *   balance = 0 → al día
 * @returns Array mínimo de transacciones para saldar todas las deudas
 */
export function calculateSettlements(balances: NetBalance[]): Settlement[] {
  const settlements: Settlement[] = []

  // Separar y ordenar: deudores (balance negativo) y acreedores (balance positivo)
  const debtors = balances
    .filter(b => b.netBalance < -0.01)
    .map(b => ({ ...b, remaining: Math.abs(b.netBalance) }))
    .sort((a, b) => b.remaining - a.remaining) // mayor deuda primero

  const creditors = balances
    .filter(b => b.netBalance > 0.01)
    .map(b => ({ ...b, remaining: b.netBalance }))
    .sort((a, b) => b.remaining - a.remaining) // mayor crédito primero

  let dIdx = 0
  let cIdx = 0

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor   = debtors[dIdx]
    const creditor = creditors[cIdx]

    // La transacción es el mínimo entre lo que debe el deudor y lo que le deben al acreedor
    const amount = Math.min(debtor.remaining, creditor.remaining)

    if (amount > 0.01) {
      settlements.push({
        from:     debtor.userId,
        fromName: debtor.name,
        to:       creditor.userId,
        toName:   creditor.name,
        amount:   parseFloat(amount.toFixed(2)),
      })
    }

    debtor.remaining   -= amount
    creditor.remaining -= amount

    // Mover puntero si el balance quedó saldado
    if (debtor.remaining < 0.01)   dIdx++
    if (creditor.remaining < 0.01) cIdx++
  }

  return settlements
}

/**
 * Filtra los settlements relevantes para un usuario específico
 * (como pagador o receptor)
 */
export function getUserSettlements(settlements: Settlement[], userId: string) {
  return {
    toPay:    settlements.filter(s => s.from === userId),
    toReceive: settlements.filter(s => s.to   === userId),
  }
}
