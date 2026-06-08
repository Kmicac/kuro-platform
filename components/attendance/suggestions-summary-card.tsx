'use client'

import { useTranslations } from 'next-intl'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AttendanceSuggestionSummary } from '@/lib/api/types'

export interface SuggestionsSummaryCardProps {
  summary: AttendanceSuggestionSummary
  /** Sesión asociada (contexto para el caller; el sheet se abre vía onViewAll). */
  sessionId: string
  /** Capability gating: si es false, la card no se renderiza. */
  canSuggest: boolean
  /** Abre el sheet con la lista completa. */
  onViewAll: () => void
  /** Abre el dialog para sugerir más alumnos. */
  onSuggestMore: () => void
}

type CounterTone = 'warning' | 'success' | 'danger' | 'muted'

const COUNTER_TONE: Record<CounterTone, string> = {
  warning: 'tone-warning',
  success: 'tone-success',
  danger: 'tone-danger',
  muted: 'text-muted-foreground',
}

/**
 * Resumen de attendance suggestions en el detalle de clase. Lee los counters
 * que vienen INLINE en el detail (no dispara request propio). Gateado por
 * `canSuggest`: es un feature operacional, no informativo para todos los roles.
 */
export function SuggestionsSummaryCard({
  summary,
  canSuggest,
  onViewAll,
  onSuggestMore,
}: SuggestionsSummaryCardProps) {
  const t = useTranslations('class-detail.suggestions.summaryCard')

  if (!canSuggest) return null

  const counters: { key: CounterTone; label: string; value: number }[] = [
    { key: 'warning', label: t('counters.pending'), value: summary.pending },
    { key: 'success', label: t('counters.accepted'), value: summary.accepted },
    { key: 'danger', label: t('counters.declined'), value: summary.declined },
    { key: 'muted', label: t('counters.canceled'), value: summary.canceled },
  ]

  return (
    <section className="flex flex-col rounded border border-border bg-card p-5">
      <p className="label-mono inline-flex items-center gap-1.5">
        <Send className="h-3.5 w-3.5 stroke-[1.5]" />
        {t('title')}
      </p>

      {summary.total === 0 ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
          <Button variant="outline" size="sm" onClick={onSuggestMore}>
            <Send className="h-3.5 w-3.5 stroke-[1.5]" />
            {t('suggestFirst')}
          </Button>
        </div>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {counters.map((c) => (
              <div
                key={c.key}
                className="rounded border border-border bg-background px-3 py-3"
              >
                <dd
                  className={cn(
                    'text-3xl font-medium leading-none tabular-nums',
                    COUNTER_TONE[c.key],
                  )}
                >
                  {c.value}
                </dd>
                <dt className="label-mono mt-2 text-muted-foreground">
                  {c.label}
                </dt>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              {t('actions.viewAll')}
            </Button>
            <Button variant="outline" size="sm" onClick={onSuggestMore}>
              <Send className="h-3.5 w-3.5 stroke-[1.5]" />
              {t('actions.suggestMore')}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
