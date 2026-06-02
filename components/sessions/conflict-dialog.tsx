'use client'

/**
 * ConflictDialog — muestra el 409 CLASS_SESSION_CONFLICT de forma legible.
 *
 * Creado en Fase 2.2 sub-fase 0. NO se usa todavía — se conecta en 2.2.10
 * (alimentado por useConflictHandler desde el onError de las mutations).
 */
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/hooks/use-sessions'
import { useCurrentContext } from '@/lib/hooks/use-current-context'
import type { ClassSessionConflict } from '@/lib/hooks/use-conflict-handler'

export interface ConflictDialogProps {
  conflict: ClassSessionConflict | null
  /** Cierra solo el conflict dialog (deja el form abierto para ajustar). */
  onDismiss: () => void
  /**
   * Se dispara cuando el usuario elige "Ver clase existente" (después de
   * navegar). El padre lo usa para cerrar también su propio dialog.
   */
  onViewExisting?: () => void
}

export function ConflictDialog({
  conflict,
  onDismiss,
  onViewExisting,
}: ConflictDialogProps) {
  const t = useTranslations('calendar.conflict')
  const router = useRouter()
  const { orgId } = useCurrentContext()

  // Hook llamado siempre (id vacío → query deshabilitada).
  const existing = useSession(conflict?.classSessionId ?? '')

  // Guarda contra un `type` inesperado del backend (next-intl tira si falta la
  // key): si no es uno de los 3 conocidos, usar el mensaje genérico.
  const KNOWN_TYPES = ['INSTRUCTOR_OVERLAP', 'BRANCH_OVERLAP', 'SCHEDULE_OVERLAP']
  const descKey =
    conflict && KNOWN_TYPES.includes(conflict.type)
      ? conflict.type
      : 'SCHEDULE_OVERLAP'

  const handleViewExisting = () => {
    if (!conflict || !orgId) return
    router.push(`/org/${orgId}/calendar?session=${conflict.classSessionId}`)
    onDismiss()
    onViewExisting?.()
  }

  return (
    <Dialog
      open={conflict !== null}
      onOpenChange={(open) => {
        if (!open) onDismiss()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {conflict ? t(`description.${descKey}`) : null}
          </DialogDescription>
        </DialogHeader>

        {conflict?.classSessionId && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="uppercase tracking-wide">{t('existingSession')}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {existing.data?.title ?? conflict.classSessionId}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            {t('actions.cancel')}
          </Button>
          {conflict?.classSessionId && (
            <Button onClick={handleViewExisting}>
              {t('actions.viewExisting')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
