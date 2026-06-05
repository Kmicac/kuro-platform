'use client'

import { useTranslations } from 'next-intl'
import { UserPlus, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared'

export interface AttendanceEmptyStateProps {
  onAddWalkIn: () => void
  disabled: boolean
}

export function AttendanceEmptyState({
  onAddWalkIn,
  disabled,
}: AttendanceEmptyStateProps) {
  const t = useTranslations('attendance.emptyState')

  return (
    <EmptyState
      icon={Users}
      title={t('title')}
      description={t('description')}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={onAddWalkIn}
          disabled={disabled}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t('addWalkIn')}
        </Button>
      }
    />
  )
}
