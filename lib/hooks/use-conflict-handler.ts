'use client'

/**
 * Manejo del 409 CLASS_SESSION_CONFLICT.
 *
 * El backend rechaza create/update de class-sessions que solapan con otra
 * sesión (instructor, filial u horario). Este módulo expone:
 *  - detectores puros (`isClassSessionConflict`, `extractConflict`) usados
 *    por las mutations para NO disparar un toast genérico ante un 409.
 *  - `useConflictHandler()` — estado del dialog de conflicto (uso en 2.2.10).
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

interface ConflictErrorBody {
  code?: string
  conflict?: ClassSessionConflict
}

/** ¿El error es un 409 con code CLASS_SESSION_CONFLICT? */
export function isClassSessionConflict(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    (error.body as ConflictErrorBody | null)?.code === 'CLASS_SESSION_CONFLICT'
  )
}

/** Extrae el objeto `conflict` del error, o null si no es un conflict. */
export function extractConflict(error: unknown): ClassSessionConflict | null {
  if (!isClassSessionConflict(error)) return null
  return (error as ApiError).body
    ? ((error as ApiError).body as ConflictErrorBody).conflict ?? null
    : null
}

export interface UseConflictHandlerResult {
  conflict: ClassSessionConflict | null
  isConflict: boolean
  /** Alimenta un error; devuelve true si era un conflict (y lo capturó). */
  handle: (error: unknown) => boolean
  dismiss: () => void
}

export function useConflictHandler(): UseConflictHandlerResult {
  const [conflict, setConflict] = useState<ClassSessionConflict | null>(null)

  const handle = useCallback((error: unknown): boolean => {
    const parsed = extractConflict(error)
    if (parsed) {
      setConflict(parsed)
      return true
    }
    return false
  }, [])

  const dismiss = useCallback(() => setConflict(null), [])

  return { conflict, isConflict: conflict !== null, handle, dismiss }
}
