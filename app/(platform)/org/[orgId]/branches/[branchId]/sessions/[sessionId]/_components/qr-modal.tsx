'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, Clock, Maximize2, QrCode, RefreshCw } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { parseQRError, type QRErrorInfo } from '@/lib/api/error-parsers'
import { useIssueQRToken } from '@/lib/hooks'
import { useQrWindow } from '@/lib/hooks/use-qr-window'
import { notifyError } from '@/lib/utils/toast'
import type { QRTokenResponse } from '@/lib/api/types'

const WARNING_THRESHOLD_SEC = 300

export interface QrModalProps {
  sessionId: string
  orgId: string
  branchId: string
}

export function QrModal({ sessionId, orgId, branchId }: QrModalProps) {
  const t = useTranslations('class-detail.qr')
  const format = useFormatter()
  const issue = useIssueQRToken(sessionId)

  const [open, setOpen] = useState(false)
  const [token, setToken] = useState<QRTokenResponse | null>(null)
  const [qrError, setQrError] = useState<QRErrorInfo | null>(null)

  // Al expirar la ventana del token, limpiamos para volver al estado idle.
  const onExpire = useCallback(() => setToken(null), [])
  const { status, remainingSec } = useQrWindow(token, onExpire)

  const generate = useCallback(() => {
    // Sin expiresInMinutes: la ventana la define el backend (validFrom/validUntil).
    issue.mutate(
      {},
      {
        onSuccess: (data) => {
          setQrError(null)
          setToken(data)
        },
        onError: (error) => {
          const qrInfo = parseQRError(error)
          if (qrInfo) {
            setToken(null)
            return setQrError(qrInfo)
          }
          if (error instanceof ApiError && error.status === 403)
            return notifyError(t('forbidden'))
          notifyError(t('generationFailed'), error)
        },
      },
    )
  }, [issue, t])

  const openModal = () => {
    setOpen(true)
    setQrError(null)
    generate()
  }
  const closeModal = () => {
    setOpen(false)
    setToken(null)
    setQrError(null)
  }

  const expiring = status === 'ACTIVE' && remainingSec <= WARNING_THRESHOLD_SEC
  const windowExpired = qrError?.type === 'WINDOW_EXPIRED'
  const sessionCanceled = qrError?.type === 'SESSION_CANCELED'
  const showQr = token != null && status !== 'EXPIRED'

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
            {windowExpired || sessionCanceled ? (
              <Banner
                title={
                  windowExpired
                    ? t('status.expiredWindow.title')
                    : t('status.sessionCanceled.title')
                }
                description={
                  windowExpired
                    ? t('status.expiredWindow.description')
                    : t('status.sessionCanceled.description')
                }
              />
            ) : issue.isPending && !token ? (
              <div className="flex h-[244px] w-[244px] items-center justify-center rounded bg-muted/40">
                <span className="text-sm text-muted-foreground">
                  {t('generating')}
                </span>
              </div>
            ) : showQr ? (
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
                {status === 'SCHEDULED' ? (
                  <div className="flex flex-col items-center gap-1 text-center">
                    <span className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
                      {t('status.scheduled.title')}
                    </span>
                    <p className="text-sm text-foreground">
                      {t('status.scheduled.description', {
                        date: safeDateTime(format, token.validFrom),
                      })}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {t('status.scheduled.subtext')}
                    </p>
                  </div>
                ) : (
                  <>
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
                      {t('status.active.expiresIn', {
                        time: formatMMSS(remainingSec),
                      })}
                    </p>
                  </>
                )}
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
                disabled={issue.isPending || windowExpired || sessionCanceled}
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

function Banner({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      role="alert"
      className="flex h-[244px] w-[244px] flex-col items-center justify-center gap-2 rounded border border-destructive/30 bg-destructive/5 p-4 text-center"
    >
      <AlertTriangle className="h-7 w-7 text-destructive" />
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
  )
}

function formatMMSS(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type Formatter = ReturnType<typeof useFormatter>

function safeDateTime(format: Formatter, iso: string): string {
  try {
    return format.dateTime(new Date(iso), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}
