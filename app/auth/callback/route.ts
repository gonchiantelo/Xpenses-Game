import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Route Handler para el callback de OAuth2 (Google, Microsoft)
// Supabase redirige aquí con un ?code= después del login social
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Verificar si el usuario tiene tema configurado (onboarding)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .single()

        // Si no eligió tema → onboarding de tema
        if (profile && profile.theme_preference === null) {
          return NextResponse.redirect(`${origin}/onboarding/theme`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si algo falla, redirigir al login con error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
