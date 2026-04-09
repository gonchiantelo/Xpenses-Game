'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatAmount, getPaletteById } from '@/lib/mockData'
import BottomNav from '@/components/BottomNav'

export default function GroupsPage() {
  const { user } = useAuth()
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const currentUserId = user.id

    async function fetchGroups() {
      try {
        const { data, error } = await supabase
          .from('group_members')
          .select(`
            role,
            groups (
              id, name, emoji, type, currency, palette,
              group_members (
                user_id,
                profiles (first_name, last_name, avatar_url)
              )
            )
          `)
          .eq('user_id', currentUserId)

        if (error) {
          console.error('Error de Supabase:', error)
        } else if (data) {
          // Filtramos nulos por si el RLS bloquea el acceso al objeto group
          const groups = data.map(d => d.groups).filter(g => g !== null)
          setMyGroups(groups)
        }
      } catch (err) {
        console.error('Error fatal al cargar grupos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [user])

  if (loading) return <div className="page" style={{display:'flex',justifyContent:'center',padding:'50px'}}><div className="spinner" /></div>
  if (!user) return null

  const userId = user.id

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Mis Grupos</h1>
          <p className="page-header__subtitle">{myGroups.length} grupos activos</p>
        </div>
        <Link href="/groups/create" id="btn-create-group" className="btn btn--primary btn--sm">
          + Nuevo grupo
        </Link>
      </header>

      <div className="page-content">
        {myGroups.map(group => {
          if (!group) return null // Seguridad extra
          const palette = getPaletteById(group.palette || 'violet')
          return (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              id={`group-card-${group.id}`}
              className="group-full-card"
              style={{ '--accent': palette.color } as React.CSSProperties}
            >
              <div className="gfc-stripe" style={{ background: palette.color }} />
              <div className="gfc-body">
                <div className="gfc-header">
                  <div className="gfc-emoji">{group.emoji}</div>
                  <div className="gfc-info">
                    <span className="gfc-name">{group.name}</span>
                    <div className="gfc-tags">
                      <span className="badge badge--neutral">
                        {group.type === 'monthly' ? '📅 Hogar' : group.type === 'travel' ? '✈️ Viaje' : '🎉 Evento'}
                      </span>
                      <span className="badge badge--neutral">{group.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="gfc-members">
                  {group.group_members?.map((m: any) => (
                    <div key={m.user_id} className="member-pill">
                      <div className="member-ava" style={{ background: 'var(--color-surface-3)' }}>
                        {m.profiles?.first_name?.substring(0, 1) || '👤'}
                      </div>
                      <span>{m.user_id === userId ? 'Yo' : m.profiles?.first_name || 'Invitado'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          )
        })}

        {/* Empty state */}
        {myGroups.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No tenés grupos</h3>
            <p>Creá tu primer grupo para empezar a dividir gastos</p>
            <Link href="/groups/create" id="btn-create-first-group" className="btn btn--primary">
              Crear grupo
            </Link>
          </div>
        )}
      </div>

      <BottomNav />

      <style jsx>{`
        .group-full-card {
          display: block;
          background: var(--color-surface);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-xl);
          overflow: hidden;
          text-decoration: none;
          transition: all 0.2s;
          position: relative;
        }
        .group-full-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .gfc-stripe {
          height: 3px;
          width: 100%;
        }
        .gfc-body {
          padding: var(--space-4) var(--space-5);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .gfc-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
        }
        .gfc-emoji { font-size: 2rem; flex-shrink: 0; }
        .gfc-info { flex: 1; }
        .gfc-name {
          display: block;
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 6px;
        }
        .gfc-tags { display: flex; gap: var(--space-2); flex-wrap: wrap; }
        .gfc-members {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        .member-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border-2);
          border-radius: var(--radius-full);
          padding: 4px 10px 4px 4px;
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-2);
        }
        .member-ava {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: white;
        }
        .gfc-budget {}
        .gfc-budget-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-16) var(--space-6);
          text-align: center;
        }
        .empty-icon { font-size: 4rem; }
        .empty-state h3 { font-size: var(--text-xl); font-weight: 700; }
        .empty-state p { font-size: var(--text-sm); color: var(--color-text-2); }
      `}</style>
    </div>
  )
}
