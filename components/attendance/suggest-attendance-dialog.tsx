'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ApiError } from '@/lib/api/client'
import { useBranchStudents, useSuggestAttendance } from '@/lib/hooks'
import { usePromotionRankResolver } from '@/lib/hooks/use-catalogs'
import { BeltBadge } from '@/components/kuro'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import { cn } from '@/lib/utils'
import type {
  StudentListItem,
  SuggestAttendanceResponse,
} from '@/lib/api/types'

/** Límite de mensaje del backend (API-CONTRACT §suggestions). */
const MESSAGE_MAX = 280

export interface SuggestAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  branchId: string
  orgId: string
  /** IDs ya con intent activo en el roster — se excluyen de la lista. */
  excludeStudentIds: string[]
  onSuccess?: (response: SuggestAttendanceResponse) => void
}

export function SuggestAttendanceDialog({
  open,
  onOpenChange,
  sessionId,
  branchId,
  orgId,
  excludeStudentIds,
  onSuccess,
}: SuggestAttendanceDialogProps) {
  const t = useTranslations('attendance.suggest')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')

  const suggest = useSuggestAttendance(sessionId, branchId)

  // Padrón de la filial (paginado). Filtro de búsqueda client-side.
  const studentsQuery = useBranchStudents(orgId, branchId, { limit: 100 })
  const resolveRank = usePromotionRankResolver()

  // Reset de los campos. Se invoca al cerrar (cancelar / backdrop / éxito),
  // así el próximo open arranca limpio sin usar setState dentro de un effect.
  const reset = () => {
    setQuery('')
    setSelected(new Set())
    setMessage('')
  }
  const close = () => {
    reset()
    onOpenChange(false)
  }

  const excluded = useMemo(
    () => new Set(excludeStudentIds),
    [excludeStudentIds],
  )

  const allStudents = useMemo<StudentListItem[]>(
    () => (studentsQuery.data?.items ?? []).filter((s) => !excluded.has(s.id)),
    [studentsQuery.data, excluded],
  )

  const results = useMemo<StudentListItem[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allStudents
    return allStudents.filter((s) => {
      const hay = `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase()
      return hay.includes(q)
    })
  }, [allStudents, query])

  // Map id → alumno para renderizar los chips de seleccionados.
  const byId = useMemo(() => {
    const m = new Map<string, StudentListItem>()
    for (const s of allStudents) m.set(s.id, s)
    return m
  }, [allStudents])

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedIds = useMemo(() => [...selected], [selected])

  const onSubmit = () => {
    if (selectedIds.length === 0) return
    suggest.mutate(
      {
        studentIds: selectedIds,
        ...(message.trim() ? { message: message.trim() } : {}),
      },
      {
        onSuccess: (response) => {
          notifyResult(response, t)
          close()
          onSuccess?.(response)
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403)
            return notifyError(t('errors.forbidden'))
          if (error instanceof ApiError && error.status === 409)
            return notifyError(t('errors.sessionCanceled'), error)
          notifyError(t('errors.generic'), error)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('fields.search')}
            className="pl-9 font-mono"
            aria-label={t('fields.search')}
          />
        </div>

        {/* Lista multi-select */}
        <ScrollArea className="max-h-[300px]">
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
              {t('emptyResults')}
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((s) => {
                const checked = selected.has(s.id)
                return (
                  <li key={s.id}>
                    <label
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                        checked
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-transparent hover:border-border hover:bg-muted/40',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(s.id)}
                        aria-label={`${s.firstName} ${s.lastName}`}
                      />
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          background:
                            'color-mix(in srgb, var(--primary) 14%, transparent)',
                          color: 'var(--primary)',
                          border:
                            '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                        }}
                      >
                        {initials(s.firstName, s.lastName)}
                      </span>
                      <span className="min-w-0 flex-1">
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
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>

        {/* Chips de seleccionados */}
        {selectedIds.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs tabular-nums text-muted-foreground">
              {t('counter', { count: selectedIds.length })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const s = byId.get(id)
                const label = s ? `${s.firstName} ${s.lastName}` : id
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 py-0.5 pl-2 pr-1 text-xs text-foreground"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label={`${t('actions.cancel')} ${label}`}
                      className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Mensaje opcional */}
        <div className="space-y-1">
          <label
            htmlFor="suggest-message"
            className="text-sm text-muted-foreground"
          >
            {t('fields.message')}
          </label>
          <Textarea
            id="suggest-message"
            rows={3}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('fields.messagePlaceholder')}
            className="min-h-[72px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">
              {t('fields.messageHelp')}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {t('actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={selectedIds.length === 0 || suggest.isPending}
          >
            {suggest.isPending ? t('actions.submitting') : t('actions.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ────────────────────────────────────────────────────

type SuggestTranslator = ReturnType<typeof useTranslations<'attendance.suggest'>>

/**
 * Toast informativo según el response. Caso simple (todo creado) → success
 * único; caso mixto → resumen con partes (created · alreadySuggested ·
 * invalid). Los inválidos se loguean para debug/soporte.
 */
function notifyResult(
  response: SuggestAttendanceResponse,
  t: SuggestTranslator,
): void {
  const { created, alreadySuggested, invalidStudents } = response

  if (created > 0 && alreadySuggested === 0 && invalidStudents.length === 0) {
    notifySuccess(t('success.allCreated', { count: created }))
    return
  }

  const parts: string[] = []
  if (created > 0) parts.push(t('summary.created', { count: created }))
  if (alreadySuggested > 0)
    parts.push(t('summary.alreadySuggested', { count: alreadySuggested }))
  if (invalidStudents.length > 0)
    parts.push(t('summary.invalid', { count: invalidStudents.length }))

  // Si no se creó nada y no hubo nada que reportar, igual confirmamos envío.
  notifySuccess(parts.length > 0 ? parts.join(' · ') : t('success.allCreated', { count: created }))

  if (invalidStudents.length > 0) {
    console.warn('[SUGGEST] Alumnos inválidos:', invalidStudents)
  }
}

function initials(first: string, last: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—'
}
