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
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentMutationAmount,
  type PaymentStatus,
} from '@/lib/api/billing.types'
import { useRecordGeneralIncome } from '@/lib/hooks'
import {
  GENERAL_INCOME_DEFAULTS,
  makeGeneralIncomeSchema,
  type GeneralIncomeFormValues,
} from '@/lib/schemas/general-income'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

interface GeneralIncomeDialogProps {
  orgId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const METHOD_LABEL_KEYS = {
  CASH: 'paymentMethod.CASH',
  BANK_TRANSFER: 'paymentMethod.BANK_TRANSFER',
  DEBIT_CARD: 'paymentMethod.DEBIT_CARD',
  CREDIT_CARD: 'paymentMethod.CREDIT_CARD',
  MERCADO_PAGO: 'paymentMethod.MERCADO_PAGO',
  TAKENOS: 'paymentMethod.TAKENOS',
  OTHER: 'paymentMethod.OTHER',
} as const satisfies Record<PaymentMethod, string>

const STATUS_LABEL_KEYS = {
  PENDING: 'paymentStatus.PENDING',
  APPROVED: 'paymentStatus.APPROVED',
  REJECTED: 'paymentStatus.REJECTED',
  CANCELED: 'paymentStatus.CANCELED',
  FAILED: 'paymentStatus.FAILED',
  REFUNDED: 'paymentStatus.REFUNDED',
  CHARGED_BACK: 'paymentStatus.CHARGED_BACK',
} as const satisfies Record<PaymentStatus, string>

function toPaymentAmount(value: string): PaymentMutationAmount {
  return value.trim() as PaymentMutationAmount
}

export function GeneralIncomeDialog({
  orgId,
  branchId,
  open,
  onOpenChange,
}: GeneralIncomeDialogProps) {
  const t = useTranslations('billing')
  const tDialog = useTranslations('billing.payments.generalIncome')
  const tCommon = useTranslations('common')
  const mutation = useRecordGeneralIncome(orgId, branchId)

  const messages = useMemo(
    () => ({
      grossAmountInvalid: tDialog('errors.grossAmountInvalid'),
      netAmountInvalid: tDialog('errors.netAmountInvalid'),
      currencyInvalid: tDialog('errors.currencyInvalid'),
    }),
    [tDialog],
  )
  const schema = useMemo(() => makeGeneralIncomeSchema(messages), [messages])

  const form = useForm<GeneralIncomeFormValues>({
    resolver: standardSchemaResolver(
      schema,
    ) as Resolver<GeneralIncomeFormValues>,
    defaultValues: GENERAL_INCOME_DEFAULTS,
  })

  useEffect(() => {
    if (open) form.reset(GENERAL_INCOME_DEFAULTS)
  }, [open, form])

  const onSubmit = (values: GeneralIncomeFormValues) => {
    const netAmount = values.netAmount?.trim()
    mutation.mutate(
      {
        grossAmount: toPaymentAmount(values.grossAmount),
        ...(netAmount ? { netAmount: toPaymentAmount(netAmount) } : {}),
        currency: values.currency.trim().toUpperCase(),
        method: values.method,
        status: values.status,
        ...(values.description?.trim()
          ? { description: values.description.trim() }
          : {}),
        ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
      },
      {
        onSuccess: () => {
          notifySuccess(tDialog('success'))
          onOpenChange(false)
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{tDialog('title')}</DialogTitle>
          <DialogDescription>{tDialog('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.currency')}</FormLabel>
                    <FormControl>
                      <Input
                        maxLength={3}
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
                        {PAYMENT_METHODS.map((method) => (
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
                        {PAYMENT_STATUSES.map((status) => (
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
