// Sentry — runtime browser. En Next 16 + Turbopack la config del cliente va
// en `instrumentation-client.ts` (el viejo `sentry.client.config.ts` no lo
// bundlea Turbopack). Sin DSN (env ausente) el SDK queda deshabilitado.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // No reportar 4xx esperables ni ruido conocido de browser.
  ignoreErrors: [
    /\b403\b/,
    /\b404\b/,
    /\b409\b/,
    /\b422\b/,
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.',
    'Non-Error promise rejection captured',
  ],

  // Protección de PII: nunca mandar cookies ni el header Authorization.
  beforeSend(event) {
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    const headers = event.request?.headers
    if (headers && 'authorization' in headers) {
      headers.authorization = '[REDACTED]'
    }
    return event
  },

  // Session Replay solo en errores (no full-session en V1).
  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
})

// Instrumentación de navegaciones del App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
