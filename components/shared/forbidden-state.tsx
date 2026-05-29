'use client'

import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ForbiddenStateProps {
  title?: string
  description?: string
  dense?: boolean
  className?: string
}

export function ForbiddenState({
  title = 'Sin permisos',
  description = 'Tu rol no permite ver este contenido.',
  dense = false,
  className,
}: ForbiddenStateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-border bg-muted/30 text-center',
        dense ? 'p-5' : 'p-8',
        className
      )}
    >
      <Lock
        className={cn(
          'mx-auto text-muted-foreground',
          dense ? 'h-4 w-4' : 'h-5 w-5'
        )}
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground mt-2">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
        {description}
      </p>
    </div>
  )
}
