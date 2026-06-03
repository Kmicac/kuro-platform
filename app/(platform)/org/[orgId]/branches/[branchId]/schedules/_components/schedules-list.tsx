'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { ApiError } from '@/lib/api/client'
import { useBranch, useCapabilities, useClassSchedules } from '@/lib/hooks'
import {
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import { WEEKDAY_VALUES } from '@/lib/schemas/schedule'
import type { ClassSchedule, Weekday } from '@/lib/api/types'
import { ScheduleToolbar } from './schedule-toolbar'
import { ScheduleCard } from './schedule-card'
import { SchedulesEmptyState } from './empty-state'
import { ScheduleDialog } from './schedule-dialog'
import { GenerateSessionsDialog } from './generate-sessions-dialog'

export interface SchedulesListProps {
  orgId: string
  branchId: string
}

interface WeekdayGroup {
  weekday: Weekday
  items: ClassSchedule[]
}

export function SchedulesList({ orgId, branchId }: SchedulesListProps) {
  const t = useTranslations('schedules')
  const tNav = useTranslations('navigation.labels')

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  // Default ON: solo se desactiva con ?activeOnly=false explícito.
  const activeOnly = searchParams.get('activeOnly') !== 'false'

  const setActiveOnly = (value: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.delete('activeOnly')
    else params.set('activeOnly', 'false')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const branchQuery = useBranch(orgId, branchId)
  const listQuery = useClassSchedules()
  const caps = useCapabilities(orgId)
  const canManage = Boolean(
    caps.data?.capabilities?.classes?.canManageSchedules,
  )

  const allItems = useMemo(
    () => listQuery.data?.items ?? [],
    [listQuery.data],
  )

  const groups = useMemo<WeekdayGroup[]>(() => {
    const filtered = activeOnly
      ? allItems.filter((s) => s.isActive)
      : allItems
    const byDay = new Map<Weekday, ClassSchedule[]>()
    for (const w of WEEKDAY_VALUES) byDay.set(w, [])
    for (const s of filtered) byDay.get(s.weekday as Weekday)?.push(s)
    for (const w of WEEKDAY_VALUES) {
      byDay.get(w)!.sort((a, b) => {
        // Inactivos al final; dentro de cada grupo, por startTime asc.
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
        return a.startTime.localeCompare(b.startTime)
      })
    }
    return WEEKDAY_VALUES.map((weekday) => ({
      weekday,
      items: byDay.get(weekday)!,
    })).filter((g) => g.items.length > 0)
  }, [allItems, activeOnly])

  const visibleCount = groups.reduce((acc, g) => acc + g.items.length, 0)

  // ── Dialog state ──────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateVariant, setGenerateVariant] = useState<
    'generate' | 'missing'
  >('generate')
  const [generateSchedule, setGenerateSchedule] =
    useState<ClassSchedule | null>(null)

  const openEdit = (schedule: ClassSchedule) => {
    setEditId(schedule.id)
    setEditOpen(true)
  }
  const openGenerateAll = () => {
    setGenerateVariant('generate')
    setGenerateSchedule(null)
    setGenerateOpen(true)
  }
  const openFillGaps = () => {
    setGenerateVariant('missing')
    setGenerateSchedule(null)
    setGenerateOpen(true)
  }
  const openGenerateForSchedule = (schedule: ClassSchedule) => {
    setGenerateVariant('generate')
    setGenerateSchedule(schedule)
    setGenerateOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        breadcrumbs={[
          { label: tNav('organization'), href: `/org/${orgId}` },
          {
            label: branchQuery.data?.name ?? '…',
            href: `/org/${orgId}/branches/${branchId}`,
          },
          { label: t('page.title') },
        ]}
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        meta={
          !listQuery.isLoading &&
          !listQuery.error && (
            <Badge variant="outline" className="text-xs tabular-nums">
              {visibleCount}
            </Badge>
          )
        }
      />

      <ScheduleToolbar
        canManage={canManage}
        activeOnly={activeOnly}
        onActiveOnlyChange={setActiveOnly}
        onGenerateAll={openGenerateAll}
        onFillGaps={openFillGaps}
      />

      <ListBody
        isLoading={listQuery.isLoading}
        error={listQuery.error}
        groups={groups}
        hasAny={allItems.length > 0}
        activeOnly={activeOnly}
        canManage={canManage}
        onRetry={() => listQuery.refetch()}
        onEdit={openEdit}
        onGenerate={openGenerateForSchedule}
        onCreate={() => setCreateOpen(true)}
      />

      {/* ── Dialogs (instancias únicas) ── */}
      <ScheduleDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <ScheduleDialog
        mode="edit"
        scheduleId={editId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <GenerateSessionsDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        variant={generateVariant}
        schedule={generateSchedule}
        orgId={orgId}
      />
    </div>
  )
}

// ── List body ──────────────────────────────────────────────

function ListBody({
  isLoading,
  error,
  groups,
  hasAny,
  activeOnly,
  canManage,
  onRetry,
  onEdit,
  onGenerate,
  onCreate,
}: {
  isLoading: boolean
  error: unknown
  groups: WeekdayGroup[]
  hasAny: boolean
  activeOnly: boolean
  canManage: boolean
  onRetry: () => void
  onEdit: (s: ClassSchedule) => void
  onGenerate: (s: ClassSchedule) => void
  onCreate: () => void
}) {
  const tWeekday = useTranslations('schedules.weekdays')

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted/50"
          />
        ))}
      </div>
    )
  }

  if (error instanceof ApiError && error.status === 403) {
    return <ForbiddenState />
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (groups.length === 0) {
    return (
      <SchedulesEmptyState
        canManage={canManage}
        // Hay horarios pero el filtro "Solo activos" los oculta.
        filtered={activeOnly && hasAny}
        onCreate={onCreate}
      />
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.weekday} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {tWeekday(group.weekday)}
          </h2>
          <div className="space-y-2">
            {group.items.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                canManage={canManage}
                onEdit={onEdit}
                onGenerate={onGenerate}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
