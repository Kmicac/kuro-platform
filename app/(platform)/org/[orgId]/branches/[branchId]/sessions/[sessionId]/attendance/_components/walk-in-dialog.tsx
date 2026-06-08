'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Search } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ErrorState } from '@/components/shared'
import { useBranchStudents, useDebouncedValue } from '@/lib/hooks'
import { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'
import { BeltBadge } from '@/components/kuro'
import type { StudentListItem } from '@/lib/api/types'

// Tamaño de página para el autocomplete. El backend hace la búsqueda
// server-side (?q=), así que con un límite chico alcanza: sin search muestra
// los primeros N del padrón; con search devuelve los matches relevantes.
const WALK_IN_LIMIT = 20

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
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)

  // Búsqueda server-side: el backend filtra por firstName/lastName/email/phone.
  const studentsQuery = useBranchStudents(orgId, branchId, {
    q: debouncedQuery,
    limit: WALK_IN_LIMIT,
  })

  const excluded = useMemo(
    () => new Set(rosterStudentIds),
    [rosterStudentIds],
  )

  // Solo se excluyen los ya presentes en el roster (client-side, set chico).
  // El filtro por texto lo resuelve el backend.
  const results = useMemo<StudentListItem[]>(
    () =>
      (studentsQuery.data?.items ?? []).filter((s) => !excluded.has(s.id)),
    [studentsQuery.data, excluded],
  )

  const resolveRank = usePromotionRankResolver()

  // Spinner sutil mientras el debounce/fetch está en vuelo (no en el primer load).
  const searching =
    studentsQuery.isFetching && !studentsQuery.isLoading
  const trimmedQuery = debouncedQuery.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          {searching ? (
            <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="pl-9"
            aria-label={t('searchPlaceholder')}
          />
        </div>

        <ScrollArea className="max-h-72">
          {studentsQuery.isError ? (
            <ErrorState
              dense
              error={studentsQuery.error}
              title={t('loadError')}
              onRetry={() => studentsQuery.refetch()}
            />
          ) : studentsQuery.isLoading ? (
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
              {trimmedQuery
                ? t('noResultsQuery', { query: trimmedQuery })
                : t('noResults')}
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
