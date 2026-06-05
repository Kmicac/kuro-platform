'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { CalendarDays, Clock, Timer } from 'lucide-react'

import { BeltBadge, ClassTypeChip } from '@/components/kuro'
import type { ClassSessionDetail } from '@/lib/api/types'

export interface QRClassInfoProps {
  session: ClassSessionDetail
}

export function QRClassInfo({ session }: QRClassInfoProps) {
  const t = useTranslations('qr-checkin.info')
  const format = useFormatter()

  const start = new Date(session.startAt)
  const end = new Date(session.endAt)
  const durationMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000))

  const instructor = session.instructor

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ClassTypeChip classType={session.classType} />
      </div>

      <h1 className="text-3xl font-medium tracking-tight text-foreground">
        {session.title}
      </h1>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" />
          {formatLongDate(format, session.startAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {formatTime(format, session.startAt)} – {formatTime(format, session.endAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Timer className="h-4 w-4" />
          {t('duration')}: {t('durationMinutes', { minutes: durationMin })}
        </span>
      </div>

      {instructor && (
        <div className="flex items-center gap-3 pt-1">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              color: 'var(--primary)',
              border:
                '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            }}
          >
            {`${instructor.firstName?.[0] ?? ''}${instructor.lastName?.[0] ?? ''}`.toUpperCase() ||
              '—'}
          </span>
          <div>
            <p className="text-xs text-[var(--text-tertiary)]">
              {t('instructor')}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-sm text-foreground">
                {instructor.firstName} {instructor.lastName}
              </span>
              <BeltBadge rank={instructor.primaryBelt} size="sm" showLabel={false} />
            </div>
          </div>
        </div>
      )}
    </section>
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
