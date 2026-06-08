# Testing Checklist — KURO Platform

Checklists de testing por módulo. Usar al finalizar cada feature/sprint para validación sistemática.

**Filosofía:** No se considera un feature "terminado" hasta haber pasado el checklist correspondiente.

---

## Cómo usar este documento

1. Después de implementar un feature/módulo → buscar el checklist correspondiente abajo
2. Ejecutar TODOS los items del checklist
3. Si un item falla → documentarlo en `docs/known-gaps.md`
4. Decidir: ¿se arregla ahora o se posterga?
5. Marcar el checklist con fecha y resultado
6. Solo hacer push después de completar el checklist

---

## Checklist universal (todos los features)

Aplica a CUALQUIER feature nuevo o modificado:

### Compilación y build
- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm build` exitoso
- [ ] Sin warnings nuevos en consola

### i18n
- [ ] Cero strings hardcoded en JSX nuevo
- [ ] Todas las keys nuevas registradas en messages/es/*.json
- [ ] Type-safe augmentation pasa (TSC valida keys)
- [ ] Sin voseo (tú estándar)

### Sistema de diseño
- [ ] Sin colores brillantes (red-500, blue-600, etc.)
- [ ] Sin hex hardcoded en componentes
- [ ] Sin pure white/black
- [ ] Border radius ≤ 4px (excepto avatars)
- [ ] Font weight ≤ 600
- [ ] Icons stroke 1.5

### Estados de pantalla
- [ ] Estado loading manejado
- [ ] Estado empty manejado
- [ ] Estado error manejado
- [ ] Estado forbidden (403) manejado
- [ ] Estado stale (401) global ya manejado por client

### Permisos
- [ ] Capability gating en acciones nuevas
- [ ] Acciones que no son del rol están ocultas o disabled
- [ ] Backend 403 sigue siendo source of truth

### Mutaciones
- [ ] Optimistic update en mutaciones (donde aplica)
- [ ] Rollback en error
- [ ] Invalidate queries en onSettled
- [ ] Hook toast-free (caller maneja toast)
- [ ] Conflict handler en 409 (donde aplica)

### Telemetría
- [ ] Errores 5xx capturados (automático vía client)
- [ ] Sentry recibe eventos en producción
- [ ] No se logean datos sensibles (PII)
- [ ] requestId visible en errores del usuario

---

## Checklists por módulo

### 🔐 Autenticación (Fase 0)

- [ ] Login con credenciales válidas funciona
- [ ] Login con credenciales inválidas muestra error
- [ ] Refresh de página mantiene sesión (F5 OK)
- [ ] Logout limpia sesión y redirige a login
- [ ] Token NO está en localStorage/sessionStorage
- [ ] Refresh cookie es httpOnly
- [ ] CSRF token rota correctamente
- [ ] Sesión expirada redirige automáticamente a login
- [ ] "Olvidé contraseña" muestra mensaje (TODO endpoint backend)

---

### 🏢 Org Dashboard (Fase 1)

- [ ] Carga inicial muestra loading
- [ ] KPIs reales del backend (no hardcoded)
- [ ] Fallback `—` cuando no hay data
- [ ] Tree summary se renderiza
- [ ] Navegación a branch funciona
- [ ] 403 muestra ForbiddenState (no error genérico)
- [ ] Error de fetch muestra retry

---

### 🏛️ Branch Dashboard (Fase 1)

- [ ] Carga inicial loading
- [ ] Action summary KPIs
- [ ] Risk roster preview
- [ ] Agenda próximas clases
- [ ] Navegación a Calendar funciona
- [ ] Navegación a Students funciona
- [ ] 403 / error manejados

---

### 📅 Training Calendar (Fase 2.2)

- [ ] Vista Month renderiza grid completo
- [ ] Vista Week renderiza rango 06:00-00:00
- [ ] Vista Day renderiza rango 06:00-00:00
- [ ] Vista List ordenada cronológicamente
- [ ] Chips por modalidad con colores correctos (no brillantes)
- [ ] Click en chip abre Sheet con detail
- [ ] **Click en chip optimistic NO navega** (Sprint 2 guard)
- [ ] Filtros funcionan
- [ ] Navegación entre fechas
- [ ] Loading state visible
- [ ] Empty state cuando no hay clases
- [ ] Error state cuando falla fetch
- [ ] Banner si hay eventos fuera del rango (06:00-00:00)

---

### 🏃 Crear Sesión Única (Fase 2.2.1)

- [ ] Family button "+ Crear" abre Sheet
- [ ] Form con todos los campos requeridos
- [ ] Validación zod (errores inline)
- [ ] Optimistic update en calendar al submit
- [ ] Toast success
- [ ] Toast error si falla
- [ ] Conflict handler 409 (ConflictDialog)
- [ ] Capability check (canManageSchedules)
- [ ] Rollback visual si rollback
- [ ] requestId visible en errores

---

### ✏️ Editar Sesión (Fase 2.2.2)

- [ ] Sheet abre con mode=edit
- [ ] Form pre-poblado con data real
- [ ] Cambios trackean correctamente
- [ ] Submit hace PATCH
- [ ] Optimistic update
- [ ] Rollback en error
- [ ] Conflict 409 manejado

---

### ❌ Cancelar Sesión (Fase 2.2.3)

- [ ] Confirmación con motivo obligatorio
- [ ] Validación motivo no vacío
- [ ] Sheet cierra al confirmar
- [ ] Chip se marca cancelado en calendar
- [ ] Toast informativo
- [ ] Capability gating

---

### 📋 Asistencia STAFF_MANUAL (Fase 2.2.4)

- [ ] Ruta /sessions/:id/attendance carga
- [ ] Header con info de la sesión
- [ ] Lista de alumnos inscritos
- [ ] Marcar PRESENT funciona (optimistic)
- [ ] Marcar LATE funciona
- [ ] Notas inline editables
- [ ] **Banner 409 con ventana cuando fuera de horario** (Sprint 2)
- [ ] Walk-in dialog abre
- [ ] **Walk-in muestra banner truncado si >100 alumnos** (Sprint 1)
- [ ] **Walk-in error+retry funciona** (Sprint 2)
- [ ] Suggest dialog abre

---

### 📱 QR Check-in (Fase 2.2.12)

- [ ] Botón "Generar QR" presente
- [ ] ⚠️ **Hoy bloqueado hasta 15 min antes** (pedido backend B-002 pendiente)
- [ ] Pantalla `/qr` fullscreen renderiza
- [ ] QR code visible
- [ ] Polling de attendance funciona
- [ ] **Error+retry del roster funciona** (Sprint 2)
- [ ] Capability gating

---

### 💡 Sugerir Asistencia (Fase 2.2.13)

- [ ] Dialog abre
- [ ] Lista de alumnos seleccionables
- [ ] Validación al submit
- [ ] **NO logea PII en console** (Sprint 1)
- [ ] Toast success
- [ ] Capability gating

---

### 🗓️ Class Schedules (Fase 2.2.5-2.2.9)

- [ ] Lista de schedules carga
- [ ] Crear schedule (form Sheet)
- [ ] Editar schedule
- [ ] Activar/desactivar (toggle)
- [ ] Generate sessions desde schedule
- [ ] Generate-missing sessions
- [ ] ⚠️ **DELETE no existe** (pedido backend B-005)

---

### 👥 Students List & Detail (Parcial)

#### Lista
- [ ] Tabla con paginación
- [ ] Filtros funcionan
- [ ] Click navega a detail
- [ ] Loading / empty / error states

#### Detail (PARCIAL)
- [ ] Info básica carga
- [ ] ⚠️ **Notas/certificados/guardian son derivados, no de endpoints reales** (F-003 pendiente)

---

### 📨 Claims (Live)

- [ ] Lista de claims carga
- [ ] **Botón Invitar con capability gating** (Sprint 1)
- [ ] **Errores NO muestran body.message crudo** (Sprint 1)
- [ ] requestId visible en errores
- [ ] Acción Invite hace POST
- [ ] Toast success/error

---

### 🛡️ Error Boundaries (Sprint 1)

- [ ] Forzar throw en componente → ErrorState aparece
- [ ] ErrorState muestra título genérico (sin info sensible)
- [ ] Botón "Reintentar" funciona (reset())
- [ ] Botón "Volver al inicio" navega correctamente
- [ ] AppShell se mantiene (cuando aplica)
- [ ] **Evento llega a Sentry** (Sprint 2)
- [ ] Stack trace en Sentry correcto
- [ ] **Cookies/tokens redactados en Sentry**

---

### 🔒 Security Headers (Sprint 2)

Verificar en DevTools Network → Response Headers:
- [ ] `Strict-Transport-Security` presente
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` presente
- [ ] `Content-Security-Policy` presente
- [ ] Sin errores CSP en Console
- [ ] Login funciona normal con CSP activa

---

## Cuándo se considera un módulo "terminado"

Un módulo está terminado cuando:

1. ✅ Pasó el **Checklist universal** completo
2. ✅ Pasó el **Checklist específico** del módulo completo
3. ✅ Los items que NO pasaron están registrados en `docs/known-gaps.md`
4. ✅ Los TODOs explícitos están marcados con fase (`TODO(Fase X.X.X): ...`)
5. ✅ La documentación (CLAUDE.md, KURO-ROADMAP.md) está actualizada
6. ✅ Smoke manual completo en al menos un browser real

---

## Histórico de testing

### Sprint 1 — Resiliencia + cumplimiento
- **Fecha:** Junio 2026
- **Resultado:** ✅ Aprobado parcial
- **Notas:** Tests automáticos OK. Smoke manual: pendiente (QR roster bloqueado por gap B-002).

### Sprint 2 — Robustez + telemetría
- **Fecha:** Junio 2026
- **Resultado:** 🟡 En curso
- **Notas:**
  - Test 1 (Sentry setup) ✅
  - Test 2 (Sentry captura crash) ✅
  - Test 3 (Roster error retry) ⏸️ Pausado por gap B-002 (no se puede generar QR)
  - Test 3 Walk-in dialog: pendiente
  - Test 4 (409 parser): pendiente
  - Test 5 (Optimistic guard): pendiente
  - Test 6 (Security headers): pendiente