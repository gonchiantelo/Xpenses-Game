// Tipos de la base de datos Supabase
// Refleja el schema v2 (con expense_splits y theme_preference)

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  country: string | null
  phone: string | null
  avatar_url: string | null
  theme_preference: 'dark' | 'light' | null
  updated_at: string
}

export interface Group {
  id: string
  name: string
  emoji: string
  type: 'monthly' | 'travel' | 'event'
  currency: string
  palette: string
  invite_code: string
  created_at: string
  owner_id: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'editor' | 'member'
  budget: number
  spent: number
  joined_at: string
  // Joined
  profiles?: Profile
  groups?: Group
}

export interface Expense {
  id: string
  group_id: string
  paid_by_id: string
  amount: number
  description: string
  category_id: string | null
  date: string
  is_fixed: boolean
  notes: string | null
  is_settled: boolean
  settled_at: string | null
  created_at: string
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  debtor_id: string
  amount: number
  is_settled: boolean
  settled_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  group_id: string
  type: 'expense' | 'overbudget' | 'invite' | 'settlement' | 'system'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ── Finance Engine Types ──────────────────────────────

export interface NetBalance {
  userId: string
  name: string
  avatarUrl?: string | null
  netBalance: number // positivo = acreedor, negativo = deudor
}

export interface Settlement {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export interface Split {
  memberId: string
  amount: number
}

export type BurnRate = 'low' | 'normal' | 'high' | 'critical'

export interface GroupEnriched extends Group {
  role: string
  members: (GroupMember & { profiles: Profile | null })[]
  expenses: Expense[]
  // Calculado en servidor
  groupTotalBudget: number
  groupTotalSpent: number
  groupAvailable: number
  isOverBudget: boolean
  burnRate: BurnRate
  daysRemaining: number
  pct: number
  netBalances: NetBalance[]
  settlements: Settlement[]
  myBudget: number
  mySpent: number
  myNetBalance: number
}

// Balance neto global del usuario (sumatorio sobre todos sus grupos)
export interface UserGlobalBalance {
  totalOwed: number    // cuánto le deben al usuario (positivo)
  totalOwing: number   // cuánto debe el usuario (positivo)
  netBalance: number   // positivo = te deben, negativo = debés
}
