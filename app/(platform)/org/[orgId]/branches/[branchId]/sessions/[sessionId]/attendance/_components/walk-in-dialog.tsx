'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, Search } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBranchStudents } from '@/lib/hooks'
import { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'
import { BeltBadge } from '@/components/kuro'
import type { StudentListItem } from '@/lib/api/types'

// Tope de alumnos que se traen del padrón para el autocomplete. El backend
// no expone search server-side en este endpoint, así que el filtro es
// client-side sobre esta página. Si la filial supera este tope, los alumnos
// fuera de la primera página quedan inbuscables → se avisa con un banner.
// TODO(backend-search): cuando el backend exponga search en
// GET /branches/:id/students?q=, eliminar este tope client-side y el banner.
// Ver docs/AUDIT-REPORT.md Sprint 1.
const STUDENTS_FETCH_LIMIT = 100
const RESULTS_RENDER_LIMIT = 50

export interface WalkInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  branchId: string
  /** IDs ya presentes en el roster — se excluyen del autocomplete. */
  rosterStudentIds: string[]
  onSelect: (studentId: string) => void
  pending: boolean
}

export function WalkInDialog({
  open,
  onOpenChange,
  orgId,
  branchId,
  rosterStudentIds,
  onSelect,
  pending,
}: WalkInDialogProps) {
  const t = useTranslations('attendance.walkIn')
  const tWarn = useTranslations('attendance.warnings')
  const [query, setQuery] = useState('')

  // Lista del padrón de la filial (paginada). El filtro de búsqueda es
  // client-side: el backend no expone search en este endpoint todavía.
  const studentsQuery = useBranchStudents(orgId, branchId, {
    limit: STUDENTS_FETCH_LIMIT,
  })

  // El padrón completo de la filial supera lo que trajimos → hay alumnos
  // inbuscables silenciosamente. Se avisa con un banner sobrio.
  const total = studentsQuery.data?.meta?.total
  const isTruncated =
    typeof total === 'number' && total > STUDENTS_FETCH_LIMIT

  const excluded = useMemo(
    () => new Set(rosterStudentIds),
    [rosterStudentIds],
  )

  const results = useMemo<StudentListItem[]>(() => {
    const items = studentsQuery.data?.items ?? []
    const q = query.trim().toLowerCase()
    return items
      .filter((s) => !excluded.has(s.id))
      .filter((s) => {
        if (!q) return true
        const hay = `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, RESULTS_RENDER_LIMIT)
  }, [studentsQuery.data, query, excluded])

  const resolveRank = usePromotionRankResolver()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
            aria-label={t('searchPlaceholder')}
          />
        </div>

        {isTruncated && (
          <div className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs surface-warning">
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
              aria-hidden
            />
            <p>
              {tWarn('searchTruncated', {
                shown: STUDENTS_FETCH_LIMIT,
                total: total ?? STUDENTS_FETCH_LIMIT,
              })}
            </p>
          </div>
        )}

        <ScrollArea className="max-h-72">
          {studentsQuery.isLoading ? (
            <div className="space-y-2 py-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-muted/50"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('noResults')}
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onSelect(s.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:border-border hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.email}
                      </span>
                    </span>
                    <BeltBadge
                      rank={resolveRank(s.currentBelt)}
                      stripes={s.currentStripes}
                      size="sm"
                      showLabel={false}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <p className="text-xs text-[var(--text-tertiary)]">
          {t('addAsPresent')}
        </p>
      </DialogContent>
    </Dialog>
  )
}
