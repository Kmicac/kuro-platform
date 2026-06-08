---
name: kuro-architect
description: Core architecture, conventions, and non-negotiable rules for the KURO Platform repository. Loads automatically on any task involving the KURO codebase. Triggers on edits to .tsx, .ts files, schema files, hooks, components, and routing.
---

# KURO Architect Skill

You are working on the **KURO Platform** repository — a SaaS operacional para academias BJJ (Brazilian Jiu-Jitsu).

This skill encodes the non-negotiable architecture, conventions, and rules of this codebase. Apply these on EVERY task touching the repo.

---

## 1. Tech Stack (fixed, do not propose changes)

- **Framework:** Next.js 16 + React 19 + TypeScript strict
- **Styling:** Tailwind v4 (config en `app/globals.css @theme`, NUNCA en `tailwind.config.ts`)
- **Forms:** react-hook-form + zod v4 + `standardSchemaResolver` (NO `zodResolver` — incompatibilidad de tipos)
- **State server:** TanStack Query v5
- **State client:** Zustand v5 (auth + UI prefs)
- **Toasts:** sonner con `richColors`
- **i18n:** next-intl con namespaces type-safe en `messages/es/*.json`
- **Auth:** JWT en memoria + refresh httpOnly cookie + CSRF double-submit
- **Fonts:** Geist Sans + Geist Mono (via next/font)
- **Package manager:** pnpm

---

## 2. Sistema de Diseño Night Ops (CRÍTICO)

### Paleta dark mode (default)

```
Background base:        #0D0F0D
Surface elevado:        #1A1D1A
Surface card:           (heredada del sistema)
Primary olivo:          #8C9366 (luminoso)
Border sutil:           (token CSS var)
Texto primario:         off-white cálido (NO blanco puro)
Destructive:            terracota apagado (NO rojo brillante)
Warning:                ámbar apagado
Border radius:          2px (esquinas casi rectas)
```

### NUNCA usar

- Verde brillante (#22c55e, #16a34a, emerald-500)
- Azul brillante (#3b82f6, blue-500)
- Púrpura, naranja, rosa, amarillo brillante (cualquier *-500 de Tailwind chillón)
- Blanco puro (#FFFFFF) — usar off-white cálido
- Negro puro (#000000)
- Gradientes llamativos, sombras pesadas, glow effects

### Paleta de filtros calendar (sobria)

```
GI:           #3F5C45 (verde oliva)
NO_GI:        #5C4A3F (marrón oliva)
FUNDAMENTALS: #4A5760 (azul gris apagado)
ADVANCED:     #6B5840 (bronze)
KIDS:         #8A7B5F (beige cálido)
COMPETITION:  #3F4858 (gris azulado)
OPEN_MAT:     #5F6B45 (verde mostaza apagado)
SEMINAR:      #705045 (terracota apagado)
PRIVATE:      #4A4540 (gris cálido)
```

Usar siempre tokens CSS variables, NUNCA hex hardcoded en componentes.

---

## 3. Tipografía

- **Headings y body:** Geist Sans
- **Mono / labels uppercase / IDs / placeholders:** Geist Mono
- **Weights:** 400 (regular), 500 (medium), 600 (semibold). NO 700+
- **Labels mono uppercase:** 11px letter-spacing 0.08em

---

## 4. Términos que NO se traducen

### BJJ / Disciplina
- BJJ, Jiu-Jitsu, Gracie

### Modalidades
- GI, No-Gi, Open Mat, Fundamentals

### Roles operacionales (inglés/portugués original)
- Manager, Head Coach, Staff, Mestre

### Faixas (portugués)
- branca, azul, roxa, marrom, preta
- Kids: cinza, amarela, laranja, verde

### Equipamiento
- Tatami, Kimono, Dojo

---

## 5. Reglas no negociables

1. **JWT en memoria, NUNCA en localStorage**
2. **Backend 403 = source of truth** (capabilities solo gating UI)
3. **Cada pantalla maneja 5 estados:** loading | empty | error | forbidden | stale
4. **UI 100% español neutro** (tú estándar, NO voseo)
5. **Componentes consumen hooks, NO endpoints directos**
6. **Patrón visto 2 veces → extraer a `components/shared/` o `components/<feature>/`**
7. **`pnpm tsc --noEmit` exit 0 antes de cerrar tarea**
8. **NO @base-ui** (queda solo Radix)
9. **ESLint ignora cult-ui** (terceros vendorizados)
10. **localStorage solo para preferencias UI no-sensibles** (currentBranchId OK, tokens NUNCA)
11. **NO se acumula deuda técnica** — cada tarea cierra completa o se espera respuesta del backend
12. **NO TODOs zombie** — solo TODOs explícitos con `(Fase X.X.X): <descripción>`
13. **i18n type-safe** — cero strings hardcoded en JSX
14. **Hooks toast-free** — caller maneja toasts y conflicts
15. **Optimistic updates** en TODAS las mutations
16. **NO instalar deps sin justificar** — preferir vendorizar in-house
17. **Vendored components marcados con `// KURO custom:`**

---

## 6. Patterns establecidos

### Forms

```typescript
// Schema factory pattern
export function makeXSchema(messages: XMessages) {
  return z.object({...})
}

// Component
const schema = makeXSchema({ ... })
const form = useForm({
  resolver: standardSchemaResolver(schema), // NO zodResolver
  defaultValues: { ... } // SIEMPRE inicializar para evitar uncontrolled→controlled
})
```

### Hooks

```typescript
// Toast-free pattern
export function useCreateX() {
  return useMutation({
    mutationFn: ...,
    onMutate: optimistic-update,
    onError: rollback,
    onSettled: invalidate,
    // NO toasts aquí — caller maneja
  })
}
```

### Conflict handling (409)

```typescript
const conflictHandler = useConflictHandler()

onError: (error) => {
  if (conflictHandler.handle(error, sessionId)) return // dialog abrió
  // si no era conflict, mostrar toast genérico
}
```

---

## 7. Estructura de carpetas

```
app/
├── (auth)/           → login, signup
├── (platform)/       → autenticado, AppShell
│   └── org/[orgId]/  → tenant scope
│       └── branches/[branchId]/  → branch scope
└── (public)/         → anónimo (Fase 3)

components/
├── ui/               → primitives + vendored (Radix, cult-ui)
├── shared/           → cross-feature reutilizable
├── <feature>/        → específico de feature
└── layout/           → sidebar, topbar

lib/
├── api/              → client.ts, endpoints.ts, types.ts
├── hooks/            → use-*.ts
├── schemas/          → zod schemas
├── utils/            → cn, toast, etc.
└── constants/        → enums, paletas

messages/
└── es/<namespace>.json

i18n/
├── request.ts        → carga namespaces
└── messages.d.ts     → type augmentation

docs/
├── DESIGN-SYSTEM.md
├── COMPONENT-PATTERNS.md
└── AUDIT-REPORT.md   → generado por auditoría
```

---

## 8. Workarounds activos esperando backend

Cuando trabajes en estas áreas, considerar el workaround:

- **Walk-in search:** client-side filter sobre `useBranchStudents(limit:100)` — pedir endpoint search al backend si branch tiene 500+ students
- **Ventana de corrección de attendance:** heurística (sesión terminada + capability admin sin within-window) — backend no expone flag explícito
- **QR expiresInMinutes:** hardcoded a 15 — backend rechaza valores > 15 sin documentar cap real
- **Ventana staff attendance:** 409 si fuera de ~2h pre-clase — pendiente respuesta del backend para ampliar

---

## 9. Capabilities operacionales

Roles principales y sus capabilities clave:

- **MESTRE / ORG_ADMIN:** todo
- **ACADEMY_MANAGER:** gestiona su branch (canManageBranches, canManageSchedules, canValidateAttendance, canSuggestAttendance)
- **HEAD_COACH:** ops branch (canManageSchedules, canValidateAttendance, canSuggestAttendance)
- **STAFF:** ops branch (canValidateAttendance, canSuggestAttendance)
- **INSTRUCTOR:** ops sesión asignada (canValidateAttendance solo sesiones suyas, canSuggestAttendance solo sesiones suyas)
- **STUDENT:** self-service (intent, suggestions accept/decline)

Frontend SIEMPRE ocultar/deshabilitar lo que rol no tiene. Backend valida final.

---

## 10. Documentos de referencia obligatorios

LEER ANTES de tocar código:

1. `CLAUDE.md` — reglas no negociables (este skill las encapsula)
2. `API-CONTRACT.md` — contrato backend completo
3. `KURO-ROADMAP.md` — fases, sub-tareas, estado
4. `docs/DESIGN-SYSTEM.md` — paleta Night Ops, tokens, tipografía
5. `docs/COMPONENT-PATTERNS.md` — patterns de forms/mutations/conflict

---

## 11. Antes de cerrar cualquier tarea

Checklist obligatorio:

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm build` exitoso
- [ ] i18n type-safe (cero strings hardcoded)
- [ ] Permission gating en acciones nuevas
- [ ] Optimistic update en mutations
- [ ] Hooks toast-free
- [ ] Sin colores brillantes
- [ ] Sin tokens hardcoded en componentes (usar CSS vars)
- [ ] Sin TODOs zombie (solo TODOs con (Fase X.X.X))
- [ ] Commits lógicos por scope

---

## 12. Comportamiento esperado

Cuando recibas una tarea en este repo:

1. **Leer los docs base** si no tenés contexto fresco
2. **Verificar contra API-CONTRACT.md** si tocas endpoints
3. **Reportar ambigüedades ANTES** de tomar decisión
4. **NO inventar shape de respuestas** del backend
5. **NO copiar componentes** — extender o crear shared
6. **Preguntar antes de instalar deps** — preferir vendorizar
7. **Smoke checklist** después de cambios visuales
8. **Decisiones técnicas justificadas** en el reporte final

Cuando termines una tarea, reportar:
- Archivos creados
- Archivos modificados
- Archivos eliminados
- Decisiones tomadas (con justificación)
- Ambigüedades detectadas
- Verificaciones automáticas (TSC, lint, build)
- Smoke manual pendiente para el usuario

---

## 13. Comunicación con el usuario

- **Idioma:** español neutro (tú estándar)
- **Tono:** técnico directo, sin floritura
- **Reportes:** estructurados con secciones claras
- **Diffs:** breves pero completos
- **Sugerencias:** alternativas cuando hay ambigüedad

NO usar:
- Emojis excesivos
- Frases motivacionales
- Repetir lo que el usuario dijo
- "Excelente pregunta" o similar