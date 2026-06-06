/**
 * IDs optimistas. Las mutations que insertan una entidad antes de la respuesta
 * del backend usan un id placeholder `optimistic-<uuid>` (ver
 * `useCreateSession` en lib/hooks/use-sessions.ts). Ese id NO existe en el
 * backend: navegar a él o pedir su detalle da 404. Usar este guard para evitar
 * acciones sobre entidades que todavía se están guardando.
 */
const OPTIMISTIC_PREFIX = 'optimistic-'

/** Prefijo usado al construir ids optimistas (single source of truth). */
export function optimisticId(uuid: string): string {
  return `${OPTIMISTIC_PREFIX}${uuid}`
}

/** True si el id corresponde a una entidad optimista aún no persistida. */
export function isOptimisticId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith(OPTIMISTIC_PREFIX)
}
