'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { Maximize2, QrCode, RefreshCw } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useIssueQRToken } from '@/lib/hooks'
import { notifyError } from '@/lib/utils/toast'
import type { QRTokenResponse } from '@/lib/api/types'

/** Cap del backend para expiresInMinutes (acepta ≤15, ver use-attendance). */
const QR_EXPIRES_MINUTES = 15
const WARNING_THRESHOLD_SEC = 300

export interface QrModalProps {
  sessionId: string
  orgId: string
  branchId: string
}

export function QrModal({ sessionId, orgId, branchId }: QrModalProps) {
  const t = useTranslations('class-detail.qr')
  const issue = useIssueQRToken(sessionId)

  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<QRTokenResponse | null>(null)
  const [remainingSec, setRemainingSec] = useState(0)
  const expiredRef = useRef(false)

  const generate = useCallback(() => {
    issue.mutate(
      { expiresInMinutes: QR_EXPIRES_MINUTES },
      {
        onSuccess: (data) => setToken(data),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403)
            return notifyError(t('forbidden'))
          notifyError(t('generationFailed'), error)
        },
      },
    )
  }, [issue, t])

  // Countdown contra expiresAt (setTimeout(0) evita setState sincrónico en effect).
  useEffect(() => {
    if (!token) return
    const expiresMs = new Date(token.expiresAt).getTime()
    expiredRef.current = false
    const tick = () => {
      const rem = Math.max(0, Math.round((expiresMs - Date.now()) / 1000))
      setRemainingSec(rem)
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true
        setToken(null)
      }
    }
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [token])

  const openModal = () => {
    setOpen(true)
    generate()
  }
  const closeModal = () => {
    setOpen(false)
    setToken(null)
  }

  const expiring = token != null && remainingSec <= WARNING_THRESHOLD_SEC

  return (
    <>
      {/* FAB — esquina inferior derecha */}
      <button
        type="button"
        onClick={openModal}
        aria-label={t('expand')}
        title={t('expand')}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-popover text-foreground shadow-sm transition-colors hover:bg-muted"
      >
        <QrCode className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeModal())}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {issue.isPending && !token ? (
              <div className="flex h-[244px] w-[244px] items-center justify-center rounded bg-muted/40">
                <span className="text-sm text-muted-foreground">
                  {t('generating')}
                </span>
              </div>
            ) : token ? (
              <>
                <div className="rounded-xl bg-[#F7F7F2] p-4">
                  <QRCodeSVG
                    value={token.token}
                    size={212}
                    level="M"
                    bgColor="#F7F7F2"
                    fgColor="#121113"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('scanInstructions')}
                </p>
                <p
                  className={
                    expiring
                      ? 'font-mono text-sm tabular-nums text-[var(--kuro-warning)]'
                      : 'font-mono text-sm tabular-nums text-foreground'
                  }
                >
                  {t('expiresIn', { time: formatMMSS(remainingSec) })}
                </p>
              </>
            ) : (
              <div className="flex h-[244px] w-[244px] flex-col items-center justify-center gap-3 rounded border border-border bg-muted/30 text-center">
                <QrCode className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('expired')}</p>
              </div>
            )}

            <div className="flex w-full items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={issue.isPending}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {token ? t('regenerate') : t('generate')}
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link
                  href={`/org/${orgId}/branches/${branchId}/sessions/${sessionId}/qr`}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  {t('fullscreen')}
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatMMSS(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
