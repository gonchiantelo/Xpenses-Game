'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CURRENT_USER, MOCK_GROUPS, formatAmount, getPaletteById, COLOR_PALETTES } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

export default function ProfilePage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<'profile' | 'subscription' | 'settings'>('profile')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    firstName: CURRENT_USER.firstName,
    lastName: CURRENT_USER.lastName,
    email: CURRENT_USER.email,
    phone: '+598 99 123 456',
    country: 'Uruguay 🇺🇾',
    birthdate: '1995-08-14',
  })

  const myGroups = MOCK_GROUPS.filter(g => g.members.some(m => m.userId === CURRENT_USER.id))
  const totalSpentAll = myGroups.reduce((sum, g) => {
    const m = g.members.find(x => x.userId === CURRENT_USER.id)
    return sum + (m?.spent ?? 0)
  }, 0)

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-header__title">Mi Perfil</h1>
        <button
          id="btn-logout"
          className="btn btn--sm btn--ghost"
          onClick={() => router.push('/login')}
        >
          Salir 👋
        </button>
      </header>

      <div className="page-content">
        {/* Avatar + name */}
        <div className="profile-hero">
          <div className="profile-avatar" style={{ background: CURRENT_USER.avatarColor }}>
            {CURRENT_USER.avatarInitials}
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-name">{form.firstName} {form.lastName}</h2>
            <p className="profile-email">{form.email}</p>
            <span className="badge badge--accent">✨ Plan Gratuito</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="stats-row">
          <div className="stat-mini">
            <span className="stat-mini-val">{myGroups.length}</span>
            <span className="stat-mini-label">Grupos</span>
          </div>
          <div className="stat-mini-div" />
          <div className="stat-mini">
            <span className="stat-mini-val">
              {MOCK_GROUPS[0] ? `$U ${(totalSpentAll / 1000).toFixed(0)}K` : '—'}
            </span>
            <span className="stat-mini-label">Gastado total</span>
          </div>
          <div className="stat-mini-div" />
          <div className="stat-mini">
            <span className="stat-mini-val">14</span>
            <span className="stat-mini-label">Días activo</span>
          </div>
        </div>

        {/* Section tabs */}
        <div className="section-tabs">
          {(['profile', 'subscription', 'settings'] as const).map(s => (
            <button
              key={s}
              id={`profile-tab-${s}`}
              className={`section-tab-btn ${activeSection === s ? 'active' : ''}`}
              onClick={() => setActiveSection(s)}
            >
              {s === 'profile' ? '👤 Datos' : s === 'subscription' ? '⭐ Plan' : '⚙️ Config'}
            </button>
          ))}
        </div>

        {/* PROFILE */}
        {activeSection === 'profile' && (
          <div className="profile-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>Información personal</h3>
              <button id="btn-edit-profile" className="btn btn--sm btn--ghost"
                onClick={() => setEditMode(!editMode)}>
                {editMode ? '✓ Guardar' : '✏️ Editar'}
              </button>
            </div>
            {[
              { label: 'Nombre', field: 'firstName', icon: '👤' },
              { label: 'Apellido', field: 'lastName', icon: '👤' },
              { label: 'Email', field: 'email', icon: '✉️' },
              { label: 'Teléfono', field: 'phone', icon: '📱' },
              { label: 'País', field: 'country', icon: '🌍' },
              { label: 'Fecha de nacimiento', field: 'birthdate', icon: '🎂' },
            ].map(({ label, field, icon }) => (
              <div key={field} className="profile-field">
                <div className="field-icon">{icon}</div>
                <div className="field-content">
                  <span className="field-label">{label}</span>
                  {editMode ? (
                    <input
                      id={`field-${field}`}
                      className="input"
                      style={{ marginTop: 4 }}
                      value={form[field as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    />
                  ) : (
                    <span className="field-value">{form[field as keyof typeof form]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBSCRIPTION */}
        {activeSection === 'subscription' && (
          <div className="profile-section">
            <div className="plan-current">
              <div className="plan-badge-free">GRATIS</div>
              <h3 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Plan Actual</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>
                Acceso básico · Hasta 4 personas por grupo
              </p>
            </div>

            <div className="plan-pro">
              <div className="plan-pro-header">
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-lg)' }}>Xpenses Pro</div>
                  <div style={{ color: 'var(--color-accent-light)', fontSize: 'var(--text-sm)' }}>
                    $U 199 / mes · o $U 1.799 / año
                  </div>
                </div>
              </div>
              <ul className="plan-features">
                {[
                  '👥 Hasta 10 personas por grupo',
                  '📊 Estadísticas avanzadas',
                  '📤 Exportar a PDF/CSV',
                  '🔁 Gastos recurrentes ilimitados',
                  '🏦 Integración bancaria (próximamente)',
                  '📷 OCR de tickets (próximamente)',
                  '🔔 Notificaciones push',
                  '🎨 Paletas premium ilimitadas',
                ].map((f, i) => (
                  <li key={i} className="plan-feature">{f}</li>
                ))}
              </ul>
              <button id="btn-upgrade" className="btn btn--primary btn--full btn--lg">
                🚀 Empezar prueba gratuita 7 días
              </button>
              <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 8 }}>
                Sin compromiso. Cancelá cuando quieras.
              </p>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === 'settings' && (
          <div className="profile-section">
            {[
              { label: 'Notificaciones push', sub: 'Alertas de deudas y presupuesto', id: 'toggle-push' },
              { label: 'Notificaciones por email', sub: 'Resumen semanal', id: 'toggle-email' },
              { label: 'Alertas de presupuesto', sub: 'Cuando quede menos del 10%', id: 'toggle-budget' },
            ].map(item => (
              <div key={item.id} className="settings-row">
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>{item.sub}</div>
                </div>
                <label className="toggle">
                  <input id={item.id} type="checkbox" defaultChecked />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}

            <div className="divider" />

            <div className="settings-link-row" onClick={() => {}}>
              <span>🔐</span>
              <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>Cambiar contraseña</span>
              <span style={{ color: 'var(--color-text-3)' }}>›</span>
            </div>
            <div className="settings-link-row" onClick={() => {}}>
              <span>📤</span>
              <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>Exportar mis datos</span>
              <span style={{ color: 'var(--color-text-3)' }}>›</span>
            </div>
            <div className="settings-link-row" style={{ color: 'var(--color-danger)' }} onClick={() => {}}>
              <span>🗑️</span>
              <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>Eliminar cuenta</span>
              <span>›</span>
            </div>

            <div className="divider" />

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)' }}>
                Xpenses Game v1.0.0 — Prototipo UI
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginTop: 4 }}>
                Hecho con ❤️ para dividir mejor
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav notifCount={2} />

      <style jsx>{`
        .profile-hero {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl);
        }
        .profile-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; font-weight: 800; color: white; flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .profile-hero-info { flex: 1; }
        .profile-name { font-size: var(--text-xl); font-weight: 800; letter-spacing: -0.02em; }
        .profile-email { font-size: var(--text-xs); color: var(--color-text-3); margin: 4px 0 8px; }
        .stats-row {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl);
          padding: 20px;
        }
        .stat-mini { text-align: center; flex: 1; }
        .stat-mini-val { display: block; font-size: var(--text-2xl); font-weight: 800; letter-spacing: -0.04em; }
        .stat-mini-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-3); }
        .stat-mini-div { width: 1px; height: 32px; background: var(--color-border-2); }
        .section-tabs {
          display: flex;
          background: var(--color-surface-2);
          border-radius: var(--radius-lg);
          padding: 4px;
          gap: 4px;
        }
        .section-tab-btn {
          flex: 1; padding: 8px; background: none; border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-xs); font-weight: 600; color: var(--color-text-3);
          cursor: pointer; transition: all 0.15s;
        }
        .section-tab-btn:hover { color: var(--color-text-2); }
        .section-tab-btn.active { background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-sm); }
        .profile-section { display: flex; flex-direction: column; gap: 12px; }
        .profile-field {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; background: var(--color-surface);
          border: 1px solid var(--color-border-2); border-radius: var(--radius-lg);
        }
        .field-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
        .field-content { flex: 1; }
        .field-label { display: block; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-3); margin-bottom: 2px; }
        .field-value { font-size: var(--text-sm); font-weight: 500; color: var(--color-text); }
        .plan-current {
          display: flex; flex-direction: column; gap: 8px;
          padding: 20px; background: var(--color-surface-2);
          border: 1px solid var(--color-border-2); border-radius: var(--radius-xl);
        }
        .plan-badge-free {
          display: inline-block; width: fit-content;
          background: var(--color-surface-3); color: var(--color-text-2);
          font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em;
          padding: 3px 10px; border-radius: 999px;
        }
        .plan-pro {
          display: flex; flex-direction: column; gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-accent-dim) 100%);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
        }
        .plan-pro-header { display: flex; align-items: center; gap: 12px; }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .plan-feature { font-size: var(--text-sm); color: var(--color-text-2); }
        .settings-row {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 14px; background: var(--color-surface);
          border: 1px solid var(--color-border-2); border-radius: var(--radius-lg);
        }
        .settings-link-row {
          display: flex; align-items: center; gap: 12px;
          padding: 14px; background: var(--color-surface);
          border: 1px solid var(--color-border-2); border-radius: var(--radius-lg);
          cursor: pointer; transition: background 0.15s;
        }
        .settings-link-row:hover { background: var(--color-surface-2); }
        .settings-link-row + .settings-link-row { margin-top: 8px; }
      `}</style>
    </div>
  )
}
