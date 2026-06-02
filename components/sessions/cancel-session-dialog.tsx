'use client'

/**
 * CancelSessionDialog — cancela una sesión con motivo obligatorio (mín. 10
 * caracteres). La cancelación NO es reversible. Componente separado (no
 * reutiliza SessionDialog). No maneja conflicts (cancelar no genera 409).
 */
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useTranslations } from 'next-intl'
import { formatInTimeZone } from 'date-fns-tz'
import { AlertTriangle } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useCancelSession, useCurrentContext } from '@/lib/hooks'
import {
  makeCancelSessionSchema,
  type CancelSessionFormValues,
} from '@/lib/schemas/session'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

export interface CancelSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  sessionTitle: string
  sessionStartAt: string
  sessionEndAt: string
  onSuccess?: () => void
}

const MAX = 500

export function CancelSessionDialog({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
  sessionStartAt,
  sessionEndAt,
  onSuccess,
}: CancelSessionDialogProps) {
  const t = useTranslations('calendar.cancelDialog')
  const tCommon = useTranslations('common')
  const { branchTimezone } = useCurrentContext()
  const cancel = useCancelSession(sessionId)

  const schema = useMemo(
    () =>
      makeCancelSessionSchema({
        reasonRequired: t('errors.reasonRequired'),
        reasonTooShort: t('errors.reasonTooShort'),
      }),
    [t],
  )

  const form = useForm<CancelSessionFormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { cancellationReason: '' },
  })

  useEffect(() => {
    if (open) form.reset({ cancellationReason: '' })
  }, [open, form])

  const reason = useWatch({
    control: form.control,
    name: 'cancellationReason',
  })
  const reasonLength = reason?.length ?? 0

  const dateStr = formatInTimeZone(
    new Date(sessionStartAt),
    branchTimezone,
    'dd/MM/yyyy',
  )
  const scheduleStr = `${formatInTimeZone(
    new Date(sessionStartAt),
    branchTimezone,
    'HH:mm',
  )} - ${formatInTimeZone(new Date(sessionEndAt), branchTimezone, 'HH:mm')}`

  const onSubmit = (values: CancelSessionFormValues) => {
    cancel.mutate(
      { cancellationReason: values.cancellationReason },
      {
        onSuccess: () => {
          notifySuccess(t('success'))
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            notifyError(t('responseErrors.forbidden'))
            return
          }
          notifyError(tCommon('error.generic'), error)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-0.5 text-sm">
              <p>
                <span className="text-muted-foreground">
                  {t('context.class')}
                </span>{' '}
                <span className="font-medium text-foreground">
                  {sessionTitle}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t('context.date')}
                </span>{' '}
                <span className="tabular-nums">{dateStr}</span>
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t('context.schedule')}
                </span>{' '}
                <span className="tabular-nums">{scheduleStr}</span>
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Warning destacado */}
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{t('warning')}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cancellationReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.reason')}</FormLabel>
                  <FormControl>
                    <Textarea
                      autoFocus
                      rows={4}
                      maxLength={MAX}
                      className="min-h-[100px]"
                      placeholder={t('fields.reasonPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {reasonLength}/{MAX}
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('actions.back')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={cancel.isPending}
              >
                {cancel.isPending ? t('actions.submitting') : t('actions.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
