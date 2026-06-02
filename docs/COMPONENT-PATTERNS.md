# KURO — Component Patterns

Patrones de referencia para Fase 2.2+ (calendario operativo y forms en general).
Mantener estos patrones para no acumular deuda. Todo texto visible viene de i18n.

---

## 1. Form completo (react-hook-form + zod)

**Schema** — `lib/schemas/class-session.ts`:

```ts
import { z } from 'zod'

export const classSessionSchema = z
  .object({
    title: z.string().min(1),
    classType: z.enum([
      'GI', 'NO_GI', 'FUNDAMENTALS', 'ADVANCED', 'KIDS',
      'COMPETITION', 'OPEN_MAT', 'SEMINAR', 'PRIVATE',
    ]),
    scheduledDate: z.string(), // YYYY-MM-DD
    startAt: z.string(),       // ISO
    endAt: z.string(),         // ISO
    instructorMembershipId: z.string().optional(),
    capacity: z.number().int().positive().optional(),
  })
  .refine((v) => v.endAt > v.startAt, { path: ['endAt'] })

export type ClassSessionFormValues = z.infer<typeof classSessionSchema>
```

**Componente** — usa las primitives de `components/ui/form.tsx`:

```tsx
'use client'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useTranslations } from 'next-intl'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { classSessionSchema, type ClassSessionFormValues } from '@/lib/schemas/class-session'

export function ClassSessionForm({ onSubmit }: { onSubmit: (v: ClassSessionFormValues) => void }) {
  const t = useTranslations('calendar') // namespace de la pantalla
  const form = useForm<ClassSessionFormValues>({
    resolver: standardSchemaResolver(classSessionSchema),
    defaultValues: { title: '', classType: 'GI', /* ... */ },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('session.titleLabel')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {t('session.actions.save')}
        </Button>
      </form>
    </Form>
  )
}
```

Para fechas usar `<Popover>` + `<Calendar>`; para horarios `<TimePicker>`.

---

## 2. Mutation con optimistic update + rollback

Los **hooks de mutation son toast-free** (solo cache: optimistic + rollback +
invalidate). El **caller** maneja los toasts y el 409, con mensajes de dominio.

```ts
// Hook (lib/hooks/use-sessions.ts) — sin toasts, sin i18n:
export function useUpdateSession(sessionId: string) {
  const { orgId, branchId } = useCurrentContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (body: ClassSessionUpdateBody) =>
      classSessionsApi.update(orgId!, branchId!, sessionId, body),

    onMutate: async (body) => {
      const filter = { queryKey: ['class-calendar', orgId, branchId] }
      await qc.cancelQueries(filter)                    // 1. cancelar in-flight
      const snapshot = qc.getQueriesData(filter)        // 2. snapshot para rollback
      qc.setQueriesData(filter, (old) => patch(old, sessionId, body)) // 3. optimista
      return { snapshot }
    },

    onError: (_error, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)) // rollback
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['class-calendar', orgId, branchId] }),
  })
}
```

```tsx
// Caller (dialog) — toasts de dominio + matriz de errores:
const update = useUpdateSession(id)
const conflict = useConflictHandler()
const t = useTranslations('calendar.something')
const tc = useTranslations('common')

update.mutate(payload, {
  onSuccess: () => { notifySuccess(t('success')); onClose() },
  onError: (error) => {
    if (conflict.handle(error)) return                 // 409 → ConflictDialog
    if (error instanceof ApiError && error.status === 403)
      return notifyError(t('errors.forbidden'))
    notifyError(tc('error.generic'), error)            // 422/otros → genérico
  },
})
```

Reglas:
- El **snapshot** se devuelve desde `onMutate` y se usa en `onError` para rollback exacto.
- `onSettled` **siempre** invalida para reconciliar con el servidor (la fuente de verdad).
- El **toast sale del caller** (mensajes de dominio i18n) vía `lib/utils/toast.ts`.
- Un **409 de conflicto NO dispara toast genérico**: `conflict.handle(error)` lo intercepta.

---

## 3. Conflict handling (409 CLASS_SESSION_CONFLICT)

El backend rechaza sesiones que solapan (instructor / filial / horario). Flujo:

```tsx
'use client'
import { useConflictHandler } from '@/lib/hooks/use-conflict-handler'
import { ConflictDialog } from '@/components/sessions/conflict-dialog'
import { useCreateSession } from '@/lib/hooks/use-sessions'

function CreateClassButton() {
  const conflict = useConflictHandler()
  const create = useCreateSession()

  const onSubmit = (values) =>
    create.mutate(values, {
      // si era un conflict, lo captura y abre el dialog; si no, devuelve false
      onError: (error) => conflict.handle(error),
    })

  return (
    <>
      {/* ...form... */}
      <ConflictDialog conflict={conflict.conflict} onDismiss={conflict.dismiss} />
    </>
  )
}
```

- `useConflictHandler()` → `{ conflict, isConflict, handle(error), dismiss }`.
- `<ConflictDialog>` muestra el tipo (i18n `calendar.conflict.type.*`) y la clase que
  choca (cargada con `useSession(conflict.classSessionId)`), con acción “Ver clase existente”.
- Tipos de conflicto reales del backend: `INSTRUCTOR_OVERLAP`, `BRANCH_OVERLAP`,
  `SCHEDULE_OVERLAP`.

---

## 4. Toasts

```ts
import { notifySuccess, notifyError, notifyInfo } from '@/lib/utils/toast'
import { useTranslations } from 'next-intl'

const t = useTranslations('common')
notifySuccess(t('success.created'))
notifyError(t('error.generic'), error) // adjunta request-id si es ApiError
```

El `<Toaster />` se monta una sola vez en `Providers` (theme-aware). No montarlo de nuevo.
