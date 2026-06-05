'use client'

/**
 * Hooks de asistencia de una class-session (Fase 2.2.4 + 2.2.12).
 *
 * READS:
 *  - useSessionAttendance   — vista administrativa (counts + bySource).
 *  - useTechnicalRoster      — roster técnico (alumnos esperados + status).
 *  - useSessionRoster        — alias de roster con polling opcional (QR page).
 *
 * MUTATIONS (optimistic + toast-free — el caller maneja toasts/i18n):
 *  - useRecordAttendance     — bulk POST (STAFF_MANUAL).
 *  - useUpdateAttendance     — corrección individual (PATCH).
 *  - useDeleteAttendance     — elimina un registro (DELETE).
 *  - useIssueQRToken         — emite un token QR (POST, NO optimistic).
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
  AttendanceStatus,
  IssueQRTokenBody,
  RecordAttendanceBody,
  SessionTechnicalRoster,
  SuggestAttendanceBody,
  TechnicalRosterItem,
  UpdateAttendanceBody,
} from '@/lib/api/types'
import { STALE, kuroRetry } from './_shared'
import { useCurrentContext } from './use-current-context'

/** Resumen + registros de asistencia de la sesión (vista administrativa). */
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
 * Fuente canónica para la página de asistencia y el roster del QR.
 *
 * `pollMs` (opcional) activa refetch en intervalo — lo usa la página de QR para
 * reflejar check-ins en (cuasi) tiempo real.
 */
export function useSessionRoster(
  sessionId: string,
  options?: { pollMs?: number },
) {
  const { orgId, branchId } = useCurrentContext()

  return useQuery({
    queryKey: ['session-roster', orgId, branchId, sessionId],
    queryFn: () =>
      classSessionsApi.technicalRoster(
        orgId as string,
        branchId as string,
        sessionId,
      ),
    staleTime: STALE.detail,
    retry: kuroRetry,
    enabled: Boolean(orgId && branchId && sessionId),
    refetchInterval: options?.pollMs,
  })
}

/** Alias retro-compatible (read). Preferir `useSessionRoster`. */
export const useTechnicalRoster = useSessionRoster

// ── Optimistic helpers (operan sobre el roster técnico) ────────

/**
 * Aplica un patch optimista a la `attendance` de un alumno dentro del roster
 * cacheado. Si el alumno no estaba en el roster, lo deja igual: la
 * reconciliación con el servidor llega vía invalidate en onSettled.
 */
function patchRosterStatus(
  roster: SessionTechnicalRoster,
  studentId: string,
  status: AttendanceStatus,
): SessionTechnicalRoster {
  return {
    ...roster,
    items: roster.items.map((it) =>
      it.studentId === studentId
        ? {
            ...it,
            attendance: {
              recordId: it.attendance?.recordId ?? `optimistic-${studentId}`,
              status,
              reasonCode: it.attendance?.reasonCode ?? null,
              source: it.attendance?.source ?? 'STAFF_MANUAL',
              updatedAt: it.attendance?.updatedAt ?? '',
            },
          }
        : it,
    ),
  }
}

/** Elimina (optimista) el registro de asistencia de un alumno del roster. */
function clearRosterStatus(
  roster: SessionTechnicalRoster,
  studentId: string,
): SessionTechnicalRoster {
  return {
    ...roster,
    items: roster.items.map((it: TechnicalRosterItem) =>
      it.studentId === studentId ? { ...it, attendance: null } : it,
    ),
  }
}

/**
 * Registro bulk de asistencia (STAFF_MANUAL).
 *
 * Optimista: patchea el status de cada record en el roster cacheado al instante.
 * Toast-free: el caller decide success/error con mensajes de dominio (i18n).
 */
export function useRecordAttendance(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()
  const key = ['session-roster', orgId, branchId, sessionId] as const

  return useMutation({
    mutationFn: (body: RecordAttendanceBody) =>
      classSessionsApi.recordAttendance(
        orgId as string,
        branchId as string,
        sessionId,
        body,
      ),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key })
      const snapshot = qc.getQueryData<SessionTechnicalRoster>(key)
      if (snapshot) {
        let next = snapshot
        for (const rec of body.records) {
          next = patchRosterStatus(next, rec.studentId, rec.status)
        }
        qc.setQueryData(key, next)
      }
      return { snapshot }
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(key, ctx.snapshot)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({
        queryKey: ['session-attendance', orgId, branchId, sessionId],
      })
      qc.invalidateQueries({
        queryKey: ['session', orgId, branchId, sessionId],
      })
    },
  })
}

/**
 * Corrección individual de asistencia (keyed por studentId).
 * Optimista sobre el roster. Toast-free.
 */
export function useUpdateAttendance(
  studentId: string,
  sessionId: string,
) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()
  const key = ['session-roster', orgId, branchId, sessionId] as const

  return useMutation({
    mutationFn: (body: UpdateAttendanceBody) =>
      classSessionsApi.updateAttendance(
        orgId as string,
        branchId as string,
        sessionId,
        studentId,
        body,
      ),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key })
      const snapshot = qc.getQueryData<SessionTechnicalRoster>(key)
      if (snapshot && body.status) {
        qc.setQueryData(key, patchRosterStatus(snapshot, studentId, body.status))
      }
      return { snapshot }
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(key, ctx.snapshot)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({
        queryKey: ['session-attendance', orgId, branchId, sessionId],
      })
      qc.invalidateQueries({
        queryKey: ['session', orgId, branchId, sessionId],
      })
    },
  })
}

/**
 * Elimina el registro de asistencia de un alumno (DELETE).
 * Optimista (lo saca del roster). Toast-free.
 */
export function useDeleteAttendance(
  studentId: string,
  sessionId: string,
) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()
  const key = ['session-roster', orgId, branchId, sessionId] as const

  return useMutation({
    mutationFn: () =>
      classSessionsApi.deleteAttendance(
        orgId as string,
        branchId as string,
        sessionId,
        studentId,
      ),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key })
      const snapshot = qc.getQueryData<SessionTechnicalRoster>(key)
      if (snapshot) {
        qc.setQueryData(key, clearRosterStatus(snapshot, studentId))
      }
      return { snapshot }
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(key, ctx.snapshot)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({
        queryKey: ['session-attendance', orgId, branchId, sessionId],
      })
      qc.invalidateQueries({
        queryKey: ['session', orgId, branchId, sessionId],
      })
    },
  })
}

/**
 * Emite un token QR para el check-in de la sesión.
 *
 * NO es optimista: debe esperar la respuesta real del backend (el token y su
 * `expiresAt` los define el servidor; el cliente solo propone `expiresInMinutes`,
 * que el backend puede capear). Toast-free.
 */
export function useIssueQRToken(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()

  return useMutation({
    mutationFn: (body: IssueQRTokenBody) =>
      classSessionsApi.issueQRToken(
        orgId as string,
        branchId as string,
        sessionId,
        body,
      ),
  })
}

/**
 * Sugiere asistencia a uno o más alumnos (recomendación, NO asistencia real).
 *
 * NO es optimista: es batch con un response detallado (created / skipped /
 * alreadySuggested / invalidStudents) que el caller usa para el toast. NO crea
 * AttendanceRecord/AttendanceIntent ni mueve enrolledCount. Toast-free.
 *
 * `branchId` se recibe explícito (el dialog puede abrirse desde el Sheet del
 * calendar org-level, donde la URL no trae branchId). Cae al contexto si no.
 */
export function useSuggestAttendance(sessionId: string, branchId?: string) {
  const ctx = useCurrentContext()
  const qc = useQueryClient()
  const orgId = ctx.orgId
  const resolvedBranchId = branchId ?? ctx.branchId

  return useMutation({
    mutationFn: (body: SuggestAttendanceBody) =>
      classSessionsApi.suggestAttendance(
        orgId as string,
        resolvedBranchId as string,
        sessionId,
        body,
      ),
    // invalidStudents puede revelar cambios de estado del alumno → refrescar
    // el roster por las dudas. No toca counts de asistencia (sugerir no marca).
    onSettled: () => {
      qc.invalidateQueries({
        queryKey: ['session-roster', orgId, resolvedBranchId, sessionId],
      })
    },
  })
}
