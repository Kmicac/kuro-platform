'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarPlus, MoreHorizontal, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClassTypeChip } from '@/components/kuro'
import { useUpdateSchedule } from '@/lib/hooks'
import { ApiError } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import type { ClassSchedule } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { DeactivateScheduleDialog } from './deactivate-schedule-dialog'

export interface ScheduleCardProps {
  schedule: ClassSchedule
  canManage: boolean
  onEdit: (schedule: ClassSchedule) => void
  onGenerate: (schedule: ClassSchedule) => void
}

/** "HH:MM:SS" (backend) → "HH:MM" (display). */
const toHM = (time: string) => time.slice(0, 5)

export function ScheduleCard({
  schedule,
  canManage,
  onEdit,
  onGenerate,
}: ScheduleCardProps) {
  const t = useTranslations('schedules.card')
  const tc = useTranslations('common')
  const tDeact = useTranslations('schedules.editDialog.deactivate')
  const update = useUpdateSchedule(schedule.id)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  const instructorName = schedule.instructorMembership?.user
    ? `${schedule.instructorMembership.user.firstName} ${schedule.instructorMembership.user.lastName}`
    : null

  const handleActivate = () => {
    update.mutate(
      { isActive: true },
      {
        onSuccess: () => notifySuccess(tDeact('activateSuccess')),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            notifyError(tDeact('forbidden'))
            return
          }
          notifyError(tc('error.generic'), error)
        },
      },
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-opacity',
        !schedule.isActive && 'opacity-60',
      )}
    >
      <div className="w-[108px] shrink-0 font-mono text-sm tabular-nums text-foreground">
        {toHM(schedule.startTime)} – {toHM(schedule.endTime)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-foreground">
            {schedule.title}
          </span>
          <ClassTypeChip classType={schedule.classType} variant="dot" />
          {!schedule.isActive && (
            <Badge variant="outline" className="text-xs">
              {t('inactive')}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {instructorName ?? t('noInstructor')}
          {' · '}
          {schedule.capacity != null
            ? t('capacityCount', { count: schedule.capacity })
            : t('noCapacity')}
        </div>
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onEdit(schedule)}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            {t('actions.edit')}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onGenerate(schedule)}
          >
            <CalendarPlus className="mr-1 h-3.5 w-3.5" />
            {t('actions.generate')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={t('optionsAria')}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {schedule.isActive ? (
                <DropdownMenuItem onSelect={() => setDeactivateOpen(true)}>
                  {t('actions.deactivate')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={handleActivate}>
                  {t('actions.activate')}
                </DropdownMenuItem>
              )}
              {/* TODO(Fase 2.2.x): eliminar schedule cuando el backend exponga DELETE. */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <DeactivateScheduleDialog
        scheduleId={schedule.id}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      />
    </div>
  )
}
