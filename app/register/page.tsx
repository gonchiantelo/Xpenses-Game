'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Datos', 'Verificación', '¡Listo!']

const COUNTRIES = [
  { code: 'UY', name: '🇺🇾 Uruguay' }, { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'BR', name: '🇧🇷 Brasil' },  { code: 'US', name: '🇺🇸 Estados Unidos' },
  { code: 'ES', name: '🇪🇸 España' },  { code: 'MX', name: '🇲🇽 México' },
  { code: 'CL', name: '🇨🇱 Chile' },   { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'PE', name: '🇵🇪 Perú' },    { code: 'PY', name: '🇵🇾 Paraguay' },
]

function XpensesLogo({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="28" r="28" fill="url(#logo-bg-reg)" />
      <path d="M16 16L28 28M28 28L40 16M28 28L16 40M28 28L40 40"
        stroke="#00DF81" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="28" r="5" fill="#00DF81" />
      <defs>
        <radialGradient id="logo-bg-reg" cx="50%" cy="30%" r="70%">
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
  if (msg.includes('User already registered')) return 'Este email ya tiene una cuenta. Iniciá sesión.'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('Unable to validate email')) return 'Email inválido'
  if (msg.includes('rate limit')) return 'Demasiados intentos. Esperá unos minutos.'
  return msg
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')
  const supabase = createClient()

  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', birthdate: '',
    country: 'UY', phone: '', password: '', confirmPassword: '',
  })

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // ── STEP 0: Crear cuenta ──────────────────
  async function handleRegister() {
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

    if (data?.user && !data?.session) {
      setStep(1) // Esperando confirmación
    } else if (data?.session) {
      setStep(2) // Éxito inmediato (OAuth o similar)
    }
  }

  async function handleNext() {
    if (step === 0) await handleRegister()
    else if (step === 1) setStep(2)
    else router.push(inviteCode ? `/invite/${inviteCode}` : '/dashboard')
  }

  async function handleOAuth(provider: 'google' | 'azure') {
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (err) setError(traducirError(err.message))
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="animate-float">
          <XpensesLogo />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary">Crear cuenta</h1>
          <p className="text-xs text-secondary mt-1">
            {inviteCode ? '🎉 Te invitaron a un grupo' : '¡Empezá a ordenar tus gastos hoy!'}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 px-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300
              ${i < step ? 'bg-accent text-[#000F0A]' : i === step ? 'bg-accent/20 border border-accent text-accent' : 'bg-surface-2 border border-subtle text-tertiary'}
            `}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${i <= step ? 'text-accent' : 'text-tertiary'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-subtle" />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-subtle bg-surface p-6 flex flex-col gap-5 shadow-card-md">
        {error && (
          <div className="flex gap-2 px-4 py-3 rounded-xl border text-xs font-medium"
            style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)', color: '#F43F5E' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* STEP 0: Formulario */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wide">Nombre *</label>
                <input className="input-field" placeholder="Juan" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wide">Apellido *</label>
                <input className="input-field" placeholder="Pérez" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wide">Email *</label>
              <input className="input-field" type="email" placeholder="tu@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wide">País</label>
                <select className="input-field cursor-pointer" value={form.country} onChange={e => update('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wide">Teléfono</label>
                <input className="input-field" type="tel" placeholder="+598 9..." value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wide">Contraseña *</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wide">Confirmar *</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 1: Verificación */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in">
            <span className="text-5xl">📧</span>
            <h3 className="text-lg font-bold text-primary">Revisá tu email</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Enviamos un link a <span className="font-bold text-accent">{form.email}</span>.<br />Hacé clic y volvé aquí.
            </p>
            <div className="w-full p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-3 text-left">
              <span className="text-lg mt-0.5">⏱️</span>
              <p className="text-xs text-secondary">Una vez confirmado tu email, el link te traerá directo a la app.</p>
            </div>
          </div>
        )}

        {/* STEP 2: Éxito */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in">
            <span className="text-5xl animate-bounce">🎉</span>
            <h3 className="text-lg font-bold text-primary">¡Bienvenido, {form.firstName}!</h3>
            <p className="text-sm text-secondary">Tu cuenta está lista. Empezamos el juego.</p>
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">🏠 HOGAR</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan-400">✈️ VIAJES</span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange/10 border border-orange/20 text-orange-400">🎉 EVENTOS</span>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-[#000F0A] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)', boxShadow: '0 4px 20px rgba(0,223,129,0.25)' }}
        >
          {loading ? <Spinner /> : step === 0 ? 'Continuar' : step === 1 ? 'Ya confirmé ✓' : 'Empezar ahora'}
        </button>

        {step === 0 && (
          <>
            <div className="flex items-center gap-3 text-[10px] text-tertiary uppercase tracking-widest font-bold">
              <div className="flex-1 h-px bg-subtle" />
              <span>o</span>
              <div className="flex-1 h-px bg-subtle" />
            </div>

            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl text-sm font-semibold text-primary border border-subtle bg-surface-2 hover:border-accent/30 transition-all duration-150"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Unirse con Google
            </button>
          </>
        )}
      </div>

      <p className="text-center text-sm text-secondary">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-bold text-accent hover:text-accent/80 transition-colors">Iniciá sesión</Link>
      </p>

    </div>
  )
}
