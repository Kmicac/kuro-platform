/**
 * Configuración central de i18n (next-intl).
 *
 * Fase 2.1 — español neutro ('tú' estándar) como único idioma base.
 * `locales` queda preparado para sumar 'en' y 'pt' en el futuro: cuando
 * se agreguen, ampliar este array y activar el middleware de routing
 * (ver i18n/routing.ts).
 */

/** Idiomas soportados. Hoy solo 'es'; futuro: ['es', 'en', 'pt']. */
export const locales = ['es'] as const

export type Locale = (typeof locales)[number]

/** Idioma por defecto y único activo en Fase 2.1. */
export const defaultLocale: Locale = 'es'

/**
 * Zona horaria por defecto para formateo de fechas/horas server-side.
 * El backend emite timestamps UTC ISO; el formateo a hora local se hace
 * acá vía useFormatter().
 */
export const timeZone = 'America/Argentina/Buenos_Aires'
