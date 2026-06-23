'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import {
  CheckCircle2,
  Inbox,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared'
import { IntakeStatusBadge } from '@/components/kuro'
import { useIntakeRequestDetail } from '@/lib/hooks'
import type { IntakeRequestDetail } from '@/lib/api/types'
import { IntakeConvertPreview } from './intake-convert-preview'
import { IntakeTransitionActions } from './intake-transition-actions'

export interface IntakeDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  requestId: string | null
}

export function IntakeDetailSheet({
  open,
  onOpenChange,
  orgId,
  requestId,
}: IntakeDetailSheetProps) {
  const t = useTranslations('intake.detail')
  const query = useIntakeRequestDetail(orgId, requestId, { enabled: open })
  const request = query.data

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 sm:max-w-[540px]">
        <div className="border-b border-border px-6 py-5 pr-12">
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('description')}</SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {query.isLoading ? (
            <DetailSkeleton />
          ) : query.isError ? (
            <ErrorState
              title={t('errorTitle')}
              error={query.error}
              onRetry={() => query.refetch()}
            />
          ) : request ? (
            <DetailContent request={request} orgId={orgId} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
              <Inbox className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                {t('emptyTitle')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('emptyDescription')}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailContent({
  request,
  orgId,
}: {
  request: IntakeRequestDetail
  orgId: string
}) {
  const t = useTranslations('intake.detail')
  const tType = useTranslations('intake.requestType')
  const tExperience = useTranslations('intake.experience')
  const format = useFormatter()

  const branchName = readString(request.branch, 'name')
  const branchCity = readString(request.branch, 'city')

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-medium text-foreground">
              {request.fullName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {branchName
                ? branchCity
                  ? `${branchName} · ${branchCity}`
                  : branchName
                : t('branchUnavailable')}
            </p>
          </div>
          <IntakeStatusBadge status={request.status} />
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <ContactRow
            icon={Mail}
            label={t('email')}
            value={request.email}
            href={`mailto:${request.email}`}
          />
          <ContactRow
            icon={Phone}
            label={t('phone')}
            value={request.phone || t('notProvided')}
            href={request.phone ? `tel:${request.phone}` : undefined}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t('requestType')}
          value={humanize(request.requestType, tType as DetailTranslator)}
        />
        <Field
          label={t('experienceLevel')}
          value={
            request.experienceLevel
              ? humanize(request.experienceLevel, tExperience as DetailTranslator)
              : t('notProvided')
          }
        />
        <Field
          label={t('receivedAt')}
          value={formatDateTime(format, request.createdAt)}
        />
        <Field
          label={t('updatedAt')}
          value={formatDateTime(format, request.updatedAt)}
        />
        <Field
          label={t('preferredWindow')}
          value={formatRange(format, request.preferredStartAt, request.preferredEndAt)}
        />
        <Field
          label={t('proposedWindow')}
          value={formatRange(format, request.proposedStartAt, request.proposedEndAt)}
        />
        <Field
          label={t('assignedTo')}
          value={request.assignedToMembershipId ?? t('notAssigned')}
        />
        <Field
          label={t('requesterUser')}
          value={request.requesterUserId ?? t('notLinked')}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {t('message')}
          </p>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
          {request.message?.trim() || t('noMessage')}
        </p>
      </section>

      {(request.notes || request.decisionReason) && (
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground">
            {t('internalContext')}
          </p>
          {request.notes && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {request.notes}
            </p>
          )}
          {request.decisionReason && (
            <Field
              className="mt-3"
              label={t('decisionReason')}
              value={request.decisionReason}
            />
          )}
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Field label={t('source')} value={request.source} />
        <Field
          label={t('consent')}
          value={
            request.consentToContact
              ? t('consentGranted')
              : t('consentMissing')
          }
        />
        <Field
          label={t('consentAt')}
          value={formatDateTime(format, request.consentAt)}
        />
        <Field
          label={t('convertedStudent')}
          value={request.convertedStudentId ?? t('notConverted')}
        />
      </section>

      <IntakeTransitionActions
        key={`${request.id}:${request.status}`}
        orgId={orgId}
        request={request}
      />

      <IntakeConvertPreview orgId={orgId} request={request} />

      {request.convertedStudentId && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {t('convertedTitle')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('convertedDescription')}
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="mt-3">
            <Link href={`/org/${orgId}/students/${request.convertedStudentId}`}>
              {t('viewStudent')}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  href?: string
}) {
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm text-foreground">{value}</span>
    </>
  )

  if (href) {
    return (
      <a className="grid grid-cols-[auto_auto_1fr] items-center gap-2" href={href}>
        {content}
      </a>
    )
  }

  return (
    <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
      {content}
    </div>
  )
}

function Field({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-foreground">{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-xl bg-muted/40" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-16 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
    </div>
  )
}

type DetailTranslator = {
  (key: never): string
  has: (key: never) => boolean
}

function humanize(value: string, t: DetailTranslator) {
  return t.has(value as never) ? t(value as never) : value
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function formatDateTime(
  format: ReturnType<typeof useFormatter>,
  iso?: string | null,
) {
  if (!iso) return '—'
  try {
    return format.dateTime(new Date(iso), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatDate(format: ReturnType<typeof useFormatter>, iso?: string | null) {
  if (!iso) return null
  try {
    return format.dateTime(new Date(iso), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function formatRange(
  format: ReturnType<typeof useFormatter>,
  start?: string | null,
  end?: string | null,
) {
  const startLabel = formatDate(format, start)
  const endLabel = formatDate(format, end)
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
  return startLabel ?? endLabel ?? '—'
}
