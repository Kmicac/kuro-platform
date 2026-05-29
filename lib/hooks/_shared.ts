/**
 * Convenciones internas de la capa de hooks.
 *
 * - `kuroRetry`: política de retry compartida. Nunca reintenta errores
 *   de cliente que no se solucionan con un retry (401/403/404).
 * - `STALE`: presets de staleTime por tipo de dato.
 */

import { ApiError } from '@/lib/api/client'

const NO_RETRY_STATUSES = new Set([401, 403, 404])

export function kuroRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && NO_RETRY_STATUSES.has(error.status)) {
    return false
  }
  return failureCount < 2
}

export const STALE = {
  /** Datos que cambian poco (organizaciones, filiales, capabilities). */
  reference: 60_000,
  /** Listados analíticos (tree-summary, action-summary, risk-roster). */
  analytics: 30_000,
  /** Listados de recursos (alumnos, intake). */
  resource: 15_000,
  /** Detalle individual (alumno, sesión). */
  detail: 30_000,
} as const
