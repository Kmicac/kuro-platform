# KURO — Web Platform Frontend
## CLAUDE.md v3 — stack real confirmado

---
## Documentos de referencia (leer SIEMPRE primero)
- CLAUDE.md (este archivo) — contexto del proyecto y stack
- BUILD-PLAYBOOK.md — proceso de 7 pasos por pantalla
- API-CONTRACT.md — contrato completo del backend (cuando esté disponible)

## Stack REAL instalado en el proyecto

```json
{
  "next": "16.x",
  "react": "19.x",
  "tailwindcss": "^4",
  "@tailwindcss/postcss": "^4",
  "tw-animate-css": "^1.4",
  "shadcn": "^4.8",
  "@base-ui/react": "^1.5",
  "@tanstack/react-query": "^5",
  "zustand": "^5",
  "next-themes": "^0.4",
  "lucide-react": "^1.x",
  "clsx": "^2",
  "tailwind-merge": "^3",
  "class-variance-authority": "^0.7"
}
```

⚠️ Diferencias importantes vs planes originales:
- **Tailwind v4** → NO usa `tailwind.config.ts`. Toda la config va en CSS con `@theme {}`.
- **shadcn v4** → usa `@base-ui/react` (no Radix) como primitivos base.
- **Next.js 16** → App Router, misma arquitectura que v15.
- **React 19** → sin cambios de API para lo que construimos.

---

## Producto

KURO — plataforma integral para academias y redes de Brazilian Jiu-Jitsu.
Dominio: **kuro.app** · Backend en Render (producción)
Tagline: *"Ordenar la vida de la academia sin perder su identidad."*
Usuarios: Mestre · Org Admin · Academy Manager · Head Coach · Instructor · Staff

Los 4 pilares: **Conducción · Comunidad · Gestión · Legado**

---

## Backend API (en Render — no necesita correr en local)

**URL producción**: `https://[TU-URL].onrender.com/api/v1`
Configurar en `.env.local`:
```
NEXT_PUBLIC_API_URL=https://[TU-URL].onrender.com/api/v1
```

### Auth
- `POST /auth/login` → body: `{ email, password, organizationSlug? }`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/step-up` (operaciones sensibles)
- `GET /organizations/:orgId/me/capabilities`

**JWT en memoria (Zustand). NUNCA localStorage.**
Token TTL = 15 min. Interceptor 401 → logout → `/login`.

### Roles del backend (SIEMPRE usar estos nombres en la UI)
```
MESTRE → ORG_ADMIN → ACADEMY_MANAGER → HEAD_COACH → INSTRUCTOR → STAFF → STUDENT
```
⚠️ "Regional Coordinator" del deck NO existe → mapear a ORG_ADMIN.

### Módulos disponibles
| Módulo | Base path |
|---|---|
| Auth | `/auth` |
| Organizations | `/organizations/:orgId` |
| Branches | `/organizations/:orgId/branches` |
| Students | `/organizations/:orgId/students` |
| Student Claims | `/organizations/:orgId/students/:id/invite` |
| Academy Intake | `/organizations/:orgId/branches/:branchId/intake-requests` |
| Classes | `/organizations/:orgId/branches/:branchId/class-schedules` |
| Attendance | `...class-sessions/:id/attendance` |
| Training Calendar | `/organizations/:orgId/training-calendar` |
| Academy Events | `/organizations/:orgId/academy-events` |
| Training Notes | `/organizations/:orgId/students/:id/training-notes` |
| Instructors | `/organizations/:orgId/branches/:branchId/instructors` |
| Promotions | `/organizations/:orgId/promotions` |
| Certificates | `/organizations/:orgId/certificates` |
| Communications | `/organizations/:orgId/communications` |
| Billing | `/organizations/:orgId/branches/:branchId/billing-*` |
| Integrations | `/organizations/:orgId/integrations` |
| Competitions | `/organizations/:orgId/competitions` |
| Analytics | `/organizations/:orgId/analytics/branches` |
| Audit | `/organizations/:orgId/audit` |

Gaps backend conocidos:
- Forgot password → no existe endpoint → mostrar UI pero sin conectar
- Org discovery pre-auth → login requiere `organizationSlug` explícito

---

## Design system KURO

### Colores de marca
| Token | Hex | Uso |
|---|---|---|
| Onyx | `#121113` | Background dark |
| Carbon Black | `#222725` | Surface dark |
| Palm Leaf | `#899878` | Acento dark mode |
| Palm Leaf Dark | `#475c38` | Acento light mode |
| Beige | `#E4E6C3` | Acento claro |
| Porcelain | `#F7F7F2` | Background light |
| Deep Academy Green | `#2d4a20` | Botón primario |

### Sidebar — dos variantes automáticas por tema
```
Dark mode:  bg #0f1210 · border #252c25 · accent #899878
Light mode: bg #1a2c1a · border #2d4230 · accent #c8d8a8  (VERDE MILITAR)
```

### Tipografía
- Display/Brand: **Space Grotesk 700** (logo, titulares)
- UI/Body: **Inter** (toda la interfaz)
- Código/IDs: **JetBrains Mono** (timestamps, identifiers)

### Logo KURO
Wordmark + 4-node mark (SVG). Componente en `components/kuro/logo.tsx`.
Los 4 nodos = 4 pilares (Conducción, Comunidad, Gestión, Legado).

### Idioma
**Toda la UI en español.** Labels, errores, estados, tooltips, empty states.
IDs, slugs técnicos y nombres de marca: inglés/snake_case.

---

## Archivos ya creados — verificar antes de recrear

```
app/
  globals.css              ← tokens KURO + Tailwind v4 (@import, @theme)
  layout.tsx               ← root con fonts Space Grotesk + Inter + JetBrains
  (auth)/layout.tsx
  (auth)/login/page.tsx    ← 2 columnas: feature showcase | form con todos los estados

  (platform)/layout.tsx    ← auth guard
  (platform)/org/[orgId]/layout.tsx   ← AppShell
  (platform)/org/[orgId]/page.tsx     ← org dashboard placeholder

components/
  kuro/logo.tsx            ← SVG KURO, props: collapsed, forceDark, size
  layout/sidebar.tsx       ← sidebar dark/militar, colapsable, 4 secciones nav
  layout/topbar.tsx        ← org+branch selector, search, quick create, bell
  layout/app-shell.tsx     ← sidebar + topbar + main content

stores/
  auth.store.ts            ← JWT in-memory, user, org/branch context
  ui.store.ts              ← sidebar collapse (persist)

lib/
  utils.ts                 ← cn()
  api/client.ts            ← fetch con auth, interceptor 401

providers/index.tsx        ← QueryClient (TanStack v5) + ThemeProvider (next-themes)
```

⚠️ Si hay errores de TypeScript al abrir el proyecto, corregirlos primero antes de construir
pantallas nuevas. Verificar que globals.css use sintaxis Tailwind v4 (`@import "tailwindcss"`).

---

## Componentes instalados

### shadcn (v4) — ya instalados
- button · badge · tooltip · separator · scroll-area

### cult-ui — PENDIENTE de instalar
Instalar con: `pnpm dlx shadcn@latest add https://cult-ui.com/r/[nombre].json`

| Componente | Pantalla | Estado |
|---|---|---|
| grid-beam | Login background, dashboard hero | ⬜ Pendiente |
| side-panel | Student detail, session detail, intake | ⬜ Pendiente |
| texture-card | Dashboard stat cards (KPIs) | ⬜ Pendiente |
| direction-aware-tabs | Student detail tabs | ⬜ Pendiente |
| toolbar-expandable | Quick Create button | ⬜ Pendiente |

---

## 21st.dev Magic — plan FREE

Plan disponible: **gratuito** (sin Magic Generate Pro).

Herramientas disponibles con el plan free:
- **Inspiration Search** — búsqueda semántica en miles de componentes para referencia
- **SVG Icon Search** — buscar logos e íconos SVG (útil para Mercado Pago, Smoothcomp)

Uso dentro de Claude Code:
```
"buscá en 21st.dev referencia de una data table con sorting y filtering"
"buscá el ícono SVG de Mercado Pago"
```

Claude Code busca la inspiración y construye el componente adaptado a tokens KURO.

Para generación de componentes nuevos usar en orden:
1. **cult-ui** (pnpm dlx shadcn@latest add cult-ui/r/...) → componentes animados
2. **shadcn/ui** (npx shadcn@latest add ...) → componentes base
3. **Claude Code directo** → construye custom con contexto KURO completo
4. **Stitch MCP** → diseño UI visual con Gemini 2.5 Pro

---

## Pantallas — prioridades

### P0 — Construir primero
| Pantalla | Ruta | Estado |
|---|---|---|
| Login | `/login` | ✅ Generado |
| Org Dashboard | `/org/[orgId]` | 🔄 Placeholder |
| Branch Dashboard | `/org/[orgId]/branches/[branchId]` | ⬜ |
| Students List | `branches/[branchId]/students` | ⬜ |
| Student Detail | `/org/[orgId]/students/[studentId]` | ⬜ |
| Academy Intake | `branches/[branchId]/intake` | ⬜ |
| Student Account Claims | `/org/[orgId]/claims` | ⬜ |

### P1 — Operaciones
Training Calendar · Classes · Attendance · Instructors · Academy Events ·
Training Notes · Communications · Public Profile Management

### P1-Ext — Dependencia externa (con estados provider-aware)
Billing (Mercado Pago) · Mercado Pago Status · Competitions (Smoothcomp)

### P2 — Gobernanza
Promotions · Certificates · Analytics · Audit Log · Settings ·
Locations Map (requiere Leaflet) · Network Graph (requiere React Flow)

---

## Reglas críticas

1. JWT en **Zustand en memoria** — NUNCA localStorage
2. Token 15 min — interceptor 401 → logout → `/login`
3. `GET /me/capabilities` al cargar → capabilities gating en UI
4. Backend 403 es source of truth — no solo capabilities
5. Estados obligatorios en CADA pantalla: `loading | empty | success | error | forbidden | stale-session`
6. NUNCA exponer orgId/branchId de otro tenant en errores
7. Billing + Competitions: siempre marcar dependencia externa
8. Toda la UI en **español**
9. **CERO strings hardcoded en JSX** — todo texto visible viene de `messages/es/*.json` vía next-intl (ver sección i18n)

---

## i18n (next-intl) — Fase 2.1

La app usa **next-intl** con **español neutro ('tú' estándar)** como único idioma base.
`locales` está preparado para sumar `en` y `pt` (ver `i18n/routing.ts`), pero hoy
corre con un solo idioma y SIN prefijo `/es/` en la URL (no hay middleware todavía).

### Reglas
- **NUNCA hardcodear strings visibles en JSX.** Todo texto (labels, placeholders,
  errores, empty states, aria-labels, títulos, toasts) vive en `messages/es/*.json`.
- **Client components**: `const t = useTranslations('namespace')` → `{t('key')}`.
- **Server components / metadata**: `const t = await getTranslations('namespace')`;
  los `page.tsx` usan `generateMetadata()` (no `export const metadata` con literales).
- **Fechas/números**: `useFormatter()` (`format.dateTime`, `format.number`) en client,
  `getFormatter()` en server. NUNCA `toLocaleDateString`/`toLocaleString` hardcodeados.
  Para tiempos relativos estables usar `useNow()` (no `Date.now()` en render).
- **Plurales**: ICU MessageFormat (`{count, plural, =1 {...} other {# ...}}`), nunca concatenar.
- **Interpolación**: `t('key', { name, count })`.
- **Sin fallbacks hardcodeados**: usar solo `t('key')` (next-intl tira error si falta la key).
  El typecheck es type-safe (ver `i18n/messages.d.ts`): una key inexistente es error de TS.
- **Voseo NO permitido** → siempre 'tú' estándar (Iniciá→Inicia, Seleccioná→Selecciona, etc.).

### Términos que NO se traducen
- Marca/producto: **KURO**, Mercado Pago, Smoothcomp.
- Roles: **Mestre**, **Manager** (ACADEMY_MANAGER), **Head Coach** (HEAD_COACH) y
  **Staff** (STAFF) se mantienen — son universales en BJJ y en operaciones de academia.
  Sí se traducen: Org admin→Administrador, Student→Alumno. INSTRUCTOR queda "Instructor".
- Términos BJJ: **GI, No-Gi, Open Mat, Tatami, Faixa** (graduaciones en portugués),
  **grado/grados** (stripes). Las graduaciones por nombre vienen del backend (`rank.label`).
- Términos producto EN ya traducidos a español neutro: Branch→Filial, Org→Organización,
  Dashboard→Panel, Academy Intake→Captación, Roster→Padrón, Pipeline→Embudo.

### Estructura
```
i18n/
  config.ts      ← locales, defaultLocale, timeZone
  routing.ts     ← routing por locale (preparado, sin middleware aún)
  request.ts     ← carga + merge de los 10 namespaces server-side
  messages.d.ts  ← augmentación type-safe de next-intl (Messages)
messages/es/
  common · auth · navigation · dashboard · calendar ·
  students · intake · claims · errors · empty-states .json
```
Ver `messages/README.md` para convenciones de keys, plurales y cómo sumar idiomas.

> ⚠️ `components/ui/event-manager.tsx` es vendored y su UI de toolbar/filtros/diálogo
> está deshabilitada (`hideHeader`/`hideFilters`): solo se migró lo alcanzable desde la
> grilla. El resto queda hardcodeado con un TODO(i18n) al tope del archivo.

---

## MCP servers activos

Verificar con `/mcp` dentro de Claude Code:
| MCP | Para qué |
|---|---|
| `magic` | `/ui descripción` → genera componentes React+Tailwind |
| `context7` | Docs Next.js 16, shadcn v4, TanStack Query v5, Tailwind v4 |
| `nanobanana` | Mockups con Gemini |
| `stitch` | Diseño UI completo con Gemini 2.5 Pro |

Flujo por pantalla nueva:
1. `/ui` (Magic) → componente base
2. `context7` → verificar APIs correctas
3. Ajustar tokens KURO

---

## Comandos

```bash
pnpm dev          # desarrollo
pnpm build        # producción
pnpm tsc --noEmit # verificar tipos
pnpm lint         # linting
```

---

## Primera tarea: Org Dashboard

Endpoints a conectar:
- `GET /organizations/:orgId` → datos de la org
- `GET /organizations/:orgId/me/capabilities` → capabilities
- `GET /organizations/:orgId/analytics/branches/tree-summary` → branches
- `GET /organizations/:orgId/analytics/branches/:branchId/action-summary` → KPIs

Usar TextureCard de cult-ui para stat cards (instalar primero).
Usar TanStack Query `useQuery` para todos los fetches.

## Stack de primitivos UI

- shadcn clásico (Radix-based) en components/ui/
- Si Claude Code necesita instalar un nuevo primitivo (alert, dialog, etc):
  pnpm dlx shadcn@2.x@latest add <componente>
  (NO la v4 que usa @base-ui/react — incompatible con el ecosistema 21st/cult-ui)