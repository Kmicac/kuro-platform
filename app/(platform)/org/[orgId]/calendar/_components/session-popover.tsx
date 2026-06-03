'use client'

import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { SessionDetail } from '@/components/sessions/session-detail'

export interface SessionPopoverProps {
  sessionId: string | null
  onClose: () => void
}

/**
 * Detalle de sesión como SIDE PANEL (Design System 2.5.2). Drawer derecho
 * (480px) en vez del Dialog centrado anterior. El SessionDetail trae su propio
 * título visible → DialogTitle/Description van sr-only para satisfacer Radix.
 */
export function SessionPopover({ sessionId, onClose }: SessionPopoverProps) {
  const t = useTranslations('calendar.session')
  const open = Boolean(sessionId)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <SheetContent className="overflow-y-auto p-0">
        <SheetTitle className="sr-only">{t('detailTitle')}</SheetTitle>
        <SheetDescription className="sr-only">
          {t('detailDescription')}
        </SheetDescription>
        {sessionId && <SessionDetail sessionId={sessionId} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
