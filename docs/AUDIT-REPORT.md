# KURO — Auditoría Exhaustiva del Repositorio

> **Tipo:** Auditoría técnica de solo-lectura (no se modificó código).
> **Fecha:** 2026-06-05 · **Commit base:** `8f61a5a` · **Branch:** `main`
> **Alcance:** `app/ components/ lib/ stores/ providers/ i18n/` — 143 archivos `.ts/.tsx`, ~22.3k LOC de fuente.
> **Método:** 6 agentes de investigación en paralelo (uno por dimensión de código) + síntesis. Toda afirmación está citada `archivo:línea`.

---

## 1. Resumen ejecutivo

KURO es un frontend **inusualmente disciplinado** para su etapa. La arquitectura por capas no solo está documentada (CLAUDE.md, BUILD-PLAYBOOK.md) sino **realmente aplicada**: cero `useQuery`/`useMutation` fuera de `lib/hooks/`, cero `fetch` directo en componentes, JWT solo en memoria, i18n type-safe end-to-end, y un patrón de mutaciones optimistas consistente. La higiene es alta: **cero `any`**, cero `@ts-ignore`, cero TODOs zombie, cero archivos de mocks, cero strings hardcodeados en JSX (fuera de un componente vendored documentado).

La auditoría **no encontró vulnerabilidades críticas ni deuda crítica de arquitectura.** Lo que sí encontró es un perfil de riesgo concentrado en tres zonas:

1. **Resiliencia en runtime (lo más serio).** No existe **ningún** `error.tsx`, `global-error.tsx` ni React ErrorBoundary en toda la app. Un throw de render en cualquier componente tira la shell completa a la pantalla de error cruda de Next, y **no hay telemetría** que lo registre. Es el único hallazgo verdaderamente **ALTA** transversal.
2. **Dos brechas de cumplimiento puntuales** contra las propias reglas del proyecto: el botón "Invitar" de Claims **no tiene capability gating** (rule #6 del playbook), y un mensaje de error crudo del backend se renderiza al usuario en Claims (posible information disclosure).
3. **Workarounds esperando backend** que hoy degradan silenciosamente: la búsqueda de alumnos walk-in está **truncada a 100** client-side, la ventana de asistencia STAFF se detecta por **regex sobre el string del error 409**, y el cap de QR (`expiresInMinutes=15`) está **adivinado empíricamente**.

Nada de esto es estructuralmente podrido. Son items acotados, mayormente de 1-cita, que se cierran en un sprint corto. El "esqueleto" (capas, estado, seguridad de auth, datos) está bien construido; lo que falta es el **tejido de tolerancia a fallos** (error boundaries + telemetría) y cerrar las últimas costuras de cumplimiento.

### Scores por dimensión

| # | Dimensión | Score | Una línea |
|---|---|:---:|---|
| 1 | Arquitectura | **9 / 10** | Capas limpias y *aplicadas*; solo deuda de `package.json` + 1 smell de ubicación de tipos. |
| 2 | Implementación | **8 / 10** | 5 estados y optimistic muy consistentes; 1 acción sin gating (ALTA) + 2 huecos de error. |
| 3 | Calidad de código | **8 / 10** | Cero `any`, naming consistente; deuda real = helpers duplicados + 2 diálogos gigantes. |
| 4 | Deuda técnica | **7 / 10** | Sin TODOs zombie; workarounds backend honestos pero uno trunca datos (ALTA). |
| 5 | Feature completeness | **7 / 10** | Fase 2.2 cerrada de verdad; Student Detail e Intake reportados como hechos están parciales. |
| 6 | Seguridad | **8 / 10** | Modelo de auth/token ejemplar; 1 leak de mensaje (MEDIA) + falta CSP/headers. |
| 7 | Observabilidad | **5 / 10** | Capa de datos excelente; **cero** error boundaries y **cero** telemetría de crashes. |
| | **Global** | **7.4 / 10** | Base sólida y bien gobernada; cerrar resiliencia + 3 costuras de cumplimiento. |

### Gap de proceso detectado

El prompt referencia **`KURO-ROADMAP.md`** — **ese archivo no existe en el repo**. El roadmap real está disperso en `BUILD-PLAYBOOK.md` (Fase 3), `CLAUDE.md` (tablas P0/P1/P2) y el historial de git (Fase 2.1, 2.2, "Night Ops"/Lote 2.5). Recomendación de gobernanza: crear un `KURO-ROADMAP.md` único con el estado real por fase (ver Dimensión 5).

---

## DIMENSIÓN 1 — ARQUITECTURA · Score 9/10

### Diagrama de capas (as-built)

```
┌─ Routing / pages ──────────────────────────────────────────┐
│ app/(auth) · app/(platform)            server components    │
│   page.tsx = solo generateMetadata() + render 1 screen      │
├─ Feature screens ──────────────────────────────────────────┤
│ app/**/_components/*.tsx              'use client'          │
│   consumen hooks + useTranslations                          │
├─ UI compartida ────────────────────────────────────────────┤
│ components/{shared,kuro,layout,sessions,attendance,ui}       │
├─ Hooks (lógica de negocio) ────────────────────────────────┤
│ lib/hooks/use-*.ts + _shared.ts   TODO useQuery/useMutation │
├─ API layer ────────────────────────────────────────────────┤
│ lib/api/{client,endpoints,types}.ts   fetch+auth+CSRF+refresh│
├─ Schemas (Zod) ── lib/schemas/*.ts                          │
├─ Estado ── stores/{auth,ui}.store.ts (Zustand)              │
└─ i18n ── i18n/{config,routing,request,messages.d.ts}        │
```

**Lo bueno (verificado, no asumido):**
- **Aislamiento de la capa de datos real:** cero `useQuery`/`useMutation` fuera de `lib/hooks/`; ningún componente llama `fetch()`/`apiClient` directo. La regla del playbook se cumple *en la práctica*.
- **Privacidad de rutas respetada:** los 11 imports `page → _components` son relativos; ningún `_components/` se importa cruzando árboles de ruta.
- **Estado de libro:** token solo en memoria, `partialize` persiste únicamente `currentBranchId` (`stores/auth.store.ts:209`); UI store solo `sidebarCollapsed`. Cero server-state en Zustand.
- **i18n type-safe:** `i18n/messages.d.ts` augmenta `Messages` → una key inexistente es **error de TS**.
- **Server/client tagging correcto:** los 12 `page.tsx` (salvo login) son server components mínimos; todo lo interactivo es `'use client'`.

### Issues

| Sev | Issue | Evidencia |
|---|---|---|
| **ALTA** | `motion@^12.40` es **dependencia muerta** — duplica `framer-motion`; cero imports de `motion`. Los 2 consumidores reales importan de `framer-motion`. | `package.json`; `components/ui/family-button.tsx:16`, `components/ui/background-paths.tsx:16` |
| **ALTA** | `shadcn@^4.8` está en **`dependencies`** (es una CLI, cero imports runtime) y la v4 es la que CLAUDE.md **prohíbe** (manda `shadcn@2.x`). | `package.json` deps; CLAUDE.md "Stack de primitivos UI" |
| **MEDIA** | 3 componentes importan de `lib/api/endpoints.ts` — el playbook lo prohíbe explícitamente (BUILD-PLAYBOOK.md:12). Son `import type` (sin coupling runtime). **Causa raíz:** los DTOs viven en `endpoints.ts` en vez de `types.ts`. | `session-dialog.tsx:73`, `schedule-dialog.tsx:71`, `generate-sessions-dialog.tsx:68` |
| **MEDIA** | 2 componentes vendored muertos (0 importers): `grid-beam.tsx` y `side-panel.tsx` (superado por `sheet.tsx`). | grep importers = 0 |
| **BAJA** | Login (`app/(auth)/login/page.tsx`) y `app/page.tsx` sin metadata. Login es el único `page.tsx` con `'use client'`, así que no puede usar `generateMetadata` sin partir en wrapper server. | — |

### Recomendaciones
1. Eliminar `motion` de `package.json` (riesgo cero).
2. Mover `shadcn` a `devDependencies` y alinear con la regla v2.x.
3. **Relocalizar los DTOs** (`ClassSessionUpdateBody`, `ClassScheduleCreate/UpdateBody`, `SessionsGenerateResponse`, etc.) de `endpoints.ts` → `types.ts` y repuntar los 3 imports. Cierra la única violación de playbook del repo.
4. Borrar `grid-beam.tsx` y `side-panel.tsx`.

---

## DIMENSIÓN 2 — IMPLEMENTACIÓN · Score 8/10

### Cobertura de features (reportado vs real)

| Área | Estado real | Evidencia |
|---|---|---|
| Org Dashboard | **Live** (org + tree-summary, KPIs con fallback honesto `—`) | `org-dashboard.tsx:32-56,274,285` |
| Branch Dashboard | **Live** (action-summary, risk-roster, agenda) | `branch-dashboard.tsx:101-188` |
| Students List | **Live** (read + paginación; sin mutaciones inline) | `students-list.tsx:153` |
| **Student Detail** | **Parcial** — un solo `useStudent` GET; notas/certificados/guardian **derivados de ese payload**, no de endpoints propios | `student-detail.tsx:36,87,220,239` |
| **Academy Intake** | **Solo lectura** — acción "gestionar" es stub `disabled` (comingSoon) | `intake-list.tsx:353-360` |
| Claims | **Live** (list + Invite POST real) | `claims-manager.tsx:453,460` |
| Calendar / Schedules / Sessions | **Live** (CRUD + generate; create/edit/cancel optimistas) | `use-sessions.ts:253,297,347`; `use-schedules.ts:104,154,226,309` |
| Attendance + QR + Suggest | **Live** (record/update/delete optimistas; QR polling; suggest batch) | `use-attendance.ts:62,136,180,224,270,294` |
| Class-detail page | **Live** salvo Compliance strip (**stub honesto** "no integrado") | `compliance-strip.tsx:6-12` |

**Stubs por diseño (honestos, no gaps ocultos):** ComplianceStrip; topbar createStudent/createEvent (`topbar.tsx:126,132` disabled); intake "gestionar"; bell con conteo hardcodeado `"3"` (`topbar.tsx:143` — **viola rule #9** de cero hardcoded).

### Tabla de 5 estados por pantalla

`stale-session` (401) es **global** en `lib/api/client.ts` (refresh-mutex + logout) → correctamente ausente por pantalla en todas.

| Pantalla | loading | empty | error | forbidden | usa `shared/*` |
|---|:--:|:--:|:--:|:--:|---|
| org-dashboard | ✅ | ✅ | ✅ | ⚠️ usa `EmptyState`+Lock, no `ForbiddenState` | parcial |
| branch-dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| students-list | ✅ | ✅ | ✅ | ✅ | ✅ |
| student-detail | ✅ | ✅ | ✅ | ⚠️ `CenteredState` custom | solo ErrorState |
| intake-list | ✅ | ✅ | ✅ | ✅ | ✅ |
| claims-manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| calendar | ✅ | ✅ | ✅ | ✅ | ✅ |
| schedules-list | ✅ | ✅ | ✅ | ✅ | ✅ |
| session-detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| class-session-detail-page | ✅ | ✅ | ✅ | ✅ | ✅ |
| attendance-page | ✅ | ✅ | ✅ | ✅ | ✅ |
| qr-page | ✅ | ✅ | ⚠️ **roster query no surface error** | ✅ | ✅ |

**Huecos:**
- **MEDIA** — `qr-page.tsx:160-163`: gatea error/403/404 de `sessionQuery` pero el error de `rosterQuery` **nunca se muestra** (`qr-roster-preview.tsx:25` solo recibe `isLoading`). Roster que falla = preview en loading/empty perpetuo.
- **BAJA** — `walk-in-dialog.tsx:46,89` corre su propio `useBranchStudents` y solo chequea `isLoading`; búsqueda fallida se ve como vacía.
- **BAJA (consistencia)** — 403 renderizado distinto en `org-dashboard.tsx:201` y `student-detail.tsx:43` (no usan `ForbiddenState`).

### Permission gating

`useCapabilities` se usa en 6 archivos. Correctamente gateado: crear clase/schedule, editar/cancelar sesión, attendance/check-in, suggest, editar currícula.

| Sev | Acción sin gating | Evidencia |
|---|---|---|
| **ALTA** | **Claims "Invitar"** (POST `/students/:id/invite`) — el archivo **no importa `useCapabilities`**; botón siempre visible, depende solo del 403 del backend. Viola Paso 6. | `claims-manager.tsx:493-512`, mutación `:453` |

### Optimistic updates

Todas las mutaciones en `lib/hooks/*.ts` (cero `useMutation` inline). **Full optimistic** (cancel+snapshot+rollback+invalidate): create/update/cancel session, create/update schedule, record/update/delete attendance. **Invalidate-only intencional:** generate-sessions (bulk server-truth), issueQR, suggest, invite.

- **MEDIA** — IDs optimistas `optimistic-${crypto.randomUUID()}` (`use-sessions.ts:267`): clicar un chip optimista antes de `onSettled` navega a `/sessions/optimistic-...` → 404. Sin guard.
- **BAJA** — `useSuggestAttendance` no hace `cancelQueries` (sin optimistic, bajo impacto); `useInviteStudent` invalida en `onSuccess` y no `onSettled`.
- **Sin colisiones de queryKey:** las mutaciones de calendar usan prefix-filter `['class-calendar', orgId, branchId]` (`use-sessions.ts:232`) que cubre todas las variantes de fecha/vista. Correcto.

### Recomendaciones (orden)
1. **[ALTA]** Gatear "Invitar" en `claims-manager.tsx:493` con capability.
2. **[MEDIA]** Surface de error+retry del roster en `qr-page.tsx:160` y `walk-in-dialog.tsx:89`.
3. **[MEDIA]** Guard contra interacción con filas de ID optimista (`id.startsWith('optimistic-')`).
4. **[BAJA]** Unificar 403 en `ForbiddenState`; reemplazar bell `"3"` hardcodeado.

---

## DIMENSIÓN 3 — CALIDAD DE CÓDIGO · Score 8/10

### Top 10 archivos más largos

| LOC | Archivo | Nota |
|---:|---|---|
| 1899 | `components/ui/event-manager.tsx` | **Vendored**, i18n parcial documentado. Fuera de scope de refactor. |
| 873 | `lib/api/types.ts` | Solo tipos; deuda = muchos `Record<string,unknown>`. |
| 825 | `branch-dashboard.tsx` | **[MED]** 6+ sub-componentes en un archivo → partir a `_components/`. |
| 771 | `components/ui/grid-beam.tsx` | Vendored canvas. |
| 612 | `lib/api/endpoints.ts` | Repetitivo pero plano. OK. |
| 591 | `session-dialog.tsx` | **[MED-HIGH]** `SessionDialog` = 1 función de 473 líneas. |
| 580 | `claims-manager.tsx` | **[MED]** 3 sub-componentes + `initials` duplicado. |
| 569 | `session-detail.tsx` | **[MED]** helpers de fecha/initials duplicados. |
| 535 | `schedule-dialog.tsx` | **[MED-HIGH]** `ScheduleDialog` = 1 función de 412 líneas (la más grande del repo). |
| 533 | `student-detail.tsx` | **[MED]** `formatDate`/initials duplicados. |

### Type safety — fortaleza
- **Cero `any`** (`: any`, `as any`, `<any>`, `Record<string,any>`) en todo el src. Excelente.
- Todo `unknown` está justificado (boundaries de error, parsing de API, indexado seguro de error body).
- Tipos de form derivados por `z.infer` de los schemas; `types.ts` tiene shapes de *response* → **sin duplicación** entre `schemas/` y `api/types.ts`.
- **[LOW]** Deuda: muchos campos `Record<string,unknown>`/`unknown[]` en `types.ts:143,163-175,244-260,347-360` (sub-objetos backend aún no consumidos) empujan narrowing a los consumidores. Tipar a medida que se usen.
- **[LOW]** Doble-cast feo: `tRel as unknown as RelTranslator` (`intake-list.tsx:342`).

### Consistencia — fortaleza
Naming kebab-case uniforme, hooks `use-*`, estructura de features idéntica. Patrón de toast/error respetado: **solo** `lib/utils/toast.ts` importa `sonner`; ningún componente llama `toast()` crudo; hooks de mutación toast-free. **Sin desviaciones.**

### Code smells
- **Ternarios anidados:** solo 2 reales — `training-calendar.tsx:390-391` (uno con rama redundante `6:6`). Un lookup map leería mejor.
- **Magic numbers:** mayormente bien (stale times centralizados en `_shared.ts:20-29`, `ROSTER_POLL_MS`, `GENERATE_MAX_DAYS` nombrados). Sueltos: `{limit:100}` y `.slice(0,50)` en walk-in/suggest; `{limit:6}` duplicado en branch-dashboard.
- **console.*** — solo 2: `login/page.tsx:108` (defendible) y `suggest-attendance-dialog.tsx:332` `console.warn('[SUGGEST]'...)` que es **debug leftover** (el toast ya informa al usuario) → **remover**.

### Duplicación (la deuda real)
- **[MED]** `initials()` reimplementado **7 veces** (`attendance-row.tsx:43`, `registered-students-table.tsx:269`, `suggest-attendance-dialog.tsx:336`, `session-detail.tsx:539`, + inline en students-list/claims-manager/student-detail). → mover a `lib/utils/`.
- **[MED]** `formatLongDate`/`formatTime` duplicados **5+ veces** (`attendance-page.tsx:362`, `qr-class-info.tsx:81/93`, `attendance-header.tsx:81/93`, `session-detail-header.tsx:212/225`, `session-detail.tsx:547/560`); `formatRelativeDate` propio en branch-dashboard e intake-list.
- **[LOW]** `${firstName} ${lastName}` ~15+ veces; `toHM = t.slice(0,5)` idéntico en 2 archivos.

**i18n hardcoded — fortaleza:** dos scans (text nodes + atributos) → **0 violaciones**. Los únicos literales en español están dentro del vendored `event-manager.tsx` (excepción documentada).

### Recomendaciones
1. Extraer `initials()` + `formatLongDate/Time/RelativeDate` a `lib/utils/` (elimina ~12 definiciones).
2. Partir `ScheduleDialog` y `SessionDialog` (create vs edit, sub-forms).
3. Remover `console.warn('[SUGGEST]')`.
4. Tipar progresivamente los `Record<string,unknown>` de `types.ts`.

---

## DIMENSIÓN 4 — DEUDA TÉCNICA · Score 7/10

### TODO / FIXME / HACK / @ts-* — tabla completa

| archivo:línea | texto | clasificación | sev |
|---|---|---|---|
| `event-manager.tsx:12` | `TODO(i18n): ...migrar strings si se reactiva el toolbar nativo` | documentado-con-fase | BAJA |
| `schedule-card.tsx:135` | `TODO(Fase 2.2.x): eliminar schedule cuando el backend exponga DELETE` | documentado-con-fase | MEDIA |
| `app/(platform)/layout.tsx:47` | `eslint-disable react-hooks/exhaustive-deps` (bootstrap mount-once) | supresión intencional | BAJA |
| `generate-sessions-dialog.tsx:127` | `eslint-disable react-hooks/exhaustive-deps` (memo 1-key) | supresión intencional | BAJA |

**Cero** FIXME, HACK, XXX, `@ts-ignore`, `@ts-expect-error`, `any`. La regla "Nada de TODOs zombie" se **cumple**.

### Workarounds activos esperando backend

| # | Workaround | archivo:línea | Dependencia backend | Sev |
|---|---|---|---|---|
| 1 | **Búsqueda walk-in client-side, `limit:100` + `.slice(0,50)`** — "el backend no expone search en este endpoint". Branch con >100 alumnos tiene miembros **inbuscables**. | `walk-in-dialog.tsx:45,53-64` | search server-side en roster | **ALTA** (truncado silencioso) |
| 2 | **Ventana asistencia STAFF heurística** — banner "ventana cerrada" calculado de `PRE_GRACE=2h`/`POST_GRACE=3h` hardcodeados. | `attendance-page.tsx:188-204` | flag/horario real del backend | MEDIA |
| 2b | **409 parseado por regex del string** `/only allowed between (\S+) and (\S+)/i` — **duplicado** en 2 archivos. Cambio de wording lo rompe. | `attendance-window.ts:16-31`; `class-session-detail-page.tsx:205-211` | error code/field estructurado | MEDIA |
| 3 | **QR `expiresInMinutes=15` adivinado** ("acepta ≤15, rechaza ≥30 con 400"); const **duplicada**. | `qr-page.tsx:40`; `qr-modal.tsx:23`; `use-attendance.ts:266` | exponer el cap real | MEDIA |
| 4 | **Compliance per-session sin agregado backend** → stub honesto "no integrado". | `compliance-strip.tsx:6-9` | agregado waiver/billing | BAJA |
| 5 | **Schedule DELETE inexistente** — solo activate/deactivate. | `schedule-card.tsx:135` | DELETE en class-schedules | MEDIA |
| 6 | **`waitlist` siempre 0** — "backend no tiene dominio de waitlist". | `lib/api/types.ts:456` | dominio waitlist | BAJA |
| 7 | **Forgot-password UI-only** → `alert()` nativo "próximamente". | `login/page.tsx:213` | endpoint forgot-password | BAJA |

Cross-check con CLAUDE.md "Gaps backend conocidos": los 3 gaps documentados (forgot-password, walk-in/enroll vía endpoint de attendance, org-discovery pre-auth) están presentes y manejados. **Sin hacks no documentados** más allá de estos.

### Mocks / stubs
**Cero archivos de mock/fixture/seed/dummy.** Org dashboard usa data real con fallback `—` (no fabrica números). Compliance y "pendiente de integración" son stubs **honestos** (etiquetados), no fakes que parezcan funcionales. Los 40+ hits de `placeholder` son props de `<input>`/`<SelectValue>`.

### Componentes vendored — estado

| Archivo | Atribución | `// KURO custom:` | Drift | Sev |
|---|:--:|:--:|---|---|
| `event-manager.tsx` (1899) | ✅ bloque i18n | ✅ múltiple | Toolbar/filtros/diálogo **desactivados**; ~50 strings hardcodeados en la parte muerta, **con voseo** (`"Elegí un tipo"` :980, `"Elegí un color"` :1005) violando CLAUDE.md. Mina si se reactiva. | **MED-ALTA** |
| `grid-beam.tsx` (771) | ❌ **sin header** | ❌ | Vendored sin procedencia, drift untraceable. | MEDIA |
| `side-panel.tsx` (128) | ❌ **sin header** | ❌ | Vendored sin procedencia (además muerto). | BAJA |
| `texture-card.tsx` (146) | ⚠️ parcial | ✅ `:32` | API upstream muerta (`TextureCardStyled`) aún shippeada. | BAJA |
| `background-paths`, `bg-animate-button`, `cutout-card`, `family-button` | ✅ header completo | ✅ | Limpios, documentados. | — |
| `sheet/calendar/time-picker/switch/sonner/card/form` | ✅ doc headers | n/a | Custom/shadcn-adaptado bien documentado. | — |

### Recomendaciones
1. **[ALTA]** Pedir search server-side para walk-in; mientras tanto, advertir explícitamente el truncado a 100 en la UI.
2. **[MEDIA]** Reemplazar el parse-por-regex del 409 por un error code estructurado (coordinar backend); deduplicar la constante QR y el `WINDOW_409_RE`.
3. **[MED-ALTA]** Decidir el destino de `event-manager.tsx`: o reemplazar por el calendario nativo ya construido, o limpiar/i18n-izar la parte muerta. Hoy es un landmine de 1.9k LOC.
4. **[MEDIA]** Agregar headers de procedencia a `grid-beam.tsx`/`side-panel.tsx` (o borrarlos, ver Dim 1).

---

## DIMENSIÓN 5 — FEATURE COMPLETENESS · Score 7/10

> **Nota:** `KURO-ROADMAP.md` no existe. El estado se reconstruye de `BUILD-PLAYBOOK.md` (Fase 3), `CLAUDE.md` (P0/P1/P2) y git.

### Estado real por fase

| Fase | Reportado | % real | Detalle |
|---|---|:--:|---|
| **Fase 0/1 — Fundación** (login, auth, shell, hooks layer, shared) | ✅ | **100%** | Login, auth store, AppShell, capa de hooks y `components/shared/` completos y en uso. |
| **Fase 2.1 — i18n (next-intl)** | ✅ | **~98%** | Migración completa y type-safe. Única isla: strings hardcodeados (con voseo) en la parte muerta de `event-manager.tsx`. |
| **Fase 2.2 — Calendar/Schedules/Sessions/Attendance/QR** | ✅ | **100%** | Cerrada de verdad. CRUD optimista, QR check-in, sugerencias, manejo de ventana/cap. Es el bloque más sólido. |
| **Lote 2.5 — Diseño "Night Ops"** | ✅ | **~95%** | Paleta/tokens aplicados; `DESIGN-SYSTEM.md` existe. Coherente salvo `texture-card` con `text-neutral-*` hardcodeado (`:88,104`). |
| **Class-detail page** | ✅ | **~90%** | Overview/currícula/alumnos/QR live; Compliance strip stub honesto. |

### P0 (CLAUDE.md) — verificación

| Pantalla | Reportado | Real | Sub-tarea pendiente oculta |
|---|---|---|---|
| Login | ✅ | ✅ | forgot-password sin endpoint (`alert()`) |
| Org Dashboard | 🔄 placeholder | ✅ **Live** (superó el placeholder) | — |
| Branch Dashboard | ⬜ | ✅ **Live** | — |
| Students List | ⬜ | ✅ **Live** | — |
| **Student Detail** | ⬜ | 🟡 **Parcial** | notas/certificados/guardian **derivados de un payload**, no endpoints reales (`student-detail.tsx:220,239`). Training-notes API existe en backend pero no se consume. |
| **Academy Intake** | ⬜ | 🟡 **Solo lectura** | acción "gestionar" stub `disabled` (`intake-list.tsx:356`) |
| Claims | ⬜ | ✅ **Live** | botón Invite sin gating (ver Dim 2 ALTA) |

### Features fantasma (implementados, fuera del roadmap escrito)
- **QR check-in page** (`/sessions/[id]/qr`) — pantalla dedicada + polling, no figura como item en BUILD-PLAYBOOK.
- **Suggest-attendance** (sugerencias de asistencia) — flujo completo, no estaba en el roadmap original.
- **"Night Ops" design system** — documentado en `docs/DESIGN-SYSTEM.md` y git, pero **no** en la tabla de roadmap de BUILD-PLAYBOOK.
- **Class-detail page** completa accesible desde el Sheet del calendario.

### No iniciado (P1/P2, correctamente ausente)
Communications, Notifications, Training Notes (pantalla), Academy Events, Billing (MP), Competitions (Smoothcomp), Promotions, Certificates, Analytics (pantalla), Audit Log, Settings, Public Profile, Locations Map, Network Graph. **Ninguno** está parcialmente implementado sin reportar (no hay código fantasma de estos).

### Recomendaciones
1. **Crear `KURO-ROADMAP.md`** con esta tabla como fuente única de verdad.
2. Reclasificar **Student Detail** e **Intake** de "hecho" a "parcial" y abrir las sub-tareas (consumir training-notes/certificates; acción de gestión de intake).
3. Documentar las features fantasma en el roadmap para no perder trazabilidad.

---

## DIMENSIÓN 6 — SEGURIDAD · Score 8/10

**Postura general: fuerte.** El modelo de auth/token está implementado con cuidado y matchea el contrato documentado.

### Lo bueno (confirmado)
- **Access token solo en memoria:** `partialize` whitelistea solo `currentBranchId` (`auth.store.ts:209`); token/CSRF/user nunca se persisten. Sin `localStorage`/`sessionStorage`/`document.cookie` para el token.
- **Refresh = httpOnly cookie**, `credentials:'include'` solo en 4 paths de auth (`client.ts:231-236`); JS nunca lo lee.
- **Refresh single-flight mutex correcto:** `_refreshPromise` (`client.ts:46`), `finally` libera siempre (`:214-217`), retry acotado por `_isRetry` (`:241,260`). N×401 en un F5 → un solo refresh. Sin race, sin lock permanente.
- **CSRF double-submit** con rotación + re-bootstrap post-F5 (`client.ts:135-144,171-172,338-339`).
- **Cero sinks XSS:** `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`new Function`/`document.write` → 0 matches.
- **Cero secretos hardcodeados;** `.env*` gitignored y no trackeado.
- **Un solo auth guard** cubre todas las rutas platform (`app/(platform)/layout.tsx`); capabilities son UX, el 403 backend es el guardián real.
- **ErrorState/toast/ApiError** exponen solo i18n genérico + `requestId`, nunca body/stack crudo (salvo finding #1).

### Vulnerabilidades / hardening

| # | Sev (CVSS-like) | Finding | OWASP | Evidencia | Fix |
|---|---|---|---|---|---|
| 1 | **MEDIUM** | **Mensaje crudo del backend renderizado al usuario** en errores de Invite — para status no mapeados muestra `body.message` verbatim (posible leak de detalle interno/ID de otro tenant). | A09/A01 | `claims-manager.tsx:578-579` (mostrado `:469`) | Quitar fallback `body?.message`; usar i18n genérico + `requestId`. |
| 2 | **MED-LOW** | **Sin security headers / CSP** — `next.config.ts` no setea CSP, HSTS, `X-Frame-Options`/`frame-ancestors`, nosniff, Referrer-Policy. Clickjacking + cero defensa en profundidad. | A05 | `next.config.ts:7-9` | Agregar `headers()` con CSP estricta, `frame-ancestors 'none'`, HSTS, nosniff. |
| 3 | **LOW** | **PII a consola** — `console.warn('[SUGGEST]', invalidStudents)` escribe IDs/nombres de alumnos a devtools. | A09 | `suggest-attendance-dialog.tsx:332` | Remover o dev-gate. |
| 4 | **LOW** | `console.error(err)` en login (no-ApiError). | A09 | `login/page.tsx:108` | Remover para prod. |
| 5 | **LOW** | **Forms sin Zod** (regla del proyecto): suggest-attendance y login arman payload de `useState`. Mitigado por `maxLength`/`type=email`/server. | A03/A04 | `suggest-attendance-dialog.tsx:113-119`, `login/page.tsx:67-72` | Agregar schemas Zod. |
| 6 | **INFO** | `/auth/me` en refresh usa `same-origin` siendo bearer-auth (cosmético). | — | `client.ts:183-191` | — |
| 7 | **INFO** | `currentBranchId` sobrevive logout (shared-device) — re-validado contra membership en `hydrateSession`, sin exposición cross-tenant. | — | `auth.store.ts:174-189` | Opcional: limpiar en logout. |

### Recomendaciones priorizadas
1. **[MEDIUM]** Eliminar el render de `body.message` en Claims (#1).
2. **[MED-LOW]** Agregar bloque `headers()` con CSP (#2).
3. **[LOW]** Remover/dev-gate los 2 console (#3, #4); agregar Zod a los 2 forms (#5).

---

## DIMENSIÓN 7 — OBSERVABILIDAD · Score 5/10

### Error handling & boundaries

**`requestId` end-to-end — sólido.** Captura en `client.ts:280` (`x-request-id`) → `ApiError` typed (`:26-35`) → `notifyError` lo adjunta (`toast.ts:20-24`) → `error-state.tsx:30,54-58` lo muestra en mono + retry.
- **[BAJA]** 3 throw sites pierden requestId: `client.ts:270,278` (`ApiError(401,null)`) y `authApi.login` `:334`.

**Cobertura de error boundaries — ALTA gap:**

| Route group | `error.tsx` | `not-found.tsx` | `global-error.tsx` |
|---|:--:|:--:|:--:|
| `app/` (root) | ❌ | ✅ | ❌ |
| `(auth)` / `(platform)` | ❌ | ❌ | — |
| `org/[orgId]/` | ❌ | ✅ | — |
| segmentos anidados (todos) | ❌ | ❌ | — |

**[ALTA]** **Cero `error.tsx`, cero `global-error.tsx`, cero ErrorBoundary** (grep `componentDidCatch|getDerivedStateFromError|ErrorBoundary` → vacío). Un throw de render en cualquier `_components` revienta la AppShell a la pantalla cruda de Next, **sin telemetría** que lo capture. `not-found.tsx` solo cubre root + org.

### Logging — MEDIA
Solo 2 `console.*` (login `:108`, suggest `:332`), **sin abstracción, sin gating por `NODE_ENV`, sin structured logging**. No existe `lib/utils/logger.ts`. El interceptor (`client.ts`) **traga errores en silencio** (`catch {}` en `:111,166,201,284`) — apropiado para parsing pero los fallos de refresh/5xx son invisibles.

### Analytics / telemetría — gap total
**Cero** product analytics y **cero** error-reporting. Sin `@vercel/analytics`, `posthog`, `sentry`, `mixpanel`, `datadog`, `opentelemetry` (todos los hits de `analytics` son el API de KPIs del backend, no tracking client). Para la etapa, la ausencia de *product* analytics es **BAJA/aceptable**; la ausencia de **crash telemetry (Sentry)** es **MEDIA** porque se compone con el gap de error boundaries → crashes en prod invisibles.

### Capa de datos — fuerte (la mejor parte de esta dimensión)
- **queryKeys consistentes y tenant-safe:** los 30+ keys incluyen `orgId`/`branchId`/filtros; **sin cross-tenant cache-bleed**, sin missing-dependency.
- **Sin refetch storms:** object-literals en keys son estables (TanStack v5 hashea estructuralmente); sin `Date.now()` en keys; `refetchOnWindowFocus:false` global.
- **staleTime/gcTime tuneados** (`_shared.ts:20-29`; catalogs `Infinity`); **todos** los queries con id gatean por `enabled: Boolean(orgId && ...)` — sin fetch con undefined.
- **Imágenes: cero riesgo** — no hay `<img>` ni `next/image`; `public/` solo SVGs.
- **[BAJA]** retry policy duplicada (`_shared.ts:13` vs `providers/index.tsx:18`).

### Recomendaciones (orden)
1. **[ALTA]** Agregar `app/global-error.tsx` + un `error.tsx` por route group (al menos `(platform)` y `org/[orgId]/`), con retry + requestId. Es el fix de mayor ROI de toda la auditoría.
2. **[MEDIA]** Integrar crash telemetry (Sentry o equivalente) — sin esto no hay señal de los crashes que (1) ahora atrapará.
3. **[MEDIA]** Crear `lib/utils/logger.ts` con gating `NODE_ENV`; migrar los 2 console; remover el `[SUGGEST]`.
4. **[BAJA]** Consolidar la retry policy duplicada; ampliar `not-found.tsx` a más segmentos.

---

## Plan de acción sugerido

Ordenado por **impacto real**, no por facilidad. Estimaciones en días-persona.

### Sprint 1 — Resiliencia y cumplimiento (lo que no puede esperar)

| # | Acción | Dim | Sev | Est. |
|---|---|---|---|---|
| 1 | `global-error.tsx` + `error.tsx` por route group (retry + requestId) | 7 | ALTA | 1.0d |
| 2 | Capability gating en botón "Invitar" de Claims | 2 | ALTA | 0.5d |
| 3 | Quitar render de `body.message` crudo en Claims (info disclosure) | 6 | MED | 0.25d |
| 4 | Advertir truncado walk-in (>100) en UI + abrir ticket backend search | 4 | ALTA | 0.5d |
| 5 | Remover/dev-gate los 2 `console` (uno con PII) | 3/6/7 | MED/LOW | 0.25d |

### Sprint 2 — Robustez y deuda backend-bound

| # | Acción | Dim | Sev | Est. |
|---|---|---|---|---|
| 6 | Integrar crash telemetry (Sentry) | 7 | MED | 1.0d |
| 7 | Surface error+retry del roster en qr-page + walk-in | 2 | MED | 0.5d |
| 8 | Reemplazar regex del 409 por error code estructurado (con backend); deduplicar | 4 | MED | 1.0d |
| 9 | Guard contra clic en filas de ID optimista | 2 | MED | 0.5d |
| 10 | `next.config.ts`: headers de seguridad + CSP | 6 | MED-LOW | 0.5d |
| 11 | Decidir destino de `event-manager.tsx` (reemplazar o limpiar voseo/i18n) | 3/4 | MED-ALTA | 1–3d |

### Sprint 3 — Higiene, reuso y cierre de features

| # | Acción | Dim | Sev | Est. |
|---|---|---|---|---|
| 12 | Extraer `initials()` + `formatLongDate/Time/Relative` a `lib/utils/` | 3 | MED | 0.5d |
| 13 | Relocalizar DTOs `endpoints.ts → types.ts` + repuntar 3 imports | 1 | MED | 0.5d |
| 14 | Limpiar `package.json` (quitar `motion`, mover `shadcn` a devDeps) | 1 | ALTA | 0.25d |
| 15 | Borrar `grid-beam.tsx` + `side-panel.tsx` muertos | 1 | MED | 0.25d |
| 16 | Partir `ScheduleDialog` y `SessionDialog` | 3 | MED-HIGH | 1.0d |
| 17 | Crear `KURO-ROADMAP.md`; reclasificar Student Detail + Intake como parciales | 5 | — | 0.5d |
| 18 | Logger con gating `NODE_ENV`; consolidar retry policy | 7 | BAJA | 0.5d |

**Total estimado:** ~12–14 días-persona (Sprint 1 ≈ 2.5d cierra todo lo ALTA + el MED de seguridad).

---

## Apéndice — Qué está genuinamente bien (no tocar)

- Aislamiento de la capa de datos (cero fetch en componentes, todo vía hooks).
- Modelo de auth/token: memoria-only, refresh mutex single-flight, CSRF double-submit.
- i18n type-safe end-to-end; cero strings hardcodeados (fuera del vendored).
- Cero `any`, cero `@ts-ignore`, cero TODOs zombie, cero mocks.
- queryKeys tenant-safe, `enabled` guards completos, staleTime tuneado.
- Patrón de mutaciones optimistas + toast-free hooks + conflict handler, aplicado consistentemente.
- Estados (loading/empty/error/forbidden) presentes en ~todas las pantallas vía `components/shared/`.

---

*Generado por auditoría de solo-lectura. Ninguna línea de código fue modificada. Toda severidad refleja impacto en producción, no facilidad de fix.*
