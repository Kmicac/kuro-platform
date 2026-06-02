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
  onDismiss: () => void
}

export function ConflictDialog({ conflict, onDismiss }: ConflictDialogProps) {
  const t = useTranslations('calendar.conflict')
  const router = useRouter()
  const { orgId } = useCurrentContext()

  // Hook llamado siempre (id vacío → query deshabilitada).
  const existing = useSession(conflict?.classSessionId ?? '')

  const handleViewExisting = () => {
    if (!conflict || !orgId) return
    router.push(`/org/${orgId}/calendar?session=${conflict.classSessionId}`)
    onDismiss()
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
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {conflict && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">
              {t(`type.${conflict.type}`)}
            </p>
            <div className="text-xs text-muted-foreground">
              <p className="uppercase tracking-wide">{t('existingSession')}</p>
              <p className="mt-0.5 text-foreground">
                {existing.data?.title ?? conflict.classSessionId}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            {t('dismiss')}
          </Button>
          <Button onClick={handleViewExisting}>{t('viewExisting')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
