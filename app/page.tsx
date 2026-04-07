'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// For the prototype, we always redirect to the login page
export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/login')
  }, [router])
  return null
}
