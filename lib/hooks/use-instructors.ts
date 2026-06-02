'use client'

import { useQuery } from '@tanstack/react-query'
import { instructorsApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'
import { useCurrentContext } from './use-current-context'

/**
 * Instructores candidatos de la filial activa — membresías asignables como
 * instructor de una clase. Reference data: staleTime 60s.
 *
 * Resuelve orgId/branchId desde la URL/contexto. Para asignar, usar
 * `candidate.membershipId` como `instructorMembershipId` en create/update.
 */
export function useBranchInstructorCandidates() {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: ['instructor-candidates', orgId, branchId],
    queryFn: () => instructorsApi.candidates(orgId as string, branchId as string),
    staleTime: STALE.reference,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId),
  })
}
