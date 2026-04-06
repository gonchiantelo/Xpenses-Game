'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const STEPS = ['Datos', 'Seguridad', 'Listo']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    birthdate: '', country: 'UY', phone: '',
    password: '', confirmPassword: '',
    verifyCode: ''
  })

  const update = (field: string, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }))

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else {
      setLoading(true)
      setTimeout(() => router.push('/dashboard'), 1200)
    }
  }

  const countries = [
    { code: 'UY', name: '🇺🇾 Uruguay' },
    { code: 'AR', name: '🇦🇷 Argentina' },
    { code: 'BR', name: '🇧🇷 Brasil' },
    { code: 'US', name: '🇺🇸 Estados Unidos' },
    { code: 'ES', name: '🇪🇸 España' },
    { code: 'MX', name: '🇲🇽 México' },
    { code: 'CL', name: '🇨🇱 Chile' },
    { code: 'CO', name: '🇨🇴 Colombia' },
    { code: 'PE', name: '🇵🇪 Perú' },
    { code: 'PY', name: '🇵🇾 Paraguay' },
  ]

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-container">
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div className="logo-mark-sm">
            <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="20" fill="var(--color-accent)" fillOpacity="0.15" />
              <path d="M14 14L32 32M32 32L50 14M32 32L14 50M32 32L50 50" stroke="var(--color-accent-light)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="32" cy="32" r="6" fill="var(--color-accent)" />
            </svg>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 'var(--text-2xl)', letterSpacing: '-0.03em', marginTop: '12px' }}>
            Crear cuenta
          </h1>
          <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            ¡Empezá a ordenar tus gastos hoy!
          </p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="step-circle">
                {i < step ? '✓' : i + 1}
              </div>
              <span className="step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="auth-card">
          {step === 0 && (
            <div className="form-step">
              <div className="input-group">
                <label className="input-label">Nombre</label>
                <input className="input" placeholder="Valentina" value={form.firstName}
                  onChange={e => update('firstName', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Apellido</label>
                <input className="input" placeholder="Gómez" value={form.lastName}
                  onChange={e => update('lastName', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="tu@email.com" value={form.email}
                  onChange={e => update('email', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Fecha de nacimiento</label>
                <input className="input" type="date" value={form.birthdate}
                  onChange={e => update('birthdate', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">País</label>
                  <select className="input" value={form.country}
                    onChange={e => update('country', e.target.value)}>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Teléfono</label>
                  <input className="input" type="tel" placeholder="+598 99..." value={form.phone}
                    onChange={e => update('phone', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form-step">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-2)', background: 'var(--color-accent-dim)', padding: '12px 16px', borderRadius: 'var(--radius-lg)' }}>
                📧 Enviamos un código de verificación a <strong style={{ color: 'var(--color-accent-light)' }}>{form.email || 'tu@email.com'}</strong>
              </p>
              <div className="input-group">
                <label className="input-label">Código de verificación</label>
                <input className="input input--lg" placeholder="000000" maxLength={6}
                  value={form.verifyCode} onChange={e => update('verifyCode', e.target.value)}
                  style={{ letterSpacing: '0.4em' }} />
              </div>
              <div className="input-group">
                <label className="input-label">Nueva contraseña</label>
                <input className="input" type="password" placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={e => update('password', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Confirmar contraseña</label>
                <input className="input" type="password" placeholder="Repetí tu contraseña"
                  value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step" style={{ alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
              <div className="success-animation">🎉</div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>¡Todo listo, {form.firstName || 'amigo'}!</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>
                Tu cuenta fue creada exitosamente. Empezá creando tu primer grupo.
              </p>
              <div className="welcome-badges">
                <span className="badge badge--accent">🏠 Hogar</span>
                <span className="badge badge--success">✈️ Viajes</span>
                <span className="badge badge--warning">🎉 Eventos</span>
              </div>
            </div>
          )}

          <button id="btn-register-next" className={`btn btn--primary btn--full btn--lg ${loading ? 'loading' : ''}`}
            onClick={next} disabled={loading}>
            {loading ? <span className="spinner" /> :
              step === STEPS.length - 1 ? '🚀 Ir al inicio' :
              step === 1 ? 'Verificar y continuar' : 'Continuar'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-2)' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--color-accent-light)', fontWeight: 600 }}>
            Iniciá sesión
          </Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: var(--space-6) var(--space-4);
        }
        .auth-glow {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          position: relative;
          z-index: 1;
        }
        .stepper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }
        .step {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-surface-2);
          border: 1.5px solid var(--color-border-2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-3);
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step.active .step-circle {
          background: var(--color-accent-dim);
          border-color: var(--color-accent);
          color: var(--color-accent-light);
        }
        .step.done .step-circle {
          background: var(--color-accent);
          border-color: var(--color-accent);
          color: white;
        }
        .step-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-3);
        }
        .step.active .step-label { color: var(--color-accent-light); }
        .step.done .step-label { color: var(--color-text-2); }
        .step-line {
          width: 32px;
          height: 1.5px;
          background: var(--color-border-2);
          margin: 0 8px;
        }
        .auth-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-2xl);
          padding: var(--space-8);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .form-step {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }
        .success-animation {
          font-size: 64px;
          animation: bounce 0.5s ease-out;
        }
        @keyframes bounce {
          0% { transform: scale(0.3); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .welcome-badges {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .btn.loading { opacity: 0.7; cursor: not-allowed; }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        select.input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B5E8A' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
