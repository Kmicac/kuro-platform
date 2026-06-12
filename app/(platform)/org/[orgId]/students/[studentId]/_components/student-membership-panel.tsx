'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useFormatter, useTranslations } from 'next-intl'
import {
  CalendarClock,
  Pause,
  Play,
  Snowflake,
  Tag,
  WalletCards,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { BgAnimateButton } from '@/components/ui/bg-animate-button'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { EmptyState, ErrorState, ForbiddenState } from '@/components/shared'
import { ApiError } from '@/lib/api/client'
import {
  type BillingFrequency,
  type BillingPlanResponse,
  type CreateStudentMembershipRequest,
  type DiscountType,
  type StudentMembershipResponse,
  type StudentMembershipStatus,
  type StudentMembershipMutationAmount,
  type UpdateStudentMembershipRequest,
} from '@/lib/api/billing.types'
import { formatDecimalMoney } from '@/lib/billing'
import {
  useBillingPlans,
  useCapabilities,
  useCreateStudentMembership,
  useStudentMembership,
  useUpdateStudentMembership,
} from '@/lib/hooks'
import {
  makeStudentMembershipDefaults,
  makeStudentMembershipSchema,
  normalizeDiscountType,
  type StudentMembershipFormValues,
} from '@/lib/schemas/student-membership'
import { cn } from '@/lib/utils'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

interface StudentMembershipPanelProps {
  orgId: string
  studentId: string
  branchId: string | null
}

const EDITABLE_STATUS_VALUES = [
  'ACTIVE',
  'PAUSED',
  'FROZEN',
] as const satisfies readonly StudentMembershipStatus[]

const STATUS_LABEL_KEYS = {
  ACTIVE: 'membershipStatus.ACTIVE',
  PAUSED: 'membershipStatus.PAUSED',
  FROZEN: 'membershipStatus.FROZEN',
  CANCELED: 'membershipStatus.CANCELED',
  ENDED: 'membershipStatus.ENDED',
} as const satisfies Record<StudentMembershipStatus, string>

const FREQUENCY_LABEL_KEYS = {
  WEEKLY: 'billingFrequency.WEEKLY',
  MONTHLY: 'billingFrequency.MONTHLY',
  QUARTERLY: 'billingFrequency.QUARTERLY',
  YEARLY: 'billingFrequency.YEARLY',
  ONE_TIME: 'billingFrequency.ONE_TIME',
} as const satisfies Record<BillingFrequency, string>

const DISCOUNT_LABEL_KEYS = {
  PERCENTAGE: 'discountType.PERCENTAGE',
  FIXED: 'discountType.FIXED',
} as const satisfies Record<DiscountType, string>

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

function toMutationAmount(value: string): StudentMembershipMutationAmount {
  return value.trim() as StudentMembershipMutationAmount
}

function formatDateValue(
  format: ReturnType<typeof useFormatter>,
  value?: string | null
) {
  if (!value) return null
  try {
    return format.dateTime(new Date(value), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function planLabel(plan: BillingPlanResponse, labelFrequency: (v: BillingFrequency) => string) {
  const amount = formatDecimalMoney(plan.amount, {
    currency: plan.currency,
    unknownCurrencyLabel: plan.currency,
  })
  return `${plan.name} · ${amount} · ${labelFrequency(plan.billingFrequency)}`
}

function membershipToFormValues(
  membership: StudentMembershipResponse
): StudentMembershipFormValues {
  const editableStatus =
    membership.status === 'ACTIVE' ||
    membership.status === 'PAUSED' ||
    membership.status === 'FROZEN'
      ? membership.status
      : 'ACTIVE'

  return {
    billingPlanId: membership.billingPlanId,
    startedAt: dateInputValue(membership.startedAt),
    nextBillingDate: dateInputValue(membership.nextBillingDate),
    status: editableStatus,
    freezeStartAt: dateInputValue(membership.freezeStartAt),
    freezeEndAt: dateInputValue(membership.freezeEndAt),
    discountType: membership.discountType ?? 'NONE',
    discountValue: membership.discountValue ?? '',
    notes: membership.notes ?? '',
  }
}

function makeCreateBody(
  values: StudentMembershipFormValues
): CreateStudentMembershipRequest {
  const body: CreateStudentMembershipRequest = {
    billingPlanId: values.billingPlanId,
    startedAt: values.startedAt,
    status: values.status,
  }
  const nextBillingDate = values.nextBillingDate.trim()
  const freezeStartAt = values.freezeStartAt.trim()
  const freezeEndAt = values.freezeEndAt.trim()
  const discountType = normalizeDiscountType(values.discountType)
  const discountValue = values.discountValue.trim()
  const notes = values.notes?.trim()

  if (nextBillingDate) body.nextBillingDate = nextBillingDate
  if (freezeStartAt) body.freezeStartAt = freezeStartAt
  if (freezeEndAt) body.freezeEndAt = freezeEndAt
  if (discountType) body.discountType = discountType
  if (discountType && discountValue) {
    body.discountValue = toMutationAmount(discountValue)
  }
  if (notes) body.notes = notes
  return body
}

function makeUpdateBody(
  values: StudentMembershipFormValues,
  current: StudentMembershipResponse
): UpdateStudentMembershipRequest {
  const body: UpdateStudentMembershipRequest = {
    billingPlanId: values.billingPlanId,
    startedAt: values.startedAt,
    status: values.status,
    notes: values.notes?.trim() ?? '',
  }
  const nextBillingDate = values.nextBillingDate.trim()
  const freezeStartAt = values.freezeStartAt.trim()
  const freezeEndAt = values.freezeEndAt.trim()
  const discountType = normalizeDiscountType(values.discountType)
  const discountValue = values.discountValue.trim()

  if (nextBillingDate) body.nextBillingDate = nextBillingDate
  if (freezeStartAt) body.freezeStartAt = freezeStartAt
  if (freezeEndAt) body.freezeEndAt = freezeEndAt
  if (!freezeStartAt && !freezeEndAt && (current.freezeStartAt || current.freezeEndAt)) {
    body.clearFreezeSchedule = true
  }
  if (discountType) {
    body.discountType = discountType
    if (discountValue) body.discountValue = toMutationAmount(discountValue)
  } else if (current.discountType || current.discountValue) {
    body.clearDiscount = true
  }
  return body
}

function isTerminal(status: StudentMembershipStatus) {
  return status === 'CANCELED' || status === 'ENDED'
}

export function StudentMembershipPanel({
  orgId,
  studentId,
  branchId,
}: StudentMembershipPanelProps) {
  const t = useTranslations('billing')
  const tm = useTranslations('billing.studentMembership')
  const format = useFormatter()
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const capabilitiesQuery = useCapabilities(orgId)
  const canReadBilling =
    capabilitiesQuery.data?.capabilities.billing?.canReadBilling ?? false
  const canWriteBilling =
    capabilitiesQuery.data?.capabilities.billing?.canWriteBilling ?? false
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const billingEnabled = hasCapabilities && canReadBilling && Boolean(branchId)

  const membershipQuery = useStudentMembership(orgId, studentId, {
    enabled: billingEnabled,
  })
  const plansQuery = useBillingPlans(orgId, branchId ?? '', {
    enabled: billingEnabled,
  })
  const update = useUpdateStudentMembership(orgId, studentId)

  const activePlans = useMemo(
    () => plansQuery.data?.filter((plan) => plan.isActive) ?? [],
    [plansQuery.data]
  )

  const membership = membershipQuery.data ?? null
  const forbiddenByCapabilities = hasCapabilities && !canReadBilling
  const forbiddenByBackend =
    membershipQuery.isError &&
    membershipQuery.error instanceof ApiError &&
    membershipQuery.error.status === 403
  const capabilitiesError = capabilitiesQuery.isError
    ? capabilitiesQuery.error
    : null
  const membershipError =
    membershipQuery.isError && !forbiddenByBackend
      ? membershipQuery.error
      : null
  const error = capabilitiesError ?? membershipError
  const isMembershipLoading =
    capabilitiesQuery.isLoading ||
    (billingEnabled && membershipQuery.isLoading)
  const canCreateMembership =
    canWriteBilling &&
    !membership &&
    Boolean(branchId) &&
    !isMembershipLoading &&
    !error

  const header = (allowCreate = canCreateMembership) => (
    <PanelHeader
      readOnly={Boolean(canReadBilling && !canWriteBilling)}
      onCreate={allowCreate ? () => setDialogMode('create') : undefined}
    />
  )

  const dialogs = (
    <>
      <MembershipFormDialog
        mode={dialogMode ?? 'create'}
        orgId={orgId}
        studentId={studentId}
        open={Boolean(dialogMode)}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null)
        }}
        plans={activePlans}
        plansLoading={plansQuery.isLoading}
        plansError={plansQuery.isError ? plansQuery.error : null}
        onRetryPlans={() => {
          void plansQuery.refetch()
        }}
        membership={dialogMode === 'edit' ? membership : null}
      />

      {membership ? (
        <>
          <FreezeMembershipDialog
            open={freezeOpen}
            onOpenChange={setFreezeOpen}
            membership={membership}
            mutation={update}
          />
          <CancelMembershipDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            mutation={update}
          />
        </>
      ) : null}
    </>
  )

  const renderCard = (content: ReactNode, options?: { allowCreate?: boolean }) => (
    <>
      <TextureCard>
        <TextureCardContent className="p-5 space-y-4">
          {header(options?.allowCreate)}
          {content}
        </TextureCardContent>
      </TextureCard>
      {dialogs}
    </>
  )

  if (!branchId) {
    return renderCard(
      <EmptyState
        dense
        icon={WalletCards}
        title={tm('title')}
        description={tm('states.noPrimaryBranch')}
      />,
      { allowCreate: false }
    )
  }

  if (forbiddenByCapabilities || forbiddenByBackend) {
    return renderCard(
      <ForbiddenState
        dense
        title={tm('states.forbiddenTitle')}
        description={tm('states.forbiddenDescription')}
      />,
      { allowCreate: false }
    )
  }

  if (error) {
    return renderCard(
      <ErrorState
        dense
        error={error}
        title={tm('states.loadErrorTitle')}
        description={tm('states.loadErrorDescription')}
        onRetry={() => {
          if (capabilitiesError) void capabilitiesQuery.refetch()
          if (membershipError) void membershipQuery.refetch()
        }}
      />,
      { allowCreate: false }
    )
  }

  return renderCard(
    <>
      {isMembershipLoading ? (
        <MembershipSkeleton />
      ) : membership ? (
        <>
          <MembershipSummary
            membership={membership}
            formatDate={(value) => formatDateValue(format, value)}
            labelStatus={(value) =>
              t(STATUS_LABEL_KEYS[value] as Parameters<typeof t>[0])
            }
            labelFrequency={(value) =>
              t(FREQUENCY_LABEL_KEYS[value] as Parameters<typeof t>[0])
            }
            labelDiscount={(value) =>
              t(DISCOUNT_LABEL_KEYS[value] as Parameters<typeof t>[0])
            }
          />

          {membership.status === 'FROZEN' ? (
            <p className="rounded-md border border-sky-500/30 bg-sky-500/5 px-3 py-2 text-xs text-sky-800">
              {tm('states.frozenDescription')}
            </p>
          ) : null}

          {canWriteBilling && !isTerminal(membership.status) ? (
            <MembershipActions
              membership={membership}
              isPending={update.isPending}
              onEdit={() => setDialogMode('edit')}
              onPause={() =>
                updateMembershipStatus(update, tm, 'PAUSED', {
                  status: 'PAUSED',
                })
              }
              onReactivate={() =>
                updateMembershipStatus(update, tm, 'ACTIVE', {
                  status: 'ACTIVE',
                })
              }
              onFreeze={() => setFreezeOpen(true)}
              onCancel={() => setCancelOpen(true)}
              onClearDiscount={() =>
                updateMembershipStatus(update, tm, 'clearDiscount', {
                  clearDiscount: true,
                })
              }
              onClearFreeze={() =>
                updateMembershipStatus(update, tm, 'clearFreeze', {
                  clearFreezeSchedule: true,
                })
              }
            />
          ) : null}

          {isTerminal(membership.status) ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {tm('states.terminal')}
            </p>
          ) : null}
        </>
      ) : (
        <EmptyState
          dense
          icon={WalletCards}
          title={tm('states.emptyTitle')}
          description={tm('states.emptyDescription')}
          action={
            canWriteBilling ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setDialogMode('create')}
              >
                {tm('actions.create')}
              </Button>
            ) : null
          }
        />
      )}

      {canWriteBilling &&
      activePlans.length === 0 &&
      !plansQuery.isLoading &&
      !plansQuery.isError ? (
        <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {tm('states.noActivePlans')}
        </p>
      ) : null}
    </>
  )
}

function PanelHeader({
  readOnly,
  onCreate,
}: {
  readOnly: boolean
  onCreate?: () => void
}) {
  const tm = useTranslations('billing.studentMembership')
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <WalletCards className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{tm('title')}</p>
            <p className="text-xs text-muted-foreground">{tm('subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {readOnly ? (
          <Badge variant="outline" className="text-xs">
            {tm('readOnly')}
          </Badge>
        ) : null}
        {onCreate ? (
          <Button type="button" size="sm" onClick={onCreate}>
            {tm('actions.create')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function MembershipSummary({
  membership,
  formatDate,
  labelStatus,
  labelFrequency,
  labelDiscount,
}: {
  membership: StudentMembershipResponse
  formatDate: (value?: string | null) => string | null
  labelStatus: (value: StudentMembershipStatus) => string
  labelFrequency: (value: BillingFrequency) => string
  labelDiscount: (value: DiscountType) => string
}) {
  const tm = useTranslations('billing.studentMembership')
  const plan = membership.billingPlan
  const amount = formatDecimalMoney(plan.amount, {
    currency: plan.currency,
    unknownCurrencyLabel: plan.currency,
  })
  const discount = membership.discountType
    ? formatDiscount(membership, labelDiscount)
    : null

  const rows = [
    { label: tm('fields.status'), value: labelStatus(membership.status) },
    { label: tm('fields.plan'), value: plan.name },
    {
      label: tm('fields.amount'),
      value: `${amount} · ${labelFrequency(plan.billingFrequency)}`,
    },
    { label: tm('fields.startedAt'), value: formatDate(membership.startedAt) },
    {
      label: tm('fields.nextBillingDate'),
      value: formatDate(membership.nextBillingDate),
    },
    {
      label: tm('fields.freezeStartAt'),
      value: formatDate(membership.freezeStartAt),
      hidden: !membership.freezeStartAt,
    },
    {
      label: tm('fields.freezeEndAt'),
      value: formatDate(membership.freezeEndAt),
      hidden: !membership.freezeEndAt,
    },
    {
      label: tm('fields.endedAt'),
      value: formatDate(membership.endedAt),
      hidden: !membership.endedAt,
    },
    {
      label: tm('fields.discount'),
      value: discount,
      hidden: !discount,
    },
    {
      label: tm('fields.notes'),
      value: membership.notes,
      hidden: !membership.notes,
    },
    {
      label: tm('fields.updatedAt'),
      value: formatDate(membership.updatedAt),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MembershipStatusBadge
          status={membership.status}
          label={labelStatus(membership.status)}
        />
        <span className="truncate text-sm font-medium text-foreground">
          {plan.name}
        </span>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm">
        {rows
          .filter((row) => !row.hidden)
          .map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="mt-0.5 break-words text-foreground">
                {row.value ?? '—'}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  )
}

function MembershipStatusBadge({
  status,
  label,
}: {
  status: StudentMembershipStatus
  label: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs',
        status === 'ACTIVE' && 'border-emerald-500/40 text-emerald-700',
        status === 'PAUSED' && 'border-amber-500/40 text-amber-700',
        status === 'FROZEN' && 'border-sky-500/40 text-sky-700',
        (status === 'CANCELED' || status === 'ENDED') &&
          'border-muted-foreground/30 text-muted-foreground'
      )}
    >
      {label}
    </Badge>
  )
}

function formatDiscount(
  membership: StudentMembershipResponse,
  labelDiscount: (value: DiscountType) => string
) {
  if (!membership.discountType || !membership.discountValue) return null
  if (membership.discountType === 'PERCENTAGE') {
    return `${labelDiscount(membership.discountType)} · ${membership.discountValue}%`
  }
  return `${labelDiscount(membership.discountType)} · ${formatDecimalMoney(
    membership.discountValue,
    {
      currency: membership.billingPlan.currency,
      unknownCurrencyLabel: membership.billingPlan.currency,
    }
  )}`
}

function MembershipActions({
  membership,
  isPending,
  onEdit,
  onPause,
  onReactivate,
  onFreeze,
  onCancel,
  onClearDiscount,
  onClearFreeze,
}: {
  membership: StudentMembershipResponse
  isPending: boolean
  onEdit: () => void
  onPause: () => void
  onReactivate: () => void
  onFreeze: () => void
  onCancel: () => void
  onClearDiscount: () => void
  onClearFreeze: () => void
}) {
  const tm = useTranslations('billing.studentMembership')
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={onEdit}
        disabled={isPending}
      >
        {tm('actions.edit')}
      </Button>
      {membership.status === 'ACTIVE' ? (
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={onPause}
          disabled={isPending}
        >
          <Pause className="h-3.5 w-3.5" />
          {tm('actions.pause')}
        </Button>
      ) : null}
      {membership.status === 'PAUSED' || membership.status === 'FROZEN' ? (
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={onReactivate}
          disabled={isPending}
        >
          <Play className="h-3.5 w-3.5" />
          {tm('actions.reactivate')}
        </Button>
      ) : null}
      {membership.status === 'ACTIVE' || membership.status === 'PAUSED' ? (
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={onFreeze}
          disabled={isPending}
        >
          <Snowflake className="h-3.5 w-3.5" />
          {tm('actions.freeze')}
        </Button>
      ) : null}
      {membership.discountType || membership.discountValue ? (
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={onClearDiscount}
          disabled={isPending}
        >
          <Tag className="h-3.5 w-3.5" />
          {tm('actions.clearDiscount')}
        </Button>
      ) : null}
      {membership.freezeStartAt || membership.freezeEndAt ? (
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={onClearFreeze}
          disabled={isPending}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          {tm('actions.clearFreeze')}
        </Button>
      ) : null}
      <Button
        type="button"
        size="xs"
        variant="ghost"
        onClick={onCancel}
        disabled={isPending}
      >
        <XCircle className="h-3.5 w-3.5" />
        {tm('actions.cancel')}
      </Button>
    </div>
  )
}

function MembershipFormDialog({
  mode,
  orgId,
  studentId,
  open,
  onOpenChange,
  plans,
  plansLoading,
  plansError,
  onRetryPlans,
  membership,
}: {
  mode: 'create' | 'edit'
  orgId: string
  studentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  plans: BillingPlanResponse[]
  plansLoading: boolean
  plansError: unknown
  onRetryPlans: () => void
  membership: StudentMembershipResponse | null
}) {
  const isEdit = mode === 'edit'
  const t = useTranslations('billing')
  const tm = useTranslations('billing.studentMembership')
  const tDialog = useTranslations('billing.studentMembership.dialog')
  const tCommon = useTranslations('common')
  const create = useCreateStudentMembership(orgId, studentId)
  const update = useUpdateStudentMembership(orgId, studentId)

  const messages = useMembershipMessages()
  const schema = useMemo(() => makeStudentMembershipSchema(messages), [messages])
  const form = useForm<StudentMembershipFormValues>({
    resolver: standardSchemaResolver(
      schema
    ) as Resolver<StudentMembershipFormValues>,
    defaultValues: makeStudentMembershipDefaults(),
  })
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      form.reset(
        membership
          ? membershipToFormValues(membership)
          : makeStudentMembershipDefaults()
      )
    }
    wasOpenRef.current = open
  }, [form, membership, open])

  const isPending = create.isPending || update.isPending

  const onSubmit = (values: StudentMembershipFormValues) => {
    if (isEdit && membership) {
      update.mutate(makeUpdateBody(values, membership), {
        onSuccess: () => {
          notifySuccess(tm('success.updated'))
          onOpenChange(false)
        },
        onError: (error) => notifyMembershipError(error, tm, tCommon),
      })
      return
    }

    create.mutate(makeCreateBody(values), {
      onSuccess: () => {
        notifySuccess(tm('success.created'))
        onOpenChange(false)
      },
      onError: (error) => notifyMembershipError(error, tm, tCommon),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tDialog('editTitle') : tDialog('createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? tDialog('editDescription') : tDialog('createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {plansError ? (
              <ErrorState dense error={plansError} onRetry={onRetryPlans} />
            ) : null}

            {!plansError && !plansLoading && plans.length === 0 ? (
              <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {tm('states.noActivePlans')}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="billingPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tDialog('fields.plan')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={plansLoading || Boolean(plansError)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={tDialog('fields.planPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {planLabel(plan, (frequency) =>
                            t(FREQUENCY_LABEL_KEYS[frequency] as Parameters<typeof t>[0])
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="startedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.startedAt')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextBillingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.nextBillingDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.status')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EDITABLE_STATUS_VALUES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(STATUS_LABEL_KEYS[status] as Parameters<typeof t>[0])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="freezeStartAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.freezeStartAt')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freezeEndAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.freezeEndAt')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {tDialog('fields.freezeEndAtHint')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.discountType')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">
                          {tDialog('fields.discountNone')}
                        </SelectItem>
                        <SelectItem value="PERCENTAGE">
                          {t(DISCOUNT_LABEL_KEYS.PERCENTAGE)}
                        </SelectItem>
                        <SelectItem value="FIXED">
                          {t(DISCOUNT_LABEL_KEYS.FIXED)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.discountValue')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder={tDialog('fields.discountValuePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tDialog('fields.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={tDialog('fields.notesPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {tCommon('actions.cancel')}
              </Button>
              <BgAnimateButton
                type="submit"
                className="h-10"
                disabled={
                  isPending ||
                  plansLoading ||
                  Boolean(plansError) ||
                  plans.length === 0
                }
              >
                {isPending
                  ? tm('actions.submitting')
                  : isEdit
                    ? tDialog('actions.update')
                    : tDialog('actions.create')}
              </BgAnimateButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function FreezeMembershipDialog({
  open,
  onOpenChange,
  membership,
  mutation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  membership: StudentMembershipResponse
  mutation: ReturnType<typeof useUpdateStudentMembership>
}) {
  const tm = useTranslations('billing.studentMembership')
  const tDialog = useTranslations('billing.studentMembership.dialog')
  const tCommon = useTranslations('common')
  const messages = useMembershipMessages()
  const schema = useMemo(() => makeStudentMembershipSchema(messages), [messages])
  const form = useForm<StudentMembershipFormValues>({
    resolver: standardSchemaResolver(
      schema
    ) as Resolver<StudentMembershipFormValues>,
    defaultValues: membershipToFormValues(membership),
  })
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      form.reset({
        ...membershipToFormValues(membership),
        status: 'FROZEN',
        freezeStartAt:
          dateInputValue(membership.freezeStartAt) ||
          dateInputValue(new Date().toISOString()),
      })
    }
    wasOpenRef.current = open
  }, [form, membership, open])

  const onSubmit = (values: StudentMembershipFormValues) => {
    mutation.mutate(
      {
        status: 'FROZEN',
        freezeStartAt: values.freezeStartAt,
        ...(values.freezeEndAt ? { freezeEndAt: values.freezeEndAt } : {}),
      },
      {
        onSuccess: () => {
          notifySuccess(tm('success.frozen'))
          onOpenChange(false)
        },
        onError: (error) => notifyMembershipError(error, tm, tCommon),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tDialog('freezeTitle')}</DialogTitle>
          <DialogDescription>{tDialog('freezeDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="freezeStartAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.freezeStartAt')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freezeEndAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.freezeEndAt')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {tDialog('fields.freezeEndAtHint')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {tCommon('actions.cancel')}
              </Button>
              <BgAnimateButton
                type="submit"
                className="h-10"
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? tm('actions.submitting')
                  : tDialog('actions.freeze')}
              </BgAnimateButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CancelMembershipDialog({
  open,
  onOpenChange,
  mutation,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mutation: ReturnType<typeof useUpdateStudentMembership>
}) {
  const tm = useTranslations('billing.studentMembership')
  const tDialog = useTranslations('billing.studentMembership.dialog')
  const tCommon = useTranslations('common')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tDialog('cancelTitle')}</DialogTitle>
          <DialogDescription>{tDialog('cancelDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {tCommon('actions.cancel')}
          </Button>
          <BgAnimateButton
            type="button"
            className="h-10"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate(
                { status: 'CANCELED' },
                {
                  onSuccess: () => {
                    notifySuccess(tm('success.canceled'))
                    onOpenChange(false)
                  },
                  onError: (error) =>
                    notifyMembershipError(error, tm, tCommon),
                }
              )
            }}
          >
            {mutation.isPending
              ? tm('actions.submitting')
              : tDialog('actions.cancel')}
          </BgAnimateButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function useMembershipMessages() {
  const tm = useTranslations('billing.studentMembership')
  return useMemo(
    () => ({
      billingPlanRequired: tm('errors.billingPlanRequired'),
      startedAtInvalid: tm('errors.startedAtInvalid'),
      nextBillingDateInvalid: tm('errors.nextBillingDateInvalid'),
      freezeStartRequired: tm('errors.freezeStartRequired'),
      freezeDateInvalid: tm('errors.freezeDateInvalid'),
      discountValueInvalid: tm('errors.discountValueInvalid'),
      discountPercentageMax: tm('errors.discountPercentageMax'),
    }),
    [tm]
  )
}

function notifyMembershipError(
  error: unknown,
  tm: ReturnType<typeof useTranslations<'billing.studentMembership'>>,
  tCommon: ReturnType<typeof useTranslations<'common'>>
) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      notifyError(tm('errors.forbidden'), error)
      return
    }
    if (error.status === 404) {
      notifyError(tm('errors.notFound'), error)
      return
    }
    if (error.status === 409) {
      notifyError(tm('errors.conflict'), error)
      return
    }
  }
  notifyError(tCommon('error.generic'), error)
}

function updateMembershipStatus(
  mutation: ReturnType<typeof useUpdateStudentMembership>,
  tm: ReturnType<typeof useTranslations<'billing.studentMembership'>>,
  success:
    | 'PAUSED'
    | 'ACTIVE'
    | 'clearDiscount'
    | 'clearFreeze',
  body: UpdateStudentMembershipRequest
) {
  const successKey =
    success === 'PAUSED'
      ? 'success.paused'
      : success === 'ACTIVE'
        ? 'success.reactivated'
        : success === 'clearDiscount'
          ? 'success.discountCleared'
          : 'success.freezeCleared'
  mutation.mutate(body, {
    onSuccess: () => notifySuccess(tm(successKey)),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) {
        notifyError(tm('errors.forbidden'), error)
        return
      }
      if (error instanceof ApiError && error.status === 404) {
        notifyError(tm('errors.notFound'), error)
        return
      }
      if (error instanceof ApiError && error.status === 409) {
        notifyError(tm('errors.conflict'), error)
        return
      }
      notifyError(tm('errors.conflict'), error)
    },
  })
}

function MembershipSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="space-y-1">
          <div className="h-3 w-24 animate-pulse rounded-md bg-muted/70" />
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}
