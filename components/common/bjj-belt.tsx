import type {
  PromotionRank,
  PromotionRankCatalogEntry,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

type BjjBeltSize = 'sm' | 'md' | 'lg'

type BjjBeltMeta = {
  mainColor: string
  accentColor?: string
  stripeColor: string
  edgeColor: string
}

const BELT_META: Record<PromotionRank, BjjBeltMeta> = {
  KIDS_WHITE:        { mainColor: '#f4f1e8',                       stripeColor: '#f8fafc', edgeColor: '#d8d3c6' },
  KIDS_GREY_WHITE:   { mainColor: '#6b7280', accentColor: '#f4f1e8', stripeColor: '#f8fafc', edgeColor: '#4b5563' },
  KIDS_GREY:         { mainColor: '#6b7280',                       stripeColor: '#f8fafc', edgeColor: '#4b5563' },
  KIDS_GREY_BLACK:   { mainColor: '#6b7280', accentColor: '#111111', stripeColor: '#f8fafc', edgeColor: '#4b5563' },
  KIDS_YELLOW_WHITE: { mainColor: '#facc15', accentColor: '#f4f1e8', stripeColor: '#f8fafc', edgeColor: '#ca8a04' },
  KIDS_YELLOW:       { mainColor: '#facc15',                       stripeColor: '#f8fafc', edgeColor: '#ca8a04' },
  KIDS_YELLOW_BLACK: { mainColor: '#facc15', accentColor: '#111111', stripeColor: '#f8fafc', edgeColor: '#ca8a04' },
  KIDS_ORANGE_WHITE: { mainColor: '#f97316', accentColor: '#f4f1e8', stripeColor: '#f8fafc', edgeColor: '#c2410c' },
  KIDS_ORANGE:       { mainColor: '#f97316',                       stripeColor: '#f8fafc', edgeColor: '#c2410c' },
  KIDS_ORANGE_BLACK: { mainColor: '#f97316', accentColor: '#111111', stripeColor: '#f8fafc', edgeColor: '#c2410c' },
  KIDS_GREEN_WHITE:  { mainColor: '#15803d', accentColor: '#f4f1e8', stripeColor: '#f8fafc', edgeColor: '#14532d' },
  KIDS_GREEN:        { mainColor: '#15803d',                       stripeColor: '#f8fafc', edgeColor: '#14532d' },
  KIDS_GREEN_BLACK:  { mainColor: '#15803d', accentColor: '#111111', stripeColor: '#f8fafc', edgeColor: '#14532d' },
  ADULT_WHITE:       { mainColor: '#f4f1e8',                       stripeColor: '#f8fafc', edgeColor: '#d8d3c6' },
  ADULT_BLUE:        { mainColor: '#1d4ed8',                       stripeColor: '#f8fafc', edgeColor: '#1e3a8a' },
  ADULT_PURPLE:      { mainColor: '#7e22ce',                       stripeColor: '#f8fafc', edgeColor: '#581c87' },
  ADULT_BROWN:       { mainColor: '#6b3f1f',                       stripeColor: '#f8fafc', edgeColor: '#422006' },
  ADULT_BLACK:       { mainColor: '#111111',                       stripeColor: '#f8fafc', edgeColor: '#020617' },
}

type SizeSpec = {
  beltClass: string
  barClass: string
  stripeClass: string
  labelClass: string
}

const SIZE_SPEC: Record<BjjBeltSize, SizeSpec> = {
  sm: {
    beltClass: 'h-4 w-[72px] rounded-[4px]',
    barClass: 'right-2 h-[72%] w-[24px] rounded-[2px]',
    stripeClass: 'h-[82%] w-[2px]',
    labelClass: 'text-[10px]',
  },
  md: {
    beltClass: 'h-5 w-[104px] rounded-md',
    barClass: 'right-3 h-[74%] w-[34px] rounded-[3px]',
    stripeClass: 'h-[82%] w-[3px]',
    labelClass: 'text-xs',
  },
  lg: {
    beltClass: 'h-7 w-[150px] rounded-lg',
    barClass: 'right-4 h-[74%] w-[48px] rounded',
    stripeClass: 'h-[82%] w-[4px]',
    labelClass: 'text-sm',
  },
}

export interface BjjBeltProps {
  rank: PromotionRankCatalogEntry | null
  stripes?: number | null
  size?: BjjBeltSize
  showLabel?: boolean
  noRankLabel: string
  ariaLabel: string
  className?: string
}

export function BjjBelt({
  rank,
  stripes,
  size = 'md',
  showLabel = true,
  noRankLabel,
  ariaLabel,
  className,
}: BjjBeltProps) {
  const spec = SIZE_SPEC[size]
  const renderLabel = showLabel && size !== 'sm'

  if (!rank) {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn('inline-flex items-center gap-2', className)}
      >
        <span
          className={cn(
            'relative inline-block overflow-hidden border border-dashed bg-muted/70 shadow-inner',
            spec.beltClass,
          )}
        />
        {renderLabel && (
          <span className={cn(spec.labelClass, 'font-medium text-muted-foreground')}>
            {noRankLabel}
          </span>
        )}
      </span>
    )
  }

  const meta = BELT_META[rank.rank]
  const cappedStripes = Math.max(0, Math.min(stripes ?? 0, 4, rank.maxStripes))

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <span
        className={cn(
          'relative inline-block overflow-hidden border shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-2px_0_rgba(0,0,0,0.22)]',
          spec.beltClass,
        )}
        style={{
          backgroundColor: meta.mainColor,
          borderColor: meta.edgeColor,
        }}
      >
        <span
          className="absolute inset-x-0 top-0 h-[28%] bg-white/18"
          aria-hidden
        />
        <span
          className="absolute inset-x-0 bottom-0 h-[24%] bg-black/18"
          aria-hidden
        />
        {meta.accentColor && (
          <span
            className="absolute inset-y-0 left-0 w-[24%] border-r border-black/25"
            style={{ backgroundColor: meta.accentColor }}
            aria-hidden
          />
        )}
        <span
          className={cn(
            'absolute top-1/2 -translate-y-1/2 border border-white/10 bg-[#050505] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
            spec.barClass,
          )}
          aria-hidden
        >
          {cappedStripes > 0 && (
            <span className="absolute inset-y-[13%] left-[18%] right-[14%] flex items-center gap-[3px]">
              {Array.from({ length: cappedStripes }).map((_, index) => (
                <span
                  key={index}
                  className={cn('rounded-full shadow-sm', spec.stripeClass)}
                  style={{ backgroundColor: meta.stripeColor }}
                />
              ))}
            </span>
          )}
        </span>
      </span>
      {renderLabel && (
        <span className={cn(spec.labelClass, 'font-medium text-foreground')}>
          {rank.label}
        </span>
      )}
    </span>
  )
}
