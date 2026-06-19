'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Pencil,
  Send,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  BeltBadge,
  ClassTypeChip,
  SessionStatusBadge,
  useClassTypeLabel,
} from '@/components/kuro'
import { PageHeader } from '@/components/shared'
import { PersonAvatar } from '@/components/common/person-avatar'
import { SessionDialog } from '@/components/sessions/session-dialog'
import { CancelSessionDialog } from '@/components/sessions/cancel-session-dialog'
import { SuggestAttendanceDialog } from '@/components/attendance/suggest-attendance-dialog'
import type { ClassSessionDetail } from '@/lib/api/types'

export interface SessionDetailHeaderProps {
  session: ClassSessionDetail
  orgId: string
  branchId: string
  canManage: boolean
  canValidate: boolean
  canSuggest: boolean
  onBack: () => void
  onCanceled: () => void
}

export function SessionDetailHeader({
  session,
  orgId,
  branchId,
  canManage,
  canValidate,
  canSuggest,
  onBack,
  onCanceled,
}: SessionDetailHeaderProps) {
  const t = useTranslations('class-detail')
  const format = useFormatter()
  const classTypeLabel = useClassTypeLabel()
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)

  const isCanceled = session.status === 'CANCELED'
  const isEditable = session.status === 'SCHEDULED'
  const sessionBranchId = session.branchId || branchId
  const instructor = session.instructor

  const durationMin = Math.max(
    0,
    Math.round(
      (new Date(session.endAt).getTime() -
        new Date(session.startAt).getTime()) /
        60_000,
    ),
  )

  const goToAttendance = () =>
    router.push(
      `/org/${orgId}/branches/${sessionBranchId}/sessions/${session.id}/attendance`,
    )

  return (
    <>
      <PageHeader
        eyebrow={classTypeLabel(session.classType).toUpperCase()}
        title={session.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatLongDate(format, session.startAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(format, session.startAt)} –{' '}
              {formatTime(format, session.endAt)}
              <span className="text-[var(--text-tertiary)]">
                ({t('header.duration', { minutes: durationMin })})
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              {t('header.instructor')}:{' '}
              {instructor ? (
                <span className="inline-flex items-center gap-1.5">
                  <PersonAvatar
                    avatarUrl={instructor.avatarUrl}
                    firstName={instructor.firstName}
                    lastName={instructor.lastName}
                    size="xs"
                    className="h-5 w-5"
                    fallbackClassName="text-[8px]"
                  />
                  <span>
                    {instructor.firstName} {instructor.lastName}
                  </span>
                  <BeltBadge
                    rank={instructor.primaryBelt}
                    size="sm"
                    showLabel={false}
                  />
                </span>
              ) : (
                <span className="text-[var(--text-tertiary)]">
                  {t('header.noInstructor')}
                </span>
              )}
            </span>
          </span>
        }
        meta={
          <div className="flex items-center gap-2">
            <SessionStatusBadge status={session.status} />
            <ClassTypeChip classType={session.classType} />
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('back')}
            </Button>
          </div>
        }
      />

      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2">
        {canValidate && (
          <Button
            variant="default"
            size="sm"
            disabled={isCanceled}
            title={isCanceled ? t('actions.notAvailableForStatus') : undefined}
            onClick={goToAttendance}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            {t('actions.markAttendance')}
          </Button>
        )}
        {canSuggest && (
          <Button
            variant="outline"
            size="sm"
            disabled={isCanceled}
            title={isCanceled ? t('actions.notAvailableForStatus') : undefined}
            onClick={() => setSuggestOpen(true)}
          >
            <Send className="h-3.5 w-3.5" />
            {t('actions.suggest')}
          </Button>
        )}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            disabled={!isEditable}
            title={!isEditable ? t('actions.notAvailableForStatus') : undefined}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('actions.edit')}
          </Button>
        )}
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={!isEditable}
            title={!isEditable ? t('actions.notAvailableForStatus') : undefined}
            onClick={() => setCancelOpen(true)}
          >
            <Ban className="h-3.5 w-3.5" />
            {t('actions.cancel')}
          </Button>
        )}
      </div>

      <SessionDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        sessionId={session.id}
      />
      <CancelSessionDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        sessionId={session.id}
        sessionTitle={session.title}
        sessionStartAt={session.startAt}
        sessionEndAt={session.endAt}
        onSuccess={onCanceled}
      />
      {canSuggest && (
        <SuggestAttendanceDialog
          open={suggestOpen}
          onOpenChange={setSuggestOpen}
          sessionId={session.id}
          branchId={sessionBranchId}
          orgId={orgId}
          excludeStudentIds={[]}
        />
      )}
    </>
  )
}

type Formatter = ReturnType<typeof useFormatter>

function formatLongDate(format: Formatter, iso: string): string {
  try {
    return format.dateTime(new Date(iso), {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatTime(format: Formatter, iso: string): string {
  try {
    return format.dateTime(new Date(iso), { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}
