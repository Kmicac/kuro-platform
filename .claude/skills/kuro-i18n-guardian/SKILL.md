---
name: kuro-i18n-guardian
description: Enforces type-safe i18n across the KURO codebase. Detects hardcoded user-facing strings in JSX and proposes proper next-intl translations. Triggers when editing .tsx files, when creating new components, or when reviewing PRs. Use whenever user-facing text appears in code.
---

# KURO i18n Guardian Skill

You are the i18n quality gate for the KURO repository. Your job is to ensure ZERO hardcoded user-facing strings make it into the codebase.

---

## 1. Core principle

EVERY string visible to a user MUST go through `next-intl` translations.

```
User-facing text → t('namespace.key')
Developer text (logs, console) → string literal OK
```

---

## 2. Where to check

When editing or reviewing any of these files:
- `.tsx` files (components, pages)
- `.ts` files that return JSX or strings for UI
- New routes or pages

Scan for:
- Text inside JSX tags: `<h1>Hello</h1>` ❌
- Strings in props that render to user: `<Button label="Save" />` ❌
- toast messages: `toast.success('Saved')` ❌
- aria-labels and accessibility text: `aria-label="Close"` ❌
- Placeholders: `placeholder="Enter name"` ❌
- Form validation messages: `errors.required = 'Required'` ❌
- Empty states, error messages, loading text ❌

EXCEPT for:
- Brand/proper names: "KURO", "BJJ", "Jiu-Jitsu", "Gracie" ✓
- Non-translatable terms (see KURO-architect skill): GI, No-Gi, faixas in português ✓
- Technical identifiers used by dev only: console.log, error.message internal ✓
- Test strings ✓

---

## 3. Detection patterns

When you see this:

```tsx
// ❌ WRONG
<button>Save changes</button>
toast.success('Class created')
<input placeholder="Email" />
<p>No students found</p>

// ✓ CORRECT
<button>{t('actions.save')}</button>
toast.success(t('success.classCreated'))
<input placeholder={t('fields.emailPlaceholder')} />
<p>{t('emptyState.noStudents')}</p>
```

---

## 4. Namespace conventions

Existing namespaces in `messages/es/`:

```
auth.json       → login, signup, password reset
calendar.json   → calendar, sessions, classes
schedules.json  → recurring schedules
attendance.json → attendance + suggestions
qr-checkin.json → QR check-in flow
class-detail.json → dedicated class detail page
common.json     → buttons, generic actions, weekdays
navigation.json → sidebar, breadcrumbs
dashboard.json  → org + branch dashboards
students.json   → students, intake
```

When in doubt about which namespace:
- Feature-specific UI → feature namespace
- Cross-cutting actions/labels → common.json
- Navigation/sidebar/breadcrumbs → navigation.json

Create new namespace only when:
- New feature with 10+ keys
- Not fitting existing namespaces conceptually
- Register in `i18n/request.ts` and `i18n/messages.d.ts`

---

## 5. Key naming convention

```
namespace.section.action
namespace.section.field
namespace.section.label

Examples:
calendar.createDialog.title
calendar.createDialog.actions.submit
calendar.createDialog.fields.title
calendar.createDialog.errors.titleRequired
calendar.createDialog.success
```

Rules:
- camelCase keys
- Nested by section/context
- Action words at the end (submit, cancel, confirm)
- Plural keys use ICU format: `{count, plural, =0 {...} =1 {...} other {# ...}}`

---

## 6. Type-safe augmentation

KURO uses next-intl with type augmentation in `i18n/messages.d.ts`. This means:

- `t('non.existent.key')` should fail at COMPILE TIME
- TSC catches missing keys
- IDE autocompletes available keys

When you create a new key in JSON, the augmentation re-validates automatically.

NEVER:
- Use `t(dynamicVariableKey as any)` — breaks type safety
- Skip the type check
- Use string concatenation for keys: `t('foo.' + bar)` ❌

If you need dynamic keys (rare), use a map:

```tsx
const STATUS_KEYS = {
  PRESENT: 'attendance.status.PRESENT',
  LATE: 'attendance.status.LATE',
  // ...
} as const

const label = t(STATUS_KEYS[status])
```

---

## 7. Common pitfalls in KURO

### Pitfall 1: Translating untranslatable terms

```tsx
// ❌ WRONG
<Badge>{t('belts.whiteBelt')}</Badge>

// ✓ CORRECT (faixas don't translate)
<Badge>Faixa Branca</Badge>
```

Refer to KURO-architect skill section 4 for the full list of untranslatable terms.

### Pitfall 2: Forgetting Sonner toasts

```tsx
// ❌ WRONG (after a refactor)
toast.success('¡Listo!')

// ✓ CORRECT
toast.success(t('success.generic'))
```

### Pitfall 3: aria-labels hardcoded

```tsx
// ❌ WRONG
<button aria-label="Close">×</button>

// ✓ CORRECT
<button aria-label={t('actions.close')}>×</button>
```

### Pitfall 4: Validation messages in Zod schemas

KURO uses factory pattern for schemas:

```tsx
// ✓ CORRECT
export function makeCreateSessionSchema(messages: CreateSessionMessages) {
  return z.object({
    title: z.string().min(3, messages.titleRequired),
    // ...
  })
}

// In component:
const t = useTranslations('calendar.createDialog.errors')
const schema = makeCreateSessionSchema({
  titleRequired: t('titleRequired'),
  // ...
})
```

NEVER hardcode validation strings in the schema itself.

---

## 8. When you detect a violation

1. **STOP.** Do not let the violation pass.
2. **Identify the namespace** that should own the string.
3. **Propose the key** following naming convention.
4. **Add to the JSON file** with the Spanish neutral translation.
5. **Verify TSC** passes after the change.
6. **Report** the violation in your final summary.

---

## 9. Spanish neutral (tú estándar)

KURO uses **tú estándar**, not voseo:

```
✓ "¿Quieres crear una clase?"
❌ "¿Querés crear una clase?"

✓ "Confirma tu correo"
❌ "Confirmá tu correo"

✓ "Guarda los cambios"
❌ "Guardá los cambios"
```

Even though the team is in Argentina, the product targets all of Latin America.

---

## 10. Reporting

When you complete a task, report:

```
i18n CHECK:
- Strings hardcoded encontrados: X
- Keys nuevas creadas: Y (en namespaces: A, B, C)
- Keys reutilizadas: Z
- Tipo-safe augmentation: ✓ pasa
- Voseo detectado: 0
```

If you find existing hardcoded strings while working (not your changes), flag them in a separate section "Deuda i18n detectada (no introducida por esta tarea)" — but DO NOT fix them in the same PR unless instructed.

---

## 11. Final rule

**If a string can be seen by a user, it goes through `t()`. No exceptions.**

The only escape is the proper-name list in section 2 (KURO, BJJ, faixas, etc.).