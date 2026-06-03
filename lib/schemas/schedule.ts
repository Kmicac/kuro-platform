import { z } from 'zod'
import { CLASS_TYPE_VALUES } from './session'

/**
 * Schemas de validación para class-schedules (templates recurrentes) y para
 * la generación de sesiones por rango.
 *
 * Igual que `session.ts`, son FÁBRICAS: reciben los `messages` ya traducidos
 * (i18n) — y, para generación, `minDate` (hoy en la timezone de la filial) —
 * así el schema queda puro y los errores se muestran traducidos vía
 * <FormMessage>. El form edita `startTime`/`endTime` en HH:mm; la conversión
 * al formato HH:mm:ss del backend y el `timezone` (del branch context) se
 * resuelven en el onSubmit del dialog, NO acá.
 */

export const WEEKDAY_VALUES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Límite duro del backend para la generación de sesiones por rango. */
export const GENERATE_MAX_DAYS = 42
const DAY_MS = 86_400_000

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// ── Create / Update schedule ──────────────────────────────────

export interface ScheduleMessages {
  titleRequired: string
  instructorRequired: string
  endBeforeStart: string
}

export function makeCreateScheduleSchema(messages: ScheduleMessages) {
  return z
    .object({
      title: z.string().trim().min(3, messages.titleRequired).max(100),
      classType: z.enum(CLASS_TYPE_VALUES),
      instructorMembershipId: z.string().min(1, messages.instructorRequired),
      weekday: z.enum(WEEKDAY_VALUES),
      startTime: z.string().regex(TIME_RE),
      endTime: z.string().regex(TIME_RE),
      capacity: z.number().int().min(1).max(200).optional(),
      isActive: z.boolean(),
    })
    .refine((v) => toMinutes(v.endTime) > toMinutes(v.startTime), {
      path: ['endTime'],
      message: messages.endBeforeStart,
    })
  // Sin límite de duración máxima en el frontend (misma decisión que
  // session.ts): el backend tiene la última palabra; acá solo se previene
  // endTime <= startTime.
}

export type CreateScheduleFormValues = z.infer<
  ReturnType<typeof makeCreateScheduleSchema>
>

/**
 * UPDATE (PATCH): misma estructura que create pero todos los campos
 * opcionales. Las validaciones cross-field solo corren si ambos extremos
 * vienen presentes.
 */
export function makeUpdateScheduleSchema(messages: ScheduleMessages) {
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(3, messages.titleRequired)
        .max(100)
        .optional(),
      classType: z.enum(CLASS_TYPE_VALUES).optional(),
      instructorMembershipId: z
        .string()
        .min(1, messages.instructorRequired)
        .optional(),
      weekday: z.enum(WEEKDAY_VALUES).optional(),
      startTime: z.string().regex(TIME_RE).optional(),
      endTime: z.string().regex(TIME_RE).optional(),
      capacity: z.number().int().min(1).max(200).optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (v) =>
        v.startTime == null ||
        v.endTime == null ||
        toMinutes(v.endTime) > toMinutes(v.startTime),
      { path: ['endTime'], message: messages.endBeforeStart },
    )
}

export type UpdateScheduleFormValues = z.infer<
  ReturnType<typeof makeUpdateScheduleSchema>
>

// ── Generate sessions (rango) ─────────────────────────────────

export interface GenerateSessionsMessages {
  rangeRequired: string
  rangeInvalid: string
  rangeTooLong: string
  fromDateInPast: string
}

export interface GenerateSessionsSchemaOpts {
  /** Hoy en la timezone del branch (YYYY-MM-DD). */
  minDate: string
  messages: GenerateSessionsMessages
}

export function makeGenerateSessionsSchema({
  minDate,
  messages,
}: GenerateSessionsSchemaOpts) {
  return z
    .object({
      fromDate: z.string().regex(DATE_RE, messages.rangeRequired),
      toDate: z.string().regex(DATE_RE, messages.rangeRequired),
    })
    .refine((v) => v.fromDate >= minDate, {
      path: ['fromDate'],
      message: messages.fromDateInPast,
    })
    .refine((v) => v.toDate >= v.fromDate, {
      path: ['toDate'],
      message: messages.rangeInvalid,
    })
    .refine(
      (v) => {
        const span =
          (new Date(`${v.toDate}T00:00:00`).getTime() -
            new Date(`${v.fromDate}T00:00:00`).getTime()) /
          DAY_MS
        return span <= GENERATE_MAX_DAYS
      },
      { path: ['toDate'], message: messages.rangeTooLong },
    )
}

export type GenerateSessionsFormValues = z.infer<
  ReturnType<typeof makeGenerateSessionsSchema>
>
