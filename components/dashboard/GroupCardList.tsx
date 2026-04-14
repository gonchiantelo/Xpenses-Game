// GroupCardList — RSC
// Lista de tarjetas de grupos con burn rate y barra de progreso

import Link from 'next/link'
import type { GroupEnriched } from '@/lib/types/database'
import { getBurnRateLabel } from '@/lib/finance/projections'

const PALETTE_COLORS: Record<string, string> = {
  green:   '#00DF81',
  emerald: '#10B981',
  cyan:    '#06B6D4',
  violet:  '#8B5CF6',
  rose:    '#F43F5E',
  amber:   '#F59E0B',
  slate:   '#64748B',
}

function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    UYU: '$U', USD: 'US$', EUR: '€', ARS: '$', BRL: 'R$',
  }
  const sym = symbols[currency] ?? '$'
  if (Math.abs(amount) >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000)     return `${sym}${(amount / 1_000).toFixed(1)}k`
  return `${sym}${Math.round(amount).toLocaleString('es-UY')}`
}

interface GroupCardListProps {
  groups: GroupEnriched[]
}

export default function GroupCardList({ groups }: GroupCardListProps) {
  if (groups.length === 0) return null

  return (
    <section id="section-groups" aria-label="Tus grupos">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-tertiary">
          Tus Grupos ({groups.length})
        </h2>
        <Link
          href="/groups/create"
          className="
            text-xs font-semibold px-3 py-1.5 rounded-lg
            text-accent border border-accent/20 bg-accent/5
            hover:bg-accent/10 transition-colors duration-150
          "
        >
          + Nuevo
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {groups.map(group => {
          const color    = PALETTE_COLORS[group.palette] ?? '#00DF81'
          const burnInfo = getBurnRateLabel(group.burnRate)
          const pct      = Math.min(group.pct, 100)
          const isOver   = group.isOverBudget

          return (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="
                block rounded-xl border border-subtle bg-surface
                p-4 hover:border-accent/20 hover:shadow-card
                active:scale-[0.98] transition-all duration-150
              "
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              {/* Top row */}
              <div className="flex items-center gap-3 mb-3">
                {/* Emoji icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${color}15`, color }}
                >
                  {group.emoji}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-primary truncate">{group.name}</h3>
                  <p className={`text-xs font-semibold mt-0.5 ${burnInfo.color}`}>
                    {burnInfo.emoji} {burnInfo.label}
                  </p>
                </div>

                {/* Amount remaining */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wide text-tertiary font-bold">Quedan</p>
                  <p
                    className="text-sm font-extrabold"
                    style={{ color: isOver ? '#F43F5E' : 'var(--text)' }}
                  >
                    {isOver ? '-' : ''}{formatAmount(Math.abs(group.groupAvailable), group.currency)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: isOver ? '#F43F5E' : pct > 80 ? '#F59E0B' : color,
                  }}
                />
              </div>

              {/* Pct label */}
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-tertiary">
                  {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] font-bold text-tertiary">{pct}% consumido</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
