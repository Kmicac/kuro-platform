'use client'

import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'

/**
 * not-found dentro de /org/[orgId]: se renderiza envuelto por el AppShell
 * (sidebar + topbar via [orgId]/layout) y el bootstrap de sesión (via
 * (platform)/layout). Así una ruta inexistente no tira el 404 pelado de
 * Next ni pierde la sesión — muestra el shell completo con un mensaje.
 *
 * not-found.tsx no recibe params, así que el orgId para "Volver" se lee
 * del store (poblado por el bootstrap/login).
 */
export default function OrgNotFound() {
  const orgId = useAuthStore((s) => s.organizationId ?? s.currentOrg?.id ?? null)

  return (
    <div className="p-6">
      <EmptyState
        icon={FileQuestion}
        title="Esta sección aún no existe"
        description="La pantalla que buscás todavía no fue construida o la dirección no es válida."
        action={
          orgId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/org/${orgId}`}>Volver al inicio</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Volver al login</Link>
            </Button>
          )
        }
      />
    </div>
  )
}
