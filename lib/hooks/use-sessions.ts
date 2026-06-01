'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  view?: 'DAY' | 'WEEK' | 'MONTH' | 'LIST'
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
 * Calendar range: resuelve el rango pedido contra las views nativas de
 * /class-calendar en UNA sola request (DAY/WEEK/MONTH/LIST).
 *
 * El backend ahora soporta `view=MONTH` (grilla calendario completa de
 * lunes a domingo — 35-42 días — incluyendo días de meses adyacentes con
 * sus clases) y `view=LIST` (mismo rango que MONTH, con `items[]` plano
 * cronológico), por lo que ya no hace falta el workaround anterior que
 * partía el rango en semanas y disparaba 5-6 requests `view=WEEK`.
 *
 * La API pública del hook se mantiene idéntica: recibe `{ startDate,
 * endDate }` y devuelve `{ items, isLoading, isError, error, refetch }`.
 * Como el consumidor no pasa la view explícita, ésta se infiere del
 * tamaño del rango (ver `viewForRange`). El backend agrupa por
 * `scheduledDate`; `items` plano es la fuente canónica cuando viene.
 */
export interface UseCalendarRangeParams {
  /** Primer día del rango (incluye). */
  startDate: Date
  /** Último día del rango (incluye). */
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

const DAY_MS = 86_400_000

/**
 * Infiere la view nativa del backend a partir del span del rango.
 * El consumidor deriva el rango desde su view (day=1 día, week=7 días,
 * month/list=grilla de 6 semanas ≈ 42 días), así que el span es estable:
 *   ≤ 1 día  → DAY
 *   ≤ 7 días → WEEK
 *   resto    → MONTH (cubre month + list; ambas devuelven la grilla
 *              completa del mes — 35-42 días — lunes a domingo)
 */
function viewForRange(
  startDate: Date,
  endDate: Date,
): 'DAY' | 'WEEK' | 'MONTH' {
  const days = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS)
  if (days <= 1) return 'DAY'
  if (days <= 7) return 'WEEK'
  return 'MONTH'
}

/**
 * Calcula el `startDate` (YYYY-MM-DD) a enviar al backend.
 * Para DAY/WEEK el inicio del rango ya es el ancla correcta. Para MONTH
 * basta con anclar a un día del mes objetivo (acá: el día 1, vía el punto
 * medio del rango): el backend identifica el mes y expande por su cuenta a
 * la grilla completa lunes-domingo. NO se limita el rango a 28-31 días.
 */
function startDateForView(
  view: 'DAY' | 'WEEK' | 'MONTH',
  startDate: Date,
  endDate: Date,
): string {
  if (view !== 'MONTH') return toISODateLocal(startDate)
  const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2)
  return toISODateLocal(new Date(midpoint.getFullYear(), midpoint.getMonth(), 1))
}

export function useCalendarRange(
  params: UseCalendarRangeParams,
): UseCalendarRangeResult {
  const { orgId, branchId } = useCurrentContext()

  const { view, startDate } = useMemo(() => {
    const v = viewForRange(params.startDate, params.endDate)
    return { view: v, startDate: startDateForView(v, params.startDate, params.endDate) }
  }, [params.startDate, params.endDate])

  const query = useQuery({
    queryKey: ['class-calendar', orgId, branchId, startDate, view] as const,
    queryFn: () =>
      classSessionsApi.calendar(orgId as string, branchId as string, {
        startDate,
        view,
      }),
    staleTime: STALE.analytics,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId),
  })

  const items = useMemo<ClassSessionListItem[]>(() => {
    const data = query.data
    if (!data) return []
    // Fuente canónica: `items[]` plano cronológico (presente en todas las
    // views nuevas). Fallback temporal a `days[].items` por compatibilidad
    // con respuestas que aún no incluyan el array plano.
    if (data.items) return data.items
    return data.days.flatMap((day) => day.items)
  }, [query.data])

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => query.refetch(),
  }
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
