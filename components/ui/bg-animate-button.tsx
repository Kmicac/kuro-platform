'use client'

/**
 * BgAnimateButton — vendorizado in-house, inspirado en el "Bg Animate Button"
 * de cult-ui. NO instalado como dependencia.
 *
 * KURO custom:
 *  - Animación SUTIL: un shimmer verde (primary → primary-hover) que se
 *    desplaza lento en loop sobre el fondo del botón. Sin neon, sin glow.
 *  - Usa tokens KURO (`--primary`, `--primary-hover`, `--primary-foreground`).
 *  - Pensado SOLO para CTAs primarios (login, submits principales).
 */
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface BgAnimateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const BgAnimateButton = React.forwardRef<
  HTMLButtonElement,
  BgAnimateButtonProps
>(({ className, children, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(
        'kuro-bg-animate group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md',
        // El color del texto lo fija `.kuro-bg-animate` (cream sobre CTA oscuro).
        'px-4 text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // El estado :disabled lo da `.kuro-bg-animate:disabled` (muted, visible).
        'disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      {/* Contenido por encima del shimmer */}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </Comp>
  )
})
BgAnimateButton.displayName = 'BgAnimateButton'
