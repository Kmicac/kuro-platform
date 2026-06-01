# KURO — Build Playbook
## Cómo construir cada pantalla nueva sin acumular deuda técnica

---

## Fase 1 — Fundación arquitectónica (hacer UNA vez, ahora)

### 1.1 Capa de hooks — `lib/hooks/`

Actualmente cada componente llama `useQuery({ queryFn: () => endpoints.xxx() })` directamente.
Esto es deuda técnica: para cualquier cambio (refetch, cache, optimistic update, error handling)
hay que tocar N componentes. La regla: **un componente nunca importa de `lib/api/endpoints.ts`**,
siempre va a través de un hook.

```
lib/hooks/
├── use-organization.ts         # useOrganization(orgId)
├── use-branches.ts             # useBranches(orgId), useBranch(orgId, branchId), useTreeSummary(orgId)
├── use-students.ts             # useStudent, useBranchStudents, useInviteStudent (mutation)
├── use-intake.ts               # useIntakeRequests(orgId, branchId, filters)
├── use-action-summary.ts       # useActionSummary, useRiskRoster
├── use-training-calendar.ts    # useTrainingCalendar(orgId, params)
├── use-capabilities.ts         # useCapabilities(orgId)
└── use-current-context.ts      # combina auth store + URL params, helper compartido
```

Cada hook define: queryKey, staleTime, retry policy, error transformation, optimistic updates.
Los componentes solo consumen.

### 1.2 Componentes compartidos — `components/shared/`

Patrones que aparecen en CADA pantalla y deberían vivir en un solo lugar:

```
components/shared/
├── page-header.tsx       # título + subtítulo + breadcrumb + actions slot
├── kpi-card.tsx          # wrapper sobre TextureCard con estados loading/empty/error/forbidden
├── empty-state.tsx       # icono + título + mensaje + CTA opcional
├── error-state.tsx       # mensaje + requestId + botón retry
├── forbidden-state.tsx   # mensaje específico de 403
├── data-table.tsx        # tabla con sort/filter/pagination, slots de columnas
├── filter-chips.tsx      # chips de filtros tipo status
└── search-input.tsx      # buscador con debounce + cmd+k binding
```

Regla: si un patrón se usó 2 veces, extraer a `shared/`. La tercera no se discute.

### 1.3 Primitivas KURO — `components/kuro/`

Componentes con identidad de marca KURO no genéricos:

```
components/kuro/
├── logo.tsx              # ya existe
├── belt-badge.tsx        # chip con color real de faja + stripes visuales
├── role-badge.tsx        # chip por rol con styling consistente (MESTRE, ORG_ADMIN, etc.)
├── status-badge.tsx      # ACTIVE/INACTIVE/SUSPENDED con colores semánticos
├── student-avatar.tsx    # avatar con fallback a iniciales y color de faja en borde
└── intake-status-badge.tsx  # los 12 estados del enum IntakeStatus
```

---

## Fase 2 — Build playbook por pantalla

Cada pantalla nueva sigue estos 7 pasos en orden, sin excepciones.

### Paso 1 — Confirmar el contrato del API en Postman
Antes de escribir TypeScript, ver la respuesta REAL del endpoint. No asumir shapes desde el nombre.
Si la respuesta no cumple las expectativas, hablar con el backend ANTES de seguir.

### Paso 2 — Tipos + endpoint
- Agregar interface en `lib/api/types.ts`
- Agregar función en `lib/api/endpoints.ts`
- `pnpm tsc --noEmit` debe pasar

### Paso 3 — Hook con TanStack Query
- Archivo en `lib/hooks/use-xxx.ts`
- Definir queryKey, staleTime apropiado, retry policy
- Si es mutation: invalidaciones de cache, optimistic update si aplica

### Paso 3.5 — Textos i18n (ANTES de escribir el componente)
- Agregar TODOS los textos visibles de la pantalla a `messages/es/{namespace}.json`
  (común → `common`, propios del módulo → su namespace). Keys en camelCase,
  descriptivas, agrupadas (headers → acciones → errores).
- Plurales con ICU (`{count, plural, ...}`), variables con interpolación (`{name}`).
- Español neutro ('tú'), NUNCA voseo. Respetar términos que no se traducen
  (KURO, Mestre, GI/No-Gi/Open Mat/Faixa, etc. — ver CLAUDE.md §i18n).
- Luego, en el componente: `useTranslations(ns)` (client) / `getTranslations(ns)` (server),
  `useFormatter()` para fechas/números. CERO strings hardcoded en JSX.

### Paso 4 — Pantalla
- `app/(platform)/.../page.tsx` server component con `generateMetadata()` (no `metadata` literal)
- `_components/xxx-screen.tsx` client component que consume hooks + `useTranslations`

### Paso 5 — Estados obligatorios
Toda pantalla maneja explícitamente:
- **loading** → skeleton con la forma del contenido final, no spinner genérico
- **empty** → mensaje accionable, no "no data"
- **error** → mensaje + requestId + botón retry
- **forbidden** (403) → mensaje específico, sin revelar qué falta
- **stale-session** (401) → manejado globalmente por el client.ts

### Paso 6 — Capabilities gating
Antes de mostrar cualquier acción que llame a `POST`/`PATCH`/`DELETE`:
```tsx
const { data: caps } = useCapabilities(orgId)
if (!caps?.capabilities.students?.invite) return null  // no muestra el botón
```
La UI nunca asume — siempre consulta capabilities. El backend 403 es el guardián real;
el gating del frontend es UX, no seguridad.

### Paso 7 — Verificación de cierre
- `pnpm tsc --noEmit` exit 0 (el typecheck valida las keys i18n — key inexistente = error)
- `pnpm lint` sin errores nuevos
- CERO strings hardcoded en JSX, CERO voseo, CERO `toLocale*` (usar `useFormatter`)
- Diff sin console.log, sin TODO, sin código comentado
- Probar manualmente los 5 estados

---

## Fase 3 — Roadmap de pantallas

### P1 · Operaciones diarias (próximo bloque)
Orden recomendado por dependencias:

| # | Pantalla | Ruta | Endpoints |
|---|---|---|---|
| 1 | Training Calendar | `/org/[orgId]/calendar` | `training-calendar` |
| 2 | Classes / Schedules | `branches/[branchId]/classes` | `class-schedules`, `class-sessions` |
| 3 | Class Session Detail | side-panel desde calendar/classes | `class-sessions/:id` |
| 4 | Attendance | `branches/[branchId]/attendance` | `class-sessions/:id/attendance` |
| 5 | Instructors | `branches/[branchId]/instructors` | `branches/:id/instructors` |

### P1 · Comunicación
| Pantalla | Ruta |
|---|---|
| Communications | `/org/[orgId]/communications` |
| Notifications | `/org/[orgId]/notifications` |
| Training Notes | side-panel desde student detail |
| Academy Events | `/org/[orgId]/events` |

### P1-Ext · Dependencia externa (con feature flag)
| Pantalla | Ruta | Bloqueado por |
|---|---|---|
| Billing | `branches/[branchId]/billing` | Mercado Pago sandbox |
| MP Status | `/org/[orgId]/settings/integrations` | Mercado Pago |
| Competitions | `/org/[orgId]/competitions` | Smoothcomp Go publisher |

Construir con empty state "Pendiente de integración" hasta que el backend confirme.

### P2 · Gobernanza
Promotions · Certificates · Analytics · Audit Log · Settings · Public Profile

---

## Integración cult-ui — qué falta usar

| Componente | Pantalla destino | Cuándo |
|---|---|---|
| `side-panel` | Student Detail (abrir desde Students List sin navegar) | P1 |
| `side-panel` | Class Session Detail | P1 con Classes |
| `direction-aware-tabs` | Student Detail: Perfil / Historial / Notas / Facturación | P1 |
| `toolbar-expandable` | Quick Create del topbar | P1 |
| `sortable-list` | Gestión de horarios de clases | P1 con Classes |
| `dynamic-island` | Notificaciones del sistema | P2 |
| `expandable-card` | Branch cards en Org Dashboard | P2 |
| `floating-panel` | Filtros avanzados de Students y Attendance | P2 |

---

## Reglas no negociables (resumen)

1. JWT en Zustand memoria — NUNCA localStorage/sessionStorage
2. Refresh token = httpOnly cookie, JS nunca lo ve
3. CSRF token leído de header `x-csrf-token`, guardado en store
4. Refresh mutex (single-flight) en `client.ts` — ya implementado
5. Toda pantalla maneja los 5 estados
6. Capabilities gating en UI + backend 403 como source of truth
7. Toda la UI en español neutro ('tú'), CERO strings hardcoded → `messages/es/*.json` (next-intl)
8. Componentes consumen hooks, no endpoints directamente
9. Patrones que se repiten 2 veces → extraer a `shared/`
10. `pnpm tsc --noEmit` debe pasar antes de cerrar cada tarea

---

## Prompt template para Claude Code

Cuando arranques una pantalla nueva:

```
Leé el CLAUDE.md y el BUILD-PLAYBOOK.md.

Pantalla: [nombre]
Ruta: [ruta]
Endpoints: [lista]

Seguí el playbook de 7 pasos:
1. Confirmar shape del API (te paso el JSON de Postman)
2. Tipos en types.ts + función en endpoints.ts
3. Hook en lib/hooks/use-xxx.ts
4. page.tsx (server) + _components/xxx.tsx (client)
5. Estados: loading, empty, error, forbidden
6. Capabilities gating en acciones
7. Verificación: pnpm tsc --noEmit + lint

JSON de respuesta del backend:
[pegar Postman]

Confirmá los archivos creados y que compila sin errores.
```