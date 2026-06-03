'use client'

/**
 * GenerateSessionsDialog — materializa sesiones desde los schedules.
 *
 * Tres modos:
 *  - variant='generate' SIN schedule → bulk branch-wide (todos los activos).
 *  - variant='generate' CON schedule → solo ese horario, iterando el endpoint
 *    single-date por cada fecha del weekday en el rango (Promise.allSettled).
 *  - variant='missing' → rellena solo huecos (bulk branch-wide, idempotente).
 *
 * Tras generar, muestra el summary (created / skipped / conflicts / errors).
 * Los conflictos se reportan en el summary, NO con ConflictDialog (no es una
 * creación interactiva). El rango está acotado a 42 días por el backend.
 */
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch, type Control, type Resolver } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useNow, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MinusCircle,
  XCircle,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ApiError } from '@/lib/api/client'
import {
  datesForWeekday,
  useCurrentContext,
  useGenerateMissingSessions,
  useGenerateScheduleSessions,
  useGenerateSessions,
} from '@/lib/hooks'
import {
  makeGenerateSessionsSchema,
  type GenerateSessionsFormValues,
} from '@/lib/schemas/schedule'
import { notifyError } from '@/lib/utils/toast'
import type { SessionsGenerateResponse } from '@/lib/api/endpoints'
import type { ClassSchedule } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export interface GenerateSessionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: 'generate' | 'missing'
  /** Si viene (y variant='generate'): genera SOLO este horario. */
  schedule: ClassSchedule | null
  orgId: string
}

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

export function GenerateSessionsDialog({
  open,
  onOpenChange,
  variant,
  schedule,
  orgId,
}: GenerateSessionsDialogProps) {
  const t = useTranslations('schedules.generateDialog')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const now = useNow()
  const { branchTimezone } = useCurrentContext()

  const isMissing = variant === 'missing'
  const perSchedule = !isMissing && schedule != null

  const bulkGenerate = useGenerateSessions()
  const missingGenerate = useGenerateMissingSessions()
  const scheduleGenerate = useGenerateScheduleSessions(schedule)
  const active = isMissing
    ? missingGenerate
    : perSchedule
      ? scheduleGenerate
      : bulkGenerate

  const [summary, setSummary] = useState<SessionsGenerateResponse | null>(null)

  // Limpia el summary al cerrar (no en un effect: evita setState-in-effect y el
  // re-render en cascada). En el próximo open el form ya arranca limpio.
  const handleOpenChange = (next: boolean) => {
    if (!next) setSummary(null)
    onOpenChange(next)
  }

  // Hoy en la timezone de la filial → rango por defecto: hoy a +30 días.
  const minDate = formatInTimeZone(now, branchTimezone, 'yyyy-MM-dd')
  const minDateObj = new Date(`${minDate}T00:00:00`)
  const defaults = useMemo<GenerateSessionsFormValues>(() => {
    const to = new Date(minDateObj)
    to.setDate(to.getDate() + 30)
    return { fromDate: minDate, toDate: toISODate(to) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate])

  const messages = useMemo(
    () => ({
      rangeRequired: t('errors.rangeRequired'),
      rangeInvalid: t('errors.rangeInvalid'),
      rangeTooLong: t('errors.rangeTooLong'),
      fromDateInPast: t('errors.fromDateInPast'),
    }),
    [t],
  )

  const schema = useMemo(
    () => makeGenerateSessionsSchema({ minDate, messages }),
    [minDate, messages],
  )

  const form = useForm<GenerateSessionsFormValues>({
    resolver: standardSchemaResolver(
      schema,
    ) as Resolver<GenerateSessionsFormValues>,
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) form.reset(defaults)
  }, [open, defaults, form])

  const watched = useWatch({ control: form.control })
  const plannedCount = useMemo(() => {
    if (!perSchedule || !schedule || !watched.fromDate || !watched.toDate) {
      return 0
    }
    return datesForWeekday(
      watched.fromDate,
      watched.toDate,
      schedule.weekday,
    ).length
  }, [perSchedule, schedule, watched.fromDate, watched.toDate])

  const title = isMissing
    ? t('titleMissing')
    : perSchedule
      ? t('titleGenerateForSchedule', { scheduleTitle: schedule!.title })
      : t('titleGenerate')
  const description = isMissing
    ? t('descriptionMissing')
    : perSchedule
      ? t('descriptionForSchedule')
      : t('descriptionGenerate')

  const onSubmit = (values: GenerateSessionsFormValues) => {
    active.mutate(
      { fromDate: values.fromDate, toDate: values.toDate },
      {
        onSuccess: (res) => setSummary(res),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            notifyError(t('errors.forbidden'))
            return
          }
          notifyError(tCommon('error.generic'), error)
        },
      },
    )
  }

  const coalesced = summary
    ? {
        created: summary.created ?? summary.generatedCount ?? 0,
        skipped: summary.skipped ?? summary.skippedExistingCount ?? 0,
        conflicts: summary.conflicts ?? summary.skippedConflictCount ?? 0,
        errors: summary.errors ?? 0,
      }
    : null

  const submittingLabel =
    perSchedule && plannedCount > 0
      ? t('progress', { count: plannedCount })
      : t('actions.submitting')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {coalesced ? (
          // ── Summary ──
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('summary.title')}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 tone-success" />
                {t('summary.created', { count: coalesced.created })}
              </li>
              {coalesced.skipped > 0 && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <MinusCircle className="h-4 w-4" />
                  {t('summary.skipped', { count: coalesced.skipped })}
                </li>
              )}
              {coalesced.conflicts > 0 && (
                <li className="flex items-center gap-2 tone-warning">
                  <AlertTriangle className="h-4 w-4" />
                  {t('summary.conflicts', { count: coalesced.conflicts })}
                </li>
              )}
              {coalesced.errors > 0 && (
                <li className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  {t('summary.errors', { count: coalesced.errors })}
                </li>
              )}
            </ul>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t('summary.close')}
              </Button>
              <Button
                type="button"
                onClick={() => router.push(`/org/${orgId}/calendar`)}
              >
                {t('summary.viewCalendar')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // ── Form ──
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DateField
                  control={form.control}
                  name="fromDate"
                  label={t('fields.fromDate')}
                  placeholder={t('fields.datePlaceholder')}
                  disabledBefore={minDateObj}
                />
                <DateField
                  control={form.control}
                  name="toDate"
                  label={t('fields.toDate')}
                  placeholder={t('fields.datePlaceholder')}
                  disabledBefore={
                    watched.fromDate
                      ? new Date(`${watched.fromDate}T00:00:00`)
                      : minDateObj
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('fields.rangeHelp')}
              </p>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={active.isPending}>
                  {active.isPending ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      {submittingLabel}
                    </>
                  ) : (
                    t('actions.submit')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Date field (Popover + Calendar) ──────────────────────────

function DateField({
  control,
  name,
  label,
  placeholder,
  disabledBefore,
}: {
  control: Control<GenerateSessionsFormValues>
  name: 'fromDate' | 'toDate'
  label: string
  placeholder: string
  disabledBefore: Date
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'justify-start gap-2 font-normal',
                    !field.value && 'text-muted-foreground',
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  {field.value
                    ? format(new Date(`${field.value}T00:00:00`), 'dd/MM/yyyy')
                    : placeholder}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  field.value
                    ? new Date(`${field.value}T00:00:00`)
                    : undefined
                }
                onSelect={(d) => field.onChange(d ? toISODate(d) : '')}
                disabled={{ before: disabledBefore }}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
