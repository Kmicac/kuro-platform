# lib/schemas — Schemas de validación (Zod)

Schemas Zod por dominio para los forms de la plataforma. Un archivo por
dominio, p.ej. `class-session.ts`, `class-schedule.ts`, `attendance.ts`.

Convención (ver CLAUDE.md §"Forms y Mutations"):

```ts
// lib/schemas/class-session.ts
import { z } from 'zod'

export const classSessionSchema = z.object({
  title: z.string().min(1),
  classType: z.enum(['GI', 'NO_GI', /* ... */]),
  startAt: z.string(),
  endAt: z.string(),
  // ...
})

export type ClassSessionFormValues = z.infer<typeof classSessionSchema>
```

Se conectan al form con `standardSchemaResolver(schema)` (react-hook-form) —
zod v4 implementa Standard Schema. Los mensajes de error van a `<FormMessage>`,
así que deben venir traducidos (pasar i18n a una fábrica de schema; ver
`session.ts` → `makeCreateSessionSchema({ minDate, messages })`).

> Carpeta sin schemas todavía — se llenan al construir cada form (Fase 2.2.1+).
