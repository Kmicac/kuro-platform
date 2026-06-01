import type { Event } from '@/components/ui/event-manager'
import { KURO_CLASS_TYPE_COLORS } from '@/components/ui/event-manager'
import type {
  ClassSessionListItem,
  ClassSessionStatus,
  ClassType,
} from '@/lib/api/types'

/**
 * Metadata adicional que vive fuera del shape público de `Event`
 * (lo usa el padre vía `extras.get(event.id)` para abrir Session Detail,
 * filtrar por status, etc.) — el Event Manager no la necesita.
 */
export interface EventExtras {
  sessionId: string
  status: ClassSessionStatus
  classType: ClassType | string
  capacity: { max: number; enrolled: number } | null
  instructor: ClassSessionListItem['instructor'] | undefined
  branchId: string
}

const KNOWN_CLASS_TYPES = new Set(
  KURO_CLASS_TYPE_COLORS.map((c) => c.value),
)

function resolveColor(classType: string): string {
  return KNOWN_CLASS_TYPES.has(classType) ? classType : 'PRIVATE'
}

export interface AdaptResult {
  events: Event[]
  extras: Map<string, EventExtras>
}

/**
 * Mapea una lista cruda de class-sessions del backend a los `Event[]`
 * que consume Event Manager. Devuelve además un map paralelo con la
 * metadata canónica (sessionId, status, capacity, branch, instructor)
 * para que la pantalla pueda filtrar por status y abrir el detalle
 * sin volver a parsear strings.
 *
 * `labelFor` resuelve el label traducido del classType (típicamente el
 * resolver de `useClassTypeLabel()`); se usa como título de fallback
 * cuando la sesión no trae `title`. Se inyecta porque el adapter es una
 * función pura y no puede usar hooks.
 */
export function adaptSessionsToEvents(
  sessions: ClassSessionListItem[],
  labelFor: (classType: string) => string,
): AdaptResult {
  const events: Event[] = []
  const extras = new Map<string, EventExtras>()

  for (const session of sessions) {
    const fallbackTitle = labelFor(String(session.classType))
    const title = session.title?.trim() ? session.title : fallbackTitle

    events.push({
      id: session.id,
      title,
      startTime: new Date(session.startAt),
      endTime: new Date(session.endAt),
      color: resolveColor(String(session.classType)),
      category: String(session.classType),
    })

    extras.set(session.id, {
      sessionId: session.id,
      status: session.status,
      classType: session.classType,
      capacity: session.capacity?.max != null && session.capacity?.enrolled != null
        ? { max: session.capacity.max, enrolled: session.capacity.enrolled }
        : null,
      instructor: session.instructor ?? undefined,
      branchId: session.branchId,
    })
  }

  return { events, extras }
}
