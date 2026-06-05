'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BookOpen, Pencil, Plus } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import { useUpdateSession } from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

const MAX = 500

export interface TechnicalCurriculumCardProps {
  sessionId: string
  notes: string | null | undefined
  canManage: boolean
  disabled: boolean
}

export function TechnicalCurriculumCard({
  sessionId,
  notes,
  canManage,
  disabled,
}: TechnicalCurriculumCardProps) {
  const t = useTranslations('class-detail.curriculum')
  const tc = useTranslations('common')
  const update = useUpdateSession(sessionId)

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const hasNotes = Boolean(notes && notes.trim())

  // Abre el dialog inicializando el borrador (sin setState-in-effect).
  const openDialog = () => {
    setDraft(notes ?? '')
    setOpen(true)
  }

  const onSave = () => {
    update.mutate(
      { notes: draft.trim() },
      {
        onSuccess: () => {
          notifySuccess(t('saved'))
          setOpen(false)
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403)
            return notifyError(tc('error.generic'), error)
          notifyError(tc('error.generic'), error)
        },
      },
    )
  }

  return (
    <section className="flex flex-col rounded border border-border bg-card p-5">
      <p className="label-mono inline-flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        {t('title')}
      </p>

      {hasNotes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {notes}
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-tertiary)]">{t('empty')}</p>
      )}

      {canManage && (
        <div className="mt-auto pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="px-0 text-primary hover:bg-transparent hover:text-[var(--primary-hover)]"
            disabled={disabled}
            onClick={openDialog}
          >
            {hasNotes ? (
              <>
                <Pencil className="h-3.5 w-3.5" />
                {t('edit')}
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                {t('add')}
              </>
            )}
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('dialogTitle')}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={5}
            maxLength={MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('placeholder')}
            className="min-h-[120px]"
          />
          <div className="flex justify-end">
            <span className="text-xs tabular-nums text-muted-foreground">
              {draft.length}/{MAX}
            </span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button onClick={onSave} disabled={update.isPending}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
