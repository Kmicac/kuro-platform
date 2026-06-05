import { ApiError } from '@/lib/api/client'

/**
 * El backend restringe las operaciones de asistencia STAFF_MANUAL a una
 * ventana horaria alrededor de la clase. Fuera de ella responde 409 con:
 *   "Staff attendance operation is only allowed between <ISO> and <ISO>"
 *
 * Detectamos ese caso para mostrar un mensaje de dominio (no el genérico)
 * y, cuando se puede, extraer el rango para el banner/toast.
 */
export interface AttendanceWindow {
  start: string // ISO
  end: string // ISO
}

const WINDOW_RE =
  /only allowed between\s+(\S+)\s+and\s+(\S+)/i

/** True si el error es el 409 de "ventana de asistencia cerrada". */
export function isAttendanceWindowError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false
  return WINDOW_RE.test(messageOf(error))
}

/** Extrae { start, end } del mensaje del 409, o null si no matchea. */
export function parseAttendanceWindow(error: unknown): AttendanceWindow | null {
  if (!(error instanceof ApiError)) return null
  const m = WINDOW_RE.exec(messageOf(error))
  if (!m) return null
  return { start: m[1], end: m[2] }
}

function messageOf(error: ApiError): string {
  const body = error.body
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message?: unknown }).message
    if (typeof msg === 'string') return msg
  }
  return ''
}
