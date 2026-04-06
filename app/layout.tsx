import type { Metadata, Viewport } from 'next'
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
  themeColor: '#0E0B1A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
