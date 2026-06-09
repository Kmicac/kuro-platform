import { ApiError } from './client'
import type {
  AttendanceWindowError,
  AttendanceWindowErrorCode,
} from './types'

/**
 * Parsers de errores estructurados del backend KURO. Centraliza la detección
 * por `body.code` en un solo lugar para deduplicar y para que el día que el
 * contrato cambie solo se toque acá.
 */

// Los 2 codes de ventana de asistencia (409). Ver API-CONTRACT §10 Attendance.
const ATTENDANCE_WINDOW_CODES = new Set<AttendanceWindowErrorCode>([
  'ATTENDANCE_OUTSIDE_WINDOW',
  'ATTENDANCE_CORRECTION_WINDOW_CLOSED',
])

/**
 * Identifica un 409 de ventana de asistencia a partir de `body.code` y expone
 * el rango horario estructurado (`windowStart`/`windowEnd`, ISO).
 *
 * Cubre tanto el registro fuera de ventana (`ATTENDANCE_OUTSIDE_WINDOW`,
 * `POST .../attendance`) como la corrección/borrado fuera de la ventana de
 * corrección (`ATTENDANCE_CORRECTION_WINDOW_CLOSED`, `PATCH`/`DELETE
 * .../attendance/:studentId`). Mismo patrón que `parseQRError`: detección por
 * code, sin parsing frágil del `message`.
 *
 * @returns el code + ventana, o null si el error no es uno de esos 409.
 */
export function parseAttendanceWindowError(
  error: unknown,
): AttendanceWindowError | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null

  const body = error.body as {
    code?: string
    windowStart?: string
    windowEnd?: string
    message?: string
  } | null

  const code = body?.code
  if (!code || !ATTENDANCE_WINDOW_CODES.has(code as AttendanceWindowErrorCode)) {
    return null
  }

  return {
    code: code as AttendanceWindowErrorCode,
    message: typeof body?.message === 'string' ? body.message : '',
    windowStart: typeof body?.windowStart === 'string' ? body.windowStart : '',
    windowEnd: typeof body?.windowEnd === 'string' ? body.windowEnd : '',
  }
}

/** True si el error es uno de los 409 de ventana de asistencia. */
export function isAttendanceWindowError(error: unknown): boolean {
  return parseAttendanceWindowError(error) !== null
}

// ── QR attendance errors (códigos estructurados del backend) ──────
//
// El backend devuelve 4 codes estructurados (todos 409) en `body.code` para el
// flujo de QR. Ver API-CONTRACT §"Issue QR token" / "Errores específicos".

export interface QRErrorInfo {
  type:
    | 'SESSION_CANCELED'
    | 'WINDOW_EXPIRED'
    | 'TOKEN_TOO_LONG'
    | 'OUTSIDE_CHECK_IN_WINDOW'
  /** Mensaje legacy del backend (para soporte/diagnóstico). */
  message?: string
}

const QR_ERROR_TYPE_BY_CODE: Record<string, QRErrorInfo['type']> = {
  QR_SESSION_CANCELED: 'SESSION_CANCELED',
  QR_ATTENDANCE_WINDOW_EXPIRED: 'WINDOW_EXPIRED',
  QR_TOKEN_EXPIRATION_TOO_LONG: 'TOKEN_TOO_LONG',
  QR_OUTSIDE_CHECK_IN_WINDOW: 'OUTSIDE_CHECK_IN_WINDOW',
}

/**
 * Identifica un error estructurado de QR a partir de `body.code`.
 * @returns el tipo + mensaje, o null si no es un error de QR conocido.
 */
export function parseQRError(error: unknown): QRErrorInfo | null {
  if (!(error instanceof ApiError)) return null

  const body = error.body as { code?: string; message?: string } | null
  const code = body?.code
  if (!code) return null

  const type = QR_ERROR_TYPE_BY_CODE[code]
  if (!type) return null

  return {
    type,
    message: typeof body?.message === 'string' ? body.message : undefined,
  }
}

/** True si el error es uno de los codes estructurados de QR. */
export function isQRError(error: unknown): boolean {
  return parseQRError(error) !== null
}
