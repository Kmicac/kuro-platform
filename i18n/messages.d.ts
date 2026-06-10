/**
 * Augmentación type-safe de next-intl.
 *
 * Al declarar `Messages`, next-intl tipa las keys de `useTranslations(ns)`
 * y `getTranslations(ns)`: un `t('keyInexistente')` se vuelve ERROR de
 * TypeScript. Esto convierte a `pnpm tsc --noEmit` en la red de seguridad
 * de la migración (detecta keys mal escritas o faltantes).
 *
 * El idioma base 'es' es la fuente de verdad del shape de los mensajes.
 */
import type common from '../messages/es/common.json'
import type auth from '../messages/es/auth.json'
import type navigation from '../messages/es/navigation.json'
import type dashboard from '../messages/es/dashboard.json'
import type calendar from '../messages/es/calendar.json'
import type schedules from '../messages/es/schedules.json'
import type students from '../messages/es/students.json'
import type intake from '../messages/es/intake.json'
import type claims from '../messages/es/claims.json'
import type billing from '../messages/es/billing.json'
import type attendance from '../messages/es/attendance.json'
import type qrCheckin from '../messages/es/qr-checkin.json'
import type classDetail from '../messages/es/class-detail.json'
import type errors from '../messages/es/errors.json'
import type emptyStates from '../messages/es/empty-states.json'
import type { routing } from './routing'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: {
      common: typeof common
      auth: typeof auth
      navigation: typeof navigation
      dashboard: typeof dashboard
      calendar: typeof calendar
      schedules: typeof schedules
      students: typeof students
      intake: typeof intake
      claims: typeof claims
      billing: typeof billing
      attendance: typeof attendance
      'qr-checkin': typeof qrCheckin
      'class-detail': typeof classDetail
      errors: typeof errors
      'empty-states': typeof emptyStates
    }
  }
}
