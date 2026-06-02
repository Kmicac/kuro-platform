'use client'

/**
 * Manejo del 409 CLASS_SESSION_CONFLICT (create/update de class-sessions).
 *
 * Detección por STATUS 409: en estos endpoints el único 409 documentado es el
 * conflicto de sesión (API-CONTRACT.md §"Conflict 409" + tabla de errores:
 * "409 | session already exists or overlaps branch/instructor session"). Por
 * eso NO exigimos `body.code` — sería frágil si el shape real difiere del
 * contrato. El `code` es confirmación opcional; el objeto `conflict` se busca
 * en las ubicaciones plausibles. Así el caller siempre evita el toast genérico
 * y abre el ConflictDialog ante cualquier 409.
 */
import { useCallback, useState } from 'react'
import { ApiError } from '@/lib/api/client'

export type ClassSessionConflictType =
  | 'INSTRUCTOR_OVERLAP'
  | 'BRANCH_OVERLAP'
  | 'SCHEDULE_OVERLAP'

export interface ClassSessionConflict {
  classSessionId: string
  type: ClassSessionConflictType
  branchId: string
  instructorMembershipId?: string
  startAt: string
  endAt: string
}

/**
 * Conflicto de fallback cuando el 409 no trae un objeto `conflict` parseable.
 * Mantiene la UX (abrir el dialog con un mensaje genérico) en vez de un toast
 * engañoso. `classSessionId` vacío → el dialog oculta "Ver clase existente".
 */
const FALLBACK_CONFLICT: ClassSessionConflict = {
  classSessionId: '',
  type: 'SCHEDULE_OVERLAP',
  branchId: '',
  startAt: '',
  endAt: '',
}

/** ¿El error es un 409 de class-session (⟺ conflicto en este endpoint)? */
export function isClassSessionConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409
}

/** Extrae el objeto `conflict` del error, buscándolo en ubicaciones plausibles. */
export function extractConflict(error: unknown): ClassSessionConflict | null {
  if (!isClassSessionConflict(error)) return null
  const body = (error as ApiError).body
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const nested = (key: string) =>
    (b[key] as { conflict?: ClassSessionConflict } | undefined)?.conflict
  return (
    (b.conflict as ClassSessionConflict | undefined) ??
    nested('error') ??
    nested('details') ??
    null
  )
}

export interface UseConflictHandlerResult {
  conflict: ClassSessionConflict | null
  isConflict: boolean
  /** Alimenta un error; devuelve true si era un 409 (y lo capturó). */
  handle: (error: unknown) => boolean
  dismiss: () => void
}

export function useConflictHandler(): UseConflictHandlerResult {
  const [conflict, setConflict] = useState<ClassSessionConflict | null>(null)

  const handle = useCallback((error: unknown): boolean => {
    if (!isClassSessionConflict(error)) return false
    setConflict(extractConflict(error) ?? FALLBACK_CONFLICT)
    return true
  }, [])

  const dismiss = useCallback(() => setConflict(null), [])

  return { conflict, isConflict: conflict !== null, handle, dismiss }
}
