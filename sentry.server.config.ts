// Sentry — runtime Node (server components, route handlers, server actions).
// Cargado por instrumentation.ts cuando NEXT_RUNTIME === 'nodejs'.
// Sin DSN (env ausente) el SDK queda deshabilitado: no envía nada.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment:
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // 4xx esperables → ruido. El 5xx server-side se captura explícito en
  // lib/api/client.ts.
  ignoreErrors: [/\b40[3489]\b/, /\b422\b/],

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
