'use client'

import { useQuery } from '@tanstack/react-query'

import { classSessionsApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'

/**
 * QueryKey canónico del listado de suggestions de una sesión. Se exporta para
 * que el hook de cancelación (optimista) lea/escriba sobre el mismo cache.
 */
export function sessionSuggestionsKey(
  orgId: string | null | undefined,
  branchId: string | null | undefined,
  sessionId: string | null | undefined,
) {
  return ['session-suggestions', orgId, branchId, sessionId] as const
}

/**
 * Listado completo de attendance suggestions de una sesión (lado operador).
 *
 * El summary (counters) ya viene inline en el detail de la sesión; este hook
 * es solo para la lista detallada que se muestra en el sheet "Ver todas".
 * Cap requerida: `attendance.canSuggestAttendance` (el caller gatea el render).
 */
export function useSessionSuggestions(
  orgId: string,
  branchId: string,
  sessionId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: sessionSuggestionsKey(orgId, branchId, sessionId),
    queryFn: () => classSessionsApi.listSuggestions(orgId, branchId, sessionId),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled:
      Boolean(orgId && branchId && sessionId) && (options?.enabled ?? true),
  })
}
