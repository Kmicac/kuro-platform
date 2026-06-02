'use client'

/**
 * Hooks de asistencia de una class-session.
 *
 * READS (funcionales): useSessionAttendance, useTechnicalRoster.
 * MUTATIONS (stubs wireados — optimistic + toast i18n llegan en Fase 2.2.4):
 * useRecordAttendance, useUpdateAttendance.
 *
 * Todos resuelven orgId/branchId desde useCurrentContext.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { classSessionsApi } from '@/lib/api/endpoints'
import type {
  RecordAttendanceBody,
  UpdateAttendanceBody,
} from '@/lib/api/types'
import { STALE, kuroRetry } from './_shared'
import { useCurrentContext } from './use-current-context'

/** Resumen + registros de asistencia de la sesión. */
export function useSessionAttendance(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: ['session-attendance', orgId, branchId, sessionId],
    queryFn: () =>
      classSessionsApi.attendance(
        orgId as string,
        branchId as string,
        sessionId,
      ),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && sessionId),
  })
}

/**
 * Roster técnico: alumnos esperados con faja, status y asistencia individual.
 */
export function useTechnicalRoster(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: ['session-roster', orgId, branchId, sessionId],
    queryFn: () =>
      classSessionsApi.technicalRoster(
        orgId as string,
        branchId as string,
        sessionId,
      ),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && sessionId),
  })
}

/**
 * Registro bulk de asistencia (STAFF_MANUAL).
 *
 * STUB: wirea el endpoint + invalida el roster/asistencia.
 * TODO(Fase 2.2.4): optimistic update del roster + toast i18n + manejo de error.
 */
export function useRecordAttendance(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: RecordAttendanceBody) =>
      classSessionsApi.recordAttendance(
        orgId as string,
        branchId as string,
        sessionId,
        body,
      ),
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ['session-roster', orgId, branchId, sessionId],
      })
      qc.invalidateQueries({
        queryKey: ['session-attendance', orgId, branchId, sessionId],
      })
    },
  })
}

/**
 * Corrección individual de asistencia (keyed por studentId).
 *
 * STUB: wirea el endpoint + invalida. TODO(Fase 2.2.4): optimistic + toast i18n.
 */
export function useUpdateAttendance(sessionId: string, studentId: string) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: UpdateAttendanceBody) =>
      classSessionsApi.updateAttendance(
        orgId as string,
        branchId as string,
        sessionId,
        studentId,
        body,
      ),
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ['session-roster', orgId, branchId, sessionId],
      })
      qc.invalidateQueries({
        queryKey: ['session-attendance', orgId, branchId, sessionId],
      })
    },
  })
}
