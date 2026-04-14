// Auth layout: centrado en el viewport, sin navegación
// Para /login, /register

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 py-8 relative overflow-hidden">
      {/* Ambient glow - sutil, sin resplandor agresivo */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(0,223,129,0.08) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 w-full max-w-[400px]">
        {children}
      </div>
    </div>
  )
}
