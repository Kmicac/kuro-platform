'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, Clock, QrCode, RefreshCw } from 'lucide-react'

import { BgAnimateButton } from '@/components/ui/bg-animate-button'
import { Button } from '@/components/ui/button'
import { useQrWindow } from '@/lib/hooks/use-qr-window'
import { cn } from '@/lib/utils'
import type { QRTokenResponse } from '@/lib/api/types'
import type { QRErrorInfo } from '@/lib/api/error-parsers'

export interface QRDisplayProps {
  token: QRTokenResponse | null
  generating: boolean
  disabled: boolean
  /** Mensaje a mostrar cuando la clase está cancelada (o null). */
  canceledMessage: string | null
  /** Error estructurado del último intento de generación (o null). */
  qrError: QRErrorInfo | null
  onGenerate: () => void
  /** Se invoca cuando la ventana del token expira (limpia el estado en el padre). */
  onExpire: () => void
}

/** Bajo este umbral (segundos), el timer entra en modo "por expirar". */
const WARNING_THRESHOLD_SEC = 300

export function QRDisplay({
  token,
  generating,
  disabled,
  canceledMessage,
  qrError,
  onGenerate,
  onExpire,
}: QRDisplayProps) {
  const t = useTranslations('qr-checkin.qr')
  const format = useFormatter()

  const { status, remainingSec } = useQrWindow(token, onExpire)
  const expiring = status === 'ACTIVE' && remainingSec <= WARNING_THRESHOLD_SEC

  // Banners de bloqueo: tienen prioridad y NO muestran el QR.
  const windowExpired = qrError?.type === 'WINDOW_EXPIRED'
  const sessionCanceled = qrError?.type === 'SESSION_CANCELED' || canceledMessage != null

  const showQr = token != null && status !== 'EXPIRED'

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card p-8">
      {windowExpired ? (
        <DestructiveBanner
          title={t('status.expiredWindow.title')}
          description={t('status.expiredWindow.description')}
        />
      ) : sessionCanceled ? (
        <DestructiveBanner
          title={t('status.sessionCanceled.title')}
          description={t('status.sessionCanceled.description')}
        />
      ) : showQr ? (
        <>
          {/* QR sobre superficie clara para máxima legibilidad del scanner. */}
          <div className="rounded-xl bg-[#F7F7F2] p-5">
            <QRCodeSVG
              value={token.token}
              size={240}
              level="M"
              bgColor="#F7F7F2"
              fgColor="#121113"
            />
          </div>

          {status === 'SCHEDULED' ? (
            <ScheduledBanner
              title={t('status.scheduled.title')}
              description={t('status.scheduled.description', {
                date: safeDateTime(format, token.validFrom),
              })}
              subtext={t('status.scheduled.subtext')}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {t('scanInstructions')}
              </p>
              <Timer
                label={t('status.active.expiresIn', {
                  time: formatMMSS(remainingSec),
                })}
                expiring={expiring}
              />
              {expiring && (
                <p className="text-xs text-[var(--kuro-warning)]">
                  {t('expiringWarning')}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerate}
                disabled={generating || disabled}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('regenerate')}
              </Button>
            </>
          )}
        </>
      ) : (
        // Estado idle / expirado → generar (o regenerar).
        <IdleState
          generating={generating}
          disabled={disabled}
          onGenerate={onGenerate}
        />
      )}
    </div>
  )
}

function DestructiveBanner({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-muted-foreground">{description}</span>
      </span>
    </div>
  )
}

function ScheduledBanner({
  title,
  description,
  subtext,
}: {
  title: string
  description: string
  subtext: string
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-1.5 text-center">
      <span className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5 stroke-[1.5]" />
        {title}
      </span>
      <p className="text-sm text-foreground">{description}</p>
      <p className="text-xs text-[var(--text-tertiary)]">{subtext}</p>
    </div>
  )
}

function IdleState({
  generating,
  disabled,
  onGenerate,
}: {
  generating: boolean
  disabled: boolean
  onGenerate: () => void
}) {
  const t = useTranslations('qr-checkin.qr')
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-muted/40">
        <QrCode className="h-9 w-9 text-muted-foreground" />
      </span>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{t('idleTitle')}</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {t('idleDescription')}
        </p>
      </div>
      <BgAnimateButton
        type="button"
        onClick={onGenerate}
        disabled={generating || disabled}
        className="h-10"
      >
        {generating ? t('generating') : t('generate')}
      </BgAnimateButton>
    </div>
  )
}

function Timer({ label, expiring }: { label: string; expiring: boolean }) {
  return (
    <p
      className={cn(
        'font-mono text-sm tabular-nums',
        expiring ? 'text-[var(--kuro-warning)]' : 'text-foreground',
      )}
    >
      {label}
    </p>
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
