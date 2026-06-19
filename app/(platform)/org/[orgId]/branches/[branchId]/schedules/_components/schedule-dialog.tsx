'use client'

/**
 * ScheduleDialog — crear / editar un class-schedule (template recurrente).
 *
 * Un solo componente con `mode: 'create' | 'edit'` (no se duplica el form).
 * El usuario edita horas en HH:mm; se mandan como HH:mm:ss y el `timezone`
 * sale del branch context (no editable). El 409 CLASS_SESSION_CONFLICT se
 * maneja con <ConflictDialog> superpuesto (mismo pattern que SessionDialog).
 *
 * El switch "Activo" (solo en edit) NO es parte del submit del form: dispara
 * una mutation inmediata — activar es directo; desactivar pide confirmación
 * con <DeactivateScheduleDialog> (decisión: NO cancela sesiones futuras).
 */
import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { BgAnimateButton } from '@/components/ui/bg-animate-button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'
import { ClassTypeChip } from '@/components/kuro'
import { PersonAvatar } from '@/components/common/person-avatar'
import { ApiError } from '@/lib/api/client'
import {
  useBranchInstructorCandidates,
  useClassSchedule,
  useConflictHandler,
  useCreateSchedule,
  useCurrentContext,
  useUpdateSchedule,
} from '@/lib/hooks'
import {
  makeCreateScheduleSchema,
  makeUpdateScheduleSchema,
  WEEKDAY_VALUES,
  type CreateScheduleFormValues,
} from '@/lib/schemas/schedule'
import { CLASS_TYPE_VALUES } from '@/lib/schemas/session'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import type {
  ClassScheduleCreateBody,
  ClassScheduleUpdateBody,
} from '@/lib/api/endpoints'
import type { ClassSchedule } from '@/lib/api/types'
import { ConflictDialog } from '@/components/sessions/conflict-dialog'
import { DeactivateScheduleDialog } from './deactivate-schedule-dialog'

type ScheduleDialogProps =
  | {
      mode: 'create'
      open: boolean
      onOpenChange: (open: boolean) => void
      onSuccess?: (schedule: ClassSchedule) => void
    }
  | {
      mode: 'edit'
      open: boolean
      onOpenChange: (open: boolean) => void
      scheduleId: string
      onSuccess?: (schedule: ClassSchedule) => void
    }

// El backend opera los horarios del schedule en formato HH:mm (NO HH:mm:ss
// pese a lo que sugiere el ejemplo del contrato): el POST/PATCH esperan
// "14:00" y la respuesta devuelve "14:00". Mandar segundos → 400.
const toHM = (time: string) => time.slice(0, 5)

function scheduleToFormValues(s: ClassSchedule): CreateScheduleFormValues {
  const upper = String(s.classType).toUpperCase()
  const classType = (CLASS_TYPE_VALUES as readonly string[]).includes(upper)
    ? (upper as CreateScheduleFormValues['classType'])
    : 'GI'
  return {
    title: s.title,
    classType,
    instructorMembershipId: s.instructorMembershipId ?? '',
    weekday: s.weekday,
    startTime: toHM(s.startTime),
    endTime: toHM(s.endTime),
    capacity: s.capacity ?? undefined,
    isActive: s.isActive,
  }
}

const CREATE_DEFAULTS: CreateScheduleFormValues = {
  title: '',
  classType: 'GI',
  instructorMembershipId: '',
  weekday: 'MONDAY',
  startTime: '',
  endTime: '',
  capacity: undefined,
  isActive: true,
}

export function ScheduleDialog(props: ScheduleDialogProps) {
  const { mode, open, onOpenChange } = props
  const isEdit = mode === 'edit'
  const scheduleId = props.mode === 'edit' ? props.scheduleId : ''

  const tCreate = useTranslations('schedules.createDialog')
  const tEdit = useTranslations('schedules.editDialog')
  const tDeact = useTranslations('schedules.editDialog.deactivate')
  const tWeekday = useTranslations('schedules.weekdays')
  const tCommon = useTranslations('common')
  const { branchTimezone } = useCurrentContext()

  const instructors = useBranchInstructorCandidates()
  const create = useCreateSchedule()
  const update = useUpdateSchedule(scheduleId)
  const activate = useUpdateSchedule(scheduleId)
  const scheduleQuery = useClassSchedule(isEdit ? scheduleId : '')
  const conflict = useConflictHandler()

  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const schedule = isEdit ? scheduleQuery.data : undefined

  const messages = useMemo(
    () => ({
      titleRequired: tCreate('errors.titleRequired'),
      instructorRequired: tCreate('errors.instructorRequired'),
      endBeforeStart: tCreate('errors.endBeforeStart'),
    }),
    [tCreate],
  )

  const schema = useMemo(
    () =>
      isEdit
        ? makeUpdateScheduleSchema(messages)
        : makeCreateScheduleSchema(messages),
    [isEdit, messages],
  )

  const form = useForm<CreateScheduleFormValues>({
    resolver: standardSchemaResolver(
      schema,
    ) as Resolver<CreateScheduleFormValues>,
    defaultValues: CREATE_DEFAULTS,
  })

  // Pre-llenado / reset al abrir.
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (schedule) form.reset(scheduleToFormValues(schedule))
    } else {
      form.reset(CREATE_DEFAULTS)
    }
  }, [open, isEdit, schedule, form])

  const candidates = instructors.data?.items ?? []
  const noInstructors = instructors.isSuccess && candidates.length === 0
  const isPending = isEdit ? update.isPending : create.isPending

  const handleMutationError = (error: unknown) => {
    if (conflict.handle(error)) return
    if (error instanceof ApiError && error.status === 403) {
      notifyError(isEdit ? tEdit('errors.forbidden') : tCreate('errors.forbidden'))
      return
    }
    notifyError(tCommon('error.generic'), error)
  }

  const onSubmit = (values: CreateScheduleFormValues) => {
    const onSuccess = (result: ClassSchedule) => {
      notifySuccess(isEdit ? tEdit('success') : tCreate('success'))
      onOpenChange(false)
      props.onSuccess?.(result)
    }

    if (isEdit) {
      // PATCH solo de campos modificados (el switch "Activo" va aparte).
      const dirty = form.formState.dirtyFields
      const body: ClassScheduleUpdateBody = {}
      if (dirty.title) body.title = values.title
      if (dirty.classType) body.classType = values.classType
      if (dirty.instructorMembershipId)
        body.instructorMembershipId = values.instructorMembershipId
      if (dirty.weekday) body.weekday = values.weekday
      if (dirty.startTime) body.startTime = values.startTime
      if (dirty.endTime) body.endTime = values.endTime
      if (dirty.capacity) body.capacity = values.capacity ?? null
      update.mutate(body, { onSuccess, onError: handleMutationError })
    } else {
      const body: ClassScheduleCreateBody = {
        instructorMembershipId: values.instructorMembershipId,
        title: values.title,
        classType: values.classType,
        weekday: values.weekday,
        startTime: values.startTime,
        endTime: values.endTime,
        timezone: branchTimezone,
        isActive: values.isActive,
        ...(values.capacity != null ? { capacity: values.capacity } : {}),
      }
      create.mutate(body, { onSuccess, onError: handleMutationError })
    }
  }

  const handleActivate = () => {
    activate.mutate(
      { isActive: true },
      {
        onSuccess: () => notifySuccess(tDeact('activateSuccess')),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 403) {
            notifyError(tDeact('forbidden'))
            return
          }
          notifyError(tCommon('error.generic'), error)
        },
      },
    )
  }

  const showLoadingOrError = isEdit && !schedule

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? tEdit('title') : tCreate('title')}
            </DialogTitle>
            <DialogDescription>
              {isEdit ? tEdit('description') : tCreate('description')}
            </DialogDescription>
          </DialogHeader>

          {showLoadingOrError ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              {scheduleQuery.isError ? (
                tCommon('error.generic')
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tEdit('loading')}
                </>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Fila 1 — Título */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCreate('fields.title')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tCreate('fields.titlePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fila 2 — Tipo de clase + Instructor */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="classType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCreate('fields.classType')}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={tCreate(
                                  'fields.classTypePlaceholder',
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CLASS_TYPE_VALUES.map((value) => (
                              <SelectItem key={value} value={value}>
                                <ClassTypeChip classType={value} variant="dot" />
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
                    name="instructorMembershipId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCreate('fields.instructor')}</FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                          disabled={instructors.isLoading || noInstructors}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  instructors.isLoading
                                    ? tCommon('loading.default')
                                    : noInstructors
                                      ? tCreate('fields.instructorEmpty')
                                      : tCreate('fields.instructorPlaceholder')
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {candidates.map((c) => (
                              <SelectItem
                                key={c.membershipId}
                                value={c.membershipId}
                              >
                                <span className="inline-flex min-w-0 items-center gap-2">
                                  <PersonAvatar
                                    avatarUrl={
                                      c.avatarUrl ?? c.user?.avatarUrl
                                    }
                                    displayName={c.displayName}
                                    firstName={c.user?.firstName}
                                    lastName={c.user?.lastName}
                                    size="xs"
                                  />
                                  <span className="truncate">
                                    {c.displayName}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fila 3 — Día + Hora inicio + Hora fin */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="weekday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCreate('fields.weekday')}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={tCreate('fields.weekdayPlaceholder')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WEEKDAY_VALUES.map((value) => (
                              <SelectItem key={value} value={value}>
                                {tWeekday(value)}
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
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{tCreate('fields.startTime')}</FormLabel>
                        <FormControl>
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                            minuteStep={15}
                            aria-label={tCreate('fields.startTime')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{tCreate('fields.endTime')}</FormLabel>
                        <FormControl>
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                            minuteStep={15}
                            aria-label={tCreate('fields.endTime')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Fila 4 — Capacidad */}
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tCreate('fields.capacity')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          inputMode="numeric"
                          placeholder={tCreate('fields.capacityPlaceholder')}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fila 5 — Activo (solo edit; mutation inmediata, no submit) */}
                {isEdit && schedule && (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label htmlFor="schedule-active" className="cursor-pointer">
                      {tEdit('active')}
                    </Label>
                    <Switch
                      id="schedule-active"
                      checked={schedule.isActive}
                      disabled={activate.isPending}
                      onCheckedChange={(next) => {
                        if (next) handleActivate()
                        else setDeactivateOpen(true)
                      }}
                    />
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                  >
                    {isEdit
                      ? tEdit('actions.cancel')
                      : tCreate('actions.cancel')}
                  </Button>
                  <BgAnimateButton
                    type="submit"
                    className="h-10"
                    disabled={isPending || (isEdit && !form.formState.isDirty)}
                  >
                    {isPending
                      ? isEdit
                        ? tEdit('actions.submitting')
                        : tCreate('actions.submitting')
                      : isEdit
                        ? tEdit('actions.submit')
                        : tCreate('actions.submit')}
                  </BgAnimateButton>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmación de desactivación desde el switch "Activo". */}
      {isEdit && scheduleId && (
        <DeactivateScheduleDialog
          scheduleId={scheduleId}
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
        />
      )}

      {/* 409 superpuesto. */}
      <ConflictDialog
        conflict={conflict.conflict}
        onDismiss={conflict.dismiss}
        onViewExisting={() => onOpenChange(false)}
      />
    </>
  )
}
