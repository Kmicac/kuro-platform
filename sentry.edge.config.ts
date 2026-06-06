// Sentry — runtime Edge (middleware, edge routes). Cargado por
// instrumentation.ts cuando NEXT_RUNTIME === 'edge'. Sin DSN el SDK queda
// deshabilitado.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  ignoreErrors: [/\b40[3489]\b/, /\b422\b/],

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
