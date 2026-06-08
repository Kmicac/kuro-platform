# Known Gaps — KURO Platform

Registro vivo de problemas, gaps técnicos y mejoras identificadas durante el desarrollo. Sirve como referencia para futuros sprints y para coordinar con el backend.

**Última actualización:** Junio 2026

---

## Cómo usar este documento

1. Cuando se detecta un problema durante desarrollo o smoke testing → registrarlo aquí
2. Clasificar por tipo, severidad y estado
3. Si requiere backend → crear pedido en `docs/backend-requests/`
4. Si requiere frontend → planear en próximos sprints o crear TODO con fase
5. Cuando se resuelve → mover a sección "Resueltos" con fecha

---

## Convenciones

**Tipo:**
- `BACKEND` → requiere cambios en API
- `FRONTEND` → solo cambios frontend
- `UX` → mejora de experiencia (no es bug pero genera fricción)
- `DATA` → problema con la data en sí (seeds, estructura)
- `SECURITY` → vulnerabilidad o riesgo

**Severidad:**
- `ALTA` → bloquea uso normal o crea riesgo real
- `MEDIA` → genera fricción notable pero workaroundable
- `BAJA` → mejora marginal

**Estado:**
- `🔴 Detectado` → identificado, sin acción
- `🟡 Pedido` → comunicado al equipo correspondiente
- `🟠 En curso` → alguien está trabajando en esto
- `✅ Resuelto` → cerrado (con fecha)

---

## Gaps activos

### BACKEND

#### B-001 — Error 409 estructurado en attendance
- **Severidad:** Media
- **Estado:** 🟠 En curso (PARCIAL)
- **Detectado:** Sprint 2 (Junio 2026)
- **Workaround:** Parser dual estructurado + regex legacy en `lib/api/error-parsers.ts`
- **Pedido:** `docs/backend-requests/2026-06-attendance-error-code.md`
- **Descripción:** El backend devuelve el motivo del 409 como string libre en `message`. El frontend debe parsear con regex frágil para extraer las fechas de ventana válida. Pedido: agregar `code: "ATTENDANCE_OUTSIDE_WINDOW"` con campos estructurados `windowStart` y `windowEnd`.
- **Avance backend (Junio 2026):** PARCIAL. El backend resolvió la parte de QR (agregó 4 codes estructurados: `QR_SESSION_CANCELED`, `QR_ATTENDANCE_WINDOW_EXPIRED`, `QR_TOKEN_EXPIRATION_TOO_LONG`, `QR_OUTSIDE_CHECK_IN_WINDOW`), pero **NO** para la asistencia general (POST/PATCH/DELETE de attendance fuera de ventana siguen devolviendo string libre). El pedido B-001 sigue abierto para el caso general.

#### B-005 — Endpoint DELETE para class-schedules
- **Severidad:** Media
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Workaround:** Solo se puede activar/desactivar (toggle isActive), no eliminar
- **Pedido:** Pendiente de crear
- **Descripción:** No existe endpoint `DELETE /class-schedules/:id`. Esquema de horarios obsoletos queda persistiendo en la base de datos para siempre. Pedido: agregar soft-delete o hard-delete según política de retención.

#### B-006 — Domain de waitlist
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Workaround:** `waitlist: 0` siempre en responses
- **Pedido:** Pendiente
- **Descripción:** El backend no tiene dominio de waitlist (lista de espera). Cuando una clase llega al cap, no hay manejo de waitlist. Pedido: definir si se necesita, en qué fase del producto.

#### B-007 — Endpoint forgot-password
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Workaround:** Botón "Olvidé contraseña" muestra `alert()` "próximamente"
- **Pedido:** Pendiente
- **Descripción:** No existe endpoint para recuperación de contraseña. Aceptable en pre-launch, bloqueante para producción.

---

### UX / FRONTEND

#### F-001 — Visual feedback para optimistic IDs
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Detectado:** Sprint 2 (Junio 2026)
- **Descripción:** El guard contra clicks en IDs optimistas funciona conductualmente (Sprint 2), pero no hay feedback visual (spinner, opacity reducida) en el chip optimistic mientras se confirma. Requiere editar componente vendored `event-manager.tsx`, queda como follow-up para sprint dedicado.
- **Plan:** Resolver junto con Tarea 6 (limpieza event-manager.tsx) en sprint dedicado.

#### F-002 — Compliance Strip stub
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Descripción:** El componente `compliance-strip.tsx` en Class Detail Page es un stub "no integrado". Backend no expone agregado de waiver/billing por sesión todavía.
- **Plan:** Cuando backend implemente el agregado, completar el componente.

#### F-003 — Student Detail parcial
- **Severidad:** Media
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** La pantalla `student-detail.tsx` está reportada como ✅ en CLAUDE.md pero en realidad es parcial. Notas/certificados/guardian se derivan de un único payload de `useStudent`, no consumen los endpoints reales que ya existen en backend (`training-notes`, etc.).
- **Plan:** Sprint dedicado de "completar Student Detail" con endpoints reales.

#### F-004 — Intake "gestionar" stub
- **Severidad:** Media
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** Botón "Gestionar" en intake-list es `disabled` con tooltip "próximamente". Backend ya expone los endpoints de transición (`/intake-requests/:id/transition`, `/convert`).
- **Plan:** Sprint dedicado de "Academy Intake lifecycle".

#### F-005 — Notification badge hardcoded
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** El badge de notificaciones en topbar muestra `"3"` hardcodeado. Viola regla #9 (no hardcoded). Backend tiene endpoint `/notifications/unread-count`.
- **Plan:** Cuando se trabaje Fase 8 (Comunicaciones), reemplazar con dato real.

---

### TÉCNICA / DEUDA

#### T-001 — event-manager.tsx vendored sucio
- **Severidad:** Media
- **Estado:** 🟡 Decidido (pendiente ejecución)
- **Detectado:** Auditoría 2026-06
- **Descripción:** Archivo vendored de 1899 LOC con ~50 strings en voseo en código muerto (toolbar/filtros/diálogo desactivados). Viola regla de español neutro.
- **Decisión:** Opción A — limpiar parte muerta
- **Plan:** Sprint dedicado de limpieza, después de cerrar Sprint 2.

#### T-002 — Helpers duplicados
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** `initials()` duplicado 7 veces, `formatLongDate/formatTime` duplicado 5+ veces, `formatRelativeDate` 2 veces. Falta extracción a `lib/utils/`.
- **Plan:** Sprint 3 (higiene).

#### T-003 — DTOs en lugar incorrecto
- **Severidad:** Media
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** Algunos DTOs de request body viven en `lib/api/endpoints.ts` en vez de `lib/api/types.ts`. Tres componentes los importan de `endpoints.ts`, violando BUILD-PLAYBOOK rule.
- **Plan:** Sprint 3 (higiene).

#### T-004 — `motion` dep muerta + `shadcn` mal ubicado
- **Severidad:** Alta (limpieza)
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** `motion@^12.40` está en deps pero sin uso (duplica framer-motion). `shadcn@^4.8` está en deps pero es CLI (debería estar en devDeps + es v4 prohibida por CLAUDE.md).
- **Plan:** Sprint 3 (higiene).

#### T-005 — Componentes vendored muertos
- **Severidad:** Media
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** `grid-beam.tsx` (771 LOC) y `side-panel.tsx` (128 LOC) sin importadores. Vendored sin atribución.
- **Plan:** Sprint 3 (higiene) — borrar.

#### T-006 — Diálogos gigantes (ScheduleDialog + SessionDialog)
- **Severidad:** Media
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** `ScheduleDialog` (412 LOC en una función), `SessionDialog` (473 LOC). Mantenibilidad baja, refactor pendiente.
- **Plan:** Sprint 3 (higiene) — partir en sub-componentes (create vs edit, sub-forms).

#### T-007 — Sin logger gating NODE_ENV
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** No existe `lib/utils/logger.ts`. Los 2 `console.*` activos no tienen gating de entorno (uno se gateó en Sprint 1).
- **Plan:** Sprint 3 (higiene) — crear logger centralizado.

#### T-008 — `console.error` en login
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Workaround:** Toleramos en Sprint 1 (fuera de scope)
- **Plan:** Sprint 3 (higiene) — gatear con logger.

---

### SEGURIDAD

#### S-001 — Forms sin Zod
- **Severidad:** Baja
- **Estado:** 🔴 Detectado
- **Detectado:** Auditoría 2026-06
- **Descripción:** Forms de suggest-attendance-dialog y login arman payload de `useState`, sin Zod. Mitigado por `maxLength`/`type=email` HTML + validación server.
- **Plan:** Sprint 3 (higiene) — agregar schemas Zod.

#### S-002 — `currentBranchId` sobrevive logout
- **Severidad:** Info (no es bug)
- **Estado:** 🔴 Detectado
- **Workaround:** Validado contra membership en `hydrateSession`, sin riesgo cross-tenant
- **Plan:** Opcional — limpiar en logout para shared-device. Sprint 3 si se decide.

---

## Resueltos por backend (workaround pendiente eliminación)

Items que el backend resolvió y cuyo workaround en el frontend **se mantenía
activo** hasta un sprint de limpieza.

> **Vacío.** Los 3 items que estaban acá (B-002, B-003, B-004) se cerraron en el
> "Sprint de Eliminación de Workarounds" (2026-06-08). Ver sección
> [Resueltos](#resueltos).

---

## Endpoints backend disponibles no consumidos aún

Endpoints que ya existen en el backend y **dejaron de ser gap**, pero todavía
no los consume este frontend (informativo, no requiere acción inmediata):

- **Public Academy Map / Search** — Fase 3 pendiente.
- **Geocoding provider-agnostic** — Fase 3 pendiente.
- **Public profile endpoints** — Fase 3 pendiente.
- **Attendance Suggestions del lado alumno** (`/students/me/attendance-suggestions`, `accept`, `decline`) — responsabilidad de la app mobile (Flutter / Gonzalo), NO de este frontend web.

---

## Resueltos

### Sprint de Eliminación de Workarounds (2026-06-08)

> Commit hash: `_pendiente — completar al commitear_`

#### B-002 — Ventana de 15 min para generar QR ✅
- **Resuelto:** 2026-06-08 (workaround frontend eliminado)
- Backend: el endpoint ya no bloquea generación pre-ventana y devuelve
  `validFrom` / `validUntil` / `currentStatus` / `expiresInMinutes`.
- Frontend: la UI del QR ahora es contextual según `currentStatus` (SCHEDULED
  muestra "se activará el {fecha}", ACTIVE hace countdown contra `validUntil`).
  Se eliminó el countdown roto contra `expiresAt` (bug "1606:07"). Banners
  destructive para `QR_SESSION_CANCELED` y `QR_ATTENDANCE_WINDOW_EXPIRED`.

#### B-003 — Walk-in search server-side ✅
- **Resuelto:** 2026-06-08 (workaround frontend eliminado)
- Backend: `?q=` en `GET .../branches/:branchId/students`.
- Frontend: el walk-in dialog usa `q` con debounce de 300 ms. Se eliminó el
  filter client-side y el banner "Mostrando 100 de X" (`warnings.searchTruncated`).

#### B-004 — Cap real de `expiresInMinutes` en QR ✅
- **Resuelto:** 2026-06-08 (hardcode eliminado)
- Frontend: ya no se envía `expiresInMinutes` en el request del QR token; el
  backend define la ventana. La constante `QR_EXPIRES_MINUTES = 15` se eliminó
  de `qr-page.tsx` y `qr-modal.tsx`.

---

Ninguno aún (Sprint 1 + Sprint 2 cerraron items grandes pero todavía no se commitearon).

Después del push se moverán acá los items cerrados por:
- Error boundaries (Dim 7 ALTA)
- Capability gating Claims (Dim 2 ALTA)
- body.message crudo (Dim 6 MEDIA)
- Walk-in banner (Dim 4 ALTA)
- console.warn PII (Dim 6 LOW)
- Sentry telemetry (Dim 7 MEDIA)
- Roster error+retry (Dim 2 MEDIA)
- Parser 409 unificado (Dim 4 MEDIA)
- Guard optimistic IDs conductual (Dim 2 MEDIA)
- Security headers + CSP (Dim 6 MEDIA-LOW)

---

## Cómo agregar un gap nuevo

1. Identificá la categoría (BACKEND / UX / FRONTEND / TÉCNICA / SEGURIDAD)
2. Asignale un código siguiente al último (B-007, F-005, T-007, S-002)
3. Completá con la plantilla:
   - **Severidad:** Alta / Media / Baja
   - **Estado:** 🔴 Detectado
   - **Detectado:** [contexto, fecha]
   - **Workaround:** [si hay]
   - **Pedido:** [link a docs/backend-requests/ si aplica]
   - **Descripción:** [explicación clara y técnica]
   - **Plan:** [cuándo/cómo resolver]
4. Si requiere comunicación al backend → crear archivo en `docs/backend-requests/`

---

## Próximo sprint sugerido

**Sprint de Eliminación de Workarounds:**
Una vez confirmada la disponibilidad de los endpoints actualizados en
staging/producción, eliminar los siguientes workarounds del frontend:

- **Walk-in dialog:** filter client-side y banner de truncado → usar `?q=` con debounce (B-003).
- **QR:** bloqueo pre-ventana → mostrar QR con `currentStatus` (B-002).
- **QR:** hardcode `expiresInMinutes=15` → leer de `validFrom` / `validUntil` / `expiresAt` (B-004).
- **Parser de errores QR:** agregar handling de los 4 codes nuevos (`QR_SESSION_CANCELED`, `QR_ATTENDANCE_WINDOW_EXPIRED`, `QR_TOKEN_EXPIRATION_TOO_LONG`, `QR_OUTSIDE_CHECK_IN_WINDOW`) (B-001 parcial / B-002).