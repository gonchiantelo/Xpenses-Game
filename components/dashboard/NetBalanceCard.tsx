// NetBalanceCard — RSC (no interactividad necesaria)
// Muestra el balance neto global del usuario: Verde / Rojo / Gris

import type { UserGlobalBalance } from '@/lib/types/database'

function formatCurrency(amount: number, currency = 'UYU'): string {
  const symbols: Record<string, string> = {
    UYU: '$U', USD: 'US$', EUR: '€', ARS: '$', BRL: 'R$',
  }
  const symbol = symbols[currency] ?? '$'
  if (Math.abs(amount) >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`
  if (Math.abs(amount) >= 1_000)     return `${symbol}${(amount / 1_000).toFixed(1)}k`
  return `${symbol}${Math.round(Math.abs(amount)).toLocaleString('es-UY')}`
}

interface NetBalanceCardProps {
  balance: UserGlobalBalance
  currency?: string
  userName?: string
}

export default function NetBalanceCard({ balance, currency = 'UYU', userName }: NetBalanceCardProps) {
  const { netBalance, totalOwed, totalOwing } = balance
  const isPositive = netBalance > 0.01
  const isNegative = netBalance < -0.01

  const config = isPositive
    ? {
        label:     'Te deben en total',
        value:     totalOwed,
        sublabel:  'Estás ganando 🎯',
        gradient:  'from-[#00DF81]/20 via-[#03624C]/10 to-transparent',
        border:    'border-[#00DF81]/25',
        textColor: 'text-[#00DF81]',
        glow:      'shadow-[0_0_40px_rgba(0,223,129,0.15)]',
        icon:      '📈',
      }
    : isNegative
    ? {
        label:     'Debés en total',
        value:     totalOwing,
        sublabel:  'Necesitás saldar cuentas',
        gradient:  'from-[#F43F5E]/15 via-[#7C0D1E]/10 to-transparent',
        border:    'border-[#F43F5E]/25',
        textColor: 'text-[#F43F5E]',
        glow:      'shadow-[0_0_40px_rgba(244,63,94,0.12)]',
        icon:      '📉',
      }
    : {
        label:     'Estás al día',
        value:     0,
        sublabel:  'Sin deudas pendientes ✓',
        gradient:  'from-surface-2/80 to-transparent',
        border:    'border-subtle',
        textColor: 'text-secondary',
        glow:      '',
        icon:      '✅',
      }

  return (
    <section
      id="hero-balance"
      className={`
        relative overflow-hidden rounded-2xl border p-6
        bg-gradient-to-br ${config.gradient} ${config.border} ${config.glow}
        transition-all duration-500
      `}
      aria-label="Balance neto global"
    >
      {/* Ambient circle */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{ background: isPositive ? '#00DF81' : isNegative ? '#F43F5E' : 'transparent', filter: 'blur(32px)' }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {userName && (
            <p className="text-xs font-semibold text-tertiary uppercase tracking-widest mb-1">
              Hola, {userName} 👋
            </p>
          )}
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">
            {config.label}
          </p>
        </div>
        <span className="text-2xl" aria-hidden="true">{config.icon}</span>
      </div>

      {/* Main value */}
      {isNegative || isPositive ? (
        <div className="flex items-baseline gap-1 mb-3">
          <span className={`text-5xl font-black tracking-tight leading-none ${config.textColor}`}>
            {formatCurrency(config.value, currency)}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl font-black text-secondary">Sin deudas</span>
        </div>
      )}

      {/* Sublabel */}
      <p className="text-xs font-medium text-tertiary">{config.sublabel}</p>

      {/* Breakdown: owed ↔ owing (si hay ambas) */}
      {(totalOwed > 0.01 || totalOwing > 0.01) && (
        <div className="flex gap-4 mt-4 pt-4 border-t border-subtle">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-tertiary font-bold">Te deben</p>
            <p className="text-sm font-bold text-[#00DF81]">{formatCurrency(totalOwed, currency)}</p>
          </div>
          <div className="w-px bg-subtle" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-tertiary font-bold">Debés</p>
            <p className="text-sm font-bold text-[#F43F5E]">{formatCurrency(totalOwing, currency)}</p>
          </div>
        </div>
      )}
    </section>
  )
}
