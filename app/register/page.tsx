'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const STEPS = ['Datos', 'Verificación', '¡Listo!']

const COUNTRIES = [
  { code: 'UY', name: '🇺🇾 Uruguay' }, { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'BR', name: '🇧🇷 Brasil' },  { code: 'US', name: '🇺🇸 Estados Unidos' },
  { code: 'ES', name: '🇪🇸 España' },  { code: 'MX', name: '🇲🇽 México' },
  { code: 'CL', name: '🇨🇱 Chile' },   { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'PE', name: '🇵🇪 Perú' },    { code: 'PY', name: '🇵🇾 Paraguay' },
]

import { Suspense } from 'react'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="spinner" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite') // soporte para invitaciones

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', birthdate: '',
    country: 'UY', phone: '', password: '', confirmPassword: '',
  })

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // ── STEP 0: Crear cuenta en Supabase Auth ──────────────────
  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword, birthdate, country, phone } = form
    if (!firstName || !lastName || !email || !password) { setError('Completá los campos obligatorios'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }

    setError(''); setLoading(true)

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, birthdate, country, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpErr) { setError(traducirError(signUpErr.message)); return }

    // Si el email ya existe y está confirmado, Supabase devuelve un user sin session
    if (data?.user && !data?.session) {
      // Email de confirmación enviado
      setStep(1)
    } else if (data?.session) {
      // Ya estaba registrado con Google y ahora enlazó email — ir directo
      setStep(2)
    }
  }

  // ── Step 0 → 1: completar data, llamar Supabase ────────────
  const handleNext = async () => {
    if (step === 0) await handleRegister()
    else if (step === 1) setStep(2) // solo instruccional, Supabase maneja la verificación
    else router.push(inviteCode ? `/invite/${inviteCode}` : '/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-container">

        <div style={{ textAlign: 'center' }}>
          <svg width="44" height="44" viewBox="0 0 64 64" fill="none" style={{ display: 'inline-block' }}>
            <rect width="64" height="64" rx="20" fill="var(--color-accent)" fillOpacity="0.15" />
            <path d="M14 14L32 32M32 32L50 14M32 32L14 50M32 32L50 50"
              stroke="var(--color-accent-light)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="32" cy="32" r="6" fill="var(--color-accent)" />
          </svg>
          <h1 style={{ fontWeight: 900, fontSize: 'var(--text-2xl)', letterSpacing: '-0.03em', marginTop: 12 }}>
            Crear cuenta
          </h1>
          <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            {inviteCode ? '🎉 Te invitaron a un grupo' : '¡Empezá a ordenar tus gastos hoy!'}
          </p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className="step">
              <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`step-label ${i <= step ? 'active' : ''}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        <div className="auth-card">
          {error && <div className="auth-feedback auth-feedback--error">⚠️ {error}</div>}

          {/* ─── STEP 0: datos ─── */}
          {step === 0 && (
            <div className="form-step">
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Nombre *</label>
                  <input className="input" placeholder="Valentina" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Apellido *</label>
                  <input className="input" placeholder="Gómez" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Email *</label>
                <input className="input" type="email" placeholder="tu@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">País</label>
                  <select className="input select-input" value={form.country} onChange={e => update('country', e.target.value)}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Teléfono</label>
                  <input className="input" type="tel" placeholder="+598 99..." value={form.phone} onChange={e => update('phone', e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Fecha de nacimiento</label>
                <input className="input" type="date" value={form.birthdate} onChange={e => update('birthdate', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Contraseña * <span style={{ color: 'var(--color-text-3)', fontWeight: 400 }}>(mín. 6 caracteres)</span></label>
                <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Confirmar contraseña *</label>
                <input className="input" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              </div>
            </div>
          )}

          {/* ─── STEP 1: verificación ─── */}
          {step === 1 && (
            <div className="form-step" style={{ alignItems: 'center', textAlign: 'center', gap: 16 }}>
              <div style={{ fontSize: '4rem' }}>📧</div>
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Revisá tu email</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                Enviamos un link de confirmación a{' '}
                <strong style={{ color: 'var(--color-accent-light)' }}>{form.email}</strong>.
                <br />Hacé clic en el link y volvé aquí.
              </p>
              <div className="verify-box">
                <span>⏱️</span>
                <span>Una vez confirmado tu email, el link te traerá directo a la app.</span>
              </div>
            </div>
          )}

          {/* ─── STEP 2: éxito ─── */}
          {step === 2 && (
            <div className="form-step" style={{ alignItems: 'center', textAlign: 'center', gap: 16 }}>
              <div style={{ fontSize: '4rem', animation: 'bounceIn .5s ease-out' }}>🎉</div>
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-xl)' }}>¡Todo listo, {form.firstName}!</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>
                Tu cuenta está creada. Empezá creando o uniéndote a un grupo.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="badge badge--accent">🏠 Hogar</span>
                <span className="badge badge--success">✈️ Viajes</span>
                <span className="badge badge--warning">🎉 Eventos</span>
              </div>
            </div>
          )}

          <button id="btn-register-next"
            className={`btn btn--primary btn--full btn--lg ${loading ? 'loading' : ''}`}
            onClick={handleNext} disabled={loading}>
            {loading ? <span className="spinner" /> :
              step === 0 ? 'Continuar →' :
              step === 1 ? 'Ya confirmé mi email ✓' :
              '🚀 Ir al inicio'}
          </button>

          {step === 0 && (
            <>
              <div className="auth-divider"><span>o</span></div>
              <button className="btn btn--secondary btn--full" onClick={() => router.push('/login')}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Registrarse con Google
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--color-accent-light)', fontWeight: 600 }}>Iniciá sesión</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:var(--space-6) var(--space-4); }
        .auth-glow { position:absolute; top:-200px; left:50%; transform:translateX(-50%); width:600px; height:600px; background:radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%); pointer-events:none; }
        .auth-container { width:100%; max-width:440px; display:flex; flex-direction:column; gap:var(--space-5); position:relative; z-index:1; }
        .stepper { display:flex; align-items:center; justify-content:center; }
        .step { display:flex; align-items:center; gap:8px; }
        .step-circle { width:30px; height:30px; border-radius:50%; background:var(--color-surface-2); border:1.5px solid var(--color-border-2); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:var(--color-text-3); transition:all .3s; flex-shrink:0; }
        .step-circle.active { background:var(--color-accent-dim); border-color:var(--color-accent); color:var(--color-accent-light); }
        .step-circle.done { background:var(--color-accent); border-color:var(--color-accent); color:white; }
        .step-label { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; color:var(--color-text-3); }
        .step-label.active { color:var(--color-accent-light); }
        .step-line { width:28px; height:1.5px; background:var(--color-border-2); margin:0 8px; }
        .auth-card { background:var(--color-surface); border:1px solid var(--color-border-2); border-radius:var(--radius-2xl); padding:var(--space-6); box-shadow:var(--shadow-lg); display:flex; flex-direction:column; gap:var(--space-4); }
        .auth-feedback { padding:var(--space-3) var(--space-4); border-radius:var(--radius-lg); font-size:var(--text-xs); font-weight:500; }
        .auth-feedback--error { background:var(--color-danger-dim); border:1px solid rgba(244,63,94,.25); color:var(--color-danger); }
        .form-step { display:flex; flex-direction:column; gap:var(--space-3); }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3); }
        .select-input { appearance:none; cursor:pointer; }
        .verify-box { background:var(--color-accent-dim); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:12px 16px; display:flex; gap:8px; align-items:flex-start; font-size:var(--text-xs); color:var(--color-text-2); text-align:left; }
        .auth-divider { display:flex; align-items:center; gap:var(--space-3); font-size:var(--text-xs); color:var(--color-text-3); text-transform:uppercase; letter-spacing:.05em; }
        .auth-divider::before,.auth-divider::after { content:''; flex:1; height:1px; background:var(--color-border-2); }
        .btn.loading { opacity:.7; cursor:not-allowed; }
        .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
        @keyframes bounceIn { 0%{transform:scale(.3)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  )
}

function traducirError(msg: string): string {
  if (msg.includes('User already registered')) return 'Este email ya tiene una cuenta. Iniciá sesión.'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('Unable to validate email')) return 'Email inválido'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos.'
  return msg
}
