'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { AlertTriangle, QrCode, RefreshCw } from 'lucide-react'

import { BgAnimateButton } from '@/components/ui/bg-animate-button'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QRTokenResponse } from '@/lib/api/types'

export interface QRDisplayProps {
  token: QRTokenResponse | null
  generating: boolean
  disabled: boolean
  /** Mensaje a mostrar cuando la clase está cancelada (o null). */
  canceledMessage: string | null
  onGenerate: () => void
  /** Se invoca cuando el token expira (para limpiar el estado en el padre). */
  onExpire: () => void
}

/** Bajo este umbral (segundos), el timer entra en modo "por expirar". */
const WARNING_THRESHOLD_SEC = 300

export function QRDisplay({
  token,
  generating,
  disabled,
  canceledMessage,
  onGenerate,
  onExpire,
}: QRDisplayProps) {
  const t = useTranslations('qr-checkin.qr')

  const [remainingSec, setRemainingSec] = useState<number>(0)
  const expiredRef = useRef(false)

  // Countdown: recalcula cada segundo contra `expiresAt`. El primer cálculo
  // se difiere con setTimeout(0) para no llamar setState sincrónicamente en el
  // cuerpo del effect (regla react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!token) return
    const expiresMs = new Date(token.expiresAt).getTime()
    expiredRef.current = false

    const tick = () => {
      const rem = Math.max(0, Math.round((expiresMs - Date.now()) / 1000))
      setRemainingSec(rem)
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
    }
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [token, onExpire])

  const expiring = token != null && remainingSec <= WARNING_THRESHOLD_SEC

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-card p-8">
      {canceledMessage ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-destructive" />
          {canceledMessage}
        </div>
      ) : token ? (
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

          <p className="text-sm text-muted-foreground">{t('scanInstructions')}</p>

          <Timer
            label={t('expiresIn', { time: formatMMSS(remainingSec) })}
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
