'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Switch — toggle accesible (role="switch") sin dependencia de primitivo
 * externo. El stack no tiene @radix-ui/react-switch instalado y el resto de
 * primitivos shadcn aquí son Radix; este se implementa como un button
 * controlado para no sumar dependencias. Estilado con tokens KURO.
 */
export interface SwitchProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onChange' | 'value'
  > {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-state={checked ? 'checked' : 'unchecked'}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  ),
)
Switch.displayName = 'Switch'
