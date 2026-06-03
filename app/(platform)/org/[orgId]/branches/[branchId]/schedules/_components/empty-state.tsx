'use client'

import { useTranslations } from 'next-intl'
import { CalendarClock, Plus } from 'lucide-react'
import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'

export interface SchedulesEmptyStateProps {
  canManage: boolean
  /** true cuando el filtro "Solo activos" oculta todos los horarios. */
  filtered: boolean
  onCreate: () => void
}

export function SchedulesEmptyState({
  canManage,
  filtered,
  onCreate,
}: SchedulesEmptyStateProps) {
  const t = useTranslations('schedules.emptyState')

  if (filtered) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={t('filteredTitle')}
        description={t('filteredDescription')}
      />
    )
  }

  return (
    <EmptyState
      icon={CalendarClock}
      title={t('title')}
      description={t('description')}
      action={
        canManage ? (
          <Button onClick={onCreate}>
            <Plus className="mr-1 h-4 w-4" />
            {t('action')}
          </Button>
        ) : undefined
      }
    />
  )
}
