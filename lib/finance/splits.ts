import type { Split } from '@/lib/types/database'

/**
 * PRORRATEO AUTOMÁTICO EQUITATIVO (Regla 1)
 * 
 * Divide un gasto equitativamente entre todos los miembros.
 * El pagador (payerId) también recibe su split (su parte del gasto),
 * pero no aparece como deudor hacia sí mismo en los settlements.
 * 
 * @param amount    - Monto total del gasto
 * @param memberIds - IDs de todos los miembros activos del grupo
 * @param payerId   - ID del miembro que pagó
 * @returns Array de splits para registrar en expense_splits
 *          (solo los que NO son el pagador — los deudores)
 */
export function calculateEqualSplit(
  amount: number,
  memberIds: string[],
  payerId: string
): Split[] {
  if (memberIds.length === 0) return []

  const sharePerPerson = amount / memberIds.length

  return memberIds
    .filter(id => id !== payerId)   // El pagador no se debe a sí mismo
    .map(memberId => ({
      memberId,
      amount: parseFloat(sharePerPerson.toFixed(2)),
    }))
}

/**
 * Prorrateo personalizado (porcentajes manuales)
 * Para splits no equitativos definidos por el usuario
 * 
 * @param amount      - Monto total
 * @param assignments - Map de userId → porcentaje (0 a 100, debe sumar 100)
 * @param payerId     - ID del pagador
 */
export function calculateCustomSplit(
  amount: number,
  assignments: Record<string, number>,
  payerId: string
): Split[] {
  return Object.entries(assignments)
    .filter(([memberId]) => memberId !== payerId)
    .map(([memberId, pct]) => ({
      memberId,
      amount: parseFloat(((amount * pct) / 100).toFixed(2)),
    }))
}

/**
 * Construye el payload para insertar en expense_splits
 */
export function buildSplitInserts(
  expenseId: string,
  splits: Split[]
): { expense_id: string; debtor_id: string; amount: number }[] {
  return splits.map(split => ({
    expense_id: expenseId,
    debtor_id:  split.memberId,
    amount:     split.amount,
  }))
}
