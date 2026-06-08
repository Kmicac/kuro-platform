# KURO-ROADMAP.md

Roadmap del producto KURO Platform. Fases, sub-tareas, dependencias y estado real.

**Última actualización:** Junio 2026
**Estado general:** Fase 2.2 cerrada + Lote 2.5 (Night Ops) cerrado + Class Detail Page cerrada. Auditoría en curso. Próximo: Fase 3 (Público anónimo) o ajustes según auditoría.

---

## Documentos relacionados

- `CLAUDE.md` — Reglas no negociables (también encapsuladas en skill `kuro-architect`)
- `API-CONTRACT.md` — Contrato backend (source of truth)
- `BUILD-PLAYBOOK.md` — Proceso de 7 pasos para construir pantallas
- `docs/DESIGN-SYSTEM.md` — Paleta Night Ops, tokens, tipografía
- `docs/COMPONENT-PATTERNS.md` — Patterns de forms/mutations/conflict
- `docs/AUDIT-REPORT.md` — Auditoría exhaustiva (a generar)
- `.claude/skills/` — Skills auto-trigger para Claude Code

---

## Decisiones arquitectónicas globales (fijas)

| Decisión | Valor |
|---|---|
| Stack | Next.js 16 + React 19 + TypeScript strict |
| Styling | Tailwind v4 (config en `globals.css @theme`) |
| Forms | react-hook-form + zod v4 + `standardSchemaResolver` |
| State server | TanStack Query v5 |
| State client | Zustand v5 |
| Auth | JWT memoria + refresh httpOnly + CSRF |
| i18n | next-intl con type-safe augmentation |
| Toasts | sonner con richColors |
| Fonts | Geist Sans + Geist Mono |
| Mapas | Mapbox (Fase 3+) |
| Package manager | pnpm |
| Sistema de diseño | "Night Ops" |
| Idioma UI | Español neutro (tú estándar) |

---

## Términos que NO se traducen

- **Disciplina:** BJJ, Jiu-Jitsu, Gracie
- **Modalidades:** GI, No-Gi, Open Mat, Fundamentals
- **Roles operacionales:** Manager, Head Coach, Staff, Mestre
- **Faixas (portugués):** branca, azul, roxa, marrom, preta (kids: cinza, amarela, laranja, verde)
- **Equipamiento:** Tatami, Kimono, Dojo

---

## Estado de fases

| Fase | Nombre | Estado |
|---|---|---|
| 0 | Fundación (auth, hooks base) | ✅ CERRADA |
| 1 | Operacional base (dashboards, visor calendar) | ✅ CERRADA |
| 2.1 | i18n + español neutro | ✅ CERRADA |
| 2.2 | Calendario operativo (sessions + schedules + attendance + QR + suggestions) | ✅ CERRADA |
| 2.5 | Sistema de diseño Night Ops | ✅ CERRADA |
| 2.6 | Class Detail Page dedicada | ✅ CERRADA |
| **AUDIT** | **Auditoría exhaustiva del repo** | **🟡 EN CURSO** |
| 2.7 | Suggestions completas en Class Detail + vista alumno | 🔴 PRÓXIMA |
| 3 | Público anónimo (mapa Mapbox, search, perfil, signup) | 🔴 PENDIENTE |
| 3.5 | Branch Detail rework (pedido pendiente) | 🔴 PENDIENTE |
| 4 | Mercado Pago | 🔴 PENDIENTE |
| 5 | Academy Events | 🔴 PENDIENTE |
| 6 | Branch Settings (settings + public profile + geocoding) | 🔴 PENDIENTE |
| 7 | Operaciones avanzadas (instructors, students full, intake lifecycle) | 🔴 PENDIENTE |
| 8 | Comunicaciones (announcements, messages, requests) | 🔴 PENDIENTE |
| 9 | Promociones & Certificados | 🔴 PENDIENTE |
| 10 | Analytics & Audit | 🔴 PENDIENTE |
| 11 | Organization Network Graph | 🔴 PENDIENTE |
| 12 | Competiciones (Smoothcomp) | 🔴 PENDIENTE |
| 13+ | Technical Lineage, Federation, Community feed, Mobile | 🔴 FUTURO |

---

## Fase 0 — Fundación ✅ CERRADA

Auth completo, JWT en memoria, refresh httpOnly + CSRF, routing por rol, Sidebar branch-aware, Radix UI 100%, BeltBadge 18 variantes, catálogo promotion-ranks.

**Endpoints:** `/auth/*`, `/catalogs/promotion-ranks`

---

## Fase 1 — Operacional base ✅ CERRADA

Org Dashboard, Branch Dashboard, Training Calendar visor (Event Manager vendored), Session Detail, Students list, Academy Intake, Claims.

**Endpoints integrados:** `/organizations/:orgId`, `/branches/:branchId`, `/branches/tree-summary`, `/analytics/branches/:branchId/action-summary`, `/branches/:branchId/class-calendar` (view=MONTH grid completo), `/students`, `/intake-requests`.

---

## Fase 2.1 — i18n + español neutro ✅ CERRADA

next-intl, 10+ namespaces type-safe, ~470 strings migrados a tú estándar, formatters via `useFormatter`, roles en inglés y faixas en portugués preservadas.

---

## Fase 2.2 — Calendario operativo ✅ CERRADA

### Sub-tareas

| # | Nombre | Estado |
|---|---|---|
| 2.2.0 | Setup forms/zod/sonner/hooks | ✅ |
| 2.2.1 | Crear sesión única | ✅ |
| 2.2.2 | Editar sesión | ✅ |
| 2.2.3 | Cancelar sesión con motivo | ✅ |
| 2.2.4 | Asistencia STAFF_MANUAL (página dedicada) | ✅ |
| 2.2.5 | List class-schedules | ✅ |
| 2.2.6 | Create class-schedule | ✅ |
| 2.2.7 | Generate sessions from schedule | ✅ |
| 2.2.8 | Generate missing sessions | ✅ |
| 2.2.9 | Edit/disable class-schedule | ✅ |
| 2.2.10 | Manejo 409 ConflictDialog | ✅ |
| 2.2.11 | Optimistic updates en todas las mutations | ✅ |
| 2.2.12 | QR check-in (página fullscreen) | ✅ |
| 2.2.13 | Sugerir asistencia (creación, lado operador) | ✅ |

### Backend confirmaciones
- `view=MONTH` grid completo (35-42 días)
- 409 estructurado con `code: CLASS_SESSION_CONFLICT`
- generate / generate-missing síncronos límite 42 días
- GET detalle de schedule
- POST suggestions

### Workarounds activos pendientes backend
- Walk-in search: client-side filter sobre `useBranchStudents(limit:100)`
- Ventana corrección attendance: heurística
- QR expiresInMinutes: hardcoded 15
- Ventana staff attendance: 409 si fuera ~2h pre-clase

### Ajuste UX adicional
- Vista Week/Day del calendar: rango horario 06:00-00:00 (NO 00:00-23:59)
- Banner sutil si hay eventos fuera de rango

---

## Lote 2.5 — Sistema de Diseño Night Ops ✅ CERRADA

### Cerrado
- Paleta Night Ops aplicada en TODA la app
- Tokens CSS variables (dark default + light preparado)
- Geist Sans + Geist Mono integradas
- Border radius 2px global
- Componentes vendorizados in-house:
  - `background-paths.tsx`, `bg-animate-button.tsx`, `family-button.tsx`, `cutout-card.tsx`, `sheet.tsx`
- Login redesign 2 columnas
- Session Detail → Sheet derecho (480px)
- Family Button en topbar
- Cutout Card en KPIs
- `docs/DESIGN-SYSTEM.md` completo

### Paleta
- Background: `#0D0F0D`
- Surface: `#1A1D1A`
- Primary: `#8C9366` (olivo luminoso)
- Sin colores brillantes (excepto belts BJJ)

---

## Lote 2.6 — Class Detail Page ✅ CERRADA

### Cerrado
- Ruta dedicada `/sessions/[sessionId]`
- 7 componentes nuevos:
  - `class-session-detail-page` (orchestrator)
  - `session-detail-header`
  - `attendance-overview-card`
  - `technical-curriculum-card` (PATCH inline notes)
  - `registered-students-table` (check-in inline)
  - `compliance-strip` (waiver/payment)
  - `qr-modal` (FAB + modal)
- Sheet sigue existiendo (vista rápida desde calendar)
- Botón "Ver detalle completo" en Sheet → navega a página
- i18n: `messages/es/class-detail.json`

---

## AUDIT — Auditoría exhaustiva del repo 🟡 EN CURSO

### Scope
7 dimensiones:
1. Arquitectura
2. Implementación
3. Calidad de código
4. Deuda técnica
5. Feature completeness
6. Seguridad
7. Observabilidad

### Entregable
`docs/AUDIT-REPORT.md`

---

## Fase 2.7 — Suggestions completas + vista alumno 🔴 PRÓXIMA

### Scope
Completar el flow de attendance suggestions:

| # | Item |
|---|---|
| 2.7.1 | Summary de suggestions en Class Detail (pending/accepted/declined/canceled) |
| 2.7.2 | Lista completa de suggestions con acciones de operador (cancelar) |
| 2.7.3 | Vista alumno "Mis sugerencias de asistencia" |
| 2.7.4 | Aceptar/rechazar desde alumno (crea/no crea AttendanceIntent) |

### Endpoints
- `GET /class-sessions/:id/attendance/suggestions` (lista por sesión)
- `POST /class-sessions/:id/attendance/suggestions/:suggestionId/cancel`
- `GET /students/me/attendance-suggestions`
- `POST /students/me/attendance-suggestions/:id/accept`
- `POST /students/me/attendance-suggestions/:id/decline`

---

## Fase 3 — Público anónimo 🔴 PENDIENTE

### Backend confirmado (handoff reciente)
- Endpoint público de búsqueda con lat/lng/radiusKm (PostGIS)
- Geocoding provider-agnostic (Mapbox adapter)
- `MAPBOX_PERMANENT_GEOCODING_ENABLED=false` en V1

### Sub-tareas

| # | Nombre | Endpoints |
|---|---|---|
| 3.1 | Layout `(public)` group + header simple | — |
| 3.2 | Landing con mapa Mapbox | `/public/branches/search` |
| 3.3 | Búsqueda academias (q, city, country, distancia) | `/public/branches/search?lat=&lng=&radiusKm=` |
| 3.4 | Perfil público academia | `/public/branches/slug/:publicSlug` + schedules |
| 3.5 | Signup público | `POST /auth/signup` |
| 3.6 | Login común (manager + público) | — (existente) |
| 3.7 | Routing post-login para usuario público | — |
| 3.8 | Crear join request desde perfil | `POST /public/branches/:id/join-requests` |
| 3.9 | "Mis solicitudes" | `GET /me/intake-requests` |

### Decisiones tomadas
- Mapbox (free tier amplio + UI polished)
- Routing público anónimo (NO requiere login)
- Filtros backend (q, city, country, distancia con lat/lng/radiusKm)
- Signup mínimos + perfil completable después
- NO persistir ubicación del usuario (solo input temporal)
- Reglas privacidad: `addressLine1=null` si `publicAddressVisibility=false`

---

## Fase 3.5 — Branch Detail rework 🔴 PENDIENTE

### Scope
Pedido original del usuario (mockup en `docs/design-refs/`).
Aplicar paleta Night Ops + Cutout Cards, estructura coherente con Class Detail Page.

---

## Fase 4 — Mercado Pago 🔴 PENDIENTE

### Pendiente backend
Smoke E2E con URL pública HTTPS

| # | Nombre | Endpoints |
|---|---|---|
| 4.1 | MP Integration Status | `GET /integrations` |
| 4.2 | `/payments/success` page | `GET /students/:id/payments` |
| 4.3 | `/payments/failure` page | — |
| 4.4 | `/payments/pending` page | — |
| 4.5 | Checkout Pro init | `POST /billing-charges/:id/mercado-pago/preference` |
| 4.6 | Payment detail | `GET /students/:id/payments/:paymentId` |
| 4.7 | Webhook events viewer (admin) | `GET /integrations/:id/webhook-events` |
| 4.8 | Reprocess webhook event | `POST /webhook-events/:id/reprocess` |

---

## Fase 5 — Academy Events 🔴 PENDIENTE

### Pendiente confirmar
- RSVP/inscripciones
- Eventos públicos anónimos

| # | Nombre | Endpoints |
|---|---|---|
| 5.1 | Events list | `GET /academy-events` |
| 5.2 | Event detail | `GET /academy-events/:id` |
| 5.3 | Create/Edit event | `POST/PATCH /academy-events` |
| 5.4 | Publish action | `POST /academy-events/:id/publish` |
| 5.5 | Cancel action | `POST /academy-events/:id/cancel` |
| 5.6 | Archive action | `POST /academy-events/:id/archive` |
| 5.7 | Integración con calendario (overlay) | composición |

---

## Fase 6 — Branch Settings 🔴 PENDIENTE

### Backend listo
- Geocoding preview endpoint
- PATCH branch para coordenadas

| # | Nombre | Endpoints |
|---|---|---|
| 6.1 | Settings page con tabs | `GET /branches/:id` |
| 6.2 | General settings | `PATCH /branches/:id` |
| 6.3 | Public profile (con coordenadas y geocoding) | `PATCH /branches/:id`, `POST /geocode-preview` |
| 6.4 | Operations | parcial PATCH |
| 6.5 | Billing | `GET/PATCH /billing-policy`, `GET /billing-plans` |
| 6.6 | Integrations | `GET /integrations` |

---

## Fase 7 — Operaciones avanzadas 🔴 PENDIENTE

| # | Nombre |
|---|---|
| 7.1 | Instructors list |
| 7.2 | Instructor candidates |
| 7.3 | Instructor profile (own) |
| 7.4 | Instructor calendar |
| 7.5 | Instructor execution view |
| 7.6 | Student detail completo |
| 7.7 | Student edit |
| 7.8 | Student create |
| 7.9 | Branch visit create/edit |
| 7.10 | Intake request detail |
| 7.11 | Intake transition |
| 7.12 | Intake convert to student |
| 7.13 | Bulk invite students |

---

## Fase 8 — Comunicaciones 🔴 PENDIENTE

Announcements, messages inbox, requests queue, notifications, mark read/unread.

---

## Fase 9 — Promociones & Certificados 🔴 PENDIENTE

Promotion context, propose, evaluate, approve/reject, certificates upload/download/void/reissue.

---

## Fase 10 — Analytics & Audit 🔴 PENDIENTE

KPIs branch, tree summary, risk roster, attendance behavior signals, follow-up queue, audit log, entity timeline.

---

## Fase 11 — Organization Network Graph 🔴 PENDIENTE

V1 read-only de estructura operativa (org → branches → managers/coaches/instructors).
**Decisión pendiente:** react-flow vs d3-force.

---

## Fase 12 — Competiciones (Smoothcomp) 🔴 PENDIENTE

Link/unlink Smoothcomp, sync, profile detail, matches list, import runs.

---

## Fase 13+ — Futuro 🔴 LARGO PLAZO

### Pendiente backend
- Technical Lineage model
- Federation Network
- Community Feed

### Frontend exclusivo
- Mobile flows (PWA o react-native)
- Offline-first
- Multi-idioma en/pt

---

## Bloqueos actuales con backend

| Item | Fase afectada | Estado |
|---|---|---|
| Smoke E2E Mercado Pago con URL pública | 4 | Pendiente backend |
| RSVP/inscripciones Academy Events | 5 | NO confirmado |
| Eventos públicos anónimos | 5 | NO confirmado |
| Branch settings avanzados | 6 | NO confirmado |
| Endpoint dedicado Network Graph | 11 | Componer existentes |
| Technical Lineage model | 13+ | NO existe |
| Ventanas operación staff (attendance + QR) | 2.2 (live) | Mensaje enviado |
| Cap real de `expiresInMinutes` en QR | 2.2 (live) | Mensaje enviado |

---

## Dependencias entre fases

```
Fase 0 → 1 → 2.1 → 2.2 ✅
                    ↓
                    2.5 (Night Ops) ✅
                    2.6 (Class Detail) ✅
                    ↓
                    AUDIT 🟡 (en curso)
                    ↓
                    2.7 (suggestions completas) ← próxima
                    ↓
                    3 (público) + 3.5 (branch detail rework)
                    ↓
                    4 (MP) → 5 (events) → 6 (settings)
                                          ↓
                                          7 (ops avanzadas)
                                          ↓
                                          8 (comms) + 9 (promotions)
                                          ↓
                                          10 → 11 → 12
                                          ↓
                                          13+ (futuro)
```

---

## Cómo usar este documento

1. **Al empezar una sub-tarea:** revisar el ítem correspondiente y endpoints
2. **Al cerrar una sub-tarea:** marcar como ✅ con la fecha
3. **Al detectar un bloqueo:** agregarlo a "Bloqueos actuales con backend"
4. **Al confirmar algo con producto:** actualizar "Decisiones arquitectónicas" si aplica
5. **Al agregar una fase nueva:** consensuar antes de modificar

Roadmap vivo. Las prioridades pueden cambiar. Las reglas técnicas no negociables viven en `CLAUDE.md` y skill `kuro-architect`.