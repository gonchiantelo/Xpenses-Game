'use client'

import { useRouter } from 'next/navigation'

export default function FABAddExpense() {
  const router = useRouter()

  return (
    <button
      id="fab-add-expense"
      onClick={() => router.push('/expenses/add')}
      className="
        fixed bottom-20 right-5 lg:bottom-8 lg:right-8
        w-14 h-14 rounded-full z-20
        flex items-center justify-center
        text-2xl font-bold text-[#000F0A]
        transition-all duration-200
        hover:scale-110 active:scale-95
        focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40
      "
      style={{
        background: 'linear-gradient(135deg, #00DF81 0%, #2CC295 100%)',
        boxShadow: '0 4px 24px rgba(0,223,129,0.35), 0 8px 32px rgba(0,0,0,0.3)',
      }}
      aria-label="Agregar nuevo gasto"
      title="Agregar gasto"
    >
      +
    </button>
  )
}
