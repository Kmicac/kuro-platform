'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { NextIntlClientProvider, useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import esErrors from '@/messages/es/errors.json'
import esCommon from '@/messages/es/common.json'
import { defaultLocale, timeZone } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import '@/app/globals.css'

interface GlobalErrorProps {
  error: Error & { digest?: string; requestId?: string }
  reset: () => void
}

/**
 * Boundary de último recurso: captura errores que rompen el root layout
 * (incluido el NextIntlClientProvider). Por eso re-monta <html>/<body> y
 * provee su propio contexto i18n con los namespaces mínimos (errors +
 * common) importados estáticamente — no puede depender de los providers
 * que justamente pueden ser lo que falló. Estilo sobrio (no AppShell)
 * pero respeta los tokens KURO vía globals.css.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body className="min-h-screen">
        <NextIntlClientProvider
          locale={defaultLocale}
          timeZone={timeZone}
          messages={{ errors: esErrors, common: esCommon }}
        >
          <GlobalErrorBody error={error} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

function GlobalErrorBody({ error, reset }: GlobalErrorProps) {
  const t = useTranslations('errors.boundary')

  useEffect(() => {
    Sentry.captureException(error)
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalErrorBoundary]', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm space-y-4 text-center">
        <AlertTriangle
          className="mx-auto h-6 w-6 text-destructive"
          aria-hidden
        />
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            {t('global.title')}
          </p>
          <p className="text-xs text-muted-foreground">{t('global.message')}</p>
        </div>
        {error.requestId && (
          <p className="font-mono text-[10px] text-muted-foreground/70">
            {error.requestId}
          </p>
        )}
        <Button variant="outline" size="sm" onClick={reset}>
          {t('reload')}
        </Button>
      </div>
    </div>
  )
}
