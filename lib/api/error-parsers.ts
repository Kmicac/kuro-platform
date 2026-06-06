import { ApiError } from './client'

/**
 * Parsers de errores estructurados del backend KURO. Centraliza la lógica
 * frágil (parsing por string) en un solo lugar para deduplicar y para que el
 * día que el backend devuelva códigos estructurados solo se toque acá.
 */

export interface AttendanceWindowInfo {
  /** Inicio de la ventana de asistencia, o null si no se pudo parsear. */
  windowStart: Date | null
  /** Fin de la ventana, o null si no se pudo parsear. */
  windowEnd: Date | null
  /** Siempre true cuando el resultado es no-null (es el 409 de ventana). */
  isOutsideWindow: boolean
}

// Mensaje legacy del 409:
//   "Staff attendance operation is only allowed between <ISO> and <ISO>"
const WINDOW_MESSAGE_RE = /only allowed between/i
const WINDOW_RANGE_RE = /only allowed between\s+(\S+)\s+and\s+(\S+)/i

/**
 * Identifica el 409 de "ventana de asistencia STAFF_MANUAL cerrada" y, cuando
 * se puede, extrae el rango horario.
 *
 * Estrategia 1 (preferida): código estructurado `ATTENDANCE_OUTSIDE_WINDOW`
 * con `windowStart`/`windowEnd` en el body.
 * Estrategia 2 (legacy, fallback): parsing del `message` por regex.
 *
 * TODO(backend-error-code): cuando el backend devuelva
 * ATTENDANCE_OUTSIDE_WINDOW con campos windowStart/windowEnd estructurados en
 * todos los endpoints de asistencia, eliminar el fallback de regex.
 * Ver docs/backend-requests/2026-06-attendance-error-code.md.
 *
 * @returns info de la ventana, o null si el error no es ese 409.
 */
export function parseAttendanceWindowError(
  error: unknown,
): AttendanceWindowInfo | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null

  const body = error.body as {
    code?: string
    windowStart?: string
    windowEnd?: string
    message?: string
  } | null

  // Estrategia 1: código estructurado (futuro backend).
  if (body?.code === 'ATTENDANCE_OUTSIDE_WINDOW') {
    return {
      windowStart: toDate(body.windowStart),
      windowEnd: toDate(body.windowEnd),
      isOutsideWindow: true,
    }
  }

  // Estrategia 2: parsing del string (legacy, frágil).
  const message = typeof body?.message === 'string' ? body.message : ''
  if (WINDOW_MESSAGE_RE.test(message)) {
    const m = WINDOW_RANGE_RE.exec(message)
    return {
      windowStart: m ? toDate(m[1]) : null,
      windowEnd: m ? toDate(m[2]) : null,
      isOutsideWindow: true,
    }
  }

  return null
}

/** True si el error es el 409 de ventana de asistencia cerrada. */
export function isAttendanceWindowError(error: unknown): boolean {
  return parseAttendanceWindowError(error) !== null
}

function toDate(value: string | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}
