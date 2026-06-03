'use client'

/**
 * DeactivateScheduleDialog — confirmación de desactivación de un schedule.
 *
 * Decisión de producto: desactivar NO cancela las sesiones ya generadas; solo
 * detiene la generación futura desde ese horario. El hook de mutation es
 * toast-free (pattern 2.2.1): los toasts y el 403 se manejan acá. Reutilizado
 * por la card (menú "...") y por el switch "Activo" del ScheduleDialog (edit).
 */
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUpdateSchedule } from '@/lib/hooks'
import { ApiError } from '@/lib/api/client'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

export interface DeactivateScheduleDialogProps {
  scheduleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeactivated?: () => void
}

export function DeactivateScheduleDialog({
  scheduleId,
  open,
  onOpenChange,
  onDeactivated,
}: DeactivateScheduleDialogProps) {
  const t = useTranslations('schedules.editDialog.deactivate')
  const tc = useTranslations('common')
  const update = useUpdateSchedule(scheduleId)

  const onConfirm = () => {
    update.mutate(
      { isActive: false },
      {
        onSuccess: () => {
          notifySuccess(t('success'))
          onOpenChange(false)
          onDeactivated?.()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            notifyError(t('forbidden'))
            return
          }
          notifyError(tc('error.generic'), error)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={update.isPending}
            onClick={onConfirm}
          >
            {update.isPending ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
