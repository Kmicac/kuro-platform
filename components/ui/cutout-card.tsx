'use client'

/**
 * CutoutCard — vendorizado in-house, inspirado en el "Cutout Card" de cult-ui.
 * NO instalado como dependencia.
 *
 * KURO custom:
 *  - Recorte circular cóncavo en la esquina superior derecha (vía CSS mask,
 *    util `.kuro-cutout` en globals.css) donde se aloja un ícono sutil.
 *  - Superficie = `bg-card`, border sutil (inset ring recortado por el mask).
 *  - Sin gradientes, sin sombras destacadas. Tokens KURO.
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CutoutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ícono (o nodo) que se aloja en el recorte de la esquina. */
  icon?: React.ReactNode
  /** Tinte del contenedor del ícono (sobrio por defecto). */
  iconClassName?: string
}

export const CutoutCard = React.forwardRef<HTMLDivElement, CutoutCardProps>(
  ({ icon, iconClassName, className, children, ...props }, ref) => (
    <div ref={ref} className={cn('relative', className)} {...props}>
      <div
        className="kuro-cutout rounded-lg bg-card"
        style={{ boxShadow: 'inset 0 0 0 1px var(--border)' }}
      >
        <div className="p-5">{children}</div>
      </div>
      {icon && (
        <div
          className={cn(
            'absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground',
            iconClassName,
          )}
        >
          {icon}
        </div>
      )}
    </div>
  ),
)
CutoutCard.displayName = 'CutoutCard'
