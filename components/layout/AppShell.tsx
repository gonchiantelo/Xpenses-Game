'use client'

// AppShell — Maneja la navegación adaptativa en todas las rutas protegidas
// Mobile: Bottom Nav | Desktop: Sidebar (definido en el (app)/layout.tsx, pero
// para páginas que viven fuera de route-groups, se usa este componente).
// Solo muestra nav en rutas de la app (no en /login, /register, /onboarding)

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

const AUTH_ROUTES = ['/login', '/register', '/auth', '/onboarding']

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

  if (isAuthRoute) {
    // Rutas de auth: contenido centrado, sin navegación
    return (
      <div className="min-h-screen flex items-center justify-center bg-app px-4 py-8 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(0,223,129,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 w-full max-w-[400px]">
          {children}
        </div>
      </div>
    )
  }

  // Rutas de app: layout adaptativo
  return (
    <div className="min-h-screen bg-app">
      <div className="lg:grid lg:grid-cols-[250px_1fr] lg:min-h-screen">

        {/* Sidebar — solo desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:w-[250px] lg:z-20">
          <Sidebar />
        </aside>

        {/* Content */}
        <main className="flex flex-col min-h-screen pb-20 lg:pb-0 lg:ml-[250px]">
          <div className="flex-1 w-full max-w-2xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav — solo mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
