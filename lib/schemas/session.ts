import { z } from 'zod'

/**
 * Schema de validación para crear una sesión ÚNICA (no recurrente).
 *
 * El form edita campos amigables (scheduledDate + startTime/endTime en HH:MM);
 * la conversión a `startAt`/`endAt` ISO UTC (vía branchTimezone) se hace en el
 * onSubmit del dialog, NO acá. `classScheduleId` queda fuera a propósito (esto
 * es para sesiones sueltas, no para schedules recurrentes).
 *
 * Es una FÁBRICA: recibe `minDate` (hoy en la timezone del branch, para
 * bloquear fechas pasadas) y los `messages` ya traducidos (i18n) — así el
 * schema queda puro y los errores se muestran traducidos vía <FormMessage>.
 */
export const CLASS_TYPE_VALUES = [
  'GI',
  'NO_GI',
  'FUNDAMENTALS',
  'ADVANCED',
  'KIDS',
  'COMPETITION',
  'OPEN_MAT',
  'SEMINAR',
  'PRIVATE',
] as const

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export interface CreateSessionMessages {
  titleRequired: string
  instructorRequired: string
  dateInPast: string
  endBeforeStart: string
}

export interface CreateSessionSchemaOpts {
  /** Hoy en la timezone del branch (YYYY-MM-DD). */
  minDate: string
  messages: CreateSessionMessages
}

export function makeCreateSessionSchema({
  minDate,
  messages,
}: CreateSessionSchemaOpts) {
  return z
    .object({
      title: z.string().trim().min(3, messages.titleRequired).max(100),
      classType: z.enum(CLASS_TYPE_VALUES),
      instructorMembershipId: z.string().min(1, messages.instructorRequired),
      scheduledDate: z.string().regex(DATE_RE),
      startTime: z.string().regex(TIME_RE),
      endTime: z.string().regex(TIME_RE),
      capacity: z.number().int().min(1).max(200).optional(),
      notes: z.string().max(500).optional(),
    })
    .refine((v) => v.scheduledDate >= minDate, {
      path: ['scheduledDate'],
      message: messages.dateInPast,
    })
    .refine((v) => toMinutes(v.endTime) > toMinutes(v.startTime), {
      path: ['endTime'],
      message: messages.endBeforeStart,
    })
  // Sin límite de duración máxima en el frontend: depende del tipo de
  // actividad (seminario/competición/ceremonia pueden durar más). El backend
  // tiene la última palabra; acá solo se previene endTime <= startTime.
}

export type CreateSessionFormValues = z.infer<
  ReturnType<typeof makeCreateSessionSchema>
>

/**
 * Schema de UPDATE (PATCH): misma estructura que create pero todos los campos
 * opcionales. Las validaciones cross-field solo corren si los campos vienen
 * (endTime > startTime si ambos presentes; scheduledDate >= hoy si presente).
 *
 * El form de edit lo usa como resolver: como el form llega pre-llenado, los
 * campos presentes igual se validan (un title vacío sigue fallando min(3)).
 */
export function makeUpdateSessionSchema({
  minDate,
  messages,
}: CreateSessionSchemaOpts) {
  return z
    .object({
      title: z.string().trim().min(3, messages.titleRequired).max(100).optional(),
      classType: z.enum(CLASS_TYPE_VALUES).optional(),
      instructorMembershipId: z
        .string()
        .min(1, messages.instructorRequired)
        .optional(),
      scheduledDate: z.string().regex(DATE_RE).optional(),
      startTime: z.string().regex(TIME_RE).optional(),
      endTime: z.string().regex(TIME_RE).optional(),
      capacity: z.number().int().min(1).max(200).optional(),
      notes: z.string().max(500).optional(),
    })
    .refine((v) => v.scheduledDate == null || v.scheduledDate >= minDate, {
      path: ['scheduledDate'],
      message: messages.dateInPast,
    })
    .refine(
      (v) =>
        v.startTime == null ||
        v.endTime == null ||
        toMinutes(v.endTime) > toMinutes(v.startTime),
      { path: ['endTime'], message: messages.endBeforeStart },
    )
}

export type UpdateSessionFormValues = z.infer<
  ReturnType<typeof makeUpdateSessionSchema>
>

// ── Cancelación ───────────────────────────────────────────────

export interface CancelSessionMessages {
  reasonRequired: string
  reasonTooShort: string
}

/** Cancelar una sesión exige un motivo (mín. 10 caracteres). */
export function makeCancelSessionSchema(messages: CancelSessionMessages) {
  return z.object({
    cancellationReason: z
      .string()
      .trim()
      .min(1, { message: messages.reasonRequired })
      .min(10, { message: messages.reasonTooShort })
      .max(500),
  })
}

export type CancelSessionFormValues = z.infer<
  ReturnType<typeof makeCancelSessionSchema>
>
