'use client'

/**
 * Hooks de class-schedules (templates recurrentes) y materialización de
 * sesiones.
 *
 * READS:
 *  - useClassSchedules: list paginado de la filial activa.
 *  - useClassSchedule: detalle (GET de detalle del backend) con initialData
 *    derivado del list cache para pintado instantáneo.
 *
 * MUTATIONS (toast-free, pattern de Fase 2.2.1 — el caller maneja los toasts
 * y el 409 vía useConflictHandler):
 *  - useCreateSchedule / useUpdateSchedule: optimistic + rollback.
 *  - useGenerateSessions: bulk branch-wide por rango.
 *  - useGenerateScheduleSessions: genera SOLO un schedule iterando el
 *    endpoint single-date por cada fecha del weekday en el rango
 *    (Promise.allSettled), y agrega el summary client-side con el mismo
 *    shape que el bulk para reutilizar el componente de resumen.
 *  - useGenerateMissingSessions: bulk branch-wide que rellena solo huecos.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  classSchedulesApi,
  classSessionsApi,
  type ClassScheduleCreateBody,
  type ClassScheduleUpdateBody,
  type SessionsGenerateBody,
  type SessionsGenerateItem,
  type SessionsGenerateResponse,
} from '@/lib/api/endpoints'
import type { ClassSchedule, PaginatedResponse, Weekday } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'
import { extractConflict } from './use-conflict-handler'
import { STALE, kuroRetry } from './_shared'
import { useCurrentContext } from './use-current-context'

export interface UseClassSchedulesParams {
  page?: number
  limit?: number
}

/** Filtro de prefijo: matchea todas las listas de schedules de la filial. */
function schedulesFilter(orgId: string | null, branchId: string | null) {
  return { queryKey: ['class-schedules', orgId, branchId] as const }
}

type SchedulesSnapshot = [
  readonly unknown[],
  PaginatedResponse<ClassSchedule> | undefined,
][]

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
 * Detalle de un schedule. Usa el GET de detalle del backend, con `initialData`
 * derivado del list cache (si está presente) para pintar al instante mientras
 * revalida — y como fallback si el detalle aún no estuviera disponible.
 */
export function useClassSchedule(scheduleId: string) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useQuery({
    queryKey: ['class-schedule', orgId, branchId, scheduleId],
    queryFn: () =>
      classSchedulesApi.get(orgId as string, branchId as string, scheduleId),
    staleTime: STALE.detail,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && scheduleId),
    initialData: () => {
      const lists = qc.getQueriesData<PaginatedResponse<ClassSchedule>>(
        schedulesFilter(orgId, branchId),
      )
      for (const [, data] of lists) {
        const found = data?.items.find((s) => s.id === scheduleId)
        if (found) return found
      }
      return undefined
    },
  })
}

// ── Mutations: create / update ────────────────────────────────

/** Crea un schedule. Inserción optimista en todas las listas cacheadas. */
export function useCreateSchedule() {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: ClassScheduleCreateBody) =>
      classSchedulesApi.create(orgId as string, branchId as string, body),
    onMutate: async (body) => {
      const filter = schedulesFilter(orgId, branchId)
      await qc.cancelQueries(filter)
      const snapshot = qc.getQueriesData<PaginatedResponse<ClassSchedule>>(
        filter,
      ) as SchedulesSnapshot
      const optimistic: ClassSchedule = {
        id: `optimistic-${crypto.randomUUID()}`,
        organizationId: orgId ?? '',
        branchId: branchId ?? '',
        instructorMembershipId: body.instructorMembershipId,
        title: body.title,
        classType: body.classType,
        description: body.description ?? null,
        weekday: body.weekday,
        startTime: body.startTime,
        endTime: body.endTime,
        timezone: body.timezone,
        capacity: body.capacity ?? null,
        isActive: body.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        instructorMembership: null,
      }
      qc.setQueriesData<PaginatedResponse<ClassSchedule>>(filter, (old) =>
        old
          ? {
              ...old,
              items: [optimistic, ...old.items],
              meta: { ...old.meta, total: old.meta.total + 1 },
            }
          : old,
      )
      return { snapshot }
    },
    onError: (_error, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSettled: () => qc.invalidateQueries(schedulesFilter(orgId, branchId)),
  })
}

/** Actualiza un schedule. Patch optimista sobre list + detail. */
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
    onMutate: async (body) => {
      const filter = schedulesFilter(orgId, branchId)
      await qc.cancelQueries(filter)
      const snapshot = qc.getQueriesData<PaginatedResponse<ClassSchedule>>(
        filter,
      ) as SchedulesSnapshot
      // Los campos del PATCH mapean 1:1 al shape de ClassSchedule.
      const patch = body as Partial<ClassSchedule>
      qc.setQueriesData<PaginatedResponse<ClassSchedule>>(filter, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((s) =>
                s.id === scheduleId ? { ...s, ...patch } : s,
              ),
            }
          : old,
      )
      const detailKey = ['class-schedule', orgId, branchId, scheduleId]
      const prevDetail = qc.getQueryData<ClassSchedule>(detailKey)
      if (prevDetail) {
        qc.setQueryData<ClassSchedule>(detailKey, { ...prevDetail, ...patch })
      }
      return { snapshot, prevDetail }
    },
    onError: (_error, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data))
      if (ctx?.prevDetail) {
        qc.setQueryData(
          ['class-schedule', orgId, branchId, scheduleId],
          ctx.prevDetail,
        )
      }
    },
    onSettled: () => {
      qc.invalidateQueries(schedulesFilter(orgId, branchId))
      qc.invalidateQueries({
        queryKey: ['class-schedule', orgId, branchId, scheduleId],
      })
    },
  })
}

// ── Mutations: generación de sesiones ─────────────────────────

/** Invalida calendario + huecos tras generar (la fuente de verdad es el server). */
function invalidateAfterGenerate(
  qc: ReturnType<typeof useQueryClient>,
  orgId: string | null,
  branchId: string | null,
) {
  qc.invalidateQueries({ queryKey: ['class-calendar', orgId, branchId] })
  qc.invalidateQueries({ queryKey: ['class-sessions', orgId, branchId] })
  qc.invalidateQueries({ queryKey: ['class-session-gaps', orgId, branchId] })
}

/**
 * Generación bulk branch-wide por rango: materializa sesiones de TODOS los
 * schedules activos en [fromDate, toDate]. Usado por el botón del toolbar.
 */
export function useGenerateSessions() {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: SessionsGenerateBody) =>
      classSessionsApi.generate(orgId as string, branchId as string, body),
    onSettled: () => invalidateAfterGenerate(qc, orgId, branchId),
  })
}

/**
 * Rellena solo los huecos del rango (idempotente, branch-wide). Mismo shape
 * de respuesta que generate.
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
    onSettled: () => invalidateAfterGenerate(qc, orgId, branchId),
  })
}

// ── Generación por-schedule (loop single-date) ────────────────

const WEEKDAY_TO_JS: Record<Weekday, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

/** Fechas (YYYY-MM-DD) en [fromDate, toDate] cuyo weekday coincide. */
export function datesForWeekday(
  fromDate: string,
  toDate: string,
  weekday: Weekday,
): string[] {
  const target = WEEKDAY_TO_JS[weekday]
  const out: string[] = []
  const cursor = new Date(`${fromDate}T00:00:00`)
  const end = new Date(`${toDate}T00:00:00`)
  while (cursor.getTime() <= end.getTime()) {
    if (cursor.getDay() === target) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      out.push(`${y}-${m}-${d}`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

/** ¿El 409 corresponde a una sesión ya existente (→ skipped) y no a un overlap? */
function isDuplicate(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false
  const body = error.body as Record<string, unknown> | undefined
  const haystack = JSON.stringify(body ?? '').toUpperCase()
  // El backend marca el duplicado como DUPLICATE_SESSION / "already exists";
  // los overlaps reales usan *_OVERLAP. Si no es un overlap conocido, lo
  // tratamos como duplicado (skipped) en vez de conflicto.
  if (/DUPLICATE|ALREADY[_ ]?EXIST/.test(haystack)) return true
  const conflict = extractConflict(error)
  return conflict ? !/OVERLAP/.test(conflict.type) : false
}

/**
 * Genera SOLO el schedule indicado en el rango: una request single-date por
 * cada fecha del weekday del schedule, en paralelo y tolerante a fallas
 * (Promise.allSettled). Devuelve un SessionsGenerateResponse agregado
 * client-side para reutilizar el componente de summary del bulk.
 */
export function useGenerateScheduleSessions(
  schedule: Pick<ClassSchedule, 'id' | 'weekday'> | null,
) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (
      body: SessionsGenerateBody,
    ): Promise<SessionsGenerateResponse> => {
      if (!schedule) throw new Error('No schedule selected')
      const dates = datesForWeekday(body.fromDate, body.toDate, schedule.weekday)

      const items: SessionsGenerateItem[] = []
      let created = 0
      let skipped = 0
      let conflicts = 0
      let errors = 0

      // SECUENCIAL a propósito: el endpoint single-date corre con advisory
      // locks de branch/instructor dentro de una transacción serializable
      // (API-CONTRACT §generate). Dispararlo en paralelo provoca conflictos
      // de serialización transitorios (varias fechas fallan sin razón de
      // dominio). En serie es determinista; 5-10 requests con spinner es
      // barato. Cada fecha se envuelve en try/catch → una falla no aborta
      // el resto (misma garantía que el allSettled anterior).
      for (const date of dates) {
        try {
          const session = await classSessionsApi.generateFromSchedule(
            orgId as string,
            branchId as string,
            schedule.id,
            { scheduledDate: date },
          )
          created += 1
          items.push({
            scheduleId: schedule.id,
            classSessionId: session.id,
            date,
            status: 'CREATED',
          })
        } catch (error) {
          if (isDuplicate(error)) {
            skipped += 1
            items.push({ scheduleId: schedule.id, date, status: 'SKIPPED_EXISTING' })
          } else if (error instanceof ApiError && error.status === 409) {
            conflicts += 1
            const c = extractConflict(error)
            items.push({
              scheduleId: schedule.id,
              date,
              status: 'CONFLICT',
              conflict: c
                ? {
                    type: c.type,
                    classSessionId: c.classSessionId,
                    branchId: c.branchId,
                    instructorMembershipId: c.instructorMembershipId,
                    startAt: c.startAt,
                    endAt: c.endAt,
                  }
                : undefined,
            })
          } else {
            errors += 1
            items.push({ scheduleId: schedule.id, date, status: 'ERROR' })
          }
        }
      }

      return {
        status: 'COMPLETED',
        fromDate: body.fromDate,
        toDate: body.toDate,
        processedSchedules: 1,
        candidateCount: dates.length,
        created,
        skipped,
        conflicts,
        errors,
        items,
      }
    },
    onSettled: () => invalidateAfterGenerate(qc, orgId, branchId),
  })
}
