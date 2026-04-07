// ============================================================
// MOCK DATA — XPENSES GAME (Prototype, no backend)
// ============================================================

export const CURRENCIES = [
  { code: 'UYU', symbol: '$U', name: 'Peso Uruguayo', flag: '🇺🇾' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino', flag: '🇦🇷' },
  { code: 'USD', symbol: 'US$', name: 'Dólar Americano', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', flag: '🇧🇷' },
]

export const CATEGORIES = [
  { id: 'food',       name: 'Comida',      icon: '🍔', color: '#F59E0B' },
  { id: 'market',     name: 'Mercado',     icon: '🛒', color: '#10B981' },
  { id: 'transport',  name: 'Transporte',  icon: '🚗', color: '#06B6D4' },
  { id: 'rent',       name: 'Alquiler',    icon: '🏠', color: '#7C3AED' },
  { id: 'services',   name: 'Servicios',   icon: '💡', color: '#F43F5E' },
  { id: 'health',     name: 'Salud',       icon: '🏥', color: '#EF4444' },
  { id: 'leisure',    name: 'Ocio',        icon: '🎬', color: '#8B5CF6' },
  { id: 'travel',     name: 'Viaje',       icon: '✈️', color: '#3B82F6' },
  { id: 'clothes',    name: 'Ropa',        icon: '👗', color: '#EC4899' },
  { id: 'tech',       name: 'Tecnología',  icon: '💻', color: '#14B8A6' },
  { id: 'fitness',    name: 'Fitness',     icon: '💪', color: '#F97316' },
  { id: 'pets',       name: 'Mascotas',    icon: '🐾', color: '#84CC16' },
  { id: 'education',  name: 'Educación',   icon: '📚', color: '#6366F1' },
  { id: 'gifts',      name: 'Regalos',     icon: '🎁', color: '#D946EF' },
  { id: 'other',      name: 'Otros',       icon: '📦', color: '#94A3B8' },
]

export const COLOR_PALETTES = [
  { id: 'violet',  name: 'Cosmos',   color: '#7C3AED', bg: '#0E0B1A' },
  { id: 'emerald', name: 'Bosque',   color: '#10B981', bg: '#070F0B' },
  { id: 'rose',    name: 'Pasión',   color: '#F43F5E', bg: '#110308' },
  { id: 'amber',   name: 'Dorado',   color: '#F59E0B', bg: '#0F0900' },
  { id: 'cyan',    name: 'Océano',   color: '#06B6D4', bg: '#00080F' },
  { id: 'slate',   name: 'Grafito',  color: '#64748B', bg: '#06090F' },
]

export const GROUP_TYPES = [
  { id: 'monthly', name: 'Hogar',    icon: '🏠', description: 'Gastos mensuales del hogar. El presupuesto se reinicia cada mes.' },
  { id: 'travel',  name: 'Viaje',   icon: '✈️', description: 'Para viajes y aventuras. El presupuesto no se reinicia.' },
  { id: 'event',   name: 'Evento',  icon: '🎉', description: 'Para eventos puntuales. El presupuesto no se reinicia.' },
  { id: 'custom',  name: 'Custom',  icon: '⚡', description: 'Personalizá todas las opciones de presupuesto.' },
]

// ---- USERS ----
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  country: string
  avatarInitials: string
  avatarColor: string
}

export const MOCK_USERS: User[] = []

export const CURRENT_USER: User | null = null

// ---- GROUPS ----
export interface GroupMember {
  userId: string
  role: 'admin' | 'editor' | 'member'
  budget: number
  spent: number
}

export interface Group {
  id: string
  name: string
  type: 'monthly' | 'travel' | 'event' | 'custom'
  currency: string
  palette: string
  members: GroupMember[]
  createdAt: string
  emoji?: string
}

export const MOCK_GROUPS: Group[] = []

// ---- EXPENSES ----
export interface ExpenseSplit {
  userId: string
  amount: number
  percentage: number
  isPaid: boolean
}

export interface Expense {
  id: string
  groupId: string
  paidById: string
  categoryId: string
  amount: number
  description: string
  notes?: string
  date: string
  isFixed: boolean
  splits: ExpenseSplit[]
}

export const MOCK_EXPENSES: Expense[] = []

// ---- NOTIFICATIONS ----
export interface AppNotification {
  id: string
  type: 'debt' | 'budget_warning' | 'fixed_expense' | 'payment_received' | 'group_invite' | 'budget_exceeded'
  title: string
  body: string
  groupId?: string
  read: boolean
  createdAt: string
  fromUserId?: string
  amount?: number
}

export const MOCK_NOTIFICATIONS: AppNotification[] = []

// ---- HELPER FUNCTIONS ----
export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find(u => u.id === id)
}

export function getCategoryById(id: string) {
  return CATEGORIES.find(c => c.id === id)
}

export function getGroupById(id: string): Group | undefined {
  return MOCK_GROUPS.find(g => g.id === id)
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code
}

export function getPaletteById(id: string) {
  return COLOR_PALETTES.find(p => p.id === id) ?? COLOR_PALETTES[0]
}

export function formatAmount(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode)
  const formatted = new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol} ${formatted}`
}

export function getExpensesForGroup(groupId: string): Expense[] {
  return MOCK_EXPENSES.filter(e => e.groupId === groupId)
}

// Calculate balances between users in a group
export interface Balance {
  fromUserId: string
  toUserId: string
  amount: number
  expenses: string[] // expense ids
}

export function calculateGroupBalances(groupId: string): Balance[] {
  const expenses = getExpensesForGroup(groupId)
  const balanceMap: Record<string, number> = {}

  expenses.forEach(expense => {
    expense.splits.forEach(split => {
      if (split.userId !== expense.paidById && !split.isPaid) {
        const key = `${split.userId}→${expense.paidById}`
        balanceMap[key] = (balanceMap[key] ?? 0) + split.amount
      }
    })
  })

  return Object.entries(balanceMap).map(([key, amount]) => {
    const [fromUserId, toUserId] = key.split('→')
    return { fromUserId, toUserId, amount, expenses: [] }
  })
}

export function getCategorySpendingForGroup(groupId: string): { categoryId: string; amount: number; name: string; icon: string; color: string }[] {
  const expenses = getExpensesForGroup(groupId)
  const map: Record<string, number> = {}
  expenses.forEach(e => {
    map[e.categoryId] = (map[e.categoryId] ?? 0) + e.amount
  })
  return Object.entries(map).map(([catId, amount]) => {
    const cat = getCategoryById(catId)!
    return { categoryId: catId, amount, name: cat.name, icon: cat.icon, color: cat.color }
  }).sort((a, b) => b.amount - a.amount)
}

export function getMemberSpent(groupId: string, userId: string): number {
  const expenses = getExpensesForGroup(groupId)
  return expenses
    .flatMap(e => e.splits)
    .filter(s => s.userId === userId)
    .reduce((sum, s) => sum + s.amount, 0)
}
