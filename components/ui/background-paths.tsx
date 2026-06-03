'use client'

/**
 * BackgroundPaths — vendorizado in-house, inspirado en el "Background Paths"
 * de 21st.dev (kokonutd). NO instalado como dependencia.
 *
 * KURO custom:
 *  - Color de las líneas = token `--primary` (verde KURO), opacidad baja.
 *  - Líneas onduladas distribuidas en TODA la altura del panel; el SVG se
 *    estira (preserveAspectRatio="none") para cubrir el contenedor completo
 *    (antes solo se veía una banda inferior).
 *  - Se dibujan al mount (~2s, draw-in escalonado) y quedan ESTÁTICAS (no loop).
 *  - Sin glow ni colores brillantes.
 */
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const VB_W = 696
const VB_H = 360
const ROWS = 30

function FloatingPaths({ stroke }: { stroke: string }) {
  const paths = useMemo(() => {
    return Array.from({ length: ROWS }, (_, i) => {
      const y = (VB_H / (ROWS - 1)) * i
      const amp = 16 + (i % 5) * 7
      const dir = i % 2 === 0 ? 1 : -1
      // Curva ondulada que cruza todo el ancho (con overshoot a ambos lados).
      const d =
        `M-60 ${y} ` +
        `C ${VB_W * 0.22} ${y + amp * dir}, ${VB_W * 0.4} ${y - amp * dir}, ${VB_W * 0.55} ${y + amp * 0.5 * dir} ` +
        `S ${VB_W * 0.92} ${y - amp * dir}, ${VB_W + 60} ${y + amp * 0.4 * dir}`
      return {
        id: i,
        d,
        width: 0.6 + (i % 4) * 0.18,
        opacity: 0.08 + (i % 6) * 0.02,
      }
    })
  }, [])

  return (
    <svg
      className="h-full w-full"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke={stroke}
          strokeWidth={path.width}
          strokeOpacity={path.opacity}
          initial={{ pathLength: 0, opacity: 0 }}
          // KURO custom: anima una sola vez al mount y queda estático.
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: path.id * 0.05, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  )
}

export interface BackgroundPathsProps {
  className?: string
  /** Color de las líneas. Default neutro (cream tenue) — NO verde. */
  stroke?: string
}

export const BackgroundPaths = memo(function BackgroundPaths({
  className,
  stroke = '#000000',
}: BackgroundPathsProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      aria-hidden
    >
      <FloatingPaths stroke={stroke} />
    </div>
  )
})
