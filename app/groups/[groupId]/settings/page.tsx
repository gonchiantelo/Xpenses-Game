'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { getPaletteById, COLOR_PALETTES } from '@/lib/mockData'

export default function GroupSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const action = searchParams.get('action') 
  const groupId = params.groupId as string
  
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedPalette, setSelectedPalette] = useState('violet')
  const [formName, setFormName] = useState('')

  useEffect(() => {
    async function fetchGroupData() {
      if (!groupId) return
      
      const { data: gData, error: gErr } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()
      
      if (gData) {
        setGroup(gData)
        setFormName(gData.name)
        setSelectedPalette(gData.palette)
      }

      const { data: mData } = await supabase
        .from('group_members')
        .select(`
          user_id,
          role,
          profiles (first_name, last_name, email)
        `)
        .eq('group_id', groupId)

      if (mData) setMembers(mData)
      setLoading(false)
    }

    fetchGroupData()
  }, [groupId])

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?invite=${groupId}` : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="page"><div className="spinner" /></div>
  if (!group || !user) return null

  const myMember = members.find(m => m.user_id === user.id)
  const isAdmin = myMember?.role === 'admin'

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('groups')
      .update({
        name: formName,
        palette: selectedPalette
      })
      .eq('id', groupId)

    if (error) {
      alert('Error al guardar cambios')
    } else {
      router.back()
    }
    setSaving(false)
  }

  return (
    <div className="page" style={{ background: 'var(--color-bg)' }}>
      <header className="page-header">
        <button className="btn btn--icon btn--ghost" onClick={() => router.back()}>←</button>
        <h1 className="page-header__title">Configuración</h1>
        <button className="btn btn--sm btn--primary" onClick={handleSave} disabled={saving || !isAdmin}>
          {saving ? '...' : 'Guardar'}
        </button>
      </header>

      <div className="page-content">
        <div className="card">
          <p className="section-title">Info del grupo</p>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label className="input-label">Nombre</label>
            <input className="input" value={formName} onChange={e => setFormName(e.target.value)} disabled={!isAdmin} />
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label className="input-label">Moneda</label>
            <input className="input" value={group.currency} disabled style={{ opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <p className="section-title">Color del grupo</p>
          <div className="palette-row" style={{ marginTop: 12 }}>
            {COLOR_PALETTES.map(p => (
              <button key={p.id}
                className={`pal-swatch ${selectedPalette === p.id ? 'selected' : ''}`}
                style={{ background: p.color }}
                onClick={() => isAdmin && setSelectedPalette(p.id)}>
                {selectedPalette === p.id && '✓'}
              </button>
            ))}
          </div>
        </div>

        <div className={`card ${action === 'invite' ? 'highlight-invite' : ''}`}>
          <p className="section-title">🔗 Invitar amigos</p>
          <div className="invite-link-box" style={{ marginTop: 12 }}>
            <code className="invite-link-text">{inviteLink}</code>
            <button className={`btn btn--sm ${copied ? 'btn--success' : 'btn--primary'}`} onClick={handleCopy}>
              {copied ? '¡Hecho!' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="card">
          <p className="section-title">Integrantes ({members.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {members.map(m => (
              <div key={m.user_id} className="member-setting-row">
                <div className="ms-ava" style={{ background: 'var(--color-accent)' }}>
                  {m.profiles?.first_name?.substring(0, 1) || '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    {m.profiles?.first_name} {m.profiles?.last_name}
                    {m.user_id === user.id && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'var(--color-accent-dim)', padding: '2px 8px', borderRadius: 999 }}>Vos</span>}
                  </div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{m.profiles?.email}</div>
                </div>
                <div className="badge badge--neutral">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .card { background: var(--color-surface); padding: 20px; border-radius: 16px; border: 1px solid var(--color-border-2); margin-bottom: 16px; }
        .section-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--color-text-3); letter-spacing: 0.05em; }
        .palette-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .pal-swatch { width: 36px; height: 36px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; transition: transform 0.2s; }
        .pal-swatch.selected { border-color: white; transform: scale(1.1); }
        .invite-link-box { display: flex; align-items: center; gap: 8px; background: var(--color-surface-2); padding: 10px; border-radius: 12px; }
        .invite-link-text { flex: 1; font-size: 0.7rem; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.6; }
        .member-setting-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--color-surface-2); border-radius: 12px; }
        .ms-ava { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12px; }
      `}</style>
    </div>
  )
}
