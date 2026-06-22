'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Loader2, RefreshCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/lib/hooks'
import { cn } from '@/lib/utils'
import type { NotificationItem } from '@/lib/api/types'

const PAGE = 1
const LIMIT = 20

type NotificationsTranslator = ReturnType<typeof useTranslations<'notifications'>>
interface NotificationBellProps {
  orgId: string
}

export function NotificationBell({ orgId }: NotificationBellProps) {
  const t = useTranslations('notifications')
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const unreadQuery = useUnreadNotificationsCount(orgId)
  const notificationsQuery = useNotifications(orgId, {
    page: PAGE,
    limit: LIMIT,
    enabled: open,
  })
  const markRead = useMarkNotificationRead(orgId)
  const markAllRead = useMarkAllNotificationsRead(orgId)
  const { refetch: refetchUnreadCount } = unreadQuery
  const { refetch: refetchNotifications } = notificationsQuery

  const unreadCount = unreadQuery.data?.unreadCount ?? 0
  const items = notificationsQuery.data?.items ?? []
  const hasUnreadItems = items.some((item) => !item.readAt)
  const [markingNotificationId, setMarkingNotificationId] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (!open) return
    refetchUnreadCount()
    refetchNotifications()
  }, [open, refetchNotifications, refetchUnreadCount])

  const badgeLabel = useMemo(
    () => t('bell.unreadCount', { count: unreadCount }),
    [t, unreadCount],
  )

  const handleNotificationClick = async (notification: NotificationItem) => {
    const href = getNotificationTargetHref(orgId, notification)
    if (markingNotificationId === notification.id) return

    try {
      if (!notification.readAt) {
        setMarkingNotificationId(notification.id)
        await markRead.mutateAsync(notification.id)
      }
      if (href) {
        setOpen(false)
        router.push(href)
      }
    } finally {
      setMarkingNotificationId(null)
    }
  }

  const handleMarkOneRead = async (notificationId: string) => {
    if (markingNotificationId === notificationId) return

    try {
      setMarkingNotificationId(notificationId)
      await markRead.mutateAsync(notificationId)
    } finally {
      setMarkingNotificationId(null)
    }
  }

  const handleMarkAllRead = () => {
    if (!hasUnreadItems && unreadCount === 0) return
    markAllRead.mutate()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={t('bell.label')}
          aria-label={
            unreadCount > 0 ? badgeLabel : t('bell.label')
          }
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell size={15} aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              {t('panel.title')}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {t('panel.total', {
                total: notificationsQuery.data?.meta.total ?? items.length,
              })}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleMarkAllRead}
            disabled={
              markAllRead.isPending || (!hasUnreadItems && unreadCount === 0)
            }
          >
            {markAllRead.isPending ? t('panel.markingRead') : t('panel.markAllRead')}
          </Button>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="flex items-center gap-2 px-3 py-6 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('panel.loading')}
          </div>
        ) : notificationsQuery.isError ? (
          <div className="space-y-3 px-3 py-5">
            <p className="text-sm text-destructive">{t('panel.error')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => notificationsQuery.refetch()}
              disabled={notificationsQuery.isFetching}
            >
              {notificationsQuery.isFetching ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
              )}
              {t('panel.retry')}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              {t('panel.empty')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('panel.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto py-1">
            {items.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                orgId={orgId}
                t={t}
                markReadPending={markingNotificationId === notification.id}
                onClick={() => handleNotificationClick(notification)}
                onMarkRead={() => handleMarkOneRead(notification.id)}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface NotificationListItemProps {
  notification: NotificationItem
  orgId: string
  t: NotificationsTranslator
  markReadPending: boolean
  onClick: () => void
  onMarkRead: () => void
}

function NotificationListItem({
  notification,
  orgId,
  t,
  markReadPending,
  onClick,
  onMarkRead,
}: NotificationListItemProps) {
  const unread = !notification.readAt
  const display = getNotificationDisplay(notification, t)
  const href = getNotificationTargetHref(orgId, notification)

  return (
    <div
      className={cn(
        'flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/70',
        unread && 'bg-primary/5',
      )}
    >
      <span
        className={cn(
          'mt-1 h-2 w-2 flex-shrink-0 rounded-full',
          unread ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
        aria-hidden
      />
      <button
        type="button"
        onClick={onClick}
        disabled={markReadPending}
        className="min-w-0 flex-1 text-left disabled:cursor-wait"
      >
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm leading-snug text-foreground',
              unread && 'font-semibold',
            )}
          >
            {display.title}
          </span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            {formatRelativeDate(notification.createdAt, t)}
          </span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted-foreground">
          {display.description}
        </span>
        <span className="mt-2 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] uppercase text-muted-foreground">
            {href ? t('panel.openTarget') : t('panel.noTarget')}
          </span>
        </span>
      </button>
      {unread && (
        <button
          type="button"
          onClick={onMarkRead}
          disabled={markReadPending}
          className="mt-auto inline-flex h-6 flex-shrink-0 items-center gap-1 rounded px-2 text-[11px] font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
        >
          {markReadPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          {t('panel.markAsRead')}
        </button>
      )}
    </div>
  )
}

export function getNotificationTargetHref(
  orgId: string,
  notification: NotificationItem,
): string | null {
  const resourceType = notification.resourceType.toUpperCase()
  const payload = getPayloadRecord(notification.payload)
  const branchId = readPayloadString(payload, 'branchId', 'targetBranchId')
  const sessionId =
    readPayloadString(payload, 'classSessionId', 'sessionId') ??
    (resourceType === 'CLASS_SESSION' ? notification.resourceId : null)
  const studentId =
    readPayloadString(payload, 'studentId', 'targetStudentId') ??
    (resourceType === 'STUDENT' ? notification.resourceId : null)
  const intakeRequestId =
    readPayloadString(payload, 'intakeRequestId', 'requestId') ??
    (resourceType === 'ACADEMY_INTAKE_REQUEST' ? notification.resourceId : null)

  if (
    notification.type === 'ATTENDANCE_SUGGESTION' &&
    branchId &&
    sessionId
  ) {
    return `/org/${orgId}/branches/${branchId}/sessions/${sessionId}/attendance`
  }

  if (resourceType === 'CLASS_SESSION' && branchId && sessionId) {
    return `/org/${orgId}/branches/${branchId}/sessions/${sessionId}`
  }

  if (
    (resourceType === 'INTAKE_REQUEST' ||
      resourceType === 'ACADEMY_INTAKE_REQUEST' ||
      notification.type === 'ACADEMY_INTAKE_REQUEST_CREATED') &&
    branchId
  ) {
    const query = intakeRequestId
      ? `?requestId=${encodeURIComponent(intakeRequestId)}`
      : ''
    return `/org/${orgId}/branches/${branchId}/intake${query}`
  }

  if (
    (resourceType === 'STUDENT' ||
      notification.type === 'TRAINING_NOTE_VISIBLE' ||
      notification.type === 'TRAINING_NOTE_COACH_REVIEW') &&
    studentId
  ) {
    return `/org/${orgId}/students/${studentId}`
  }

  return null
}

type NotificationDisplay = {
  title: string
  description: string
}

export function getNotificationDisplay(
  notification: NotificationItem,
  t: NotificationsTranslator,
): NotificationDisplay {
  const type = notification.type
  const payload = getPayloadRecord(notification.payload)
  const knownType = isKnownNotificationType(type)

  return {
    title: getNotificationTitle(type, t),
    description:
      (knownType ? getPayloadDescription(type, payload, t) : null) ??
      getNotificationDescription(type, t),
  }
}

function isKnownNotificationType(type: string): boolean {
  switch (type) {
    case 'ANNOUNCEMENT_PUBLISHED':
    case 'INVITATION_ACCEPTED':
    case 'ACADEMY_INTAKE_REQUEST_CREATED':
    case 'ATTENDANCE_SUGGESTION':
    case 'ATTENDANCE_FOLLOW_UP_ASSIGNED':
    case 'INSTITUTIONAL_REQUEST_ACTION_REQUIRED':
    case 'INSTITUTIONAL_REQUEST_ASSIGNED':
    case 'INSTITUTIONAL_REQUEST_CLOSED':
    case 'INSTITUTIONAL_REQUEST_REMINDER':
    case 'INSTITUTIONAL_REQUEST_ESCALATED':
    case 'TRAINING_NOTE_VISIBLE':
    case 'TRAINING_NOTE_COACH_REVIEW':
      return true
    default:
      if (process.env.NODE_ENV === 'development') {
        console.debug('[notifications] Unknown notification type', type)
      }
      return false
  }
}

function getNotificationTitle(type: string, t: NotificationsTranslator): string {
  switch (type) {
    case 'ANNOUNCEMENT_PUBLISHED':
      return t('types.ANNOUNCEMENT_PUBLISHED.title')
    case 'INVITATION_ACCEPTED':
      return t('types.INVITATION_ACCEPTED.title')
    case 'ACADEMY_INTAKE_REQUEST_CREATED':
      return t('types.ACADEMY_INTAKE_REQUEST_CREATED.title')
    case 'ATTENDANCE_SUGGESTION':
      return t('types.ATTENDANCE_SUGGESTION.title')
    case 'ATTENDANCE_FOLLOW_UP_ASSIGNED':
      return t('types.ATTENDANCE_FOLLOW_UP_ASSIGNED.title')
    case 'INSTITUTIONAL_REQUEST_ACTION_REQUIRED':
      return t('types.INSTITUTIONAL_REQUEST_ACTION_REQUIRED.title')
    case 'INSTITUTIONAL_REQUEST_ASSIGNED':
      return t('types.INSTITUTIONAL_REQUEST_ASSIGNED.title')
    case 'INSTITUTIONAL_REQUEST_CLOSED':
      return t('types.INSTITUTIONAL_REQUEST_CLOSED.title')
    case 'INSTITUTIONAL_REQUEST_REMINDER':
      return t('types.INSTITUTIONAL_REQUEST_REMINDER.title')
    case 'INSTITUTIONAL_REQUEST_ESCALATED':
      return t('types.INSTITUTIONAL_REQUEST_ESCALATED.title')
    case 'TRAINING_NOTE_VISIBLE':
      return t('types.TRAINING_NOTE_VISIBLE.title')
    case 'TRAINING_NOTE_COACH_REVIEW':
      return t('types.TRAINING_NOTE_COACH_REVIEW.title')
    default:
      return t('types.UNKNOWN.title')
  }
}

function getNotificationDescription(
  type: string,
  t: NotificationsTranslator,
): string {
  switch (type) {
    case 'ANNOUNCEMENT_PUBLISHED':
      return t('types.ANNOUNCEMENT_PUBLISHED.description')
    case 'INVITATION_ACCEPTED':
      return t('types.INVITATION_ACCEPTED.description')
    case 'ACADEMY_INTAKE_REQUEST_CREATED':
      return t('types.ACADEMY_INTAKE_REQUEST_CREATED.description')
    case 'ATTENDANCE_SUGGESTION':
      return t('types.ATTENDANCE_SUGGESTION.description')
    case 'ATTENDANCE_FOLLOW_UP_ASSIGNED':
      return t('types.ATTENDANCE_FOLLOW_UP_ASSIGNED.description')
    case 'INSTITUTIONAL_REQUEST_ACTION_REQUIRED':
      return t('types.INSTITUTIONAL_REQUEST_ACTION_REQUIRED.description')
    case 'INSTITUTIONAL_REQUEST_ASSIGNED':
      return t('types.INSTITUTIONAL_REQUEST_ASSIGNED.description')
    case 'INSTITUTIONAL_REQUEST_CLOSED':
      return t('types.INSTITUTIONAL_REQUEST_CLOSED.description')
    case 'INSTITUTIONAL_REQUEST_REMINDER':
      return t('types.INSTITUTIONAL_REQUEST_REMINDER.description')
    case 'INSTITUTIONAL_REQUEST_ESCALATED':
      return t('types.INSTITUTIONAL_REQUEST_ESCALATED.description')
    case 'TRAINING_NOTE_VISIBLE':
      return t('types.TRAINING_NOTE_VISIBLE.description')
    case 'TRAINING_NOTE_COACH_REVIEW':
      return t('types.TRAINING_NOTE_COACH_REVIEW.description')
    default:
      return t('types.UNKNOWN.description')
  }
}

function getPayloadDescription(
  type: string,
  payload: Record<string, unknown>,
  t: NotificationsTranslator,
): string | null {
  const studentName = readPayloadString(payload, 'studentName')
  const branchName = readPayloadString(payload, 'branchName')
  const title = readPayloadString(payload, 'title')
  const className = readPayloadString(payload, 'className', 'sessionName')
  const summary = readPayloadString(payload, 'summary')
  const message = readPayloadString(payload, 'message')

  switch (type) {
    case 'ACADEMY_INTAKE_REQUEST_CREATED': {
      const fullName = readPayloadString(payload, 'fullName', 'requesterName')
      return fullName
        ? t('payload.intakeRequestFrom', { name: fullName })
        : null
    }
    case 'ATTENDANCE_SUGGESTION':
      return className ?? summary ?? message
    case 'ATTENDANCE_FOLLOW_UP_ASSIGNED':
      return studentName
        ? t('payload.attendanceFollowUpFor', { name: studentName })
        : null
    case 'INSTITUTIONAL_REQUEST_ACTION_REQUIRED':
    case 'INSTITUTIONAL_REQUEST_ASSIGNED':
    case 'INSTITUTIONAL_REQUEST_CLOSED':
    case 'INSTITUTIONAL_REQUEST_REMINDER':
    case 'INSTITUTIONAL_REQUEST_ESCALATED':
      return title
    case 'TRAINING_NOTE_VISIBLE':
    case 'TRAINING_NOTE_COACH_REVIEW':
      return studentName
        ? t('payload.trainingNoteFor', { name: studentName })
        : branchName
    default:
      return readPayloadString(payload, 'description', 'summary', 'title')
  }
}

function getPayloadRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {}
  }

  return payload as Record<string, unknown>
}

function readPayloadString(
  payload: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }
  return null
}

function formatRelativeDate(
  iso: string | null | undefined,
  t: NotificationsTranslator,
) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const mins = Math.max(0, Math.floor(diffMs / 60_000))
  if (mins < 1) return t('relativeTime.now')
  if (mins < 60) {
    return t('relativeTime.minutesAgo', {
      count: mins,
    })
  }
  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return t('relativeTime.hoursAgo', {
      count: hours,
    })
  }
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return days === 1
      ? t('relativeTime.yesterday')
      : t('relativeTime.daysAgo', { count: days })
  }
  const months = Math.floor(days / 30)
  return t('relativeTime.monthsAgo', {
    count: months,
  })
}
