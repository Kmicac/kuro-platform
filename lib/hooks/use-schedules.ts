'use client'

/**
 * Hooks de class-schedules (templates recurrentes) y materialización.
 *
 * READS: useClassSchedules (list, funcional), useClassSchedule (derivado del
 * list — el backend NO expone un GET de detalle).
 * MUTATIONS (stubs wireados — optimistic + toast i18n en Fase 2.2.5+):
 * useCreateSchedule, useUpdateSchedule, useGenerateSessions,
 * useGenerateMissingSessions.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  classSchedulesApi,
  classSessionsApi,
  type ClassScheduleCreateBody,
  type ClassScheduleUpdateBody,
  type SessionsGenerateBody,
} from '@/lib/api/endpoints'
import { STALE, kuroRetry } from './_shared'
import { useCurrentContext } from './use-current-context'

export interface UseClassSchedulesParams {
  page?: number
  limit?: number
}

/** Lista paginada de schedules de la filial activa. */
export function useClassSchedules(params?: UseClassSchedulesParams) {
  const { orgId, branchId } = useCurrentContext()
  const page = params?.page ?? 1
  const limit = params?.limit ?? 50

  return useQuery({
    queryKey: ['class-schedules', orgId, branchId, { page, limit }],
    queryFn: () =>
      classSchedulesApi.list(orgId as string, branchId as string, {
        page,
        limit,
      }),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId),
  })
}

/**
 * Detalle de un schedule. El backend NO expone GET .../class-schedules/:id,
 * así que se deriva del list.
 * TODO(Fase 2.2.5): si el backend agrega el endpoint de detalle, usarlo acá.
 */
export function useClassSchedule(scheduleId: string) {
  const list = useClassSchedules()
  const data = list.data?.items.find((s) => s.id === scheduleId)
  return { ...list, data }
}

/**
 * Crea un schedule. STUB wireado.
 * TODO(Fase 2.2.5): optimistic update + toast i18n + manejo de error.
 */
export function useCreateSchedule() {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: ClassScheduleCreateBody) =>
      classSchedulesApi.create(orgId as string, branchId as string, body),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['class-schedules', orgId, branchId],
      }),
  })
}

/**
 * Actualiza un schedule. STUB wireado.
 * TODO(Fase 2.2.5): optimistic update + toast i18n.
 */
export function useUpdateSchedule(scheduleId: string) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: ClassScheduleUpdateBody) =>
      classSchedulesApi.update(
        orgId as string,
        branchId as string,
        scheduleId,
        body,
      ),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: ['class-schedules', orgId, branchId],
      }),
  })
}

/**
 * Materializa sesiones de un rango desde los schedules activos. STUB wireado.
 * TODO(Fase 2.2.5): UI de progreso (created/skipped/conflicts) + toast i18n.
 */
export function useGenerateSessions() {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: SessionsGenerateBody) =>
      classSessionsApi.generate(orgId as string, branchId as string, body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['class-calendar', orgId, branchId] })
      qc.invalidateQueries({ queryKey: ['class-session-gaps', orgId, branchId] })
    },
  })
}

/**
 * Rellena solo los huecos del rango (idempotente). STUB wireado.
 * TODO(Fase 2.2.5): UI de resultados + toast i18n.
 */
export function useGenerateMissingSessions() {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: SessionsGenerateBody) =>
      classSessionsApi.generateMissing(
        orgId as string,
        branchId as string,
        body,
      ),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['class-calendar', orgId, branchId] })
      qc.invalidateQueries({ queryKey: ['class-session-gaps', orgId, branchId] })
    },
  })
}
