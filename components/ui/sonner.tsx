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
      richColors
      position="top-right"
      duration={4000}
      offset={16}
      className="toaster group"
      toastOptions={{
        // Con `richColors`, sonner colorea el fondo/borde/texto por tipo
        // (success=verde, error=rojo, info=azul, warning=ámbar). NO forzar
        // bg/text/border acá (eso neutralizaba los colores). Solo estilo
        // estructural + botones.
        classNames: {
          toast:
            'group toast group-[.toaster]:rounded-lg group-[.toaster]:shadow-lg',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}
