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
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import type {
  BillingChargeListItem,
  PaymentMutationAmount,
} from '@/lib/api/billing.types'
import { useRecordManualStudentPayment } from '@/lib/hooks'
import {
  makeManualPaymentSchema,
  MANUAL_PAYMENT_METHOD_VALUES,
  type ManualPaymentFormValues,
} from '@/lib/schemas/manual-payment'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

interface ManualPaymentDialogProps {
  orgId: string
  charge: BillingChargeListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const METHOD_LABEL_KEYS = {
  CASH: 'paymentMethod.CASH',
  BANK_TRANSFER: 'paymentMethod.BANK_TRANSFER',
  DEBIT_CARD: 'paymentMethod.DEBIT_CARD',
  CREDIT_CARD: 'paymentMethod.CREDIT_CARD',
  OTHER: 'paymentMethod.OTHER',
} as const satisfies Record<(typeof MANUAL_PAYMENT_METHOD_VALUES)[number], string>

function toMutationAmount(value: string): PaymentMutationAmount {
  return value.trim() as PaymentMutationAmount
}

function defaultsForCharge(charge: BillingChargeListItem): ManualPaymentFormValues {
  return {
    grossAmount: charge.outstandingAmount,
    netAmount: charge.outstandingAmount,
    method: 'CASH',
    description: '',
    notes: '',
  }
}

export function ManualPaymentDialog({
  orgId,
  charge,
  open,
  onOpenChange,
  onSuccess,
}: ManualPaymentDialogProps) {
  const t = useTranslations('billing')
  const tDialog = useTranslations('billing.charges.manualPayment')
  const tCommon = useTranslations('common')
  const mutation = useRecordManualStudentPayment(orgId, charge.studentId)

  const messages = useMemo(
    () => ({
      grossAmountInvalid: tDialog('errors.grossAmountInvalid'),
      netAmountInvalid: tDialog('errors.netAmountInvalid'),
    }),
    [tDialog],
  )
  const schema = useMemo(() => makeManualPaymentSchema(messages), [messages])

  const form = useForm<ManualPaymentFormValues>({
    resolver: standardSchemaResolver(
      schema,
    ) as Resolver<ManualPaymentFormValues>,
    defaultValues: defaultsForCharge(charge),
  })

  useEffect(() => {
    if (!open) return
    form.reset(defaultsForCharge(charge))
  }, [open, charge, form])

  const onSubmit = (values: ManualPaymentFormValues) => {
    mutation.mutate(
      {
        billingChargeId: charge.id,
        grossAmount: toMutationAmount(values.grossAmount),
        netAmount: toMutationAmount(values.netAmount),
        currency: charge.currency,
        method: values.method,
        status: 'APPROVED',
        ...(values.description?.trim()
          ? { description: values.description.trim() }
          : {}),
        ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
      },
      {
        onSuccess: () => {
          notifySuccess(tDialog('success'))
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            notifyError(tDialog('errors.forbidden'), error)
            return
          }
          notifyError(tCommon('error.generic'), error)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tDialog('title')}</DialogTitle>
          <DialogDescription>{tDialog('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="grossAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.grossAmount')}</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="netAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.netAmount')}</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>{tDialog('fields.currency')}</FormLabel>
                <FormControl>
                  <Input value={charge.currency} disabled readOnly />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.method')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MANUAL_PAYMENT_METHOD_VALUES.map((method) => (
                          <SelectItem key={method} value={method}>
                            {t(METHOD_LABEL_KEYS[method] as Parameters<typeof t>[0])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tDialog('fields.description')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tDialog('fields.descriptionPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? tDialog('actions.submitting')
                  : tDialog('actions.submit')}
              </BgAnimateButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
