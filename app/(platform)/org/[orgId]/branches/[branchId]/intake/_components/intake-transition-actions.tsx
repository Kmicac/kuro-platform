'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, LockKeyhole } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import type {
  IntakeRequestDetail,
  IntakeStatus,
  IntakeTransitionBody,
} from '@/lib/api/types'
import {
  useCapabilities,
  useTransitionIntakeRequest,
} from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

type TransitionActionKey =
  | 'markReviewing'
  | 'markContacted'
  | 'proposeVisit'
  | 'scheduleVisit'
  | 'markVisitCompleted'
  | 'markNoShow'
  | 'markReadyToConvert'
  | 'decline'
  | 'reject'
  | 'cancel'

type TransitionAction = {
  key: TransitionActionKey
  status: IntakeStatus
  tone?: 'default' | 'destructive'
  needsVisitWindow?: boolean
}

const TERMINAL_STATUSES = new Set<IntakeStatus>([
  'CONVERTED',
  'CANCELLED',
  'REJECTED_BY_ACADEMY',
  'DECLINED_BY_PROSPECT',
])

const EMPTY_ACTIONS: TransitionAction[] = []

const ACTIONS_BY_STATUS: Record<IntakeStatus, TransitionAction[]> = {
  NEW: [
    { key: 'markReviewing', status: 'REVIEWING' },
  ],
  REVIEWING: [
    { key: 'markContacted', status: 'CONTACTED' },
  ],
  CONTACTED: [
    { key: 'proposeVisit', status: 'VISIT_PROPOSED', needsVisitWindow: true },
  ],
  VISIT_PROPOSED: [
    { key: 'scheduleVisit', status: 'VISIT_SCHEDULED', needsVisitWindow: true },
  ],
  VISIT_SCHEDULED: [
    { key: 'markVisitCompleted', status: 'VISIT_COMPLETED' },
    { key: 'markNoShow', status: 'NO_SHOW', tone: 'destructive' },
  ],
  VISIT_COMPLETED: [
    { key: 'markReadyToConvert', status: 'READY_TO_CONVERT' },
  ],
  NO_SHOW: [],
  DECLINED_BY_PROSPECT: [],
  REJECTED_BY_ACADEMY: [],
  READY_TO_CONVERT: [],
  CONVERTED: [],
  CANCELLED: [],
}

export function IntakeTransitionActions({
  orgId,
  request,
}: {
  orgId: string
  request: IntakeRequestDetail
}) {
  const t = useTranslations('intake.transition')
  const tStatus = useTranslations('intake.status')
  const capabilitiesQuery = useCapabilities(orgId)
  const mutation = useTransitionIntakeRequest(orgId, request.id, request.branchId)
  const [selectedKey, setSelectedKey] = useState<TransitionActionKey | null>(null)
  const [proposedStartAt, setProposedStartAt] = useState(() =>
    toDateInputValue(request.proposedStartAt),
  )
  const [proposedEndAt, setProposedEndAt] = useState(() =>
    toDateInputValue(request.proposedEndAt),
  )
  const [decisionReason, setDecisionReason] = useState('')

  const actions = ACTIONS_BY_STATUS[request.status] ?? EMPTY_ACTIONS
  const selectedAction =
    actions.find((action) => action.key === selectedKey) ?? null
  const canManage = Boolean(
    capabilitiesQuery.data?.capabilities?.academyIntake?.canManageBranchRequests,
  )

  const submit = () => {
    if (!selectedAction) return

    const body: IntakeTransitionBody = { status: selectedAction.status }
    const start = proposedStartAt.trim()
    const end = proposedEndAt.trim()
    const reason = decisionReason.trim()

    if (selectedAction.needsVisitWindow) {
      body.proposedStartAt = start || null
      body.proposedEndAt = end || null
    }

    if (reason) body.decisionReason = reason

    mutation.mutate(body, {
      onSuccess: () => {
        notifySuccess(t('success'))
        setSelectedKey(null)
        setDecisionReason('')
      },
      onError: (error) => {
        notifyError(resolveTransitionError(error, t), error)
      },
    })
  }

  if (request.status === 'READY_TO_CONVERT') {
    return null
  }

  if (TERMINAL_STATUSES.has(request.status)) {
    return (
      <section className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">
          {t('terminalTitle')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('terminalDescription')}
        </p>
      </section>
    )
  }

  if (capabilitiesQuery.isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="h-20 animate-pulse rounded-lg bg-muted/40" />
      </section>
    )
  }

  if (!canManage) {
    return (
      <section className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-2">
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
      </section>
    )
  }

  if (actions.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">
          {t('noActionsTitle')}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('noActionsDescription')}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {t('title')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('currentStatus', { status: tStatus(request.status as never) })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            type="button"
            size="xs"
            variant={
              selectedKey === action.key
                ? action.tone === 'destructive'
                  ? 'destructive'
                  : 'default'
                : 'outline'
            }
            onClick={() => setSelectedKey(action.key)}
            disabled={mutation.isPending}
          >
            {actionLabel(action.key, t)}
          </Button>
        ))}
      </div>

      {selectedAction ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {t('selectedStatus', {
                status: tStatus(selectedAction.status as never),
              })}
            </span>
          </div>

          {selectedAction.needsVisitWindow && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="intake-proposed-start" className="text-xs">
                  {t('fields.proposedStartAt')}
                </Label>
                <Input
                  id="intake-proposed-start"
                  type="date"
                  value={proposedStartAt}
                  onChange={(event) => setProposedStartAt(event.target.value)}
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake-proposed-end" className="text-xs">
                  {t('fields.proposedEndAt')}
                </Label>
                <Input
                  id="intake-proposed-end"
                  type="date"
                  value={proposedEndAt}
                  onChange={(event) => setProposedEndAt(event.target.value)}
                  disabled={mutation.isPending}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="intake-decision-reason" className="text-xs">
              {t('fields.decisionReason')}
            </Label>
            <Textarea
              id="intake-decision-reason"
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
              placeholder={t('fields.decisionReasonPlaceholder')}
              disabled={mutation.isPending}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedKey(null)}
              disabled={mutation.isPending}
            >
              {t('actions.clear')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              {mutation.isPending ? t('actions.saving') : t('actions.submit')}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          {t('selectAction')}
        </p>
      )}
    </section>
  )
}

function actionLabel(
  key: TransitionActionKey,
  t: ReturnType<typeof useTranslations<'intake.transition'>>,
) {
  switch (key) {
    case 'markReviewing':
      return t('actions.markReviewing')
    case 'markContacted':
      return t('actions.markContacted')
    case 'proposeVisit':
      return t('actions.proposeVisit')
    case 'scheduleVisit':
      return t('actions.scheduleVisit')
    case 'markVisitCompleted':
      return t('actions.markVisitCompleted')
    case 'markNoShow':
      return t('actions.markNoShow')
    case 'markReadyToConvert':
      return t('actions.markReadyToConvert')
    case 'decline':
      return t('actions.decline')
    case 'reject':
      return t('actions.reject')
    case 'cancel':
      return t('actions.cancel')
  }
}

function resolveTransitionError(
  error: unknown,
  t: ReturnType<typeof useTranslations<'intake.transition'>>,
) {
  const code = readApiErrorCode(error)
  if (code === 'STUDENT_USER_IDENTITY_CONFLICT') {
    return t('errors.identityConflict')
  }

  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 422) return t('errors.validation')
    if (error.status === 403) return t('errors.forbidden')
    if (error.status === 404) return t('errors.notFound')
    if (error.status === 409) return t('errors.invalidTransition')
  }

  return t('errors.generic')
}

function readApiErrorCode(error: unknown) {
  if (!(error instanceof ApiError)) return null
  return readCodeFromRecord(error.body)
}

function readCodeFromRecord(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const directCode = record.code ?? record.errorCode
  if (typeof directCode === 'string') return directCode

  const nestedError = record.error
  if (nestedError && typeof nestedError === 'object') {
    const nestedRecord = nestedError as Record<string, unknown>
    const nestedCode = nestedRecord.code ?? nestedRecord.errorCode
    if (typeof nestedCode === 'string') return nestedCode
  }

  return null
}

function toDateInputValue(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 10)
}
