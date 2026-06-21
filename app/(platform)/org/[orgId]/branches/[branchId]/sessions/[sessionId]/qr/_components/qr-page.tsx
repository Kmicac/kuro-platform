'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, CalendarDays } from 'lucide-react'

import { ApiError } from '@/lib/api/client'
import { parseQRError, type QRErrorInfo } from '@/lib/api/error-parsers'
import {
  useCapabilities,
  useIssueQRToken,
  useSession,
  useSessionRoster,
} from '@/lib/hooks'
import { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'
import { ErrorState, ForbiddenState, EmptyState } from '@/components/shared'
import { KuroLogo } from '@/components/kuro'
import { Button } from '@/components/ui/button'
import { notifyError } from '@/lib/utils/toast'
import type { QRTokenResponse } from '@/lib/api/types'
import { isCheckedInAttendanceStatus } from '@/lib/attendance/attendance-status'

import { QRClassInfo } from './qr-class-info'
import { QRDisplay } from './qr-display'
import { QRStatusSummary } from './qr-status-summary'
import { QRRosterPreview } from './qr-roster-preview'

export interface QRPageProps {
  orgId: string
  branchId: string
  sessionId: string
}

/** Polling del roster para reflejar check-ins ~en vivo. */
const ROSTER_POLL_MS = 30_000

export function QRPage({ orgId, branchId, sessionId }: QRPageProps) {
  const t = useTranslations('qr-checkin')
  const router = useRouter()

  const sessionQuery = useSession(sessionId)
  const rosterQuery = useSessionRoster(sessionId, { pollMs: ROSTER_POLL_MS })
  const caps = useCapabilities(orgId)
  const issue = useIssueQRToken(sessionId)
  const resolveRank = usePromotionRankResolver()

  const [token, setToken] = useState<QRTokenResponse | null>(null)
  const [qrError, setQrError] = useState<QRErrorInfo | null>(null)

  const goBack = () =>
    router.push(`/org/${orgId}/branches/${branchId}/sessions/${sessionId}`)

  const canValidate = Boolean(
    caps.data?.capabilities?.attendance?.canValidateAttendance,
  )

  const session = sessionQuery.data

  const generate = useCallback(() => {
    // No enviamos expiresInMinutes: la ventana la define el backend
    // (validFrom/validUntil). Generación permitida en cualquier momento.
    issue.mutate(
      {},
      {
        onSuccess: (data) => {
          setQrError(null)
          setToken(data)
        },
        onError: (error) => {
          // Errores estructurados de QR → banner contextual (no toast).
          const qrInfo = parseQRError(error)
          if (qrInfo) {
            setToken(null)
            return setQrError(qrInfo)
          }
          if (error instanceof ApiError && error.status === 403)
            return notifyError(t('errors.forbidden'))
          notifyError(t('errors.generationFailed'), error)
        },
      },
    )
  }, [issue, t])

  // Al expirar, limpiamos el token para mostrar el botón "Regenerar".
  const onExpire = useCallback(() => setToken(null), [])

  // ── States ─────────────────────────────────────────────────
  if (sessionQuery.isLoading || caps.isLoading) {
    return <FullscreenShell onBack={goBack}><QRSkeleton /></FullscreenShell>
  }

  const forbidden =
    sessionQuery.error instanceof ApiError && sessionQuery.error.status === 403
  if (forbidden || (caps.data && !canValidate)) {
    return (
      <FullscreenShell onBack={goBack}>
        <ForbiddenState
          title={t('errors.forbiddenTitle')}
          description={t('errors.forbiddenDescription')}
        />
      </FullscreenShell>
    )
  }

  if (
    sessionQuery.error instanceof ApiError &&
    sessionQuery.error.status === 404
  ) {
    return (
      <FullscreenShell onBack={goBack}>
        <EmptyState
          icon={CalendarDays}
          title={t('errors.notFoundTitle')}
          description={t('errors.notFoundDescription')}
        />
      </FullscreenShell>
    )
  }

  if (sessionQuery.error) {
    return (
      <FullscreenShell onBack={goBack}>
        <ErrorState
          title={t('errors.loadErrorTitle')}
          error={sessionQuery.error}
          onRetry={() => sessionQuery.refetch()}
        />
      </FullscreenShell>
    )
  }

  if (!session) return null

  const isCanceled = session.status === 'CANCELED'
  const rosterItems = rosterQuery.data?.items ?? []
  const checkedInCount = rosterItems.filter(
    (it) => isCheckedInAttendanceStatus(it.attendance?.status),
  ).length

  return (
    <FullscreenShell onBack={goBack} branchName={session.branch.name}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        {/* ÁREA 1 — Info de la clase */}
        <QRClassInfo session={session} />

        {/* ÁREA 2 — QR + capacidad */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <QRDisplay
            token={token}
            generating={issue.isPending}
            disabled={isCanceled}
            canceledMessage={isCanceled ? t('errors.sessionCanceled') : null}
            qrError={qrError}
            onGenerate={generate}
            onExpire={onExpire}
          />
          <QRStatusSummary
            checkedIn={checkedInCount}
            capacityMax={session.capacity.max}
          />
        </div>

        {/* ÁREA 3 — Roster de alumnos */}
        <QRRosterPreview
          items={rosterItems}
          isLoading={rosterQuery.isLoading}
          isError={rosterQuery.isError}
          error={rosterQuery.error}
          onRetry={() => rosterQuery.refetch()}
          resolveRank={resolveRank}
        />
      </div>
    </FullscreenShell>
  )
}

// ── Fullscreen shell (escapa al AppShell con fixed inset-0) ────

function FullscreenShell({
  children,
  onBack,
  branchName,
}: {
  children: React.ReactNode
  onBack: () => void
  branchName?: string
}) {
  const t = useTranslations('qr-checkin')

  // Bloquea el scroll del body mientras el overlay fullscreen está activo.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">
      {/* Barra superior mínima (sidebar implícito en horizontal). */}
      <header className="flex items-center gap-4 border-b border-border px-6 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {t('page.back')}
        </Button>
        <span className="h-4 w-px bg-border" aria-hidden />
        <KuroLogo size="sm" />
        {branchName && (
          <span className="truncate text-sm text-muted-foreground">
            {branchName}
          </span>
        )}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

function QRSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
        <div className="h-10 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-80 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    </div>
  )
}
