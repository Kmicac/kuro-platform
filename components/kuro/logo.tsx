import { cn } from '@/lib/utils'

interface KuroLogoProps {
  /** Modo colapsado: muestra solo el mark de 4 nodos */
  collapsed?: boolean
  /** Fuerza colores claros (para fondos oscuros como el sidebar) */
  forceDark?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { w: 72, h: 20, mark: 14, text: 12 },
  md: { w: 88, h: 24, mark: 16, text: 14 },
  lg: { w: 108, h: 30, mark: 20, text: 17 },
}

/**
 * Logo KURO — wordmark + 4-node mark.
 * Los 4 nodos representan los 4 pilares: Conducción · Comunidad · Gestión · Legado.
 *
 * forceDark=true  → texto claro (para sidebar y fondos oscuros)
 * forceDark=false → usa currentColor (sigue el tema CSS)
 */
export function KuroLogo({
  collapsed = false,
  forceDark = false,
  className,
  size = 'md',
}: KuroLogoProps) {
  const s = SIZES[size]

  const textFill   = forceDark ? '#e8ece0' : 'currentColor'
  const accentMain = forceDark ? '#899878' : 'var(--primary)'
  const accentPale = forceDark ? '#E4E6C3' : 'var(--secondary)'

  if (collapsed) {
    return (
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 18 18"
        className={cn('flex-shrink-0', className)}
        role="img"
        aria-label="KURO"
      >
        <title>KURO</title>
        <circle cx="5"  cy="5"  r="2.2" fill={accentMain} />
        <circle cx="13" cy="5"  r="2.2" fill={accentMain}  opacity="0.4" />
        <circle cx="5"  cy="13" r="2.2" fill={accentMain}  opacity="0.65" />
        <circle cx="13" cy="13" r="2.2" fill={accentPale} />
        <line x1="5"  y1="5"  x2="13" y2="13" stroke={accentMain} strokeWidth="0.8" opacity="0.2" />
        <line x1="13" y1="5"  x2="5"  y2="13" stroke={accentMain} strokeWidth="0.8" opacity="0.2" />
      </svg>
    )
  }

  const vw = 94
  const vh = s.h

  return (
    <svg
      width={s.w}
      height={s.h}
      viewBox={`0 0 ${vw} ${vh}`}
      className={cn('flex-shrink-0', className)}
      role="img"
      aria-label="KURO"
    >
      <title>KURO</title>
      {/* 4-node mark */}
      <circle cx="5"  cy={vh * 0.33} r="2.1" fill={accentMain} />
      <circle cx="13" cy={vh * 0.33} r="2.1" fill={accentMain}  opacity="0.4" />
      <circle cx="5"  cy={vh * 0.73} r="2.1" fill={accentMain}  opacity="0.65" />
      <circle cx="13" cy={vh * 0.73} r="2.1" fill={accentPale} />
      <line x1="5"  y1={vh * 0.33} x2="13" y2={vh * 0.73} stroke={accentMain} strokeWidth="0.7" opacity="0.2" />
      <line x1="13" y1={vh * 0.33} x2="5"  y2={vh * 0.73} stroke={accentMain} strokeWidth="0.7" opacity="0.2" />
      <line x1="5"  y1={vh * 0.33} x2="5"  y2={vh * 0.73} stroke={accentMain} strokeWidth="0.5" opacity="0.14" />
      <line x1="13" y1={vh * 0.33} x2="13" y2={vh * 0.73} stroke={accentMain} strokeWidth="0.5" opacity="0.14" />
      {/* Wordmark */}
      <text
        x="22"
        y={vh * 0.72}
        fontFamily="var(--font-geist), system-ui, sans-serif"
        fontSize={s.text}
        fontWeight="600"
        fill={textFill}
        letterSpacing="0.14em"
      >
        KURO
      </text>
    </svg>
  )
}