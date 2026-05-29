'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api/client'
import { KuroLogo } from '@/components/kuro/logo'
import { Button } from '@/components/ui/button'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [refreshAttempted, setRefreshAttempted] = useState(false)
  const [bootstrapError, setBootstrapError] = useState<unknown>(null)

  useEffect(() => {
    if (isAuthenticated) return

    // Token no está en memoria (F5 / nueva pestaña).
    // authApi.refresh() rehidrata: GET /auth/csrf → POST /auth/refresh.
    //  - resuelve token → sesión restaurada
    //  - resuelve null  → 401 (sin sesión) → /login limpio
    //  - rechaza        → error real (403 origin / network) → error state
    let cancelled = false
    authApi
      .refresh()
      .then((newToken) => {
        if (cancelled) return
        if (!newToken) router.replace('/login')
        setRefreshAttempted(true)
      })
      .catch((err) => {
        if (cancelled) return
        setBootstrapError(err)
        setRefreshAttempted(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Error real durante el bootstrap → no quedar colgado en "Restaurando".
  if (bootstrapError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4 max-w-sm px-6 text-center">
          <KuroLogo forceDark size="md" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              No se pudo restaurar la sesión
            </p>
            <p className="text-xs text-muted-foreground">
              Hubo un problema de conexión o de permisos. Reintentá; si el
              problema persiste, volvé a iniciar sesión.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.replace('/login')}
            >
              Ir a login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const bootstrapping = !isAuthenticated && !refreshAttempted

  if (bootstrapping) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-pulse">
            <KuroLogo forceDark size="md" />
          </div>
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            Restaurando sesión
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}
