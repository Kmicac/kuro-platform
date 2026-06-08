'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { classSessionsApi } from '@/lib/api/endpoints'
import type { SuggestionsListResponse } from '@/lib/api/types'
import { sessionSuggestionsKey } from './use-session-suggestions'

/**
 * Cancela una suggestion PENDING (lado operador). Toast-free: el caller maneja
 * success/error. Optimista: marca la row como CANCELED y ajusta el summary
 * embebido del listado; onError hace rollback; onSettled reconcilia.
 *
 * `nowIso` se inyecta desde el caller (next-intl `useNow()`) para no usar un
 * `new Date()` impuro y mantener estabilidad entre render y mutación.
 */
export function useCancelSuggestion(
  orgId: string,
  branchId: string,
  sessionId: string,
) {
  const queryClient = useQueryClient()
  const listKey = sessionSuggestionsKey(orgId, branchId, sessionId)

  return useMutation({
    mutationFn: ({ suggestionId }: { suggestionId: string; nowIso: string }) =>
      classSessionsApi.cancelSuggestion(
        orgId,
        branchId,
        sessionId,
        suggestionId,
      ),

    onMutate: async ({ suggestionId, nowIso }) => {
      await queryClient.cancelQueries({ queryKey: listKey })
      const previous =
        queryClient.getQueryData<SuggestionsListResponse>(listKey)

      queryClient.setQueryData<SuggestionsListResponse>(listKey, (old) => {
        if (!old) return old
        // Solo descuenta del summary si la row estaba PENDING (el backend solo
        // permite cancelar pendientes; evita doble conteo si llega ruido).
        const wasPending =
          old.items.find((s) => s.id === suggestionId)?.status === 'PENDING'
        return {
          ...old,
          summary: wasPending
            ? {
                ...old.summary,
                pending: Math.max(0, old.summary.pending - 1),
                canceled: old.summary.canceled + 1,
              }
            : old.summary,
          items: old.items.map((s) =>
            s.id === suggestionId
              ? { ...s, status: 'CANCELED' as const, canceledAt: nowIso }
              : s,
          ),
        }
      })

      return { previous }
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous)
      }
    },

    onSettled: () => {
      // Reconciliar la lista...
      queryClient.invalidateQueries({ queryKey: listKey })
      // ...y el detail de la sesión (su summary inline de suggestions cambió).
      queryClient.invalidateQueries({
        queryKey: ['session', orgId, branchId, sessionId],
      })
    },
  })
}
