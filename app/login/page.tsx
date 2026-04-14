'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function XpensesLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="28" fill="url(#logo-bg-lp)" />
      <path d="M16 16L28 28M28 28L40 16M28 28L16 40M28 28L40 40"
        stroke="#00DF81" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="28" r="5" fill="#00DF81" />
      <circle cx="16" cy="16" r="3" fill="#2CC295" fillOpacity="0.7" />
      <circle cx="40" cy="16" r="3" fill="#2CC295" fillOpacity="0.7" />
      <circle cx="16" cy="40" r="3" fill="#2CC295" fillOpacity="0.7" />
      <circle cx="40" cy="40" r="3" fill="#2CC295" fillOpacity="0.7" />
      <defs>
        <radialGradient id="logo-bg-lp" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#03624C" />
          <stop offset="100%" stopColor="#000F0A" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function Spinner() {
  return <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
}

function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed'))        return 'Confirmá tu email antes de ingresar'
  if (msg.includes('User already registered'))    return 'Este email ya tiene una cuenta'
  if (msg.includes('Password should be at least'))return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('Unable to validate email'))   return 'Email inválido'
  if (msg.includes('rate limit'))                 return 'Demasiados intentos. Esperá unos minutos.'
  return msg
}

export default function LoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'azure' | null>(null)
  const [error,        setError]        = useState('')
  const [message,      setMessage]      = useState('')
  const [showPass,     setShowPass]     = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Completá todos los campos'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(traducirError(err.message)); return }
    router.push('/dashboard')
  }

  async function handleOAuth(provider: 'google' | 'azure') {
    setOauthLoading(provider)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'azure' ? 'email profile openid' : undefined,
      },
    })
    if (err) { setError(traducirError(err.message)); setOauthLoading(null) }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Ingresá tu email para continuar'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (err) { setError(traducirError(err.message)); return }
    setMessage('📧 Revisá tu email — te enviamos el link para restablecer la contraseña.')
    setError('')
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Logo + Branding */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="animate-float">
          <XpensesLogo size={64} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">
            Xpenses<span className="text-accent">Game</span>
          </h1>
          <p className="text-sm text-tertiary mt-1">Dividí bien. Gastá mejor. Jugá en equipo.</p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="rounded-2xl border border-subtle p-7 flex flex-col gap-5 shadow-card-md bg-surface">
        <div>
          <h2 className="text-lg font-bold text-primary">Bienvenido de vuelta 👋</h2>
          <p className="text-sm text-secondary mt-0.5">Ingresá a tu cuenta</p>
        </div>

        {/* OAuth */}
        <div className="flex flex-col gap-2.5">
          {[
            {
              id: 'btn-google', provider: 'google' as const, label: 'Continuar con Google',
              svg: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              ),
            },
            {
              id: 'btn-microsoft', provider: 'azure' as const, label: 'Continuar con Microsoft',
              svg: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="7" height="7" fill="#F25022"/>
                  <rect x="10" y="1" width="7" height="7" fill="#7FBA00"/>
                  <rect x="1" y="10" width="7" height="7" fill="#00A4EF"/>
                  <rect x="10" y="10" width="7" height="7" fill="#FFB900"/>
                </svg>
              ),
            },
          ].map(btn => (
            <button key={btn.id} id={btn.id}
              onClick={() => handleOAuth(btn.provider)}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-primary border border-subtle bg-surface-2 hover:border-accent/30 hover:bg-surface-3 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {oauthLoading === btn.provider ? <Spinner /> : <>{btn.svg}{btn.label}</>}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs text-tertiary uppercase tracking-widest">
          <div className="flex-1 h-px" style={{ background: 'var(--border-2)' }} />
          <span>o con email</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-2)' }} />
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex gap-2 px-4 py-3 rounded-xl border text-sm font-medium"
            style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)', color: '#F43F5E' }}>
            <span>⚠️</span> {error}
          </div>
        )}
        {message && (
          <div className="px-4 py-3 rounded-xl border text-sm font-medium"
            style={{ background: 'rgba(0,223,129,0.08)', borderColor: 'rgba(0,223,129,0.25)', color: '#00DF81' }}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-secondary uppercase tracking-wide">Email</label>
            <input id="email" type="email" placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-primary placeholder:text-tertiary border border-subtle bg-surface-2 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all duration-150" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-secondary uppercase tracking-wide">Contraseña</label>
            <div className="relative">
              <input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-primary placeholder:text-tertiary border border-subtle bg-surface-2 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all duration-150" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={handleForgotPassword}
              className="text-xs text-tertiary hover:text-accent transition-colors duration-150">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button id="btn-login" type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl text-sm font-bold text-[#000F0A] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)', boxShadow: '0 4px 20px rgba(0,223,129,0.25)' }}>
            {loading ? <Spinner /> : 'Ingresar'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-secondary">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-semibold text-accent hover:text-accent/80 transition-colors">
          Crear cuenta gratis
        </Link>
      </p>
    </div>
  )
}
