'use client'

import { useTranslations } from 'next-intl'

import { ApiError } from '@/lib/api/client'
import { isAttendanceWindowError } from '@/lib/api/error-parsers'
import { notifyError } from '@/lib/utils/toast'

/**
 * Handler de error compartido por todos los callers de mutations de asistencia
 * (page bulk, row toggles, nota). Mapea:
 *   - 403            → "sin permiso"
 *   - 409 ventana    → "fuera de la ventana horaria" (mensaje de dominio)
 *   - resto          → genérico (con request-id)
 *
 * Centraliza la matriz para no duplicarla (CLAUDE.md §Forms y Mutations).
 */
export function useAttendanceErrorHandler() {
  const t = useTranslations('attendance')
  const tc = useTranslations('common')

  return (error: unknown): void => {
    if (error instanceof ApiError && error.status === 403) {
      notifyError(t('errors.forbidden'))
      return
    }
    if (isAttendanceWindowError(error)) {
      notifyError(t('errors.outOfWindow'), error)
      return
    }
    notifyError(tc('error.generic'), error)
  }
}
