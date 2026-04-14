'use client'
// Onboarding de Tema — aparece una sola vez al crear la cuenta
// Guarda la preferencia en profiles.theme_preference y en next-themes

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingThemePage() {
  const router   = useRouter()
  const { setTheme } = useTheme()
  const supabase = createClient()
  const [selected, setSelected] = useState<'dark' | 'light'>('dark')
  const [loading,  setLoading]  = useState(false)

  async function handleConfirm() {
    setLoading(true)
    setTheme(selected)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme_preference: selected })
        .eq('id', user.id)
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center animate-fade-in">
        <div className="text-5xl animate-float">🎨</div>

        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Elegí tu estilo
          </h1>
          <p className="text-sm text-secondary mt-2">
            Podés cambiarlo cuando quieras desde tu perfil
          </p>
        </div>

        <div className="flex gap-4 w-full">
          {/* Dark mode card */}
          <button
            onClick={() => setSelected('dark')}
            className={`
              flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2
              transition-all duration-200
              ${selected === 'dark'
                ? 'border-accent shadow-accent scale-[1.02]'
                : 'border-subtle hover:border-accent/30'}
            `}
            style={{ background: '#000F0A' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: '#0D1F15' }}>
              🌙
            </div>
            <div className="text-left w-full">
              <p className="text-sm font-bold text-[#E8FBF4]">Deep Night</p>
              <p className="text-xs text-[#7AB89A] mt-0.5">Negro profundo</p>
            </div>
            {selected === 'dark' && (
              <span className="ml-auto text-accent text-lg">✓</span>
            )}
          </button>

          {/* Light mode card */}
          <button
            onClick={() => setSelected('light')}
            className={`
              flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2
              transition-all duration-200
              ${selected === 'light'
                ? 'border-[#00A85A] scale-[1.02]'
                : 'border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,168,90,0.3)]'}
            `}
            style={{ background: '#F1F7F6' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: '#FFFFFF' }}>
              ☀️
            </div>
            <div className="text-left w-full">
              <p className="text-sm font-bold text-[#0D1F15]">Minimalista</p>
              <p className="text-xs text-[#3D6B55] mt-0.5">Claro y limpio</p>
            </div>
            {selected === 'light' && (
              <span className="ml-auto text-[#00A85A] text-lg">✓</span>
            )}
          </button>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="
            flex items-center justify-center gap-2
            w-full py-3.5 px-6 rounded-xl
            text-sm font-bold text-[#000F0A]
            disabled:opacity-70
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
          "
          style={{
            background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)',
            boxShadow: '0 4px 20px rgba(0,223,129,0.30)',
          }}
        >
          {loading
            ? <span className="inline-block w-4 h-4 rounded-full border-2 border-[#000F0A]/30 border-t-[#000F0A] animate-spin" />
            : `Confirmar — Modo ${selected === 'dark' ? 'oscuro' : 'claro'}`
          }
        </button>
      </div>
    </div>
  )
}
