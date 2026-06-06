'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ErrorState } from '@/components/shared'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string; requestId?: string }
  reset: () => void
}

/**
 * Boundary scoped a la organización. Se renderiza dentro del AppShell (su
 * layout padre, org/[orgId]/layout, monta sidebar + topbar), así un throw
 * de render en cualquier pantalla de la org no tira el shell: el usuario
 * conserva navegación y contexto. El orgId sale de la ruta (useParams).
 */
export default function OrgError({ error, reset }: ErrorProps) {
  const t = useTranslations('errors.boundary')
  const params = useParams<{ orgId: string }>()

  useEffect(() => {
    Sentry.captureException(error)
    if (process.env.NODE_ENV === 'development') {
      console.error('[OrgErrorBoundary]', error)
    }
  }, [error])

  return (
    <div className="space-y-3 p-6">
      <ErrorState
        error={error}
        onRetry={reset}
        title={t('title')}
        description={t('message')}
      />
      {params.orgId && (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/org/${params.orgId}`}>{t('goHome')}</Link>
        </Button>
      )}
    </div>
  )
}
