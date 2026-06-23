'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  UserRoundPlus,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import type { IntakeRequestDetail } from '@/lib/api/types'
import { useCapabilities, useConvertIntakeRequest } from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

type IdentityConflictAction =
  | 'INVITE_STUDENT_CLAIM'
  | 'CREATE_STUDENT_WITH_EXISTING_USER'
  | 'LINK_STUDENT_TO_USER'
  | 'CONTACT_ADMIN'

type IdentityConflict = {
  action: IdentityConflictAction | null
  message: string
}

export function IntakeConvertPreview({
  orgId,
  request,
}: {
  orgId: string
  request: IntakeRequestDetail
}) {
  const t = useTranslations('intake.convert')
  const tType = useTranslations('intake.requestType')
  const tExperience = useTranslations('intake.experience')
  const capabilitiesQuery = useCapabilities(orgId)
  const mutation = useConvertIntakeRequest(orgId, request.id, request.branchId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [conversionReason, setConversionReason] = useState('')
  const [identityConflict, setIdentityConflict] =
    useState<IdentityConflict | null>(null)

  if (request.status !== 'READY_TO_CONVERT') return null

  const branchName = readString(request.branch, 'name')
  const branchCity = readString(request.branch, 'city')
  const canConvert = Boolean(
    capabilitiesQuery.data?.capabilities?.academyIntake?.canConvertToStudent,
  )
  const trimmedReason = conversionReason.trim()

  const convert = () => {
    if (!trimmedReason) return
    setIdentityConflict(null)

    mutation.mutate(
      { conversionReason: trimmedReason },
      {
        onSuccess: () => {
          notifySuccess(t('success'))
          setConfirmOpen(false)
          setConversionReason('')
        },
        onError: (error) => {
          const conflict = resolveIdentityConflict(error, t)
          if (conflict) setIdentityConflict(conflict)
          notifyError(resolveConvertError(error, t), error)
        },
      },
    )
  }

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/10 p-4">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {t('title')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PreviewField label={t('fields.name')} value={request.fullName} />
        <PreviewField label={t('fields.email')} value={request.email} />
        <PreviewField
          label={t('fields.phone')}
          value={request.phone || t('notProvided')}
        />
        <PreviewField
          label={t('fields.branch')}
          value={
            branchName
              ? branchCity
                ? `${branchName} · ${branchCity}`
                : branchName
              : t('notProvided')
          }
        />
        <PreviewField
          label={t('fields.experience')}
          value={
            request.experienceLevel
              ? humanize(request.experienceLevel, tExperience as PreviewTranslator)
              : t('notProvided')
          }
        />
        <PreviewField
          label={t('fields.requestType')}
          value={humanize(request.requestType, tType as PreviewTranslator)}
        />
        <PreviewField
          className="sm:col-span-2"
          label={t('fields.studentPreview')}
          value={t('studentPreviewValue', {
            name: request.fullName,
            email: request.email,
          })}
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-background/70 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {t('warning')}
          </p>
        </div>
      </div>

      {identityConflict && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {t('identityConflict.title')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {identityConflict.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {capabilitiesQuery.isLoading ? (
        <div className="mt-4 h-9 animate-pulse rounded-md bg-muted/40" />
      ) : canConvert ? (
        <Button
          type="button"
          size="sm"
          className="mt-4"
          onClick={() => setConfirmOpen(true)}
        >
          <UserRoundPlus className="mr-2 h-4 w-4" />
          {t('action')}
        </Button>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('noPermissionTitle')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('noPermissionDescription')}
            </p>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm.title')}</DialogTitle>
            <DialogDescription>{t('confirm.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-sm font-medium text-foreground">
                {request.fullName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {request.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="intake-conversion-reason" className="text-xs">
                {t('confirm.reasonLabel')}
              </Label>
              <Textarea
                id="intake-conversion-reason"
                value={conversionReason}
                onChange={(event) => setConversionReason(event.target.value)}
                placeholder={t('confirm.reasonPlaceholder')}
                disabled={mutation.isPending}
              />
              {!trimmedReason && (
                <p className="text-xs text-muted-foreground">
                  {t('confirm.reasonRequired')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={mutation.isPending}
            >
              {t('confirm.cancel')}
            </Button>
            <Button
              type="button"
              onClick={convert}
              disabled={mutation.isPending || !trimmedReason}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mutation.isPending ? t('confirm.converting') : t('confirm.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function PreviewField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-foreground">{value}</p>
    </div>
  )
}

type PreviewTranslator = {
  (key: never): string
  has: (key: never) => boolean
}

function humanize(value: string, t: PreviewTranslator) {
  return t.has(value as never) ? t(value as never) : value
}

function resolveConvertError(
  error: unknown,
  t: ReturnType<typeof useTranslations<'intake.convert'>>,
) {
  if (readApiErrorCode(error) === 'STUDENT_USER_IDENTITY_CONFLICT') {
    return t('errors.identityConflict')
  }

  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 422) return t('errors.validation')
    if (error.status === 403) return t('errors.forbidden')
    if (error.status === 404) return t('errors.notFound')
    if (error.status === 409) return t('errors.conflict')
  }

  return t('errors.generic')
}

function resolveIdentityConflict(
  error: unknown,
  t: ReturnType<typeof useTranslations<'intake.convert'>>,
): IdentityConflict | null {
  if (!(error instanceof ApiError)) return null
  if (readApiErrorCode(error) !== 'STUDENT_USER_IDENTITY_CONFLICT') return null

  const suggestedAction = readSuggestedAction(error.body)
  return {
    action: suggestedAction,
    message: suggestedAction
      ? t(`identityConflict.actions.${suggestedAction}`)
      : t('identityConflict.actions.CONTACT_ADMIN'),
  }
}

function readApiErrorCode(error: unknown) {
  if (!(error instanceof ApiError)) return null
  const record = readRecord(error.body)
  const nested = readRecord(record?.error)
  const code = record?.code ?? record?.errorCode ?? nested?.code ?? nested?.errorCode
  return typeof code === 'string' ? code : null
}

function readSuggestedAction(value: unknown): IdentityConflictAction | null {
  const record = readRecord(value)
  const nested = readRecord(record?.error)
  const suggestedAction = record?.suggestedAction ?? nested?.suggestedAction
  if (
    suggestedAction === 'INVITE_STUDENT_CLAIM' ||
    suggestedAction === 'CREATE_STUDENT_WITH_EXISTING_USER' ||
    suggestedAction === 'LINK_STUDENT_TO_USER' ||
    suggestedAction === 'CONTACT_ADMIN'
  ) {
    return suggestedAction
  }
  return null
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value : null
}
