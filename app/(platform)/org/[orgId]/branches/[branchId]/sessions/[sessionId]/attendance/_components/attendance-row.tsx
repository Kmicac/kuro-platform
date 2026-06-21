'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, StickyNote, Trash2 } from 'lucide-react'

import {
  useRecordAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from '@/lib/hooks'
import { PersonAvatar } from '@/components/common/person-avatar'
import { notifySuccess } from '@/lib/utils/toast'
import { useAttendanceErrorHandler } from './use-attendance-error'
import { BeltBadge } from '@/components/kuro'
import { cn } from '@/lib/utils'
import {
  getAttendanceStatusLabelKey,
  getAttendanceStatusTone,
  isCheckedInAttendanceStatus,
} from '@/lib/attendance/attendance-status'
import type {
  AttendanceStatus,
  UpdateAttendanceBody,
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
  const currentNotes = item.attendance?.notes ?? null
  const hasNote = Boolean(currentNotes?.trim())

  const record = useRecordAttendance(sessionId)
  const update = useUpdateAttendance(item.studentId, sessionId)
  const remove = useDeleteAttendance(item.studentId, sessionId)

  const anyPending = record.isPending || update.isPending || remove.isPending

  // Un click en P/L/A/E: si ya hay registro → PATCH (corrección); si no → POST.
  const setStatus = (status: AttendanceStatus) => {
    if (hasRecord) {
      update.mutate(
        buildStatusCorrectionBody(status),
        {
          onSuccess: () => notifySuccess(t('success.updated')),
          onError: handleError,
        },
      )
    } else {
      record.mutate(
        { records: [buildStatusRecord(item.studentId, status)] },
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
  const noteDisabled = disabled || anyPending || !hasRecord
  const noteActionLabel = !hasRecord
    ? t('actions.noteRequiresRecord')
    : hasNote
      ? t('actions.editNote')
      : t('actions.addNote')

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4">
      {/* Alumno: avatar + nombre + faixa + intent */}
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar
          avatarUrl={item.student.avatarUrl}
          firstName={item.student.firstName}
          lastName={item.student.lastName}
          size="sm"
          className="h-9 w-9"
          fallbackClassName="text-[11px]"
        />
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
              'flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              current === status
                ? getActionActiveClassName(status)
                : 'border-border text-muted-foreground hover:border-border-medium hover:text-foreground',
            )}
          >
            {t(`statusShort.${status}`)}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          disabled={noteDisabled}
          aria-label={noteActionLabel}
          title={noteActionLabel}
          className={cn(
            'flex h-7 items-center justify-center gap-1 rounded-md border px-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
            hasNote
              ? 'border-primary/45 bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          <StickyNote className="h-3.5 w-3.5" />
          {hasNote && <span>{t('table.noteBadge')}</span>}
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

      {anyPending && (
        <div
          role="status"
          className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-3 sm:justify-end"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('actions.updating')}
        </div>
      )}

      <AttendanceNoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        sessionId={sessionId}
        studentId={item.studentId}
        studentName={`${item.student.firstName} ${item.student.lastName}`}
        currentStatus={current}
        currentNotes={currentNotes}
        hasRecord={hasRecord}
      />
    </li>
  )
}

// ── Status chip (sobrio, sin colores brillantes) ───────────────

function StatusChip({ status }: { status: AttendanceStatus | null }) {
  const t = useTranslations('attendance')
  const tone = getAttendanceStatusTone(status)
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-xs text-[var(--text-tertiary)]">
        {t(getAttendanceStatusLabelKey(status))}
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        tone === 'checkedIn'
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-amber-500/35 bg-amber-500/10 text-foreground',
      )}
    >
      {t(getAttendanceStatusLabelKey(status))}
    </span>
  )
}

function getActionActiveClassName(status: AttendanceStatus): string {
  if (isCheckedInAttendanceStatus(status)) {
    return 'border-primary/50 bg-primary/15 text-foreground'
  }
  return 'border-amber-500/45 bg-amber-500/10 text-foreground'
}

function buildStatusCorrectionBody(
  status: AttendanceStatus,
): UpdateAttendanceBody {
  return {
    status,
    correctionReasonCode: 'STATUS_CORRECTION',
    ...(status === 'EXCUSED' ? { reasonCode: 'OTHER' as const } : {}),
  }
}

function buildStatusRecord(
  studentId: string,
  status: AttendanceStatus,
) {
  return {
    studentId,
    status,
    ...(status === 'EXCUSED' ? { reasonCode: 'OTHER' as const } : {}),
  }
}
