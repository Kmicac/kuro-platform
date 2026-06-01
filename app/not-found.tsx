import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

/**
 * not-found raíz — para rutas completamente fuera de (platform) y (auth)
 * (ej. /ruta-totalmente-invalida). Sin contexto de auth: solo mensaje +
 * link al login.
 */
export default async function RootNotFound() {
  const t = await getTranslations('errors.notFound')
  const tc = await getTranslations('common')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm space-y-3 text-center">
        <p className="text-sm font-medium text-foreground">
          {t('title')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('description')}
        </p>
        <Link
          href="/login"
          className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {tc('nav.goToLogin')}
        </Link>
      </div>
    </div>
  )
}
