// App layout: adaptativo Mobile (bottom nav) / Desktop (sidebar)
// Desktop: CSS Grid 250px sidebar + 1fr content

import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      {/* Desktop: Grid con sidebar */}
      <div className="lg:grid lg:grid-cols-[250px_1fr] lg:min-h-screen">

        {/* Sidebar — solo visible en desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:w-[250px] lg:z-20">
          <Sidebar />
        </aside>

        {/* Content area */}
        <main
          className="
            flex flex-col
            min-h-screen
            pb-20 lg:pb-0
            lg:ml-[250px]
            max-w-full
          "
        >
          <div className="flex-1 w-full max-w-2xl mx-auto px-4 lg:px-8 py-4 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav — solo visible en mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
