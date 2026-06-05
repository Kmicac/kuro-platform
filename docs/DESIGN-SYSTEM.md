# KURO — Design System

> **"Night Ops" — Disciplined Authority Dark**: nocturno, premium, sobrio,
> disciplinado. Estética de *command panel* institucional (finanzas /
> inteligencia) cruzada con Linear / Vercel / Geist.
> **La jerarquía la da la tipografía y la elevación tonal, NO el color.**

Base Fase 2.5; paleta y forma actualizadas a "Night Ops" (olivo luminoso +
esquinas casi rectas) tras la revisión de diseño con los mockups en
`docs/design-refs/`.

> **Esquinas casi rectas:** `--radius` = **2px** (`0.125rem`) — look técnico /
> disciplinado. `rounded-md` ≈ 2px, `rounded-lg` ≈ 4px, `rounded-xl` ≈ 8px.
> Los dots de status y avatares siguen circulares (`rounded-full`).

---

## Arquitectura de tokens

> ⚠️ El proyecto usa **Tailwind v4** → NO hay `tailwind.config.ts`. Toda la
> configuración vive en `app/globals.css`:
> - Variables CSS por tema en `:root` (light) y `.dark` (dark, **default**).
> - Mapeo a utilidades Tailwind vía `@theme inline { --color-*: var(--*) }`.
>
> Redefinir una variable en `globals.css` se propaga **retroactivamente** a
> todo componente que use tokens semánticos (`bg-card`, `text-muted-foreground`,
> `border-border`, `bg-primary`, etc.).

El tema por defecto es **dark** (`defaultTheme="dark"` en `providers/index.tsx`).

---

## Paleta — DARK (default · "Night Ops")

**Elevación por capas tonales** (cada tier MÁS claro, con border sutil en vez de
sombra): base `#0D0F0D` → card `#1A1D1A` → muted `#1E201E` → elevado `#242824`.

| Rol | Token | HEX |
|---|---|---|
| Background base (Tier 1) | `--background` | `#0D0F0D` (deep forest charcoal) |
| Surface card (Tier 2) | `--card` / `--secondary` | `#1A1D1A` (container, border sin sombra) |
| Muted (hover/skeleton) | `--muted` / `--accent` | `#1E201E` (lift sutil sobre card) |
| Surface elevado (Tier 3) | `--popover` | `#242824` (popovers/modales, más claro) |
| Primary olivo luminoso | `--primary` | `#8C9366` (CTAs y status críticos) |
| Primary foreground | `--primary-foreground` | `#1E2310` (texto OSCURO sobre olivo sólido) |
| Primary hover | `--primary-hover` | `#9AA174` |
| Primary muted | `--primary-muted` | `#2A311E` (relleno de chips/iconos) |
| Border sutil | `--border` / `--input` | `#2D362E` |
| Border medium | `--border-medium` | `#3C4A3E` (hover/énfasis) |
| Texto primario | `--foreground` | `#E2E3DF` (off-white frío, NO blanco puro) |
| Texto secundario | `--muted-foreground` | `#A9A89B` |
| Texto terciario | `--text-tertiary` | `#6E7166` (placeholders, hints) |
| Texto disabled | `--text-disabled` | `#474A43` |
| Destructive | `--destructive` | `#9A5246` (terracota apagado) |
| Warning | `--kuro-warning` | `#A98A4C` (ochre apagado) |
| Success | `--kuro-success` | `#8C9366` (olivo = positivo: check-in, OK) |
| Info | `--kuro-info` | `#5E7079` (azul gris apagado) |
| Focus ring | `--ring` | `#8C9366` |

> **Botones primarios:** olivo luminoso sólido (`bg-primary`) con texto oscuro
> (`text-primary-foreground` = `#1E2310`). Excepción: el CTA animado
> `.kuro-bg-animate` (login / create submit) es un bloque **oscuro** con texto
> cream fijo — no usa `--primary-foreground`.

## Paleta — LIGHT (preparada, sin switcher aún — ver §Light mode)

| Rol | Token | HEX |
|---|---|---|
| Background base | `--background` | `#F5F3EC` (cream cálido) |
| Surface elevado | `--popover` / `--card` | `#EBE8DD` |
| Surface card | `--secondary` / `--muted` | `#DFD9C8` |
| Primary verde | `--primary` | `#3F5C45` (light usa olivo oscuro; dark usa olivo luminoso `#8C9366`) |
| Border sutil | `--border` | `#C9C3B0` |
| Texto primario | `--foreground` | `#1F2820` |
| Texto secundario | `--muted-foreground` | `#4A5048` |
| Texto terciario | `--text-tertiary` | `#7A7768` |

## NUNCA usar

- Verde brillante (`#22c55e`, `#16a34a`), azul brillante (`#3b82f6`), púrpura,
  naranja, rosa, amarillo brillante.
- Blanco puro (`#FFFFFF`) ni negro puro (`#000000`).
- Gradientes llamativos, sombras pesadas, glow effects.

---

## Tipografía

- **Geist Sans** (`--font-geist`, `font-sans`): headings y body.
- **Geist Mono** (`--font-geist-mono`, `font-mono`): IDs, timestamps,
  placeholders, labels uppercase.
- Configuradas vía `next/font/google` en `app/layout.tsx`.
- Weights: **400 / 500 / 600** (nunca 700+).
- Tracking: heading `-0.02em` (`--tracking-heading`, aplicado a `h1..h6`),
  body normal, mono normal.

### Escala

| Nivel | Size / line-height / weight |
|---|---|
| Display | 48px / 1.1 / 500 |
| H1 | 32px / 1.2 / 500 |
| H2 | 24px / 1.3 / 500 |
| H3 | 20px / 1.4 / 500 |
| Body | 14px / 1.5 / 400 |
| Small | 12px / 1.5 / 400 |
| Mono label | 11px uppercase · letter-spacing 0.08em (util `.label-mono`) |

---

## Paleta de filtros / eventos del Calendario

Family coherente (luminosidad ~30-40%, saturación baja ~20%). Fuente única:
`lib/constants/class-types.ts` (`CLASS_TYPE_HEX`).

| Tipo | HEX |
|---|---|
| GI | `#3F5C45` (verde oliva, primary) |
| NO_GI | `#5C4A3F` (marrón oliva) |
| FUNDAMENTALS | `#4A5760` (azul gris apagado) |
| ADVANCED | `#6B5840` (bronze sobrio) |
| KIDS | `#8A7B5F` (beige cálido) |
| COMPETITION | `#3F4858` (gris azulado oscuro) |
| OPEN_MAT | `#5F6B45` (verde mostaza apagado) |
| SEMINAR | `#705045` (terracota apagado) |
| PRIVATE | `#4A4540` (gris cálido oscuro) |

- **Chips** (`components/kuro/class-type-chip.tsx`): background 18%, border 40%,
  texto mezclado con `--foreground` vía `color-mix` (legible + adaptativo).
- **Eventos del calendario** (`components/ui/event-manager.tsx`,
  `KURO_CLASS_TYPE_COLORS`): mismos hex como clases arbitrarias **literales**
  (`bg-[#3F5C45]`) — el JIT de Tailwind solo detecta literales, por eso se
  duplican en vez de derivarse del constant.
- **Event chips (Night Ops):** NO son bloques de color sólido. Se renderizan
  como chip oscuro (`bg-muted/50` + `border-border`) con una **barra de acento
  vertical** del color del tipo a la izquierda (`w-[3px]` con el `bg-[hex]`
  literal); el título va en `--foreground` y el hover es estable (`bg-muted`,
  sin scale/shadow). Mismo lenguaje que el mockup `training-calendar`.

---

## Utilidades CSS (globals.css)

- `.label-mono` — mono 11px uppercase tracking 0.08em, color secundario.
- `.font-display` / `.font-kuro-mono` — Geist Sans / Geist Mono.
- `.scrollbar-none` / `.scrollbar-kuro` — scrollbars sobrios.
- `.kuro-fabric` — textura "Fabric of Squares" generada por CSS (rejilla
  discreta de cuadros sobre superficies; sin PNG). Usada en el login.
- `::selection` — verde primary al 35%.

---

## Componentes vendorizados (in-house, NO instalados como dependencia)

Todos copiados/adaptados a tokens KURO y marcados con `// KURO custom:`.

| Componente | Archivo | Dónde | Estado |
|---|---|---|---|
| Background Paths (21st.dev) | `components/ui/background-paths.tsx` | Login col. izquierda | ✅ |
| Bg Animate Button (cult-ui) | `components/ui/bg-animate-button.tsx` | Login submit, Create Session/Schedule submit | ✅ |
| Family Button (cult-ui) | `components/ui/family-button.tsx` | Topbar "Crear" (clase/horario/alumno/evento) | ✅ |
| Cutout Card (cult-ui) | `components/ui/cutout-card.tsx` | `kpi-card` (dashboards) | ✅ |
| Sheet (drawer derecho) | `components/ui/sheet.tsx` | Session Detail (`session-popover`) | ✅ |

> El `SidePanel` de cult-ui ya vendorizado (`components/ui/side-panel.tsx`) es
> un panel *inline expansible* (no un drawer lateral), no apto para el detalle
> de sesión; por eso 2.5.2 usa el nuevo `Sheet` (480px, drawer derecho).

> **Fabric of Squares:** el PNG no llegó por el chat. Se usa la textura por CSS
> `.kuro-fabric` (rejilla de cuadros sobre verde oliva, opacidad baja) en la
> columna derecha del login. Reemplazable por el PNG en `public/textures/` si
> se sube.

---

## Light mode (2.5.7)

Las variables de light mode ya están definidas en `:root` (globals.css). **No
hay switcher todavía** — el default es dark. Para probar light manualmente:
forzar la clase en `<html>` quitando `dark` / agregando una clase light, o
setear `localStorage.theme = 'light'` (next-themes). El switcher de tema se
construye en una fase posterior.
