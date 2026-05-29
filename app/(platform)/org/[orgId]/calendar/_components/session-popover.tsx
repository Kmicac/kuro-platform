'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { SessionDetail } from '@/components/sessions/session-detail'

export interface SessionPopoverProps {
  sessionId: string | null
  onClose: () => void
}

export function SessionPopover({ sessionId, onClose }: SessionPopoverProps) {
  const open = Boolean(sessionId)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* a11y: el SessionDetail tiene su propio título visible.
            DialogTitle hidden satisface Radix sin duplicar UI. */}
        <DialogTitle className="sr-only">Detalle de la clase</DialogTitle>
        {sessionId && <SessionDetail sessionId={sessionId} />}
      </DialogContent>
    </Dialog>
  )
}
