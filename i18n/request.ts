import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, timeZone } from './config'

/**
 * Namespaces de mensajes. El orden no importa; cada archivo se monta bajo
 * su key de namespace en el objeto final de `messages`. Mantener esta lista
 * sincronizada con messages/<locale>/*.json y con AppConfig['Messages']
 * (ver i18n/messages.d.ts).
 */
const NAMESPACES = [
  'common',
  'auth',
  'navigation',
  'dashboard',
  'calendar',
  'schedules',
  'students',
  'intake',
  'claims',
  'errors',
  'empty-states',
] as const

/**
 * Carga y mergea los 10 namespaces de messages/<locale>/*.json en un solo
 * objeto `{ [namespace]: { ...keys } }`.
 */
async function loadMessages(locale: string) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`)
      return [ns, mod.default] as const
    }),
  )
  return Object.fromEntries(entries)
}

export default getRequestConfig(async () => {
  // Sin middleware de routing en Fase 2.1 → idioma fijo.
  // Cuando se sumen idiomas: resolver desde `requestLocale` (ver routing.ts).
  const locale = defaultLocale

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone,
    // Ancla temporal estable por request para el formateo de tiempos
    // relativos (useFormatter().relativeTime).
    now: new Date(),
  }
})
