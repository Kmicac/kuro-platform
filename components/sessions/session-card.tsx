'use client'

import { useFormatter } from 'next-intl'
import { Users } from 'lucide-react'
import {
  ClassTypeChip,
  SessionStatusBadge,
} from '@/components/kuro'
import { PersonAvatar } from '@/components/common/person-avatar'
import type {
  CalendarItem,
  ClassSessionListItem,
  ClassSessionStatus,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * Mini-card horizontal de una sesión. Reusable desde:
 *  - Agenda de hoy del Branch Dashboard
 *  - Resultados de búsqueda de clases
 *  - Vista LIST del Event Manager
 *
 * Acepta ambos shapes: ClassSessionListItem (recursos de clases) o
 * CalendarItem (training-calendar embebido). El componente normaliza
 * internamente y muestra siempre lo mismo.
 */
export interface SessionCardProps {
  session: ClassSessionListItem | CalendarItem
  onClick?: (sessionId: string) => void
  className?: string
}

export function SessionCard({
  session,
  onClick,
  className,
}: SessionCardProps) {
  const format = useFormatter()
  const v = normalize(session)
  const isClickable = Boolean(onClick)

  const formatTime = (iso: string): string => {
    try {
      return format.dateTime(new Date(iso), {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  const handleClick = () => onClick?.(v.id)
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(v.id)
    }
  }

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKey : undefined}
      className={cn(
        'group flex items-stretch gap-3 rounded-lg border border-border bg-card p-3 transition-all',
        isClickable &&
          'cursor-pointer hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        className
      )}
    >
      {/* Hora a la izquierda */}
      <div className="flex flex-col items-center justify-center min-w-[58px] border-r border-border/60 pr-3">
        <span className="text-base font-semibold text-foreground tabular-nums leading-none">
          {formatTime(v.startAt)}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
          {formatTime(v.endAt)}
        </span>
      </div>

      {/* Detalle */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start gap-2 flex-wrap">
          <p
            className={cn(
              'text-sm font-medium text-foreground truncate',
              isClickable && 'group-hover:text-primary transition-colors'
            )}
          >
            {v.title}
          </p>
          <ClassTypeChip classType={v.classType} variant="dot" />
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
          {v.capacity && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {v.capacity.enrolled ?? '—'}/{v.capacity.max ?? '—'}
            </span>
          )}
          {v.instructorName && (
            <span className="inline-flex items-center gap-1 truncate">
              <PersonAvatar
                avatarUrl={v.instructorAvatarUrl}
                displayName={v.instructorName}
                firstName={v.instructorFirstName}
                lastName={v.instructorLastName}
                size="xs"
              />
              {v.instructorName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center pl-2">
        <SessionStatusBadge status={v.status} hideIcon />
      </div>
    </div>
  )
}

// ── Normalización ──────────────────────────────────────────

interface NormalizedSession {
  id: string
  title: string
  startAt: string
  endAt: string
  classType: string
  status: ClassSessionStatus | string
  capacity?: { max?: number; enrolled?: number }
  instructorName?: string
  instructorFirstName?: string
  instructorLastName?: string
  instructorAvatarUrl?: string | null
}

function normalize(
  s: ClassSessionListItem | CalendarItem
): NormalizedSession {
  // CalendarItem tiene `type === 'CLASS_SESSION' | 'ACADEMY_EVENT'`
  // y `classSession: { classType, capacity, ... } | null`.
  if ('type' in s && 'classSession' in s) {
    const calendarItem = s
    const inst = calendarItem.instructor
    return {
      id: calendarItem.id,
      title: calendarItem.title,
      startAt: calendarItem.startAt,
      endAt: calendarItem.endAt,
      classType: calendarItem.classSession?.classType ?? 'PRIVATE',
      status: calendarItem.status,
      capacity: calendarItem.classSession?.capacity
        ? { max: calendarItem.classSession.capacity }
        : undefined,
      instructorName: inst
        ? inst.displayName ??
          inst.fullName ??
          joinName(inst.firstName, inst.lastName)
        : undefined,
      instructorFirstName: inst?.firstName,
      instructorLastName: inst?.lastName,
      instructorAvatarUrl: inst?.avatarUrl,
    }
  }

  // ClassSessionListItem (shape del resource API)
  const item = s as ClassSessionListItem
  const inst = item.instructor
  return {
    id: item.id,
    title: item.title,
    startAt: item.startAt,
    endAt: item.endAt,
    classType: String(item.classType),
    status: item.status,
    capacity: item.capacity,
    instructorName: inst
      ? inst.displayName ?? joinName(inst.firstName, inst.lastName)
      : undefined,
    instructorFirstName: inst?.firstName,
    instructorLastName: inst?.lastName,
    instructorAvatarUrl: inst?.avatarUrl,
  }
}

function joinName(first?: string, last?: string): string | undefined {
  const full = [first, last].filter(Boolean).join(' ').trim()
  return full || undefined
}
