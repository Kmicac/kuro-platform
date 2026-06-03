# KURO — Design System

> "Academia japonesa moderna": minimalismo, jerarquía clara, foco.
> Premium · sobrio · disciplinado. Inspirado en Linear / Vercel / Geist.
> **La jerarquía la da la tipografía, NO el color.**

Implementado en la Fase 2.5 (Sistema de Diseño KURO).

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

## Paleta — DARK (default)

| Rol | Token | HEX |
|---|---|---|
| Background base | `--background` | `#0A0E0C` (negro con tinte verde) |
| Surface elevado | `--popover` | `#13181A` |
| Surface card | `--card` / `--secondary` | `#1A2520` (verde oliva oscuro) |
| Muted (hover/skeleton) | `--muted` / `--accent` | `#13181A` |
| Primary verde | `--primary` | `#3F5C45` |
| Primary hover | `--primary-hover` | `#4A6B52` |
| Primary muted | `--primary-muted` | `#2A3B30` |
| Border sutil | `--border` / `--input` | `#2A3530` |
| Border medium | `--border-medium` | `#3A4540` |
| Texto primario | `--foreground` | `#E8E4D9` (off-white cálido) |
| Texto secundario | `--muted-foreground` | `#A8A496` |
| Texto terciario | `--text-tertiary` | `#6B6B5E` (placeholders, hints) |
| Texto disabled | `--text-disabled` | `#4A4A42` |
| Destructive | `--destructive` | `#8B4A3F` (terracota apagado) |
| Warning | `--kuro-warning` | `#8B7340` (ámbar apagado) |
| Success | `--kuro-success` | `#4A6B52` (verde) |
| Info | `--kuro-info` | `#4A5760` (azul gris apagado) |
| Focus ring | `--ring` | `#3F5C45` |

## Paleta — LIGHT (preparada, sin switcher aún — ver §Light mode)

| Rol | Token | HEX |
|---|---|---|
| Background base | `--background` | `#F5F3EC` (cream cálido) |
| Surface elevado | `--popover` / `--card` | `#EBE8DD` |
| Surface card | `--secondary` / `--muted` | `#DFD9C8` |
| Primary verde | `--primary` | `#3F5C45` (mismo en ambos modes) |
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
