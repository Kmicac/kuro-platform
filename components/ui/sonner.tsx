'use client'

import type { CSSProperties } from 'react'
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
      // KURO Design System 2.5.27 — sobrescribe las CSS vars que `richColors`
      // usa por tipo con la paleta SOBRIA KURO (fondo = surface elevado, acento
      // = token kuro-* apagado en borde/texto). Sin neon ni colores brillantes.
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--popover)',
          '--success-text': 'var(--kuro-success)',
          '--success-border':
            'color-mix(in srgb, var(--kuro-success) 45%, var(--border))',
          '--error-bg': 'var(--popover)',
          '--error-text': 'var(--kuro-danger)',
          '--error-border':
            'color-mix(in srgb, var(--kuro-danger) 45%, var(--border))',
          '--warning-bg': 'var(--popover)',
          '--warning-text': 'var(--kuro-warning)',
          '--warning-border':
            'color-mix(in srgb, var(--kuro-warning) 45%, var(--border))',
          '--info-bg': 'var(--popover)',
          '--info-text': 'var(--kuro-info)',
          '--info-border':
            'color-mix(in srgb, var(--kuro-info) 45%, var(--border))',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:rounded-md',
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
