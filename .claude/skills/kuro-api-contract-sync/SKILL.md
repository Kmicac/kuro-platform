---
name: kuro-api-contract-sync
description: Ensures every endpoint usage in the frontend matches API-CONTRACT.md. Prevents calling phantom endpoints, drift between frontend and backend, and silent contract violations. Triggers when editing lib/api/, lib/hooks/, or any code that makes HTTP requests.
---

# KURO API Contract Sync

You are the contract integrity gate for KURO. Backend reality is in `API-CONTRACT.md`. Frontend code that diverges from it is a bug waiting to surface.

---

## 1. Core principle

EVERY HTTP request to the KURO backend MUST correspond to a documented endpoint in `API-CONTRACT.md`.

If an endpoint isn't in the contract:
- DO NOT assume it exists
- DO NOT invent shapes
- ASK the user/backend team

---

## 2. When you triggered

Activates when working on:
- `lib/api/endpoints.ts` (endpoint definitions)
- `lib/api/types.ts` (request/response types)
- `lib/hooks/use-*.ts` (data hooks)
- Any code calling `apiClient.*` or making fetch requests
- New features that imply backend calls

---

## 3. Pre-flight checklist for any endpoint

Before writing or modifying an endpoint:

```
□ Endpoint path exists in API-CONTRACT.md
□ HTTP method matches contract
□ Request body shape matches contract
□ Response shape matches contract  
□ Status codes documented (200/201/400/403/404/409/422)
□ Required capabilities documented
□ Query params documented
```

If ANY of these is missing, STOP and flag to the user.

---

## 4. Contract drift detection

When editing code, scan for:

### Phantom endpoints

```typescript
// ❌ STOP - is this in the contract?
apiClient.post(`/organizations/${orgId}/some-new-endpoint`)
```

Search `API-CONTRACT.md` for the path. If not found:
1. Flag immediately
2. Ask user: "¿Este endpoint existe en el backend? No lo encuentro en API-CONTRACT.md"
3. NO assumir que existe

### Wrong shapes

```typescript
// ❌ If contract says:
// { items: [...], meta: { total } }
// And code does:
const { results } = await fetch... // wrong key

// ✓ Match exactly the contract
const { items, meta } = await fetch...
```

### Missing fields

```typescript
// If contract response includes `correctionReasonCode`
// But frontend type only declares `status, notes`
// → flag missing field
```

### Outdated mutations

```typescript
// If endpoint expects { studentIds, message }
// But code sends { ids, note }
// → flag mismatch
```

---

## 5. Existing endpoint catalog

KURO API base: `/api/v1`

### Auth
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
GET    /auth/csrf
POST   /auth/step-up
POST   /auth/signup (público)
```

### Organizations / Branches
```
GET    /organizations/:orgId
GET    /organizations/:orgId/branches/:branchId
GET    /organizations/:orgId/branches/tree-summary
PATCH  /organizations/:orgId/branches/:branchId (settings, public profile)
POST   /organizations/:orgId/branches/:branchId/geocode-preview
```

### Public (anónimo)
```
GET    /public/branches/search (con lat/lng/radiusKm)
GET    /public/branches/:branchId
GET    /public/branches/slug/:publicSlug
GET    /public/branches/:branchId/schedules
POST   /public/branches/:branchId/join-requests
```

### Class Sessions
```
GET    /class-sessions/:sessionId
POST   /class-sessions (crear)
PATCH  /class-sessions/:sessionId (editar / cancelar)
GET    /branches/:branchId/class-calendar (view=MONTH/WEEK/DAY/LIST)
POST   /class-sessions/generate (bulk desde schedules)
POST   /class-sessions/generate-missing (llenar huecos)
```

### Class Schedules
```
GET    /class-schedules
GET    /class-schedules/:scheduleId (detail)
POST   /class-schedules
PATCH  /class-schedules/:scheduleId
POST   /class-schedules/:scheduleId/class-sessions (single-date)
```

### Attendance
```
GET    /class-sessions/:sessionId/attendance/technical-roster
POST   /class-sessions/:sessionId/attendance (record bulk)
PATCH  /class-sessions/:sessionId/attendance/:studentId (update)
DELETE /class-sessions/:sessionId/attendance/:studentId
POST   /class-sessions/:sessionId/attendance/qr-token
POST   /class-sessions/:sessionId/attendance/suggestions (sugerir)
GET    /class-sessions/:sessionId/attendance/suggestions (listar)
POST   /class-sessions/:sessionId/attendance/suggestions/:id/cancel
```

### Self (Student)
```
GET    /students/me/attendance-suggestions
POST   /students/me/attendance-suggestions/:id/accept
POST   /students/me/attendance-suggestions/:id/decline
PUT    /class-sessions/:sessionId/attendance/intent
```

### Students / Intake
```
GET    /branches/:branchId/students
GET    /students/:studentId
PATCH  /students/:studentId
POST   /students
GET    /branches/:branchId/intake-requests
POST   /intake-requests/:id/transition
POST   /intake-requests/:id/convert
```

### Instructors
```
GET    /branches/:branchId/instructors
GET    /branches/:branchId/instructors/candidates
```

### Catalogs
```
GET    /catalogs/promotion-ranks
```

If you need an endpoint NOT in this list, verify in `API-CONTRACT.md` first.

---

## 6. Status code conventions

All KURO endpoints follow this convention:

```
200 → OK con data
201 → Created
204 → No content (deletes)
400 → Bad Request (payload malformado)
401 → Unauthorized (no auth)
403 → Forbidden (sin capability)
404 → Not Found
409 → Conflict (overlap, ventana, estado inválido)
422 → Unprocessable (validación de negocio)
500 → Server error
```

Frontend SIEMPRE maneja al menos: 200/201, 400, 403, 404, 409, 422.

---

## 7. Error response shape

Standard error:

```typescript
interface ApiErrorResponse {
  error: string         // 'BadRequestException', 'Conflict', etc.
  message: string       // human-readable
  path: string          // endpoint path
  requestId: string     // UUID for support
  statusCode: number
  timestamp: string     // ISO
  
  // Optional extensions:
  code?: string         // for structured errors (e.g. 'CLASS_SESSION_CONFLICT')
  conflict?: object     // for 409 conflict details
  details?: object      // for 422 validation
}
```

Frontend handles via `ApiError` class in `lib/api/client.ts`.

---

## 8. Capability gating

Every mutation requires a capability. Frontend must:

1. Check `capabilities.<feature>.<action>` BEFORE rendering action buttons
2. Hide if `false`, disable with tooltip if `false` due to context
3. Still handle 403 from backend (last source of truth)

Common capabilities:

```
auth.canStepUp
classes.canManageSchedules
classes.canAssignInstructor
attendance.canValidateAttendance
attendance.canCorrectAttendanceWithinWindow
attendance.canCorrectAttendanceAsAdmin
attendance.canSuggestAttendance
organizations.canManageBranches
intake.canReviewRequests
```

When you write an action, ALWAYS pair with capability check.

---

## 9. Pending backend items (live workarounds)

Backend has these gaps documented. Frontend works around them temporarily:

### Walk-in search
- Backend: no search endpoint for students
- Frontend: `useBranchStudents(limit:100)` + client-side filter
- TODO: pedir endpoint si branch > 500 students

### Ventana corrección attendance
- Backend: no flag explícito "fuera de ventana"
- Frontend: heurística (sesión terminada + capability admin sin within-window)
- TODO: pedir flag explícito en roster response

### QR expiresInMinutes cap
- Backend: rechaza > 15 sin documentar cap real
- Frontend: hardcoded a 15
- TODO: pedir documentación del cap

### Ventana staff attendance
- Backend: 409 si fuera de ~2h pre-clase + duración
- Frontend: muestra banner + toast con motivo
- TODO: pedir ampliar ventana operativa

When working in these areas, KEEP the workaround. Do not "fix" by inventing endpoints.

---

## 10. Adding a new endpoint

When backend agrega un endpoint nuevo:

### Step 1: Verify it's in API-CONTRACT.md
If not: stop, ask user to update contract first.

### Step 2: Add to `lib/api/types.ts`
```typescript
// Request body
export interface FooBody {
  field: string
}

// Response
export interface FooResponse {
  id: string
  // ... matches contract EXACTLY
}
```

### Step 3: Add to `lib/api/endpoints.ts`
```typescript
export const fooApi = {
  create: (orgId: string, body: FooBody) =>
    apiClient.post<FooResponse>(
      `/organizations/${orgId}/foo`,
      body
    ),
}
```

### Step 4: Add hook in `lib/hooks/use-foo.ts`
- Toast-free
- Optimistic if applicable
- Proper queryKey
- Invalidations on settled

### Step 5: Document capability if new
If a new capability is introduced, add to `lib/auth/capabilities.ts` types.

---

## 11. Querykey conventions

Consistent queryKeys for cache management:

```typescript
['<resource>', branchId, params]
['<resource>', resourceId]
['session-roster', sessionId]
['class-calendar', branchId, view, dateRange]
['class-schedules', branchId, filters]
```

Match invalidations to these keys. Avoid wildcards.

---

## 12. Optimistic update pattern

```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: [...] })
  const previous = queryClient.getQueryData([...])
  queryClient.setQueryData([...], optimisticData)
  return { previous }
},
onError: (err, vars, context) => {
  if (context?.previous) {
    queryClient.setQueryData([...], context.previous)
  }
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: [...] })
}
```

---

## 13. When backend says one thing and code does another

Priority order:

1. **API-CONTRACT.md is source of truth** for shapes and paths
2. **If frontend code drifts from contract**, frontend is wrong
3. **If backend behavior drifts from contract**, raise ticket — DO NOT silently adapt frontend

Exception: when the contract has gaps (like the items in section 9), the frontend can have documented workarounds.

---

## 14. Reporting

After working on API-related code:

```
API CONTRACT SYNC:
- Endpoints usados: X
- En contrato: ✓
- Fuera de contrato: 0 (o lista si hay)
- Shapes coinciden: ✓
- Status codes manejados: 200/201/400/403/404/409/422
- Capabilities gateadas: ✓
- Optimistic updates: ✓ (donde aplica)
- Invalidations: ✓
```

---

## 15. Final rule

**Si el endpoint no está en API-CONTRACT.md, no existe.**

Pedile al usuario que actualice el contrato primero. NO inventar.