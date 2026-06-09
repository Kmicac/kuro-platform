'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { ApiError } from '@/lib/api/client'
import { parseAttendanceWindowError } from '@/lib/api/error-parsers'
import { useCapabilities } from '@/lib/hooks/use-capabilities'
import { useCurrentContext } from '@/lib/hooks/use-current-context'
import { notifyError } from '@/lib/utils/toast'
import type { AttendanceWindowError } from '@/lib/api/types'

type AttendanceTranslator = ReturnType<typeof useTranslations<'attendance'>>
type Formatter = ReturnType<typeof useFormatter>

/**
 * Handler de error compartido por todos los callers de mutations de asistencia
 * (page bulk, row toggles, nota). Mapea:
 *   - 403                              → "sin permiso"
 *   - 409 ATTENDANCE_OUTSIDE_WINDOW    → registro fuera de la ventana operativa
 *                                         (con el rango horario local).
 *   - 409 ATTENDANCE_CORRECTION_WINDOW_CLOSED → corrección/borrado fuera de la
 *                                         ventana de corrección. Si el principal
 *                                         tiene la capability de corrección admin
 *                                         (ventana extendida) se le aclara que esa
 *                                         ventana también se cerró.
 *   - resto                            → genérico (con request-id)
 *
 * Centraliza la matriz para no duplicarla (CLAUDE.md §Forms y Mutations).
 */
export function useAttendanceErrorHandler() {
  const t = useTranslations('attendance')
  const tc = useTranslations('common')
  const format = useFormatter()
  const { orgId } = useCurrentContext()

  // Para diferenciar el copy de la ventana de corrección: liderazgo/admin
  // (`canCorrectAttendanceAsAdmin`) tiene una ventana extendida; el resto de los
  // operadores corrige solo dentro de la ventana estándar. Ver API-CONTRACT §10.
  const caps = useCapabilities(orgId ?? '')
  const canCorrectAsAdmin = Boolean(
    caps.data?.capabilities?.attendance?.canCorrectAttendanceAsAdmin,
  )

  return (error: unknown): void => {
    if (error instanceof ApiError && error.status === 403) {
      notifyError(t('errors.forbidden'))
      return
    }

    const windowError = parseAttendanceWindowError(error)
    if (windowError) {
      notifyError(
        buildWindowMessage(windowError, t, format, canCorrectAsAdmin),
        error,
      )
      return
    }

    notifyError(tc('error.generic'), error)
  }
}

/** Formatea un ISO UTC a hora local legible, o '' si no es válido. */
function formatWindowBound(iso: string, format: Formatter): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return format.dateTime(d, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Arma el mensaje del toast (título + descripción) según el code y el rol. */
function buildWindowMessage(
  windowError: AttendanceWindowError,
  t: AttendanceTranslator,
  format: Formatter,
  canCorrectAsAdmin: boolean,
): string {
  const start = formatWindowBound(windowError.windowStart, format)
  const end = formatWindowBound(windowError.windowEnd, format)

  if (windowError.code === 'ATTENDANCE_OUTSIDE_WINDOW') {
    return `${t('errors.outsideWindow.title')} — ${t(
      'errors.outsideWindow.description',
      { start, end },
    )}`
  }

  // ATTENDANCE_CORRECTION_WINDOW_CLOSED
  const base = `${t('errors.correctionWindowClosed.title')} — ${t(
    'errors.correctionWindowClosed.description',
    { end },
  )}`
  return canCorrectAsAdmin
    ? `${base} ${t('errors.correctionWindowClosed.adminNote')}`
    : base
}
