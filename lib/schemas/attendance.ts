import { z } from 'zod'

/**
 * Schemas de validación para registro/corrección de asistencia (STAFF_MANUAL).
 *
 * Son FÁBRICAS que reciben los `messages` ya traducidos (i18n) — así el schema
 * queda puro y los errores se muestran traducidos vía <FormMessage> o se
 * consumen directo en el caller. Ver lib/schemas/README.md y session.ts.
 *
 * Los enums son la fuente de verdad del backend (API-CONTRACT §10 Attendance):
 *  - AttendanceStatus:     PRESENT | LATE | ABSENT | EXCUSED
 *  - AttendanceReasonCode: INJURY | TRAVEL | SCHEDULE_CONFLICT |
 *                          TEMPORARY_SUSPENSION | VALID_VISIT |
 *                          OPERATIONAL_ERROR | OTHER
 */
export const ATTENDANCE_STATUS_VALUES = [
  'PRESENT',
  'LATE',
  'ABSENT',
  'EXCUSED',
] as const

export const ATTENDANCE_REASON_CODE_VALUES = [
  'INJURY',
  'TRAVEL',
  'SCHEDULE_CONFLICT',
  'TEMPORARY_SUSPENSION',
  'VALID_VISIT',
  'OPERATIONAL_ERROR',
  'OTHER',
] as const

export interface AttendanceRecordMessages {
  studentRequired: string
  statusRequired: string
  notesTooLong: string
}

/** Schema de un único registro de asistencia (studentId + status + opcionales). */
export function makeAttendanceRecordSchema(messages: AttendanceRecordMessages) {
  return z.object({
    studentId: z.string().min(1, messages.studentRequired),
    status: z.enum(ATTENDANCE_STATUS_VALUES, {
      message: messages.statusRequired,
    }),
    reasonCode: z.enum(ATTENDANCE_REASON_CODE_VALUES).optional(),
    notes: z.string().trim().max(500, messages.notesTooLong).optional(),
  })
}

export type AttendanceRecordFormValues = z.infer<
  ReturnType<typeof makeAttendanceRecordSchema>
>

/** Schema del body bulk (`{ records: [...] }`) del POST .../attendance. */
export function makeBulkAttendanceSchema(messages: AttendanceRecordMessages) {
  return z.object({
    records: z.array(makeAttendanceRecordSchema(messages)).min(1),
  })
}

export type BulkAttendanceFormValues = z.infer<
  ReturnType<typeof makeBulkAttendanceSchema>
>

// ── Nota individual (dialog de nota por alumno) ────────────────

export interface AttendanceNoteMessages {
  notesTooLong: string
}

/** Schema del dialog de nota: solo el campo `notes` (opcional, max 500). */
export function makeAttendanceNoteSchema(messages: AttendanceNoteMessages) {
  return z.object({
    notes: z.string().trim().max(500, messages.notesTooLong),
  })
}

export type AttendanceNoteFormValues = z.infer<
  ReturnType<typeof makeAttendanceNoteSchema>
>
