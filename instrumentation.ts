// Next.js instrumentation hook. Carga la config de Sentry según el runtime y
// expone onRequestError para capturar errores de Server Components, route
// handlers y middleware. Requiere @sentry/nextjs v8.28+ y Next 15+.
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
