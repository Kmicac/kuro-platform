'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { studentsApi } from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'

export interface UseBranchStudentsParams {
  page?: number
  limit?: number
  /** Search server-side (firstName/lastName/email/phone). Vacío = sin filtro. */
  q?: string
  enabled?: boolean
}

export function useBranchStudents(
  orgId: string,
  branchId: string,
  params?: UseBranchStudentsParams
) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 25
  const q = params?.q?.trim() || undefined

  return useQuery({
    queryKey: ['students', orgId, branchId, { page, limit, q }],
    queryFn: () => studentsApi.listByBranch(orgId, branchId, { page, limit, q }),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && (params?.enabled ?? true)),
    placeholderData: keepPreviousData,
  })
}

export function useStudent(orgId: string, studentId: string) {
  return useQuery({
    queryKey: ['student', orgId, studentId],
    queryFn: () => studentsApi.get(orgId, studentId),
    staleTime: STALE.detail,
    retry: kuroRetry,
    enabled: Boolean(orgId && studentId),
  })
}

export interface InviteStudentVars {
  studentId: string
  email?: string
  message?: string
}

export function useInviteStudent(orgId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, email, message }: InviteStudentVars) =>
      studentsApi.invite(orgId, studentId, {
        ...(email ? { email } : {}),
        ...(message ? { message } : {}),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['student', orgId, vars.studentId] })
    },
  })
}
