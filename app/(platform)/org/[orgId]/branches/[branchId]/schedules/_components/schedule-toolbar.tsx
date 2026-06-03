'use client'

import { useTranslations } from 'next-intl'
import { CalendarPlus, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export interface ScheduleToolbarProps {
  canManage: boolean
  activeOnly: boolean
  onActiveOnlyChange: (value: boolean) => void
  onGenerateAll: () => void
  onFillGaps: () => void
}

export function ScheduleToolbar({
  canManage,
  activeOnly,
  onActiveOnlyChange,
  onGenerateAll,
  onFillGaps,
}: ScheduleToolbarProps) {
  const t = useTranslations('schedules.toolbar')

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Switch
          id="schedules-active-only"
          checked={activeOnly}
          onCheckedChange={onActiveOnlyChange}
        />
        <Label
          htmlFor="schedules-active-only"
          className="cursor-pointer text-sm text-muted-foreground"
        >
          {t('activeOnly')}
        </Label>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onFillGaps}
            title={t('fillGapsHint')}
          >
            <Wand2 className="mr-1 h-4 w-4" />
            {t('fillGaps')}
          </Button>
          <Button variant="outline" size="sm" onClick={onGenerateAll}>
            <CalendarPlus className="mr-1 h-4 w-4" />
            {t('generateAll')}
          </Button>
        </div>
      )}
    </div>
  )
}
