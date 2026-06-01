'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  Inbox,
  Mail,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { Badge } from '@/components/ui/badge'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  KpiCard,
  PageHeader,
} from '@/components/shared'
import { StatusBadge } from '@/components/kuro'
import { ApiError } from '@/lib/api/client'
import {
  useActionSummary,
  useBranch,
  useRiskRoster,
  useTrainingCalendar,
} from '@/lib/hooks'
import type {
  BranchActionSummary,
  CalendarItem,
  RiskItem,
} from '@/lib/api/types'

interface BranchDashboardProps {
  orgId: string
  branchId: string
}

export function BranchDashboard({ orgId, branchId }: BranchDashboardProps) {
  const t = useTranslations('dashboard.branch')
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const branchQuery = useBranch(orgId, branchId)
  const summaryQuery = useActionSummary(orgId, branchId)
  const riskQuery = useRiskRoster(orgId, branchId, { limit: 6 })
  const calendarQuery = useTrainingCalendar(orgId, {
    from: today,
    to: today,
    branchId,
    view: 'DAY',
    itemType: 'CLASS_SESSION',
  })

  const summary = summaryQuery.data
  const calendarItems = calendarQuery.data?.items ?? []

  const derivedInstructors = new Set(
    calendarItems
      .map((it) => instructorId(it))
      .filter((id): id is string => Boolean(id))
  ).size
  const scheduledInstructors =
    summary?.attendance?.scheduledInstructors ??
    (derivedInstructors > 0 ? derivedInstructors : undefined)

  const expectedAttendance =
    summary?.attendance?.expectedAttendance ??
    (calendarItems.length > 0
      ? calendarItems.reduce(
          (acc, it) => acc + (it.classSession?.capacity ?? 0),
          0
        )
      : undefined)

  const classesToday =
    summary?.classes?.todayCount ??
    summary?.attendance?.classesTodayCount ??
    (calendarQuery.data ? calendarItems.length : undefined)

  const pendingIntake = summary?.requests?.pendingIntake
  const pendingClaims = summary?.requests?.pendingClaims
  const operationalAlerts = summary
    ? (branchQuery.data?.attention?.flags?.length ?? 0)
    : undefined

  return (
    <div className="p-6 space-y-6">
      <Header
        orgId={orgId}
        branch={branchQuery.data}
        isLoading={branchQuery.isLoading}
        error={branchQuery.error}
      />

      <section
        aria-label={t('kpisAria')}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <KpiCard
          label={t('kpis.classesToday')}
          value={classesToday}
          icon={CalendarDays}
          hint={t('kpis.classesTodayHint')}
          href={`/org/${orgId}/calendar`}
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
        />
        <KpiCard
          label={t('kpis.instructors')}
          value={scheduledInstructors}
          icon={GraduationCap}
          hint={t('kpis.instructorsHint')}
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
        />
        <KpiCard
          label={t('kpis.expectedAttendance')}
          value={expectedAttendance}
          icon={Users}
          hint={t('kpis.expectedAttendanceHint')}
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
        />
        <KpiCard
          label={t('kpis.pendingIntake')}
          value={pendingIntake}
          icon={ClipboardList}
          hint={t('kpis.pendingIntakeHint')}
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
          href={`/org/${orgId}/branches/${branchId}/intake`}
        />
        <KpiCard
          label={t('kpis.studentsNoAccount')}
          value={pendingClaims}
          icon={UserPlus}
          hint={t('kpis.studentsNoAccountHint')}
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
          href={`/org/${orgId}/claims`}
        />
        <KpiCard
          label={t('kpis.operationalAlerts')}
          value={operationalAlerts}
          icon={AlertTriangle}
          hint={
            (operationalAlerts ?? 0) > 0
              ? t('kpis.operationalAlertsHint')
              : t('kpis.noAlerts')
          }
          isLoading={summaryQuery.isLoading || branchQuery.isLoading}
          error={summaryQuery.error ?? branchQuery.error}
          tone="warning"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <IntakePipelineCard
            summary={summary}
            isLoading={summaryQuery.isLoading}
            error={summaryQuery.error}
            orgId={orgId}
            branchId={branchId}
          />
          <RiskRosterCard
            items={riskQuery.data?.items}
            isLoading={riskQuery.isLoading}
            error={riskQuery.error}
            onRetry={() => riskQuery.refetch()}
            orgId={orgId}
          />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <AgendaCard
            items={calendarItems}
            isLoading={calendarQuery.isLoading}
            error={calendarQuery.error}
            onRetry={() => calendarQuery.refetch()}
          />
          <QuickActionsCard orgId={orgId} branchId={branchId} />
        </div>
      </div>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────

function Header({
  orgId,
  branch,
  isLoading,
  error,
}: {
  orgId: string
  branch?: ReturnType<typeof useBranch>['data']
  isLoading: boolean
  error: unknown
}) {
  const t = useTranslations('dashboard.branch')
  const te = useTranslations('errors')
  const tn = useTranslations('navigation')
  const tc = useTranslations('common')

  if (isLoading) {
    return (
      <header className="space-y-2">
        <div className="h-3 w-40 rounded-md bg-muted/60 animate-pulse" />
        <div className="h-6 w-72 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded-md bg-muted/60 animate-pulse" />
      </header>
    )
  }

  if (error instanceof ApiError && error.status === 403) {
    return (
      <PageHeader
        title={te('branch.forbiddenTitle')}
        subtitle={te('branch.forbiddenDescription')}
      />
    )
  }

  if (error) {
    return (
      <PageHeader
        title={te('branch.loadErrorTitle')}
        subtitle={te('generic.description')}
      />
    )
  }

  const status = branch?.status ?? 'ACTIVE'
  const needsReview = Boolean(branch?.attention?.needsReview)
  const location = [branch?.city, branch?.countryCode]
    .filter(Boolean)
    .join(' · ')

  return (
    <PageHeader
      breadcrumbs={[
        { label: tn('labels.organization'), href: `/org/${orgId}` },
        { label: branch?.name ?? tn('labels.branch') },
      ]}
      title={branch?.name ?? tn('labels.branch')}
      subtitle={location || t('subtitle')}
      meta={
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge
            status={status}
            label={
              status === 'ACTIVE'
                ? t('status.active')
                : status === 'SUSPENDED'
                  ? t('status.suspended')
                  : status === 'INACTIVE'
                    ? t('status.inactive')
                    : undefined
            }
          />
          {branch?.isHeadquarter && (
            <Badge variant="outline" className="text-[10px]">
              {tc('branchBadge.hq')}
            </Badge>
          )}
          {needsReview && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="h-3 w-3" />
              {t('needsReview')}
            </Badge>
          )}
        </div>
      }
    />
  )
}

// ── Agenda ─────────────────────────────────────────────────

function AgendaCard({
  items,
  isLoading,
  error,
  onRetry,
}: {
  items: CalendarItem[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}) {
  const t = useTranslations('dashboard.branch')
  const tEmpty = useTranslations('empty-states')
  const format = useFormatter()

  const formatTime = (iso?: string) => {
    if (!iso) return '—'
    try {
      return format.dateTime(new Date(iso), {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  return (
    <SectionCard
      title={t('agenda.title')}
      subtitle={t('agenda.subtitle')}
      icon={Clock}
    >
      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isEmpty={items.length === 0}
        emptyTitle={tEmpty('branch.agendaTitle')}
        emptyDescription={tEmpty('branch.agendaDescription')}
        skeleton={
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex flex-col items-center min-w-[44px]">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {formatTime(it.startAt)}
                </span>
                {it.endAt && (
                  <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {formatTime(it.endAt)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {it.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {instructorName(it) ?? t('agenda.instructorUnassigned')}
                </p>
              </div>
              <SessionStatusBadge status={it.status} />
            </li>
          ))}
        </ul>
      </SectionStateWrapper>
    </SectionCard>
  )
}

function SessionStatusBadge({ status }: { status?: string }) {
  const t = useTranslations('dashboard.branch')
  const normalized = (status ?? 'SCHEDULED').toUpperCase()
  const map: Record<string, { label: string; className: string }> = {
    SCHEDULED: {
      label: t('agenda.sessionStatus.scheduled'),
      className: 'border-border text-muted-foreground',
    },
    IN_PROGRESS: {
      label: t('agenda.sessionStatus.inProgress'),
      className: 'border-primary/40 bg-primary/10 text-primary',
    },
    COMPLETED: {
      label: t('agenda.sessionStatus.completed'),
      className: 'border-border text-muted-foreground',
    },
    CANCELLED: {
      label: t('agenda.sessionStatus.canceled'),
      className: 'border-destructive/40 bg-destructive/10 text-destructive',
    },
  }
  const entry = map[normalized] ?? map.SCHEDULED
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  )
}

// ── Intake pipeline ────────────────────────────────────────

const STAGE_LABEL_KEYS: Record<string, string> = {
  NEW: 'new',
  REVIEWING: 'reviewing',
  CONTACTED: 'contacted',
  VISIT_PROPOSED: 'visitProposed',
  VISIT_SCHEDULED: 'visit',
  VISIT_COMPLETED: 'visitDone',
  READY_TO_CONVERT: 'ready',
  CONVERTED: 'converted',
}

const STAGE_ORDER = [
  'NEW',
  'CONTACTED',
  'VISIT_SCHEDULED',
  'READY_TO_CONVERT',
  'CONVERTED',
]

function IntakePipelineCard({
  summary,
  isLoading,
  error,
  orgId,
  branchId,
}: {
  summary?: BranchActionSummary
  isLoading: boolean
  error: unknown
  orgId: string
  branchId: string
}) {
  const t = useTranslations('dashboard.branch')
  const tEmpty = useTranslations('empty-states')
  const format = useFormatter()
  const pipeline = summary?.requests?.pipeline
  const normalized = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABEL_KEYS[stage]
      ? t(`intakeStage.${STAGE_LABEL_KEYS[stage]}` as Parameters<typeof t>[0])
      : stage,
    count:
      pipeline?.find((s) => String(s.stage).toUpperCase() === stage)?.count ??
      0,
  }))

  const hasData = Boolean(pipeline && pipeline.length > 0)
  const total = normalized.reduce((acc, s) => acc + s.count, 0)

  return (
    <SectionCard
      title={t('pipeline.title')}
      subtitle={t('pipeline.subtitle')}
      icon={Inbox}
      action={
        <Link
          href={`/org/${orgId}/branches/${branchId}/intake`}
          className="text-xs text-primary hover:underline"
        >
          {t('pipeline.open')}
        </Link>
      }
    >
      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={() => undefined}
        hideRetry
        isEmpty={!hasData || total === 0}
        emptyTitle={tEmpty('branch.pipelineTitle')}
        emptyDescription={
          hasData
            ? tEmpty('branch.pipelineDescription')
            : tEmpty('branch.pipelineUnavailable')
        }
        skeleton={
          <div className="grid grid-cols-5 gap-2">
            {STAGE_ORDER.map((s) => (
              <div
                key={s}
                className="h-20 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {normalized.map((s, idx) => (
            <div
              key={s.stage}
              className="rounded-lg border border-border bg-card p-3"
            >
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {idx + 1}. {s.label}
              </p>
              <p className="text-2xl font-semibold text-foreground tabular-nums mt-1">
                {format.number(s.count)}
              </p>
            </div>
          ))}
        </div>
      </SectionStateWrapper>
    </SectionCard>
  )
}

// ── Risk roster ────────────────────────────────────────────

function RiskRosterCard({
  items,
  isLoading,
  error,
  onRetry,
  orgId,
}: {
  items: RiskItem[] | undefined
  isLoading: boolean
  error: unknown
  onRetry: () => void
  orgId: string
}) {
  const t = useTranslations('dashboard.branch')
  const tc = useTranslations('common')
  const tEmpty = useTranslations('empty-states')
  // `now` estable provisto por next-intl (request config) — evita Date.now()
  // impuro durante el render.
  const now = useNow()

  const formatRelativeDate = (iso?: string | null) => {
    if (!iso) return '—'
    try {
      const date = new Date(iso)
      const diffMs = now.getTime() - date.getTime()
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (days <= 0) return tc('relativeTime.today')
      if (days < 30) return tc('relativeTime.daysAgo', { count: days })
      const months = Math.floor(days / 30)
      return tc('relativeTime.monthsAgo', { count: months })
    } catch {
      return '—'
    }
  }

  return (
    <SectionCard
      title={t('risk.title')}
      subtitle={t('risk.subtitle')}
      icon={AlertTriangle}
    >
      <SectionStateWrapper
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isEmpty={!items || items.length === 0}
        emptyTitle={tEmpty('branch.riskTitle')}
        emptyDescription={tEmpty('branch.riskDescription')}
        skeleton={
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="font-medium pb-2">{t('risk.table.student')}</th>
                <th className="font-medium pb-2">{t('risk.table.level')}</th>
                <th className="font-medium pb-2">
                  {t('risk.table.consistency')}
                </th>
                <th className="font-medium pb-2">
                  {t('risk.table.lastAttendance')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items?.slice(0, 6).map((item) => (
                <tr key={item.studentId}>
                  <td className="py-2.5">
                    <Link
                      href={`/org/${orgId}/students/${item.studentId}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {`${item.firstName} ${item.lastName}`.trim()}
                    </Link>
                  </td>
                  <td className="py-2.5">
                    <RiskLevelBadge level={item.riskLevel} />
                  </td>
                  <td className="py-2.5 tabular-nums text-muted-foreground">
                    {item.metrics?.consistencyRate != null
                      ? `${Math.round(item.metrics.consistencyRate * 100)}%`
                      : '—'}
                  </td>
                  <td className="py-2.5 text-muted-foreground tabular-nums">
                    {formatRelativeDate(item.metrics?.lastAttendanceAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionStateWrapper>
    </SectionCard>
  )
}

function RiskLevelBadge({ level }: { level?: string }) {
  const t = useTranslations('dashboard.branch')
  const normalized = (level ?? 'LOW').toUpperCase()
  const map: Record<string, { label: string; className: string }> = {
    HIGH: {
      label: t('risk.level.high'),
      className: 'border-destructive/40 bg-destructive/10 text-destructive',
    },
    MEDIUM: {
      label: t('risk.level.medium'),
      className:
        'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    LOW: {
      label: t('risk.level.low'),
      className: 'border-border text-muted-foreground',
    },
  }
  const entry = map[normalized] ?? map.LOW
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  )
}

// ── Quick actions ──────────────────────────────────────────

function QuickActionsCard({
  orgId,
  branchId,
}: {
  orgId: string
  branchId: string
}) {
  const t = useTranslations('dashboard.branch')
  const actions = [
    {
      label: t('quickActions.validateAttendance'),
      icon: ClipboardCheck,
      href: `/org/${orgId}/branches/${branchId}/attendance`,
    },
    {
      label: t('quickActions.openIntake'),
      icon: Inbox,
      href: `/org/${orgId}/branches/${branchId}/intake`,
    },
    {
      label: t('quickActions.inviteStudents'),
      icon: Mail,
      href: `/org/${orgId}/claims`,
    },
    {
      label: t('quickActions.viewCalendar'),
      icon: CalendarDays,
      href: `/org/${orgId}/calendar`,
    },
  ]

  return (
    <SectionCard
      title={t('quickActions.title')}
      subtitle={t('quickActions.subtitle')}
    >
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}

// ── Section primitives ─────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <TextureCard>
      <TextureCardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action}
        </div>
        {children}
      </TextureCardContent>
    </TextureCard>
  )
}

function SectionStateWrapper({
  isLoading,
  error,
  onRetry,
  hideRetry,
  isEmpty,
  emptyTitle,
  emptyDescription,
  skeleton,
  children,
}: {
  isLoading: boolean
  error: unknown
  onRetry: () => void
  hideRetry?: boolean
  isEmpty: boolean
  emptyTitle: string
  emptyDescription: string
  skeleton: React.ReactNode
  children: React.ReactNode
}) {
  const te = useTranslations('errors')

  if (isLoading) return <>{skeleton}</>

  if (error instanceof ApiError && error.status === 403) {
    return (
      <ForbiddenState
        dense
        title={te('branch.sectionRestrictedTitle')}
        description={te('branch.sectionRestrictedDescription')}
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        dense
        error={error}
        onRetry={hideRetry ? undefined : onRetry}
      />
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        dense
        icon={Inbox}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return <>{children}</>
}

// ── Helpers ────────────────────────────────────────────────

function instructorName(item: CalendarItem): string | undefined {
  const inst = item.instructor as
    | { fullName?: string; firstName?: string; lastName?: string }
    | null
    | undefined
  if (!inst) return undefined
  if (inst.fullName) return inst.fullName
  const full = [inst.firstName, inst.lastName].filter(Boolean).join(' ').trim()
  return full || undefined
}

function instructorId(item: CalendarItem): string | undefined {
  const inst = item.instructor as
    | { id?: string; membershipId?: string }
    | null
    | undefined
  return inst?.id ?? inst?.membershipId
}

