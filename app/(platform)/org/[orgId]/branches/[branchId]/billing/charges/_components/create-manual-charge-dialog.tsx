'use client'

import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useTranslations } from 'next-intl'
import { Loader2, Search } from 'lucide-react'

import { ErrorState } from '@/components/shared'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import type {
  BillingChargeMutationAmount,
  CreateBillingChargeRequest,
} from '@/lib/api/billing.types'
import type { StudentListItem } from '@/lib/api/types'
import {
  useBranchStudents,
  useCreateBillingCharge,
  useDebouncedValue,
} from '@/lib/hooks'
import {
  makeManualChargeDefaults,
  makeManualChargeSchema,
  type ManualChargeFormValues,
} from '@/lib/schemas/manual-charge'
import { cn } from '@/lib/utils'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

const STUDENT_SEARCH_LIMIT = 20

interface CreateManualChargeDialogProps {
  orgId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function toChargeAmount(value: string): BillingChargeMutationAmount {
  return value.trim() as BillingChargeMutationAmount
}

function studentName(student: StudentListItem) {
  return [student.firstName, student.lastName].filter(Boolean).join(' ')
}

export function CreateManualChargeDialog({
  orgId,
  branchId,
  open,
  onOpenChange,
  onSuccess,
}: CreateManualChargeDialogProps) {
  const tDialog = useTranslations('billing.charges.createManual')
  const tCommon = useTranslations('common')
  const [query, setQuery] = useState('')
  const [selectedStudent, setSelectedStudent] =
    useState<StudentListItem | null>(null)
  const debouncedQuery = useDebouncedValue(query, 300)

  const messages = useMemo(
    () => ({
      studentRequired: tDialog('errors.studentRequired'),
      dueDateInvalid: tDialog('errors.dueDateInvalid'),
      amountInvalid: tDialog('errors.amountInvalid'),
      currencyInvalid: tDialog('errors.currencyInvalid'),
      periodDateInvalid: tDialog('errors.periodDateInvalid'),
    }),
    [tDialog],
  )
  const schema = useMemo(() => makeManualChargeSchema(messages), [messages])

  const form = useForm<ManualChargeFormValues>({
    resolver: standardSchemaResolver(
      schema,
    ) as Resolver<ManualChargeFormValues>,
    defaultValues: makeManualChargeDefaults(),
  })

  const mutation = useCreateBillingCharge(orgId, selectedStudent?.id ?? '')
  const studentsQuery = useBranchStudents(orgId, branchId, {
    q: debouncedQuery,
    limit: STUDENT_SEARCH_LIMIT,
    enabled: open,
  })

  const resetForm = () => {
    form.reset(makeManualChargeDefaults())
    setQuery('')
    setSelectedStudent(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  const students = studentsQuery.data?.items ?? []
  const searching = studentsQuery.isFetching && !studentsQuery.isLoading
  const trimmedQuery = debouncedQuery.trim()

  const selectStudent = (student: StudentListItem) => {
    setSelectedStudent(student)
    form.setValue('studentId', student.id, { shouldValidate: true })
  }

  const onSubmit = (values: ManualChargeFormValues) => {
    if (!selectedStudent) {
      form.setError('studentId', {
        type: 'manual',
        message: tDialog('errors.studentRequired'),
      })
      return
    }

    const periodStart = values.periodStart?.trim()
    const periodEnd = values.periodEnd?.trim()
    const description = values.description?.trim()
    const body: CreateBillingChargeRequest = {
      chargeType: 'MANUAL',
      dueDate: values.dueDate.trim(),
      amount: toChargeAmount(values.amount),
      currency: values.currency.trim().toUpperCase(),
      ...(periodStart ? { periodStart } : {}),
      ...(periodEnd ? { periodEnd } : {}),
      ...(description ? { description } : {}),
    }

    mutation.mutate(body, {
      onSuccess: () => {
        notifySuccess(tDialog('success'))
        onSuccess?.()
        handleOpenChange(false)
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 403) {
          notifyError(tDialog('errors.forbidden'), error)
          return
        }
        notifyError(tCommon('error.generic'), error)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tDialog('title')}</DialogTitle>
          <DialogDescription>{tDialog('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3 pb-1">
              <FormLabel>{tDialog('fields.student')}</FormLabel>
              <div className="relative">
                {searching ? (
                  <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tDialog('fields.studentSearchPlaceholder')}
                  className="pl-9"
                  aria-label={tDialog('fields.studentSearchPlaceholder')}
                />
              </div>

              <ScrollArea className="h-52 max-h-[32vh] overflow-hidden rounded-md border border-border">
                {studentsQuery.isError ? (
                  <div className="p-3">
                    <ErrorState
                      dense
                      error={studentsQuery.error}
                      onRetry={() => studentsQuery.refetch()}
                    />
                  </div>
                ) : studentsQuery.isLoading ? (
                  <div className="space-y-2 p-3">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-12 animate-pulse rounded-md bg-muted"
                      />
                    ))}
                  </div>
                ) : students.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {trimmedQuery
                      ? tDialog('states.noResultsQuery', {
                          query: trimmedQuery,
                        })
                      : tDialog('states.emptyStudents')}
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {students.map((student) => {
                      const selected = selectedStudent?.id === student.id
                      return (
                        <li key={student.id}>
                          <button
                            type="button"
                            className={cn(
                              'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors',
                              selected
                                ? 'bg-primary/10'
                                : 'hover:bg-muted/60',
                            )}
                            onClick={() => selectStudent(student)}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {studentName(student)}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {student.email ??
                                  student.phone ??
                                  tDialog('fields.studentNoContact')}
                              </span>
                            </span>
                            {selected ? (
                              <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                {tDialog('states.selected')}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </ScrollArea>
              {form.formState.errors.studentId?.message ? (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.studentId.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.amount')}</FormLabel>
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
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.dueDate')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.periodStart')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tDialog('fields.periodEnd')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
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
