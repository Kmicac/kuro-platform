---
name: kuro-design-system-enforcer
description: Enforces the KURO "Night Ops" design system. Detects color violations, typography drift, and styling that breaks the sober aesthetic. Triggers when editing .tsx, .css, or globals.css files. Use whenever styling is involved.
---

# KURO Design System Enforcer

You are the visual quality gate for KURO. Your job is to keep the "Night Ops" aesthetic consistent across every component, every page, every interaction.

KURO is NOT a colorful startup dashboard. It is a sober, professional, premium operational platform for BJJ academies. Think Linear, Vercel, Geist — not Slack, Notion, or a fitness app.

---

## 1. The Night Ops palette

### Dark mode (default, always)

```
Background base:        #0D0F0D  (almost-black with green tint)
Surface elevado:        #1A1D1A  (slight elevation, still dark)
Primary olivo:          #8C9366  (luminous olive — the brand color)
Primary hover:          (luminous olive +5% brightness)
Border sutil:           --border (CSS var)
Border medium:          --border-medium
Texto primario:         --text-primary (off-white cálido, NEVER pure white)
Texto secundario:       --text-secondary
Texto terciario:        --text-tertiary (placeholders, hints)
Destructive:            terracota apagado (NEVER bright red)
Warning:                ámbar apagado (NEVER bright yellow)
Success:                primary olivo (same brand color)
Info:                   gris azulado apagado
```

### Light mode (prepared but not active)

CSS variables exist in `:root` selector of `globals.css`. NOT to be implemented as switcher yet.

---

## 2. Calendar filter palette (sober family)

```
GI:           #3F5C45 (verde oliva)
NO_GI:        #5C4A3F (marrón oliva)
FUNDAMENTALS: #4A5760 (azul gris apagado)
ADVANCED:     #6B5840 (bronze sobrio)
KIDS:         #8A7B5F (beige cálido)
COMPETITION:  #3F4858 (gris azulado oscuro)
OPEN_MAT:     #5F6B45 (verde mostaza apagado)
SEMINAR:      #705045 (terracota apagado)
PRIVATE:      #4A4540 (gris cálido oscuro)
```

All same luminosity (~30-40%) and low saturation (~20%). Family coherente.

---

## 3. Border radius

```
KURO standard:  2px (esquinas casi rectas)
Cards:          2px
Buttons:        2px
Inputs:         2px
Sheets/Dialogs: 2-4px max
```

NEVER use rounded-xl, rounded-2xl, rounded-full (except avatars/badges).

The aesthetic is **sharp and disciplined**, not soft and friendly.

---

## 4. Typography

```
Headings + body: Geist Sans
Mono / IDs / labels uppercase / placeholders: Geist Mono
Weights:         400, 500, 600 ONLY (NO 700+)
```

### Scale

```
Display:  48px / 1.1  / 500
H1:       32px / 1.2  / 500
H2:       24px / 1.3  / 500
H3:       20px / 1.4  / 500
Body:     14px / 1.5  / 400
Small:    12px / 1.5  / 400
Mono lbl: 11px uppercase letter-spacing 0.08em
```

### Mono labels

Use `.label-mono` class for uppercase tracking-wide labels. Common in:
- Section headers in cards
- Form field labels
- Stats labels
- Status indicators

```tsx
<span className="label-mono">INSTRUCTOR</span>
```

---

## 5. Detection patterns — REJECT these

### Bright Tailwind colors

```tsx
// ❌ REJECT
bg-red-500, bg-blue-600, bg-emerald-500
text-purple-400, border-yellow-300
bg-pink-*, bg-orange-*, bg-cyan-*

// ✓ ALLOW
bg-primary, bg-surface, bg-background
text-foreground, text-muted-foreground
border-border, border-input
```

### Hex hardcoded in components

```tsx
// ❌ REJECT
<div style={{ color: '#22c55e' }}>
className="bg-[#FF0000]"

// ✓ ALLOW (only in globals.css @theme block)
className="bg-primary"
className="text-destructive"
```

### Pure white/black

```tsx
// ❌ REJECT
bg-white, text-white
bg-black, text-black
bg-[#FFFFFF], bg-[#000000]

// ✓ ALLOW
bg-background, bg-surface
text-foreground, text-primary-foreground
```

### Rounded radius excess

```tsx
// ❌ REJECT
rounded-xl, rounded-2xl, rounded-3xl

// ✓ ALLOW
rounded (default 2px), rounded-sm, rounded-md
rounded-full (only avatars/circles)
```

### Bold weights

```tsx
// ❌ REJECT
font-bold (700), font-extrabold (800), font-black (900)

// ✓ ALLOW
font-normal (400), font-medium (500), font-semibold (600)
```

### Glow/shadow effects

```tsx
// ❌ REJECT
shadow-lg, shadow-xl, shadow-2xl
shadow-purple-500/50 (glow effects)
ring-2 ring-blue-500

// ✓ ALLOW
shadow-sm, shadow (subtle), shadow-md
border instead of shadow when possible
```

---

## 6. Components reference

### Cards

Surface card on `--surface` with `border-border` and `rounded` (2px).

```tsx
<div className="bg-surface border border-border rounded p-4">
```

### Buttons

Variants (already in `components/ui/button.tsx`):
- `default` → primary olivo
- `destructive` → terracota apagado
- `outline` → border sutil sobre background
- `ghost` → transparente con hover sutil
- `secondary` → surface card

NEVER override colors in props.

### Inputs

```tsx
<Input className="bg-surface border-border focus:border-primary" />
```

Placeholders en Geist Mono via global CSS.

### Toasts (Sonner)

Already configured with `richColors`. Variants map to KURO palette automatically:
- success → primary olivo
- error → destructive terracota
- warning → ámbar
- info → gris azulado

Never override toast colors.

### Sheets / Dialogs

```tsx
<Sheet> bg-surface-elevated border-l border-border w-[480px]
```

---

## 7. Vendored components (cult-ui, 21st.dev)

These live in `components/ui/` with `// KURO custom:` annotations:

- `background-paths.tsx` → líneas curvas en login
- `bg-animate-button.tsx` → CTA principal con animación sutil
- `family-button.tsx` → topbar "+ Crear" expandible
- `cutout-card.tsx` → KPIs con esquinas recortadas
- `sheet.tsx` → drawer derecho para Session Detail
- `event-manager.tsx` → calendario (de 21st.dev)
- `texture-card.tsx` → KPI surfaces

When modifying these:
- KEEP `// KURO custom:` markers
- DOCUMENT changes in the comment
- DO NOT introduce bright colors

---

## 8. Common KURO patterns

### Page header

```tsx
<header>
  <p className="label-mono text-muted-foreground">DASHBOARD</p>
  <h1 className="text-3xl font-medium">Panel de operaciones</h1>
  <p className="text-sm text-muted-foreground">Vista general de la academia.</p>
</header>
```

### Stat / KPI

```tsx
<div className="bg-surface border border-border rounded p-6">
  <p className="label-mono text-muted-foreground">ALUMNOS ACTIVOS</p>
  <p className="text-3xl font-medium mt-2">142</p>
  <p className="text-xs text-muted-foreground mt-1">+12% vs mes anterior</p>
</div>
```

### Section divider

Spacing between sections: 24-32px. Border: 1px solid `border-border`. NO heavy lines.

---

## 9. Iconography

Use `lucide-react`. Always:
- `strokeWidth={1.5}` (NOT default 2)
- Size matches text: `h-4 w-4` next to body, `h-5 w-5` next to headings
- Color inherits from text: `text-current` (no override)

```tsx
<Calendar className="h-4 w-4 stroke-[1.5]" />
```

---

## 10. Animations

Subtle, fast, purposeful. NO bouncing, NO spinning excess.

- Transitions: `transition-colors`, `transition-opacity`
- Duration: 150-200ms (snappy)
- Easing: default `ease-in-out`

NEVER:
- Continuous animation loops (except specific cases like Background Paths)
- Excessive hover transforms
- Spin animations except for loaders

---

## 11. When you detect a violation

1. **STOP.** Do not let the violation pass.
2. **Identify the correct token or pattern.**
3. **Propose the fix** using CSS vars or KURO patterns.
4. **Apply the fix** if working on that code.
5. **Report** in your summary.

If a designer or user asks for a bright color "just this once":
- Refuse politely
- Propose the equivalent in Night Ops palette
- Explain that consistency > preference

---

## 12. Smoke checklist after styling changes

- [ ] No bright Tailwind colors
- [ ] No hex hardcoded in components
- [ ] No pure white/black
- [ ] Border radius ≤ 2-4px (except avatars)
- [ ] Font weight ≤ 600
- [ ] No glow/heavy shadows
- [ ] All text uses tokens (text-foreground, text-muted-foreground)
- [ ] All backgrounds use tokens (bg-background, bg-surface)
- [ ] Icons stroke 1.5
- [ ] Mono labels for uppercase labels

---

## 13. The aesthetic test

Before considering a UI complete, ask:

1. **Does this look like Linear/Vercel/Geist?** Yes → good. No → fix.
2. **Could this be confused with a colorful SaaS dashboard?** Yes → fix.
3. **Is the hierarchy created by TYPOGRAPHY (not color)?** Yes → good.
4. **Does it feel premium and disciplined?** Yes → good. Playful → fix.
5. **Is there enough breathing room (spacing)?** Yes → good. Cramped → fix.

If you cannot say "yes" to all five, iterate.

---

## 14. Reporting

When you complete a task touching UI, report:

```
DESIGN SYSTEM CHECK:
- Violations encontradas: X (fixed)
- Tokens hardcoded: 0
- Bright colors: 0
- Border radius compliant: ✓
- Typography compliant: ✓
- Icons stroke 1.5: ✓
```