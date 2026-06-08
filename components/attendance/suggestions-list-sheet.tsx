'use client'

import { useState } from 'react'
import { useFormatter, useNow, useTranslations } from 'next-intl'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared'
import { ApiError } from '@/lib/api/client'
import { useCancelSuggestion, useSessionSuggestions } from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import { cn } from '@/lib/utils'
import type {
  AttendanceSuggestionListItem,
  AttendanceSuggestionStatus,
} from '@/lib/api/types'

export interface SuggestionsListSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  branchId: string
  sessionId: string
  sessionTitle: string
  /** ISO de inicio de la sesión, para el subheader. */
  sessionStartAt: string
}

// Estilo del badge por estado (paleta Night Ops, tonos semánticos sobrios).
const STATUS_BADGE = {
  PENDING: 'surface-warning',
  ACCEPTED: 'border-primary/40 bg-primary/10 text-primary',
  DECLINED: 'surface-danger',
  CANCELED: 'border-border text-muted-foreground',
  EXPIRED: 'border-border text-muted-foreground',
} as const satisfies Record<AttendanceSuggestionStatus, string>

// Map estado → key i18n (sin concatenar keys dinámicas: type-safe).
const STATUS_LABEL_KEY = {
  PENDING: 'status.PENDING',
  ACCEPTED: 'status.ACCEPTED',
  DECLINED: 'status.DECLINED',
  CANCELED: 'status.CANCELED',
  EXPIRED: 'status.EXPIRED',
} as const satisfies Record<AttendanceSuggestionStatus, string>

/**
 * Sheet derecho con la lista completa de attendance suggestions de una sesión
 * (lado operador). Permite cancelar las pendientes con confirmación previa.
 * Gateado por capability en el caller (`attendance.canSuggestAttendance`).
 */
export function SuggestionsListSheet({
  open,
  onOpenChange,
  orgId,
  branchId,
  sessionId,
  sessionTitle,
  sessionStartAt,
}: SuggestionsListSheetProps) {
  const t = useTranslations('class-detail.suggestions.listSheet')
  const format = useFormatter()

  const query = useSessionSuggestions(orgId, branchId, sessionId, { enabled: open })
  const items = query.data?.items ?? []

  const subheaderDate = safeDate(format, sessionStartAt)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <div className="border-b border-border px-6 py-5 pr-12">
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>
            {t('subheader', { sessionTitle, date: subheaderDate })}
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {query.isLoading ? (
            <SkeletonRows />
          ) : query.isError ? (
            <ErrorState
              title={t('errorTitle')}
              error={query.error}
              onRetry={() => query.refetch()}
            />
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t('empty')}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  orgId={orgId}
                  branchId={branchId}
                  sessionId={sessionId}
                />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Row ────────────────────────────────────────────────────────

interface SuggestionRowProps {
  suggestion: AttendanceSuggestionListItem
  orgId: string
  branchId: string
  sessionId: string
}

function SuggestionRow({
  suggestion,
  orgId,
  branchId,
  sessionId,
}: SuggestionRowProps) {
  const t = useTranslations('class-detail.suggestions.listSheet')
  const format = useFormatter()
  const now = useNow()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const cancel = useCancelSuggestion(orgId, branchId, sessionId)

  const { firstName, lastName } = suggestion.student
  const fullName = `${firstName} ${lastName}`.trim()
  const isPending = suggestion.status === 'PENDING'

  const onConfirmCancel = () => {
    cancel.mutate(
      { suggestionId: suggestion.id, nowIso: now.toISOString() },
      {
        onSuccess: () => {
          notifySuccess(t('cancelSuccess'))
          setConfirmOpen(false)
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403)
            return notifyError(t('cancelForbidden'))
          notifyError(t('cancelError'), error)
        },
      },
    )
  }

  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
        style={{
          background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
          color: 'var(--primary)',
          border: '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
        }}
        aria-hidden
      >
        {initials(firstName, lastName)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-foreground">{fullName}</span>
          <Badge
            variant="outline"
            className={cn('flex-shrink-0', STATUS_BADGE[suggestion.status])}
          >
            {t(STATUS_LABEL_KEY[suggestion.status])}
          </Badge>
        </div>

        {suggestion.message && (
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {suggestion.message}
          </p>
        )}

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {timestampLabel(suggestion, t, format, now)}
          </span>
          {isPending && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              {t('actions.cancel')}
            </Button>
          )}
        </div>
      </div>

      {/* Confirmación antes de cancelar (rol AlertDialog sobre el primitivo Dialog). */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('actions.confirmCancel.title')}</DialogTitle>
            <DialogDescription>
              {t('actions.confirmCancel.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={cancel.isPending}
            >
              {t('actions.confirmCancel.back')}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmCancel}
              disabled={cancel.isPending}
            >
              {t('actions.confirmCancel.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}

// ── Helpers ────────────────────────────────────────────────────

type SheetTranslator = ReturnType<
  typeof useTranslations<'class-detail.suggestions.listSheet'>
>
type Formatter = ReturnType<typeof useFormatter>

/** Texto de timestamp contextual según el estado de la suggestion. */
function timestampLabel(
  s: AttendanceSuggestionListItem,
  t: SheetTranslator,
  format: Formatter,
  now: Date,
): string {
  if (s.status === 'CANCELED' && s.canceledAt) {
    return t('canceledAt', { time: relative(format, s.canceledAt, now) })
  }
  if (
    (s.status === 'ACCEPTED' || s.status === 'DECLINED') &&
    s.respondedAt
  ) {
    return t('respondedAt', { time: relative(format, s.respondedAt, now) })
  }
  return t('sentAgo', { time: relative(format, s.createdAt, now) })
}

function relative(format: Formatter, iso: string, now: Date): string {
  try {
    return format.relativeTime(new Date(iso), now)
  } catch {
    return '—'
  }
}

function safeDate(format: Formatter, iso: string): string {
  try {
    return format.dateTime(new Date(iso), {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—'
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-border">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-start gap-3 py-3">
          <span className="mt-0.5 h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted/60" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
          </div>
        </li>
      ))}
    </ul>
  )
}
