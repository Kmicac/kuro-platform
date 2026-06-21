'use client'

import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useTranslations } from 'next-intl'

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
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useUpdateAttendance } from '@/lib/hooks'
import {
  makeAttendanceNoteSchema,
  type AttendanceNoteFormValues,
} from '@/lib/schemas/attendance'
import { notifySuccess } from '@/lib/utils/toast'
import type { AttendanceStatus } from '@/lib/api/types'
import { useAttendanceErrorHandler } from './use-attendance-error'

export interface AttendanceNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  studentId: string
  studentName: string
  currentStatus: AttendanceStatus | null
  currentNotes?: string | null
  hasRecord: boolean
}

const MAX = 500

export function AttendanceNoteDialog({
  open,
  onOpenChange,
  sessionId,
  studentId,
  studentName,
  currentStatus,
  currentNotes,
  hasRecord,
}: AttendanceNoteDialogProps) {
  const t = useTranslations('attendance')
  const tc = useTranslations('common')
  const handleError = useAttendanceErrorHandler()

  const update = useUpdateAttendance(studentId, sessionId)
  const pending = update.isPending

  const schema = useMemo(
    () => makeAttendanceNoteSchema({ notesTooLong: t('noteDialog.tooLong') }),
    [t],
  )

  const form = useForm<AttendanceNoteFormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { notes: '' },
  })

  useEffect(() => {
    if (open) form.reset({ notes: currentNotes ?? '' })
  }, [open, currentNotes, form])

  const notes = useWatch({ control: form.control, name: 'notes' })
  const length = notes?.length ?? 0

  const onSubmit = (values: AttendanceNoteFormValues) => {
    if (!hasRecord) return
    const notes = values.notes.trim()
    const onSuccess = () => {
      notifySuccess(t('success.noteSaved'))
      onOpenChange(false)
    }
    const onError = handleError

    // Corrección sobre un registro existente — solo la nota.
    update.mutate(
      {
        status: currentStatus ?? undefined,
        notes,
        correctionReasonCode: 'STATUS_CORRECTION',
        correctionNote: notes,
      },
      { onSuccess, onError },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('noteDialog.title')}</DialogTitle>
          <DialogDescription>{studentName}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      autoFocus
                      rows={4}
                      maxLength={MAX}
                      className="min-h-[100px]"
                      placeholder={t('noteDialog.placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {length}/{MAX}
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
                {tc('actions.cancel')}
              </Button>
              <Button type="submit" disabled={pending}>
                {t('noteDialog.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
