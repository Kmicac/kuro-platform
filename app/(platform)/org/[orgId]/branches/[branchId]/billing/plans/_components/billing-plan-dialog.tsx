'use client'

import { useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useTranslations } from 'next-intl'

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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import {
  BILLING_FREQUENCY_VALUES,
  type BillingPlanMutationAmount,
  type BillingPlanResponse,
  type CreateBillingPlanRequest,
  type UpdateBillingPlanRequest,
} from '@/lib/api/billing.types'
import { useCreateBillingPlan, useUpdateBillingPlan } from '@/lib/hooks'
import {
  BILLING_PLAN_DEFAULTS,
  makeBillingPlanSchema,
  type BillingPlanFormValues,
} from '@/lib/schemas/billing-plan'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

type BillingPlanDialogProps =
  | {
      mode: 'create'
      orgId: string
      branchId: string
      open: boolean
      onOpenChange: (open: boolean) => void
    }
  | {
      mode: 'edit'
      orgId: string
      branchId: string
      open: boolean
      onOpenChange: (open: boolean) => void
      plan: BillingPlanResponse
    }

const FREQUENCY_LABEL_KEYS = {
  WEEKLY: 'billingFrequency.WEEKLY',
  MONTHLY: 'billingFrequency.MONTHLY',
  QUARTERLY: 'billingFrequency.QUARTERLY',
  YEARLY: 'billingFrequency.YEARLY',
  ONE_TIME: 'billingFrequency.ONE_TIME',
} as const

function planToFormValues(plan: BillingPlanResponse): BillingPlanFormValues {
  return {
    name: plan.name,
    description: plan.description ?? '',
    billingFrequency: plan.billingFrequency,
    amount: plan.amount,
    currency: plan.currency,
    enrollmentFeeAmount: plan.enrollmentFeeAmount ?? '0',
    isActive: plan.isActive,
  }
}

function normalizeDecimal(value: string): BillingPlanMutationAmount {
  return value.trim() as BillingPlanMutationAmount
}

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase()
}

function normalizeEnrollmentFee(
  value: string | undefined,
): BillingPlanMutationAmount {
  const trimmed = value?.trim()
  return (trimmed ? trimmed : '0') as BillingPlanMutationAmount
}

export function BillingPlanDialog(props: BillingPlanDialogProps) {
  const isEdit = props.mode === 'edit'
  const plan = isEdit ? props.plan : undefined
  const t = useTranslations('billing')
  const tDialog = useTranslations('billing.plans.dialog')
  const tCommon = useTranslations('common')

  const create = useCreateBillingPlan(props.orgId, props.branchId)
  const update = useUpdateBillingPlan(props.orgId, props.branchId, plan?.id ?? '')

  const messages = useMemo(
    () => ({
      nameRequired: tDialog('errors.nameRequired'),
      amountInvalid: tDialog('errors.amountInvalid'),
      currencyInvalid: tDialog('errors.currencyInvalid'),
      enrollmentFeeInvalid: tDialog('errors.enrollmentFeeInvalid'),
    }),
    [tDialog],
  )

  const schema = useMemo(() => makeBillingPlanSchema(messages), [messages])

  const form = useForm<BillingPlanFormValues>({
    resolver: standardSchemaResolver(
      schema,
    ) as Resolver<BillingPlanFormValues>,
    defaultValues: BILLING_PLAN_DEFAULTS,
  })

  useEffect(() => {
    if (!props.open) return
    form.reset(plan ? planToFormValues(plan) : BILLING_PLAN_DEFAULTS)
  }, [props.open, plan, form])

  const isPending = create.isPending || update.isPending

  const handleMutationError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 403) {
      notifyError(tDialog('errors.forbidden'))
      return
    }
    notifyError(tCommon('error.generic'), error)
  }

  const onSubmit = (values: BillingPlanFormValues) => {
    const onSuccess = () => {
      notifySuccess(
        isEdit ? tDialog('success.updated') : tDialog('success.created'),
      )
      props.onOpenChange(false)
    }

    if (isEdit) {
      const dirty = form.formState.dirtyFields
      const body: UpdateBillingPlanRequest = {}
      if (dirty.name) body.name = values.name.trim()
      if (dirty.description) body.description = values.description?.trim() ?? ''
      if (dirty.billingFrequency) body.billingFrequency = values.billingFrequency
      if (dirty.amount) body.amount = normalizeDecimal(values.amount)
      if (dirty.currency) body.currency = normalizeCurrency(values.currency)
      if (dirty.enrollmentFeeAmount) {
        body.enrollmentFeeAmount = normalizeEnrollmentFee(
          values.enrollmentFeeAmount,
        )
      }
      if (dirty.isActive) body.isActive = values.isActive

      update.mutate(body, { onSuccess, onError: handleMutationError })
      return
    }

    const description = values.description?.trim()
    const body: CreateBillingPlanRequest = {
      name: values.name.trim(),
      ...(description ? { description } : {}),
      billingFrequency: values.billingFrequency,
      amount: normalizeDecimal(values.amount),
      currency: normalizeCurrency(values.currency),
      enrollmentFeeAmount: normalizeEnrollmentFee(values.enrollmentFeeAmount),
      isActive: values.isActive,
    }
    create.mutate(body, { onSuccess, onError: handleMutationError })
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-xl">
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tDialog('fields.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tDialog('fields.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tDialog('fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={tDialog('fields.descriptionPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="billingFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.frequency')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={tDialog('fields.frequencyPlaceholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BILLING_FREQUENCY_VALUES.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {t(FREQUENCY_LABEL_KEYS[frequency])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.currency')}</FormLabel>
                    <FormControl>
                      <Input
                        maxLength={3}
                        placeholder={tDialog('fields.currencyPlaceholder')}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.amount')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder={tDialog('fields.amountPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enrollmentFeeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.enrollmentFee')}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder={tDialog(
                          'fields.enrollmentFeePlaceholder',
                        )}
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
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <FormLabel className="cursor-pointer">
                    {tDialog('fields.isActive')}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
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
                onClick={() => props.onOpenChange(false)}
              >
                {tCommon('actions.cancel')}
              </Button>
              <BgAnimateButton
                type="submit"
                className="h-10"
                disabled={isPending || (isEdit && !form.formState.isDirty)}
              >
                {isPending
                  ? tDialog('actions.submitting')
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
