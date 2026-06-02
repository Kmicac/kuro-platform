/**
 * Helpers de notificación (toasts) sobre sonner.
 *
 * Usar SIEMPRE estos helpers en vez de `toast` de sonner directo, para que
 * el estilo y el manejo de errores queden centralizados. Los mensajes deben
 * venir de i18n (messages/es/common.json → common.success/error.*), nunca
 * hardcodeados en el call site.
 *
 * `notifyError` adjunta el `request-id` cuando el error es un ApiError, para
 * que el usuario pueda reportarlo en soporte/debugging.
 */
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'

export function notifySuccess(message: string): void {
  toast.success(message)
}

export function notifyError(message: string, error?: unknown): void {
  const requestId = error instanceof ApiError ? error.requestId : undefined
  toast.error(
    message,
    requestId ? { description: `request-id: ${requestId}` } : undefined,
  )
}

export function notifyInfo(message: string): void {
  toast(message)
}
