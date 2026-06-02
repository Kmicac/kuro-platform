'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * Toaster KURO — wrapper de sonner que respeta el theme (dark/light) vía
 * next-themes. Montado una sola vez (dentro de Providers, donde vive el
 * ThemeProvider). Para emitir toasts usar siempre lib/utils/toast.ts.
 *
 * Defaults: top-right, 4s, offset 16px, estilo alineado a tokens KURO.
 */
export function Toaster(props: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-right"
      duration={4000}
      offset={16}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error:
            'group-[.toaster]:border-destructive/40 group-[.toaster]:text-destructive',
          success: 'group-[.toaster]:border-primary/40',
        },
      }}
      {...props}
    />
  )
}
