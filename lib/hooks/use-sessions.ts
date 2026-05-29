'use client'

import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { classSessionsApi } from '@/lib/api/endpoints'
import type { ClassSessionListItem } from '@/lib/api/types'
import { STALE, kuroRetry } from './_shared'
import { useCurrentContext } from './use-current-context'

/**
 * Detalle canónico del ClassSession.
 *
 * El consumer solo pasa `sessionId` — `orgId` y `branchId` los resuelve
 * automáticamente desde la URL vía useCurrentContext(). Si en algún caso
 * la pantalla NO está dentro de /org/[orgId]/branches/[branchId]/...,
 * el hook queda deshabilitado y `data` permanece undefined.
 */
export function useSession(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: ['session', orgId, branchId, sessionId],
    queryFn: () =>
      classSessionsApi.get(orgId as string, branchId as string, sessionId),
    staleTime: STALE.detail,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && sessionId),
  })
}

/**
 * Resumen agregado de attendance de una sesión.
 */
export function useSessionAttendance(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: ['session-attendance', orgId, branchId, sessionId],
    queryFn: () =>
      classSessionsApi.attendance(
        orgId as string,
        branchId as string,
        sessionId
      ),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && sessionId),
  })
}

/**
 * Roster técnico: lista de alumnos esperados con su faja, status y
 * registro de asistencia individual.
 */
export function useSessionTechnicalRoster(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: ['session-roster', orgId, branchId, sessionId],
    queryFn: () =>
      classSessionsApi.technicalRoster(
        orgId as string,
        branchId as string,
        sessionId
      ),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && sessionId),
  })
}

/**
 * Class calendar (vista DAY o WEEK) agrupada por día.
 * staleTime analytics — el calendar se cachea ~30s.
 */
export interface UseClassCalendarParams {
  startDate: string // YYYY-MM-DD
  view?: 'DAY' | 'WEEK'
}

export function useClassCalendar(params: UseClassCalendarParams) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: [
      'class-calendar',
      orgId,
      branchId,
      params.startDate,
      params.view ?? 'DAY',
    ],
    queryFn: () =>
      classSessionsApi.calendar(orgId as string, branchId as string, params),
    staleTime: STALE.analytics,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && params.startDate),
  })
}

/**
 * Calendar range: cubre rangos arbitrarios (DAY/WEEK/MONTH/grilla de 6
 * semanas/etc.) particionando el rango en semanas y disparando una
 * query a /class-calendar (view=WEEK) por cada semana en paralelo.
 *
 * Se evita usar el endpoint paginado GET /class-sessions porque su
 * `limit` máximo es 100, insuficiente para vistas de mes.
 */
export interface UseCalendarRangeParams {
  /** Primer día del rango (incluye). Se redondea a su semana (lunes). */
  startDate: Date
  /** Último día del rango (incluye). Se redondea a su semana (domingo). */
  endDate: Date
}

export interface UseCalendarRangeResult {
  items: ClassSessionListItem[]
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
}

function toISODateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function mondayOf(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  const dow = r.getDay() // 0=domingo..6=sábado
  const diff = (dow + 6) % 7
  r.setDate(r.getDate() - diff)
  return r
}

export function useCalendarRange(
  params: UseCalendarRangeParams,
): UseCalendarRangeResult {
  const { orgId, branchId } = useCurrentContext()

  // Generar el lunes de cada semana cubierta por [startDate, endDate].
  // Estable como key: ISO string del lunes.
  const weekStarts = useMemo(() => {
    const startMonday = mondayOf(params.startDate)
    const endMonday = mondayOf(params.endDate)
    const out: string[] = []
    const cursor = new Date(startMonday)
    while (cursor.getTime() <= endMonday.getTime()) {
      out.push(toISODateLocal(cursor))
      cursor.setDate(cursor.getDate() + 7)
    }
    return out
  }, [params.startDate, params.endDate])

  const queries = useQueries({
    queries: weekStarts.map((startDate) => ({
      queryKey: ['class-calendar', orgId, branchId, startDate, 'WEEK'] as const,
      queryFn: () =>
        classSessionsApi.calendar(orgId as string, branchId as string, {
          startDate,
          view: 'WEEK' as const,
        }),
      staleTime: STALE.analytics,
      retry: kuroRetry,
      enabled: Boolean(orgId && branchId),
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const isError = queries.some((q) => q.isError)
  const error = queries.find((q) => q.error)?.error
  // Clave estable que cambia sólo cuando algún sub-query trae datos nuevos:
  // sirve para que `items` no re-aloque la memo en cada render.
  const dataKey = queries.map((q) => q.dataUpdatedAt).join('|')
  const items = useMemo<ClassSessionListItem[]>(
    () =>
      queries.flatMap((q) =>
        (q.data?.days ?? []).flatMap((day) => day.items),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataKey],
  )

  const refetch = () => {
    queries.forEach((q) => q.refetch())
  }

  return { items, isLoading, isError, error, refetch }
}

/**
 * Lista paginada de class-sessions por rango de fechas.
 */
export interface UseClassSessionsByDateRangeParams {
  fromDate: string
  toDate: string
  page?: number
  limit?: number
}

export function useClassSessionsByDateRange(
  params: UseClassSessionsByDateRangeParams
) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: [
      'class-sessions',
      orgId,
      branchId,
      {
        fromDate: params.fromDate,
        toDate: params.toDate,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    ],
    queryFn: () =>
      classSessionsApi.list(orgId as string, branchId as string, params),
    staleTime: STALE.resource,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && params.fromDate && params.toDate),
  })
}
