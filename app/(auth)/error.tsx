'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { KuroLogo } from '@/components/kuro/logo'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string; requestId?: string }
  reset: () => void
}

/**
 * Boundary del portal de acceso (login/signup). Sin AppShell: layout sobrio
 * centrado, consistente con el bootstrap de sesión. Reintentar (reset) o
 * volver al login.
 */
export default function AuthError({ error, reset }: ErrorProps) {
  const t = useTranslations('errors.boundary')
  const router = useRouter()
  const requestId = error.requestId

  useEffect(() => {
    console.error('[AuthErrorBoundary]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <KuroLogo forceDark size="md" />
        <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t('auth.title')}
          </p>
          <p className="text-xs text-muted-foreground">{t('auth.message')}</p>
        </div>
        {requestId && (
          <p className="font-mono text-[10px] text-muted-foreground/70">
            {requestId}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            {t('retry')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace('/login')}
          >
            {t('auth.backToLogin')}
          </Button>
        </div>
      </div>
    </div>
  )
}
