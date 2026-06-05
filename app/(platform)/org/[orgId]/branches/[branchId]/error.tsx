'use client'

import { useEffect } from 'react'
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
 * Boundary scoped a la filial (branch). Más granular que org/error.tsx:
 * un throw en una pantalla branch-scoped (sesiones, asistencia, padrón) se
 * contiene acá sin tirar el AppShell (montado por el layout de la org). El
 * orgId/branchId salen de la ruta (useParams) para ofrecer salidas claras.
 */
export default function BranchError({ error, reset }: ErrorProps) {
  const t = useTranslations('errors.boundary')
  const params = useParams<{ orgId: string; branchId: string }>()

  useEffect(() => {
    console.error('[BranchErrorBoundary]', error)
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
