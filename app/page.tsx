// Root /app/page.tsx — redirige al dashboard
// El middleware ya maneja autenticación, esto es por compatibilidad
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
