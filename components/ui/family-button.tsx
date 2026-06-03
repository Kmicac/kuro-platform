'use client'

/**
 * FamilyButton — vendorizado in-house, inspirado en el "Family Button" de
 * cult-ui. NO instalado como dependencia.
 *
 * KURO custom:
 *  - Trigger compacto (estilo CTA primario) que se expande revelando un stack
 *    de sub-acciones con animación spring sutil (framer-motion).
 *  - Cierra por click-outside y Escape. El `+` rota a `×` al abrir.
 *  - Tokens KURO; sin glow ni colores brillantes.
 *  - Presentacional: el caller compone los <FamilyButtonItem> (permission-aware,
 *    abren sus dialogs).
 */
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FamilyButtonProps {
  /** Texto accesible del trigger (aria-label). */
  label: string
  children: React.ReactNode
  className?: string
  /** Alineación del panel respecto del trigger. */
  align?: 'start' | 'end'
}

export function FamilyButton({
  label,
  children,
  className,
  align = 'end',
}: FamilyButtonProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground',
          'transition-colors hover:bg-[var(--primary-hover)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="inline-flex"
        >
          <Plus className="h-4 w-4" />
        </motion.span>
        <span>{label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className={cn(
              'absolute top-full z-50 mt-2 min-w-[208px] rounded-lg border border-border bg-popover p-1.5 shadow-lg',
              align === 'end' ? 'right-0' : 'left-0',
            )}
            role="menu"
          >
            <div
              className="flex flex-col gap-0.5"
              onClick={() => setOpen(false)}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export interface FamilyButtonItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  disabled?: boolean
  /** Texto auxiliar a la derecha (ej. "Próximamente"). */
  hint?: string
}

export function FamilyButtonItem({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  hint,
}: FamilyButtonItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
        'text-foreground hover:bg-accent',
        'disabled:pointer-events-none disabled:opacity-45',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <span className="label-mono text-[10px] normal-case tracking-normal">
          {hint}
        </span>
      )}
    </button>
  )
}
