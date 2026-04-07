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

export const MOCK_USERS: User[] = [
  { id: 'u1', firstName: 'Valentina', lastName: 'Gómez',   email: 'vale@gmail.com',  country: 'UY', avatarInitials: 'VG', avatarColor: '#7C3AED' },
  { id: 'u2', firstName: 'Matías',    lastName: 'López',   email: 'mati@gmail.com',  country: 'UY', avatarInitials: 'ML', avatarColor: '#10B981' },
  { id: 'u3', firstName: 'Sofía',     lastName: 'Martínez',email: 'sofi@gmail.com',  country: 'AR', avatarInitials: 'SM', avatarColor: '#F43F5E' },
  { id: 'u4', firstName: 'Diego',     lastName: 'Pérez',   email: 'diego@gmail.com', country: 'AR', avatarInitials: 'DP', avatarColor: '#F59E0B' },
]

export const CURRENT_USER = MOCK_USERS[0]

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

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Casa',
    type: 'monthly',
    currency: 'UYU',
    palette: 'violet',
    emoji: '🏠',
    createdAt: '2024-01-01',
    members: [
      { userId: 'u1', role: 'admin',  budget: 25000, spent: 18500 },
      { userId: 'u2', role: 'editor', budget: 25000, spent: 12300 },
    ]
  },
  {
    id: 'g2',
    name: 'Viaje Punta del Este',
    type: 'travel',
    currency: 'USD',
    palette: 'cyan',
    emoji: '🏖️',
    createdAt: '2024-03-01',
    members: [
      { userId: 'u1', role: 'admin',  budget: 800, spent: 420 },
      { userId: 'u2', role: 'member', budget: 800, spent: 380 },
      { userId: 'u3', role: 'member', budget: 800, spent: 290 },
    ]
  },
  {
    id: 'g3',
    name: 'Asado del Sábado',
    type: 'event',
    currency: 'ARS',
    palette: 'amber',
    emoji: '🔥',
    createdAt: '2024-04-01',
    members: [
      { userId: 'u1', role: 'admin',  budget: 50000, spent: 32000 },
      { userId: 'u3', role: 'member', budget: 50000, spent: 18000 },
      { userId: 'u4', role: 'member', budget: 50000, spent: 0 },
    ]
  },
]

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

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1', groupId: 'g1', paidById: 'u1',
    categoryId: 'rent', amount: 28000,
    description: 'Alquiler Abril', date: '2024-04-01', isFixed: true,
    notes: 'Transferido el 1ro',
    splits: [
      { userId: 'u1', amount: 14000, percentage: 50, isPaid: true },
      { userId: 'u2', amount: 14000, percentage: 50, isPaid: false },
    ]
  },
  {
    id: 'e2', groupId: 'g1', paidById: 'u2',
    categoryId: 'market', amount: 4800,
    description: 'Supermercado', date: '2024-04-03', isFixed: false,
    splits: [
      { userId: 'u1', amount: 2400, percentage: 50, isPaid: false },
      { userId: 'u2', amount: 2400, percentage: 50, isPaid: true },
    ]
  },
  {
    id: 'e3', groupId: 'g1', paidById: 'u1',
    categoryId: 'services', amount: 1200,
    description: 'Internet', date: '2024-04-05', isFixed: true,
    splits: [
      { userId: 'u1', amount: 600, percentage: 50, isPaid: true },
      { userId: 'u2', amount: 600, percentage: 50, isPaid: false },
    ]
  },
  {
    id: 'e4', groupId: 'g1', paidById: 'u1',
    categoryId: 'services', amount: 850,
    description: 'UTE (Luz)', date: '2024-04-06', isFixed: true,
    splits: [
      { userId: 'u1', amount: 425, percentage: 50, isPaid: true },
      { userId: 'u2', amount: 425, percentage: 50, isPaid: false },
    ]
  },
  {
    id: 'e5', groupId: 'g1', paidById: 'u2',
    categoryId: 'food', amount: 2200,
    description: 'Pizza delivery', date: '2024-04-06', isFixed: false,
    splits: [
      { userId: 'u1', amount: 1100, percentage: 50, isPaid: false },
      { userId: 'u2', amount: 1100, percentage: 50, isPaid: true },
    ]
  },
  {
    id: 'e6', groupId: 'g1', paidById: 'u1',
    categoryId: 'leisure', amount: 1800,
    description: 'Netflix & Spotify', date: '2024-04-02', isFixed: true,
    splits: [
      { userId: 'u1', amount: 900, percentage: 50, isPaid: true },
      { userId: 'u2', amount: 900, percentage: 50, isPaid: false },
    ]
  },
  {
    id: 'e7', groupId: 'g2', paidById: 'u1',
    categoryId: 'travel', amount: 360,
    description: 'Hotel La Barra', date: '2024-03-15', isFixed: false,
    splits: [
      { userId: 'u1', amount: 120, percentage: 33.3, isPaid: true },
      { userId: 'u2', amount: 120, percentage: 33.3, isPaid: false },
      { userId: 'u3', amount: 120, percentage: 33.3, isPaid: false },
    ]
  },
  {
    id: 'e8', groupId: 'g2', paidById: 'u2',
    categoryId: 'food', amount: 180,
    description: 'Restaurante Il Baretto', date: '2024-03-16', isFixed: false,
    splits: [
      { userId: 'u1', amount: 60, percentage: 33.3, isPaid: false },
      { userId: 'u2', amount: 60, percentage: 33.3, isPaid: true },
      { userId: 'u3', amount: 60, percentage: 33.3, isPaid: false },
    ]
  },
]

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

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1', type: 'debt',
    title: '💸 Matías te debe',
    body: 'Matías debe $U 14.000 por Alquiler Abril en Casa',
    groupId: 'g1', read: false, createdAt: '2024-04-01T09:00:00Z',
    fromUserId: 'u2', amount: 14000
  },
  {
    id: 'n2', type: 'budget_warning',
    title: '⚠️ Presupuesto casi agotado',
    body: 'Te queda menos del 10% de tu presupuesto en Casa este mes. Llevás $U 22.500 de $U 25.000.',
    groupId: 'g1', read: false, createdAt: '2024-04-06T14:30:00Z'
  },
  {
    id: 'n3', type: 'fixed_expense',
    title: '🔄 Gasto fijo registrado',
    body: 'Internet ($U 1.200) fue registrado automáticamente en Casa',
    groupId: 'g1', read: true, createdAt: '2024-04-05T00:01:00Z', amount: 1200
  },
  {
    id: 'n4', type: 'payment_received',
    title: '✅ Pago recibido',
    body: 'Matías marcó como pagada su parte del Supermercado ($U 2.400) en Casa',
    groupId: 'g1', read: true, createdAt: '2024-04-04T16:20:00Z', amount: 2400
  },
  {
    id: 'n5', type: 'debt',
    title: '💸 Sofía te debe',
    body: 'Sofía debe US$ 120 por Hotel La Barra en Viaje Punta del Este',
    groupId: 'g2', read: true, createdAt: '2024-03-15T18:00:00Z', amount: 120
  },
]

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
