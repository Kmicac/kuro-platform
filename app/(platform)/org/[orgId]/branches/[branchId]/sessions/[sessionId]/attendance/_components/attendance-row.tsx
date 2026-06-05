'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StickyNote, Trash2 } from 'lucide-react'

import {
  useRecordAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from '@/lib/hooks'
import { notifySuccess } from '@/lib/utils/toast'
import { useAttendanceErrorHandler } from './use-attendance-error'
import { BeltBadge } from '@/components/kuro'
import { cn } from '@/lib/utils'
import type {
  AttendanceStatus,
  PromotionRankCatalogEntry,
  TechnicalRosterItem,
} from '@/lib/api/types'

import { AttendanceNoteDialog } from './attendance-note-dialog'

export interface AttendanceRowProps {
  item: TechnicalRosterItem
  sessionId: string
  canCorrect: boolean
  disabled: boolean
  beltEntry: PromotionRankCatalogEntry | null
}

const STATUSES: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED']

/** Keys i18n del aria-label por status (estáticas → type-safe). */
const ACTION_LABEL_KEY = {
  PRESENT: 'actions.markPresent',
  LATE: 'actions.markLate',
  ABSENT: 'actions.markAbsent',
  EXCUSED: 'actions.markExcused',
} as const

/** Iniciales para el avatar. */
function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—'
}

export function AttendanceRow({
  item,
  sessionId,
  canCorrect,
  disabled,
  beltEntry,
}: AttendanceRowProps) {
  const t = useTranslations('attendance')
  const handleError = useAttendanceErrorHandler()
  const [noteOpen, setNoteOpen] = useState(false)

  const current = item.attendance?.status ?? null
  const hasRecord = item.attendance != null

  const record = useRecordAttendance(sessionId)
  const update = useUpdateAttendance(item.studentId, sessionId)
  const remove = useDeleteAttendance(item.studentId, sessionId)

  const anyPending = record.isPending || update.isPending || remove.isPending

  // Un click en P/L/A/E: si ya hay registro → PATCH (corrección); si no → POST.
  const setStatus = (status: AttendanceStatus) => {
    if (hasRecord) {
      update.mutate(
        { status, correctionReasonCode: 'STATUS_CORRECTION' },
        {
          onSuccess: () => notifySuccess(t('success.updated')),
          onError: handleError,
        },
      )
    } else {
      record.mutate(
        { records: [{ studentId: item.studentId, status }] },
        {
          onSuccess: () => notifySuccess(t('success.marked')),
          onError: handleError,
        },
      )
    }
  }

  const onRemove = () => {
    remove.mutate(undefined, {
      onSuccess: () => notifySuccess(t('success.removed')),
      onError: handleError,
    })
  }

  // Si ya hay un registro y NO puede corregir, los toggles se deshabilitan
  // (solo podría registrar nuevos, no cambiar existentes).
  const toggleDisabled = disabled || anyPending || (hasRecord && !canCorrect)

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4">
      {/* Alumno: avatar + nombre + faixa + intent */}
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={{
            background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
            color: 'var(--primary)',
            border:
              '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
          }}
        >
          {initials(item.student.firstName, item.student.lastName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">
            {item.student.firstName} {item.student.lastName}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <BeltBadge
              rank={beltEntry}
              stripes={item.student.currentStripes}
              size="sm"
              showLabel={false}
            />
            {item.intent ? (
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t('table.expectedBadge')}
              </span>
            ) : (
              <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
                {t('table.walkInBadge')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Estado actual (chip sutil) */}
      <div className="sm:justify-self-start">
        <StatusChip status={current} />
      </div>

      {/* Acciones: toggles P/L/A/E + nota + eliminar */}
      <div className="flex items-center gap-1 sm:justify-self-end">
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatus(status)}
            disabled={toggleDisabled}
            aria-pressed={current === status}
            aria-label={t(ACTION_LABEL_KEY[status])}
            title={t(ACTION_LABEL_KEY[status])}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              current === status
                ? 'border-primary/50 bg-primary/15 text-foreground'
                : 'border-border text-muted-foreground hover:border-border-medium hover:text-foreground',
            )}
          >
            {t(`status.${status}`).charAt(0)}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          disabled={disabled}
          aria-label={t('actions.addNote')}
          title={t('actions.addNote')}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <StickyNote className="h-3.5 w-3.5" />
        </button>

        {hasRecord && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled || anyPending || !canCorrect}
            aria-label={t('actions.remove')}
            title={t('actions.remove')}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AttendanceNoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        sessionId={sessionId}
        studentId={item.studentId}
        studentName={`${item.student.firstName} ${item.student.lastName}`}
        currentStatus={current}
        hasRecord={hasRecord}
      />
    </li>
  )
}

// ── Status chip (sobrio, sin colores brillantes) ───────────────

function StatusChip({ status }: { status: AttendanceStatus | null }) {
  const t = useTranslations('attendance.status')
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-xs text-[var(--text-tertiary)]">
        {t('pending')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-foreground">
      {t(status)}
    </span>
  )
}
