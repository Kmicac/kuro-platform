'use client'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  /** dense: padding más bajo cuando se usa dentro de cards o tabs. */
  dense?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  dense = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-border bg-muted/20 text-center',
        dense ? 'p-5' : 'p-10',
        className
      )}
    >
      <Icon
        className={cn(
          'mx-auto text-muted-foreground',
          dense ? 'h-5 w-5' : 'h-6 w-6'
        )}
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground mt-3">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
