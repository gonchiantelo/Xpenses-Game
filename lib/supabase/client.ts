import { createBrowserClient } from '@supabase/ssr'

// Singleton browser client — usar en 'use client' components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Retrocompatibilidad con imports existentes de '@/lib/supabase'
export const supabase = createClient()

export type { User, Session } from '@supabase/supabase-js'
