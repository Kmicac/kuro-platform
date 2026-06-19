'use client'

/**
 * SessionDialog — crear / editar una sesión de clase ÚNICA (no recurrente).
 *
 * Un solo componente con `mode: 'create' | 'edit'` (no se duplica el form).
 * El usuario edita en hora local de la filial; se convierte a ISO UTC con
 * `branchTimezone` (date-fns-tz). El 409 CLASS_SESSION_CONFLICT se maneja con
 * <ConflictDialog> superpuesto. En edit: pre-llena, gatea por isDirty, y
 * bloquea sesiones CANCELED/COMPLETED.
 */
import { useEffect, useMemo } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
// zod v4 implementa Standard Schema → resolver agnóstico de versión.
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useNow, useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { CalendarDays, Loader2 } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { BgAnimateButton } from '@/components/ui/bg-animate-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { TimePicker } from '@/components/ui/time-picker'
import { ClassTypeChip } from '@/components/kuro'
import { PersonAvatar } from '@/components/common/person-avatar'
import { ApiError } from '@/lib/api/client'
import {
  extractConflict,
  useBranchInstructorCandidates,
  useConflictHandler,
  useCreateSession,
  useCurrentContext,
  useSession,
  useUpdateSession,
} from '@/lib/hooks'
import {
  CLASS_TYPE_VALUES,
  makeCreateSessionSchema,
  makeUpdateSessionSchema,
  type CreateSessionFormValues,
} from '@/lib/schemas/session'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import type { ClassSessionUpdateBody } from '@/lib/api/endpoints'
import type { ClassSessionDetail } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { ConflictDialog } from './conflict-dialog'

type SessionDialogProps =
  | {
      mode: 'create'
      open: boolean
      onOpenChange: (open: boolean) => void
      defaultDate?: Date
      onSuccess?: (session: ClassSessionDetail) => void
    }
  | {
      mode: 'edit'
      open: boolean
      onOpenChange: (open: boolean) => void
      sessionId: string
      onSuccess?: (session: ClassSessionDetail) => void
    }

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`

function sessionToFormValues(
  s: ClassSessionDetail,
  tz: string,
): CreateSessionFormValues {
  const upper = String(s.classType).toUpperCase()
  const classType = (CLASS_TYPE_VALUES as readonly string[]).includes(upper)
    ? (upper as CreateSessionFormValues['classType'])
    : 'GI'
  return {
    title: s.title,
    classType,
    instructorMembershipId: s.instructor?.membershipId ?? '',
    scheduledDate: s.scheduledDate.slice(0, 10),
    startTime: formatInTimeZone(new Date(s.startAt), tz, 'HH:mm'),
    endTime: formatInTimeZone(new Date(s.endAt), tz, 'HH:mm'),
    capacity: s.capacity?.max,
    notes: s.notes ?? '',
  }
}

export function SessionDialog(props: SessionDialogProps) {
  const { mode, open, onOpenChange } = props
  const isEdit = mode === 'edit'
  const sessionId = props.mode === 'edit' ? props.sessionId : ''
  const defaultDate = props.mode === 'create' ? props.defaultDate : undefined

  const tCreate = useTranslations('calendar.createDialog')
  const tEdit = useTranslations('calendar.editDialog')
  const tCommon = useTranslations('common')
  const now = useNow()
  const { branchTimezone } = useCurrentContext()

  const instructors = useBranchInstructorCandidates()
  const create = useCreateSession()
  const update = useUpdateSession(sessionId)
  const sessionQuery = useSession(isEdit ? sessionId : '')
  const conflict = useConflictHandler()

  const session = isEdit ? sessionQuery.data : undefined
  const notEditableReason = session
    ? session.status === 'CANCELED'
      ? ('canceled' as const)
      : session.status === 'COMPLETED'
        ? ('completed' as const)
        : null
    : null
  const isNotEditable = isEdit && notEditableReason !== null

  // Hoy en la timezone de la filial → bloquea fechas pasadas.
  const minDate = formatInTimeZone(now, branchTimezone, 'yyyy-MM-dd')
  const minDateObj = new Date(`${minDate}T00:00:00`)

  const messages = useMemo(
    () => ({
      titleRequired: tCreate('errors.titleRequired'),
      instructorRequired: tCreate('errors.instructorRequired'),
      dateInPast: tCreate('errors.dateInPast'),
      endBeforeStart: tCreate('errors.endBeforeStart'),
    }),
    [tCreate],
  )

  const schema = useMemo(
    () =>
      isEdit
        ? makeUpdateSessionSchema({ minDate, messages })
        : makeCreateSessionSchema({ minDate, messages }),
    [isEdit, minDate, messages],
  )

  const createDefaults = useMemo<CreateSessionFormValues>(
    () => ({
      title: '',
      classType: 'GI',
      instructorMembershipId: '',
      scheduledDate: defaultDate ? toISODate(defaultDate) : '',
      startTime: '',
      endTime: '',
      capacity: undefined,
      notes: '',
    }),
    [defaultDate],
  )

  const form = useForm<CreateSessionFormValues>({
    // El form siempre llega completo (create: el usuario; edit: pre-llenado),
    // así que el resolver de update (opcional) se castea al tipo full.
    resolver: standardSchemaResolver(schema) as Resolver<CreateSessionFormValues>,
    defaultValues: createDefaults,
  })

  // Pre-llenado / reset al abrir.
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (session) form.reset(sessionToFormValues(session, branchTimezone))
    } else {
      form.reset(createDefaults)
    }
  }, [open, isEdit, session, createDefaults, branchTimezone, form])

  const candidates = instructors.data?.items ?? []
  const noInstructors = instructors.isSuccess && candidates.length === 0
  const isPending = isEdit ? update.isPending : create.isPending

  const successMsg = isEdit ? tEdit('success') : tCreate('success')
  const forbiddenMsg = isEdit ? tEdit('forbidden') : tCreate('errors.forbidden')

  const handleMutationError = (error: unknown) => {
    // Defensa self-conflict (edit): si choca consigo mismo, ignorar (no debería
    // pasar — el backend excluye la sesión editada de la detección de overlap).
    if (isEdit) {
      const c = extractConflict(error)
      if (c && c.classSessionId === sessionId) return
    }
    if (conflict.handle(error)) return
    if (error instanceof ApiError && error.status === 403) {
      notifyError(forbiddenMsg)
      return
    }
    notifyError(tCommon('error.generic'), error)
  }

  const onSubmit = (values: CreateSessionFormValues) => {
    const onSuccess = (session: ClassSessionDetail) => {
      notifySuccess(successMsg)
      onOpenChange(false)
      props.onSuccess?.(session)
    }

    if (isEdit) {
      // PATCH: solo los campos modificados (dirtyFields).
      const dirty = form.formState.dirtyFields
      const body: ClassSessionUpdateBody = {}
      if (dirty.title) body.title = values.title
      if (dirty.classType) body.classType = values.classType
      if (dirty.instructorMembershipId)
        body.instructorMembershipId = values.instructorMembershipId
      if (dirty.capacity && values.capacity != null)
        body.capacity = values.capacity
      if (dirty.notes) body.notes = values.notes ?? ''
      if (dirty.scheduledDate || dirty.startTime || dirty.endTime) {
        body.scheduledDate = values.scheduledDate
        body.startAt = fromZonedTime(
          `${values.scheduledDate}T${values.startTime}:00`,
          branchTimezone,
        ).toISOString()
        body.endAt = fromZonedTime(
          `${values.scheduledDate}T${values.endTime}:00`,
          branchTimezone,
        ).toISOString()
      }
      update.mutate(body, { onSuccess, onError: handleMutationError })
    } else {
      const startAt = fromZonedTime(
        `${values.scheduledDate}T${values.startTime}:00`,
        branchTimezone,
      ).toISOString()
      const endAt = fromZonedTime(
        `${values.scheduledDate}T${values.endTime}:00`,
        branchTimezone,
      ).toISOString()
      create.mutate(
        {
          title: values.title,
          classType: values.classType,
          instructorMembershipId: values.instructorMembershipId,
          scheduledDate: values.scheduledDate,
          startAt,
          endAt,
          ...(values.capacity != null ? { capacity: values.capacity } : {}),
          ...(values.notes ? { notes: values.notes } : {}),
        },
        { onSuccess, onError: handleMutationError },
      )
    }
  }

  const showLoadingOrError = isEdit && !session

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? tEdit('title') : tCreate('title')}</DialogTitle>
            <DialogDescription>
              {isEdit ? tEdit('description') : tCreate('description')}
            </DialogDescription>
          </DialogHeader>

          {showLoadingOrError ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              {sessionQuery.isError ? (
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {isNotEditable && notEditableReason && (
                  <div
                    role="alert"
                    className="surface-warning rounded-lg border p-3 text-sm"
                  >
                    {tEdit(`notEditable.${notEditableReason}`)}
                  </div>
                )}

                <fieldset
                  disabled={isNotEditable}
                  className="space-y-4 disabled:opacity-60"
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
                                  <ClassTypeChip
                                    classType={value}
                                    variant="dot"
                                  />
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

                  {/* Fila 3 — Fecha + Hora inicio + Hora fin */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{tCreate('fields.scheduledDate')}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    'justify-start gap-2 font-normal',
                                    !field.value && 'text-muted-foreground',
                                  )}
                                >
                                  <CalendarDays className="h-4 w-4" />
                                  {field.value
                                    ? format(
                                        new Date(`${field.value}T00:00:00`),
                                        'dd/MM/yyyy',
                                      )
                                    : tCreate('fields.scheduledDatePlaceholder')}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(`${field.value}T00:00:00`)
                                    : undefined
                                }
                                onSelect={(d) =>
                                  field.onChange(d ? toISODate(d) : '')
                                }
                                disabled={{ before: minDateObj }}
                                autoFocus
                              />
                            </PopoverContent>
                          </Popover>
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

                  {/* Fila 5 — Notas */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tCreate('fields.notes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder={tCreate('fields.notesPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                  >
                    {isEdit ? tEdit('actions.close') : tCreate('actions.cancel')}
                  </Button>
                  {!isNotEditable && (
                    <BgAnimateButton
                      type="submit"
                      className="h-10"
                      disabled={
                        isPending || (isEdit && !form.formState.isDirty)
                      }
                    >
                      {isPending
                        ? isEdit
                          ? tEdit('actions.submitting')
                          : tCreate('actions.submitting')
                        : isEdit
                          ? tEdit('actions.submit')
                          : tCreate('actions.submit')}
                    </BgAnimateButton>
                  )}
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* 409 superpuesto — al "ver clase existente" cierra también este dialog. */}
      <ConflictDialog
        conflict={conflict.conflict}
        onDismiss={conflict.dismiss}
        onViewExisting={() => onOpenChange(false)}
      />
    </>
  )
}
