'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/stores/auth.store'
import { ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string; requestId?: string }
  reset: () => void
}

/**
 * Boundary del shell autenticado. Su layout padre es el auth-guard de
 * (platform), que NO monta el AppShell (el AppShell vive a nivel
 * org/[orgId]); por eso acá no podemos mantener sidebar/topbar y caemos a
 * un estado sobrio centrado. Los errores dentro de una org son capturados
 * antes por org/[orgId]/error.tsx (que sí conserva el AppShell). El orgId
 * para "volver al inicio" se lee del store de auth.
 */
export default function PlatformError({ error, reset }: ErrorProps) {
  const t = useTranslations('errors.boundary')
  const orgId = useAuthStore((s) => s.organizationId ?? s.currentOrg?.id ?? null)

  useEffect(() => {
    console.error('[PlatformErrorBoundary]', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-3">
        <ErrorState
          error={error}
          onRetry={reset}
          title={t('title')}
          description={t('message')}
        />
        <div className="flex justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link href={orgId ? `/org/${orgId}` : '/login'}>
              {t('goHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
