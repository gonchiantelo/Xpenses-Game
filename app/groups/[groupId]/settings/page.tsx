'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getGroupById, getPaletteById, getUserById, CURRENT_USER, COLOR_PALETTES } from '@/lib/mockData'

export default function GroupSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const action = searchParams.get('action') 
  const groupId = params.groupId as string
  const group = getGroupById(groupId)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedPalette, setSelectedPalette] = useState(group?.palette ?? 'violet')

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?invite=${groupId}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!group) return null
  const palette = getPaletteById(group.palette)
  const myMember = group.members.find(m => m.userId === CURRENT_USER.id)
  const isAdmin = myMember?.role === 'admin'

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); router.back() }, 800)
  }

  return (
    <div className="page">
      <header className="page-header">
        <button id="btn-back-settings" className="btn btn--icon btn--ghost" onClick={() => router.back()}>←</button>
        <h1 className="page-header__title">Configuración</h1>
        <button id="btn-save-settings" className="btn btn--sm btn--primary"
          onClick={handleSave} disabled={saving}>
          {saving ? '...' : 'Guardar'}
        </button>
      </header>

      <div className="page-content">
        {/* Group info */}
        <div className="card">
          <p className="section-title">Info del grupo</p>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label className="input-label">Nombre</label>
            <input id="setting-name" className="input" defaultValue={group.name} disabled={!isAdmin} />
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label className="input-label">Moneda</label>
            <input className="input" value={group.currency} disabled style={{ opacity: 0.6 }} />
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', marginTop: 4 }}>
              La moneda no se puede cambiar una vez creado el grupo.
            </p>
          </div>
        </div>

        {/* Palette */}
        <div className="card">
          <p className="section-title">Color del grupo</p>
          <div className="palette-row" style={{ marginTop: 12 }}>
            {COLOR_PALETTES.map(p => (
              <button key={p.id} id={`palette-set-${p.id}`}
                className={`pal-swatch ${selectedPalette === p.id ? 'selected' : ''}`}
                style={{ background: p.color }}
                title={p.name}
                onClick={() => setSelectedPalette(p.id)}>
                {selectedPalette === p.id && '✓'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-3)', marginTop: 8 }}>
            Paleta: <strong style={{ color: COLOR_PALETTES.find(p => p.id === selectedPalette)?.color }}>
              {COLOR_PALETTES.find(p => p.id === selectedPalette)?.name}
            </strong>
          </p>
        </div>

        {/* Connectivity: INVITE SYSTEM */}
        <div className={`card ${action === 'invite' ? 'highlight-invite' : ''}`} id="invite-section">
          <p className="section-title">🔗 Invitar amigos</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-3)', marginBottom: 12 }}>
            Cualquiera con este link podrá unirse al grupo (límite 4 personas).
          </p>
          <div className="invite-link-box">
            <code className="invite-link-text">{inviteLink}</code>
            <button className={`btn btn--sm ${copied ? 'btn--success' : 'btn--primary'}`} onClick={handleCopy}>
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn--secondary btn--full btn--sm" style={{ gap: 8 }}>
              💬 WhatsApp
            </button>
            <button className="btn btn--secondary btn--full btn--sm" style={{ gap: 8 }}>
              ✉️ Email
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="section-title">Integrantes ({group.members.length}/4)</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {group.members.map(m => {
              const u = getUserById(m.userId)
              if (!u) return null
              return (
                <div key={m.userId} className="member-setting-row">
                  <div className="ms-ava" style={{ background: u.avatarColor }}>{u.avatarInitials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {u.firstName} {u.lastName}
                      {m.userId === CURRENT_USER.id && (
                        <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'var(--color-accent-light)', background: 'var(--color-accent-dim)', padding: '1px 6px', borderRadius: 999 }}>Vos</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-3)' }}>{u.email}</div>
                  </div>
                  <select
                    id={`role-${m.userId}`}
                    className="input"
                    defaultValue={m.role}
                    disabled={!isAdmin || m.userId === CURRENT_USER.id}
                    style={{ width: 100, padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="member">Miembro</option>
                  </select>
                </div>
              )
            })}
          </div>
        </div>

        {/* Danger zone */}
        {isAdmin && (
          <div className="card" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
            <p className="section-title" style={{ color: 'var(--color-danger)' }}>Zona de peligro</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button id="btn-archive-group" className="btn btn--danger btn--full">📦 Archivar grupo</button>
              <button id="btn-delete-group" className="btn btn--full"
                style={{ background: 'var(--color-danger-dim)', color: 'var(--color-danger)', border: '1px solid rgba(244,63,94,0.3)' }}>
                🗑️ Eliminar grupo permanentemente
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .palette-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .pal-swatch {
          width: 38px; height: 38px; border-radius: 50%;
          border: 3px solid transparent;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white;
          cursor: pointer; transition: all 0.15s;
        }
        .pal-swatch:hover { transform: scale(1.1); }
        .pal-swatch.selected { border-color: white; transform: scale(1.2); box-shadow: 0 0 12px rgba(255,255,255,0.2); }
        .member-setting-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; background: var(--color-surface-2);
          border-radius: var(--radius-lg);
        }
        .ms-ava {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .invite-link-box {
          display: flex; align-items: center; gap: 8px;
          background: var(--color-surface-2); padding: 8px 12px;
          border-radius: var(--radius-lg); border: 1px solid var(--color-border-2);
        }
        .invite-link-text {
          flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;
          font-size: 0.65rem; color: var(--color-text-3); font-family: monospace;
        }
        .highlight-invite {
          border-color: var(--color-accent) !important;
          animation: pulse-border 2s infinite;
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
          100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
        }
      `}</style>
    </div>
  )
}
