import type { ClassType } from '@/lib/api/types'

/**
 * Paleta SOBRIA KURO para tipos de clase (Design System 2.5.3).
 *
 * Family coherente: luminosidad ~30-40%, saturación baja (~20%). Sin colores
 * brillantes. Fuente única de verdad de los HEX.
 *
 * Consumo:
 *  - `components/kuro/class-type-chip.tsx` lee estos hex con estilos inline
 *    (background 18%, border 40%, texto mezclado con foreground → legible y
 *    adaptativo a dark/light vía color-mix).
 *  - `components/ui/event-manager.tsx` ESPEJA estos mismos hex como clases
 *    arbitrarias literales (`bg-[#...]`) porque el JIT de Tailwind solo
 *    detecta strings literales — no se pueden derivar por template. Si cambiás
 *    un hex acá, actualizá también el literal allá.
 */
export const CLASS_TYPE_HEX: Record<ClassType, string> = {
  GI: '#3F5C45', // verde oliva (primary KURO)
  NO_GI: '#5C4A3F', // marrón oliva
  FUNDAMENTALS: '#4A5760', // azul gris apagado
  ADVANCED: '#6B5840', // bronze sobrio
  KIDS: '#8A7B5F', // beige cálido
  COMPETITION: '#3F4858', // gris azulado oscuro
  OPEN_MAT: '#5F6B45', // verde mostaza apagado
  SEMINAR: '#705045', // terracota apagado
  PRIVATE: '#4A4540', // gris cálido oscuro
}

export const CLASS_TYPE_ORDER: ClassType[] = [
  'GI',
  'NO_GI',
  'FUNDAMENTALS',
  'ADVANCED',
  'KIDS',
  'COMPETITION',
  'OPEN_MAT',
  'SEMINAR',
  'PRIVATE',
]
