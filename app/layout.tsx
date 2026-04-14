import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/Providers'
import AppShell from '@/components/layout/AppShell'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Xpenses Game — Dividí bien, gastá mejor',
  description: 'La app de gastos compartidos para parejas y amigos. Registrá, dividí y controlá tus finanzas en equipo.',
  keywords: ['gastos compartidos', 'finanzas', 'parejas', 'dividir gastos', 'presupuesto'],
  authors: [{ name: 'Xpenses Game' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Xpenses Game',
    description: 'Dividí bien. Gastá mejor. Jugá en equipo.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#000F0A' },
    { media: '(prefers-color-scheme: light)', color: '#F1F7F6' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="xpenses-theme"
        >
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
