'use client'

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  membershipsApi,
  studentsApi,
  trainingNotesApi,
} from '@/lib/api/endpoints'
import type {
  CreateTrainingNoteBody,
  MembershipTechnicalProfileBody,
  PaginatedResponse,
  StudentDetail,
  StudentListItem,
} from '@/lib/api/types'
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

export function useStudentTrainingNotes(
  orgId: string,
  studentId: string,
  enabled = true,
  params?: { classSessionId?: string },
) {
  const classSessionId = params?.classSessionId

  return useQuery({
    queryKey: ['student-training-notes', orgId, studentId, { classSessionId }],
    queryFn: () =>
      trainingNotesApi.listByStudent(orgId, studentId, {
        ...(classSessionId ? { classSessionId } : {}),
      }),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && studentId && enabled),
  })
}

export interface CreateStudentTrainingNoteVars
  extends CreateTrainingNoteBody {
  studentId: string
}

export function useCreateStudentTrainingNote(orgId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      studentId,
      body,
      visibility,
      noteType,
      classSessionId,
    }: CreateStudentTrainingNoteVars) =>
      trainingNotesApi.createForStudent(orgId, studentId, {
        body,
        visibility,
        noteType,
        ...(classSessionId ? { classSessionId } : {}),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ['student-training-notes', orgId, vars.studentId],
      })
    },
  })
}

export interface InviteStudentVars {
  studentId: string
  email?: string
  expiresInDays?: number
  branchId?: string | null
  intakeRequestId?: string | null
}

export function useInviteStudent(orgId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, email, expiresInDays }: InviteStudentVars) =>
      studentsApi.invite(orgId, studentId, {
        ...(email ? { email } : {}),
        ...(expiresInDays ? { expiresInDays } : {}),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['student', orgId, vars.studentId] })
      if (vars.branchId) {
        qc.invalidateQueries({ queryKey: ['students', orgId, vars.branchId] })
        qc.invalidateQueries({ queryKey: ['intake', orgId, vars.branchId] })
      }
      if (vars.intakeRequestId) {
        qc.invalidateQueries({
          queryKey: ['intake-detail', orgId, vars.intakeRequestId],
        })
      }
    },
  })
}

export interface UpdateMembershipTechnicalProfileVars
  extends MembershipTechnicalProfileBody {
  membershipId: string
  studentId: string
  branchId?: string | null
}

export function useUpdateMembershipTechnicalProfile(orgId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      membershipId,
      currentBelt,
      currentStripes,
    }: UpdateMembershipTechnicalProfileVars) =>
      membershipsApi.updateTechnicalProfile(orgId, membershipId, {
        currentBelt,
        currentStripes,
      }),
    onSuccess: (data, vars) => {
      const currentBelt = data.belt?.rank ?? null
      const currentStripes = data.belt?.stripeCount ?? 0

      qc.setQueryData<StudentDetail>(
        ['student', orgId, vars.studentId],
        (current) =>
          current
            ? {
                ...current,
                currentBelt,
                currentStripes,
              }
            : current,
      )
      qc.setQueryData(
        ['membership-technical-profile', orgId, vars.membershipId],
        data,
      )

      if (vars.branchId) {
        qc.setQueriesData<PaginatedResponse<StudentListItem>>(
          { queryKey: ['students', orgId, vars.branchId] },
          (current) =>
            current
              ? {
                  ...current,
                  items: current.items.map((student) =>
                    student.id === vars.studentId
                      ? {
                          ...student,
                          currentBelt,
                          currentStripes,
                        }
                      : student,
                  ),
                }
              : current,
        )
        qc.invalidateQueries({
          queryKey: ['students', orgId, vars.branchId],
          refetchType: 'none',
        })
      }
      qc.invalidateQueries({
        queryKey: ['student', orgId, vars.studentId],
        refetchType: 'none',
      })
    },
  })
}
