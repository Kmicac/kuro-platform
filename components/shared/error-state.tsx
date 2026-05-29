'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  /** Override del título por defecto */
  title?: string
  /** Override de la descripción por defecto */
  description?: string
  dense?: boolean
  className?: string
}

export function ErrorState({
  error,
  onRetry,
  title = 'No se pudo cargar',
  description = 'Revisá la conexión e intentá nuevamente.',
  dense = false,
  className,
}: ErrorStateProps) {
  const requestId = error instanceof ApiError ? error.requestId : undefined

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-destructive/30 bg-destructive/5 text-center',
        dense ? 'p-5' : 'p-6',
        className
      )}
    >
      <AlertCircle
        className={cn(
          'mx-auto text-destructive',
          dense ? 'h-4 w-4' : 'h-5 w-5'
        )}
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground mt-2">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {requestId && (
        <p className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
          request-id: {requestId}
        </p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  )
}
