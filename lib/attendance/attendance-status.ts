import type { AttendanceStatus } from '@/lib/api/types'

export type AttendanceStatusTone =
  | 'checkedIn'
  | 'administrative'
  | 'pending'

export type AttendanceStatusLabelKey =
  | 'status.PRESENT'
  | 'status.LATE'
  | 'status.ABSENT'
  | 'status.EXCUSED'
  | 'status.pending'

export function isCheckedInAttendanceStatus(
  status?: AttendanceStatus | null,
): boolean {
  return status === 'PRESENT' || status === 'LATE'
}

export function isAdministrativeAttendanceStatus(
  status?: AttendanceStatus | null,
): boolean {
  return status === 'ABSENT' || status === 'EXCUSED'
}

export function getAttendanceStatusTone(
  status?: AttendanceStatus | null,
): AttendanceStatusTone {
  if (isCheckedInAttendanceStatus(status)) return 'checkedIn'
  if (isAdministrativeAttendanceStatus(status)) return 'administrative'
  return 'pending'
}

export function getAttendanceStatusLabelKey(
  status?: AttendanceStatus | null,
): AttendanceStatusLabelKey {
  if (!status) return 'status.pending'
  return `status.${status}`
}
