'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { KuroLogo } from '@/components/kuro/logo'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse">
            <KuroLogo forceDark size="md" />
          </div>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            Cargando
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}