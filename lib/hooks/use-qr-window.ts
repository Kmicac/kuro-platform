'use client'

import { useEffect, useRef, useState } from 'react'

import type { QRTokenResponse } from '@/lib/api/types'

export type QrWindowStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED'

export interface QrWindowState {
  /** Estado derivado de `validFrom`/`validUntil` vs el tiempo actual. */
  status: QrWindowStatus | null
  /** Segundos restantes hasta `validUntil` (solo relevante en ACTIVE). */
  remainingSec: number
}

/**
 * Deriva en vivo el estado de la ventana operativa de un token QR y el
 * countdown contra `validUntil` (NO `expiresAt`, que para un QR generado con
 * anticipación puede estar a horas/días → bug del countdown "1606:07").
 *
 * - `SCHEDULED`: `now < validFrom` → no hay countdown útil.
 * - `ACTIVE`: dentro de la ventana → `remainingSec` cuenta hasta `validUntil`.
 * - `EXPIRED`: `now > validUntil` → dispara `onExpire` una sola vez.
 *
 * Recalcula cada segundo. El primer tick se difiere con `setTimeout(0)` para no
 * llamar setState sincrónicamente dentro del effect (regla react-hooks).
 */
export function useQrWindow(
  token: QRTokenResponse | null,
  onExpire?: () => void,
): QrWindowState {
  const [state, setState] = useState<QrWindowState>({
    status: null,
    remainingSec: 0,
  })
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!token) {
      // Reset diferido: evita setState sincrónico en el cuerpo del effect
      // (regla react-hooks/set-state-in-effect). El consumer igual gatea por
      // `token != null`, así que no hay flash perceptible.
      const reset = setTimeout(() => setState({ status: null, remainingSec: 0 }), 0)
      return () => clearTimeout(reset)
    }

    const fromMs = new Date(token.validFrom).getTime()
    const untilMs = new Date(token.validUntil).getTime()
    expiredRef.current = false

    const tick = () => {
      const now = Date.now()
      let status: QrWindowStatus
      if (now < fromMs) status = 'SCHEDULED'
      else if (now > untilMs) status = 'EXPIRED'
      else status = 'ACTIVE'

      const remainingSec =
        status === 'ACTIVE' ? Math.max(0, Math.round((untilMs - now) / 1000)) : 0

      setState({ status, remainingSec })

      if (status === 'EXPIRED' && !expiredRef.current) {
        expiredRef.current = true
        onExpire?.()
      }
    }

    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [token, onExpire])

  return state
}
