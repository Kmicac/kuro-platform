'use client'

import { useEffect, useState } from 'react'

/**
 * Devuelve una versión "debounced" de `value`: solo se actualiza cuando pasaron
 * `delayMs` sin cambios. Útil para search-as-you-type sin disparar un request
 * por keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
