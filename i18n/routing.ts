import { defineRouting } from 'next-intl/routing'
import { defaultLocale, locales } from './config'

/**
 * Routing por locale — DEFINIDO pero NO conectado a middleware todavía.
 *
 * En Fase 2.1 la app corre con un solo idioma y SIN prefijo `/es/` en la
 * URL. No existe `middleware.ts` ni el segmento `app/[locale]/`, así que
 * este objeto no afecta el ruteo actual: sólo centraliza la config para
 * el día que se sumen idiomas.
 *
 * Para activar multi-idioma en el futuro:
 *   1. Ampliar `locales` en i18n/config.ts → ['es', 'en', 'pt'].
 *   2. Crear `middleware.ts` con `createMiddleware(routing)`.
 *   3. Mover `app/*` a `app/[locale]/*`.
 *   4. Usar los helpers de `next-intl/navigation` (Link, useRouter) creados
 *      a partir de este `routing`.
 *   5. En i18n/request.ts, resolver el locale desde `requestLocale` en vez
 *      de fijarlo a `defaultLocale`.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  // Sin prefijo para el locale por defecto (cuando se active el middleware).
  localePrefix: 'as-needed',
})
