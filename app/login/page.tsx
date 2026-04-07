'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'azure' | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // ── Email / Password login ───────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Completá todos los campos'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(traducirError(err.message)); return }
    router.push('/dashboard')
  }

  // ── OAuth ────────────────────────────────────────────────
  const handleOAuth = async (provider: 'google' | 'azure') => {
    setOauthLoading(provider)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'azure' ? 'email profile openid' : undefined,
      },
    })
    if (err) { setError(traducirError(err.message)); setOauthLoading(null) }
    // Si no hay error, el browser redirige al proveedor automáticamente
  }

  // ── Forgot password ──────────────────────────────────────
  const handleForgotPassword = async () => {
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
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-container">

        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-mark">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="20" fill="var(--color-accent)" fillOpacity="0.15" />
              <path d="M14 14L32 32M32 32L50 14M32 32L14 50M32 32L50 50"
                stroke="var(--color-accent-light)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="32" cy="32" r="6" fill="var(--color-accent)" />
              <circle cx="14" cy="14" r="4" fill="var(--color-accent)" fillOpacity="0.6" />
              <circle cx="50" cy="14" r="4" fill="var(--color-accent)" fillOpacity="0.6" />
              <circle cx="14" cy="50" r="4" fill="var(--color-accent)" fillOpacity="0.6" />
              <circle cx="50" cy="50" r="4" fill="var(--color-accent)" fillOpacity="0.6" />
            </svg>
          </div>
          <h1 className="logo-name">Xpenses<span style={{ color: 'var(--color-accent)' }}>Game</span></h1>
          <p className="logo-tagline">Dividí bien. Gastá mejor. Jugá en equipo.</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <h2 className="auth-card__title">Bienvenido de vuelta 👋</h2>
          <p className="auth-card__sub">Ingresá a tu cuenta</p>

          {/* OAuth buttons — PRIMERO */}
          <div className="social-buttons">
            <button
              id="btn-google"
              className="btn btn--secondary social-btn"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
            >
              {oauthLoading === 'google'
                ? <span className="spinner" />
                : <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </>
              }
            </button>
            <button
              id="btn-microsoft"
              className="btn btn--secondary social-btn"
              onClick={() => handleOAuth('azure')}
              disabled={!!oauthLoading}
            >
              {oauthLoading === 'azure'
                ? <span className="spinner" />
                : <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="1" y="1" width="7" height="7" fill="#F25022"/>
                      <rect x="10" y="1" width="7" height="7" fill="#7FBA00"/>
                      <rect x="1" y="10" width="7" height="7" fill="#00A4EF"/>
                      <rect x="10" y="10" width="7" height="7" fill="#FFB900"/>
                    </svg>
                    Continuar con Microsoft
                  </>
              }
            </button>
          </div>

          <div className="auth-divider"><span>o con email</span></div>

          {error && <div className="auth-feedback auth-feedback--error">⚠️ {error}</div>}
          {message && <div className="auth-feedback auth-feedback--success">{message}</div>}

          <form onSubmit={handleEmailLogin} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">✉️</span>
                <input id="email" className="input" type="email" placeholder="tu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="password">Contraseña</label>
              <div className="input-icon-wrapper">
                <span className="input-icon">🔒</span>
                <input id="password" className="input" type="password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="auth-link" onClick={handleForgotPassword}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button id="btn-login" type="submit"
              className={`btn btn--primary btn--full btn--lg ${loading ? 'loading' : ''}`}
              disabled={loading}>
              {loading ? <span className="spinner" /> : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="auth-signup-link">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="auth-link auth-link--accent">Crear cuenta gratis</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:var(--space-6) var(--space-4); }
        .auth-glow { position:absolute; top:-200px; left:50%; transform:translateX(-50%); width:600px; height:600px; background:radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%); pointer-events:none; }
        .auth-container { width:100%; max-width:400px; display:flex; flex-direction:column; gap:var(--space-6); position:relative; z-index:1; }
        .auth-logo { text-align:center; display:flex; flex-direction:column; align-items:center; gap:var(--space-3); }
        .logo-mark { animation:float 3s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .logo-name { font-size:var(--text-3xl); font-weight:900; letter-spacing:-0.04em; }
        .logo-tagline { font-size:var(--text-sm); color:var(--color-text-3); }
        .auth-card { background:var(--color-surface); border:1px solid var(--color-border-2); border-radius:var(--radius-2xl); padding:var(--space-8); box-shadow:var(--shadow-lg); display:flex; flex-direction:column; gap:var(--space-5); }
        .auth-card__title { font-size:var(--text-xl); font-weight:700; }
        .auth-card__sub { font-size:var(--text-sm); color:var(--color-text-2); margin-top:-12px; }
        .social-buttons { display:flex; flex-direction:column; gap:var(--space-3); }
        .social-btn { font-size:var(--text-sm); padding:0.75rem 1rem; justify-content:center; gap:10px; }
        .auth-divider { display:flex; align-items:center; gap:var(--space-3); font-size:var(--text-xs); color:var(--color-text-3); letter-spacing:0.05em; text-transform:uppercase; }
        .auth-divider::before, .auth-divider::after { content:''; flex:1; height:1px; background:var(--color-border-2); }
        .auth-feedback { padding:var(--space-3) var(--space-4); border-radius:var(--radius-lg); font-size:var(--text-sm); font-weight:500; }
        .auth-feedback--error { background:var(--color-danger-dim); border:1px solid rgba(244,63,94,.25); color:var(--color-danger); }
        .auth-feedback--success { background:var(--color-success-dim); border:1px solid rgba(16,185,129,.25); color:var(--color-success); }
        .auth-form { display:flex; flex-direction:column; gap:var(--space-4); }
        .auth-signup-link { text-align:center; font-size:var(--text-sm); color:var(--color-text-2); }
        .auth-link { background:none; border:none; cursor:pointer; color:var(--color-text-3); font-size:var(--text-sm); transition:color var(--duration-fast); }
        .auth-link:hover { color:var(--color-text-2); }
        .auth-link--accent { color:var(--color-accent-light); font-weight:600; }
        .auth-link--accent:hover { color:var(--color-accent); }
        .btn.loading { opacity:.7; cursor:not-allowed; }
        .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
      `}</style>
    </div>
  )
}

// Traduce errores de Supabase al español
function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed')) return 'Confirmá tu email antes de ingresar'
  if (msg.includes('User already registered')) return 'Este email ya tiene una cuenta'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('Unable to validate email')) return 'Email inválido'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos.'
  return msg
}
