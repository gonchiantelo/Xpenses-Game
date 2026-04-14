// Retrocompatibilidad: lib/supabase.ts → lib/supabase/client.ts
// Evita romper imports existentes en el código viejo
export { supabase, createClient } from '@/lib/supabase/client'
export type { User, Session } from '@supabase/supabase-js'
