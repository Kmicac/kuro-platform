'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { ArrowLeft, CalendarDays, Clock, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  BeltBadge,
  ClassTypeChip,
  SessionStatusBadge,
} from '@/components/kuro'
import { PageHeader } from '@/components/shared'
import type { ClassSessionDetail } from '@/lib/api/types'

export interface AttendanceHeaderProps {
  session: ClassSessionDetail
  onBack: () => void
}

export function AttendanceHeader({
  session,
  onBack,
}: AttendanceHeaderProps) {
  const t = useTranslations('attendance')
  const tc = useTranslations('common')
  const format = useFormatter()

  const instructor = session.instructor
  const instructorName = instructor
    ? `${instructor.firstName} ${instructor.lastName}`
    : null

  return (
    <PageHeader
      eyebrow={t('page.title').toUpperCase()}
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
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {t('header.capacity')}: {session.capacity.enrolled}/
            {session.capacity.max}
          </span>
          {instructorName && (
            <span className="inline-flex items-center gap-1.5">
              {t('header.instructor')}: {instructorName}
              <BeltBadge
                rank={instructor?.primaryBelt ?? null}
                size="sm"
                showLabel={false}
              />
            </span>
          )}
        </span>
      }
      meta={
        <div className="flex items-center gap-2">
          <SessionStatusBadge status={session.status} />
          <ClassTypeChip classType={session.classType} />
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {tc('nav.back')}
          </Button>
        </div>
      }
    />
  )
}

type Formatter = ReturnType<typeof useFormatter>

function formatLongDate(format: Formatter, iso: string): string {
  try {
    return format.dateTime(new Date(iso), {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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
