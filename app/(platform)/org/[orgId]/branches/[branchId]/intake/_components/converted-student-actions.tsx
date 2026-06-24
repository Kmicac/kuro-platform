'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Mail, UserRound } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError, authApi } from '@/lib/api/client'
import type {
  IntakeRequestDetail,
  StudentAccountInviteResponse,
} from '@/lib/api/types'
import { useCapabilities, useInviteStudent, useStudent } from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

type IdentityConflictAction =
  | 'INVITE_STUDENT_CLAIM'
  | 'CREATE_STUDENT_WITH_EXISTING_USER'
  | 'LINK_STUDENT_TO_USER'
  | 'CONTACT_ADMIN'

type InviteFeedback =
  | { kind: 'idle' }
  | { kind: 'sent'; message: string }
  | { kind: 'started'; message: string }
  | { kind: 'error'; message: string }

export function ConvertedStudentActions({
  orgId,
  request,
}: {
  orgId: string
  request: IntakeRequestDetail
}) {
  const t = useTranslations('intake.convertedStudent')
  const capabilitiesQuery = useCapabilities(orgId)
  const inviteMutation = useInviteStudent(orgId)
  const [feedback, setFeedback] = useState<InviteFeedback>({ kind: 'idle' })
  const [stepUpOpen, setStepUpOpen] = useState(false)
  const [stepUpPassword, setStepUpPassword] = useState('')
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [isStepUpPending, setIsStepUpPending] = useState(false)

  const studentId = request.convertedStudentId
  const studentQuery = useStudent(orgId, studentId ?? '')
  const isStudentLinked = Boolean(studentQuery.data?.userId)

  if (request.status !== 'CONVERTED') return null

  const caps = capabilitiesQuery.data?.capabilities
  const canInvite = Boolean(
    !isStudentLinked &&
      (caps?.students?.canInviteExistingStudent ||
        caps?.usersMemberships?.canCreateStudentMembershipFromClaim),
  )

  const triggerInvite = () => {
    if (!studentId) return

    inviteMutation.mutate(
      {
        studentId,
        email: request.email,
        branchId: request.branchId,
        intakeRequestId: request.id,
      },
      {
        onSuccess: (data) => {
          const result = resolveInviteSuccess(data, t)
          setFeedback(result.feedback)
          if (result.kind === 'error') {
            notifyError(result.toast)
          } else {
            notifySuccess(result.toast)
          }
        },
        onError: (error) => {
          if (readApiErrorCode(error) === 'RECENT_AUTH_REQUIRED') {
            setStepUpError(null)
            setStepUpOpen(true)
            return
          }

          const message = resolveInviteError(error, t)
          setFeedback({ kind: 'error', message })
          notifyError(message, error)
        },
      },
    )
  }

  const sendInvite = () => {
    setFeedback({ kind: 'idle' })
    triggerInvite()
  }

  const confirmStepUp = async () => {
    const password = stepUpPassword.trim()
    if (!password) {
      setStepUpError(t('stepUp.errors.required'))
      return
    }

    setIsStepUpPending(true)
    setStepUpError(null)

    try {
      await authApi.stepUp(password)
      setStepUpOpen(false)
      setStepUpPassword('')
      triggerInvite()
    } catch (error) {
      const message =
        error instanceof ApiError && (error.status === 401 || error.status === 403)
          ? t('stepUp.errors.invalid')
          : t('stepUp.errors.generic')
      setStepUpError(message)
      notifyError(message, error)
    } finally {
      setIsStepUpPending(false)
    }
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
            {studentId ? t('description') : t('missingStudentId')}
          </p>
        </div>
      </div>

      {feedback.kind !== 'idle' && (
        <div
          className={
            feedback.kind === 'sent' || feedback.kind === 'started'
              ? 'mt-3 rounded-lg border border-primary/30 bg-primary/10 p-3'
              : 'mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3'
          }
        >
          <div className="flex items-start gap-2">
            {feedback.kind === 'sent' || feedback.kind === 'started' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
            )}
            <p className="text-xs text-muted-foreground">{feedback.message}</p>
          </div>
        </div>
      )}

      {isStudentLinked && (
        <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              {t('alreadyLinked')}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {studentId && (
          <Button asChild size="sm">
            <Link href={`/org/${orgId}/students/${studentId}`}>
              <UserRound className="mr-2 h-4 w-4" />
              {t('viewStudent')}
            </Link>
          </Button>
        )}

        {studentId && capabilitiesQuery.isLoading && (
          <Button type="button" size="sm" variant="outline" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('checkingPermission')}
          </Button>
        )}

        {studentId && !capabilitiesQuery.isLoading && canInvite && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={sendInvite}
            disabled={
              inviteMutation.isPending ||
              feedback.kind === 'sent' ||
              feedback.kind === 'started'
            }
          >
            {inviteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : feedback.kind === 'sent' || feedback.kind === 'started' ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {inviteMutation.isPending
              ? t('sending')
              : feedback.kind === 'sent' || feedback.kind === 'started'
                ? feedback.kind === 'sent'
                  ? t('sent')
                  : t('started')
                : t('sendInvite')}
          </Button>
        )}

        {studentId && !capabilitiesQuery.isLoading && !canInvite && !isStudentLinked && (
          <div className="flex items-center rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {t('noPermission')}
          </div>
        )}
      </div>

      <Dialog
        open={stepUpOpen}
        onOpenChange={(open) => {
          if (isStepUpPending) return
          setStepUpOpen(open)
          if (!open) {
            setStepUpPassword('')
            setStepUpError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('stepUp.title')}</DialogTitle>
            <DialogDescription>
              {t('stepUp.description')}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void confirmStepUp()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="student-invite-step-up-password">
                {t('stepUp.passwordLabel')}
              </Label>
              <Input
                id="student-invite-step-up-password"
                type="password"
                value={stepUpPassword}
                onChange={(event) => setStepUpPassword(event.target.value)}
                placeholder={t('stepUp.passwordPlaceholder')}
                disabled={isStepUpPending}
                autoComplete="current-password"
              />
              {stepUpError && (
                <p className="text-xs text-destructive">{stepUpError}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStepUpOpen(false)}
                disabled={isStepUpPending}
              >
                {t('stepUp.cancel')}
              </Button>
              <Button type="submit" disabled={isStepUpPending}>
                {isStepUpPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isStepUpPending ? t('stepUp.confirming') : t('stepUp.submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function resolveInviteSuccess(
  data: StudentAccountInviteResponse,
  t: ReturnType<typeof useTranslations<'intake.convertedStudent'>>,
): {
  feedback: Exclude<InviteFeedback, { kind: 'idle' }>
  toast: string
  kind: 'success' | 'error'
} {
  if (data.delivery?.status === 'SENT') {
    return {
      feedback: { kind: 'sent', message: t('sentDescription') },
      toast: t('successSent'),
      kind: 'success',
    }
  }

  if (data.delivery?.status === 'FAILED') {
    return {
      feedback: { kind: 'error', message: t('deliveryFailedDescription') },
      toast: t('deliveryFailed'),
      kind: 'error',
    }
  }

  return {
    feedback: { kind: 'started', message: t('startedDescription') },
    toast: t('successStarted'),
    kind: 'success',
  }
}

function resolveInviteError(
  error: unknown,
  t: ReturnType<typeof useTranslations<'intake.convertedStudent'>>,
) {
  const code = readApiErrorCode(error)
  if (code === 'STUDENT_USER_IDENTITY_CONFLICT') {
    const action = readSuggestedAction(error instanceof ApiError ? error.body : null)
    return action
      ? t(`identityConflict.actions.${action}`)
      : t('identityConflict.actions.CONTACT_ADMIN')
  }

  const message = readApiErrorMessage(error)
  if (message && /already linked/i.test(message)) {
    return t('errors.alreadyLinked')
  }
  if (message && /pending/i.test(message)) {
    return t('errors.pendingInvite')
  }
  if (message && /(step[- ]?up|recent auth|re[- ]?authentication)/i.test(message)) {
    return t('errors.stepUpRequired')
  }

  if (code === 'STUDENT_ALREADY_LINKED' || code === 'STUDENT_ACCOUNT_ALREADY_LINKED') {
    return t('errors.alreadyLinked')
  }

  if (
    code === 'STUDENT_CLAIM_INVITATION_PENDING' ||
    code === 'STUDENT_INVITATION_ALREADY_PENDING'
  ) {
    return t('errors.pendingInvite')
  }

  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 422) return t('errors.validation')
    if (error.status === 403) return t('errors.forbidden')
    if (error.status === 404) return t('errors.notFound')
    if (error.status === 409) return t('errors.conflict')
  }

  return t('errors.generic')
}

function readApiErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return null
  const record = readRecord(error.body)
  const nested = readRecord(record?.error)
  const message = record?.message ?? nested?.message
  return typeof message === 'string' ? message : null
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
