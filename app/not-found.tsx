import Link from 'next/link'

/**
 * not-found raíz — para rutas completamente fuera de (platform) y (auth)
 * (ej. /ruta-totalmente-invalida). Sin contexto de auth: solo mensaje +
 * link al login.
 */
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm space-y-3 text-center">
        <p className="text-sm font-medium text-foreground">
          Página no encontrada
        </p>
        <p className="text-xs text-muted-foreground">
          La dirección que ingresaste no existe.
        </p>
        <Link
          href="/login"
          className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Ir al login
        </Link>
      </div>
    </div>
  )
}
