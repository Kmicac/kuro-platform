'use client'

import { useTranslations } from 'next-intl'

import type { TechnicalRosterItem } from '@/lib/api/types'
import type { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'
import { AttendanceRow } from './attendance-row'

export interface AttendanceTableProps {
  items: TechnicalRosterItem[]
  sessionId: string
  canCorrect: boolean
  disabled: boolean
  resolveRank: ReturnType<typeof usePromotionRankResolver>
}

export function AttendanceTable({
  items,
  sessionId,
  canCorrect,
  disabled,
  resolveRank,
}: AttendanceTableProps) {
  const t = useTranslations('attendance.table')

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header (oculto en mobile, las rows son auto-explicativas) */}
      <div className="hidden grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border bg-card px-4 py-2.5 sm:grid">
        <span className="label-mono">{t('student')}</span>
        <span className="label-mono">{t('status')}</span>
        <span className="label-mono text-right">{t('actions')}</span>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <AttendanceRow
            key={item.studentId}
            item={item}
            sessionId={sessionId}
            canCorrect={canCorrect}
            disabled={disabled}
            beltEntry={resolveRank(item.student.currentBelt)}
          />
        ))}
      </ul>
    </div>
  )
}
