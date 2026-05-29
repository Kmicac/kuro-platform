# API Contract

- Generated at: 2026-05-28
- Backend version: `0.0.1`
- Source basis: current backend code in this repository
- API version: `v1`
- Base URL production: `https://bjj-ops-api.onrender.com/api/v1`
- Base URL development: `http://localhost:3001/api/v1`
- Auth model: Bearer access token + refresh cookie + CSRF for cookie-backed session csrf/refresh/logout flows
- Note: this document reflects the backend source in this workspace. If Render differs, the backend and this contract are out of sync and the contract must be updated.

## 1. Introducción

### Autenticación y sesión
- Access token: sent as `Authorization: Bearer <token>`.
- Refresh token: `httpOnly` cookie named by backend runtime config.
- CSRF token: issued alongside refresh cookie on login/signup/refresh and re-bootstrapped through `GET /auth/csrf` after a browser reload.
- Some sensitive actions require recent authentication (`RecentAuthGuard`) in addition to JWT auth.
- All authorization is enforced backend-side via policies and capability checks.
- Auth principals have two contexts:
  - `TENANT`: backed by a real active `OrganizationMembership`.
  - `PUBLIC`: global authenticated `User` without academy membership; `organizationId`, `membershipId`, `scopeType`, `branchIds`, and roles are null/empty.
- Public signup creates identity only. It never creates `Student`, `OrganizationMembership`, roles, branch access, billing, attendance, or tenant access.

### Paginación
- Standard query params: `page` and `limit`.
- Defaults: `page=1`, `limit=20`.
- Max `limit`: `100` unless a specific endpoint says otherwise.

### Fechas
- ISO timestamps: UTC ISO 8601 strings, example `2026-05-26T10:30:00.000Z`.
- Date-only fields and filters: `YYYY-MM-DD`.
- Time-only schedule fields: backend stores and returns them as strings such as `08:30:00`.

### Errores
- Standard error shape:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Missing capability",
  "path": "/api/v1/organizations/org_123",
  "requestId": "uuid",
  "timestamp": "2026-05-26T10:30:00.000Z"
}
```

- Common statuses:
  - `401` Unauthorized
  - `403` Forbidden
  - `404` Not Found
  - `409` Conflict
  - `422` Validation error
  - `429` Rate limit
  - `500` Internal server error

## Active Endpoint Index

Controller-verified on 2026-05-28. This index is the parity list used to keep the official Postman collection aligned with implemented NestJS controllers. Detailed request/response notes remain in the domain sections below.

- `DELETE /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/:studentId`
- `DELETE /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/intent`
- `DELETE /organizations/:organizationId/students/:studentId/competitions/smoothcomp/link`
- `GET /auth/csrf`
- `GET /auth/me`
- `GET /auth/sessions`
- `GET /catalogs/promotion-ranks`
- `GET /health/live`
- `GET /health/ready`
- `GET /me/intake-requests`
- `GET /metrics`
- `GET /organizations`
- `GET /organizations/:organizationId`
- `GET /organizations/:organizationId/academy-events`
- `GET /organizations/:organizationId/academy-events/:eventId`
- `GET /organizations/:organizationId/analytics/branches/:branchId/action-summary`
- `GET /organizations/:organizationId/analytics/branches/:branchId/risk-roster`
- `GET /organizations/:organizationId/analytics/branches/:branchId/subtree-summary`
- `GET /organizations/:organizationId/analytics/branches/tree-summary`
- `GET /organizations/:organizationId/audit`
- `GET /organizations/:organizationId/audit/entities/:entityType/:entityId/timeline`
- `GET /organizations/:organizationId/branches`
- `GET /organizations/:organizationId/branches/:branchId`
- `GET /organizations/:organizationId/branches/:branchId/attendance/behavior-signals`
- `GET /organizations/:organizationId/branches/:branchId/attendance/follow-ups`
- `GET /organizations/:organizationId/branches/:branchId/audit`
- `GET /organizations/:organizationId/branches/:branchId/audit/entities/:entityType/:entityId/timeline`
- `GET /organizations/:organizationId/branches/:branchId/billing-charges`
- `GET /organizations/:organizationId/branches/:branchId/billing-plans`
- `GET /organizations/:organizationId/branches/:branchId/billing-policy`
- `GET /organizations/:organizationId/branches/:branchId/billing-summary`
- `GET /organizations/:organizationId/branches/:branchId/class-calendar`
- `GET /organizations/:organizationId/branches/:branchId/class-schedules`
- `GET /organizations/:organizationId/branches/:branchId/class-session-gaps`
- `GET /organizations/:organizationId/branches/:branchId/class-sessions`
- `GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId`
- `GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance`
- `GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/intent`
- `GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/technical-roster`
- `GET /organizations/:organizationId/branches/:branchId/class-sessions/assigned`
- `GET /organizations/:organizationId/branches/:branchId/instructors`
- `GET /organizations/:organizationId/branches/:branchId/instructors/candidates`
- `GET /organizations/:organizationId/branches/:branchId/intake-requests`
- `GET /organizations/:organizationId/branches/:branchId/payments`
- `GET /organizations/:organizationId/branches/:branchId/payments/possible-duplicates`
- `GET /organizations/:organizationId/branches/:branchId/student-financial-statuses`
- `GET /organizations/:organizationId/branches/:branchId/students`
- `GET /organizations/:organizationId/branches/tree`
- `GET /organizations/:organizationId/certificates/:certificateId`
- `GET /organizations/:organizationId/certificates/:certificateId/download`
- `GET /organizations/:organizationId/certificates/mine`
- `GET /organizations/:organizationId/communications/announcements`
- `GET /organizations/:organizationId/communications/announcements/:announcementId`
- `GET /organizations/:organizationId/communications/inbox`
- `GET /organizations/:organizationId/communications/messages`
- `GET /organizations/:organizationId/communications/messages/:messageId`
- `GET /organizations/:organizationId/communications/requests/board`
- `GET /organizations/:organizationId/communications/requests/board/metrics`
- `GET /organizations/:organizationId/communications/requests/metrics`
- `GET /organizations/:organizationId/communications/requests/queue`
- `GET /organizations/:organizationId/competitions/external-profile-links`
- `GET /organizations/:organizationId/competitions/import-runs`
- `GET /organizations/:organizationId/competitions/import-runs/operational-snapshot`
- `GET /organizations/:organizationId/competitions/legacy-ownership-conflicts`
- `GET /organizations/:organizationId/instructors/:membershipId/calendar`
- `GET /organizations/:organizationId/instructors/me`
- `GET /organizations/:organizationId/instructors/me/calendar`
- `GET /organizations/:organizationId/instructors/me/class-sessions`
- `GET /organizations/:organizationId/instructors/me/class-sessions/:sessionId/execution`
- `GET /organizations/:organizationId/intake-requests/:requestId`
- `GET /organizations/:organizationId/integrations`
- `GET /organizations/:organizationId/integrations/:integrationId/external-links`
- `GET /organizations/:organizationId/integrations/:integrationId/sync-jobs`
- `GET /organizations/:organizationId/integrations/:integrationId/webhook-events`
- `GET /organizations/:organizationId/integrations/:integrationId/webhook-events/:eventId`
- `GET /organizations/:organizationId/me/capabilities`
- `GET /organizations/:organizationId/members`
- `GET /organizations/:organizationId/memberships/:membershipId`
- `GET /organizations/:organizationId/notifications`
- `GET /organizations/:organizationId/notifications/delivery/stats`
- `GET /organizations/:organizationId/notifications/unread-count`
- `GET /organizations/:organizationId/promotions`
- `GET /organizations/:organizationId/promotions/:promotionId`
- `GET /organizations/:organizationId/promotions/:promotionId/certificate`
- `GET /organizations/:organizationId/promotions/catalog`
- `GET /organizations/:organizationId/students/:studentId`
- `GET /organizations/:organizationId/students/:studentId/billing-charges`
- `GET /organizations/:organizationId/students/:studentId/billing-context`
- `GET /organizations/:organizationId/students/:studentId/certificates`
- `GET /organizations/:organizationId/students/:studentId/competitions/matches`
- `GET /organizations/:organizationId/students/:studentId/competitions/profile`
- `GET /organizations/:organizationId/students/:studentId/membership`
- `GET /organizations/:organizationId/students/:studentId/payments`
- `GET /organizations/:organizationId/students/:studentId/promotion-context`
- `GET /organizations/:organizationId/students/:studentId/technical-profile`
- `GET /organizations/:organizationId/students/:studentId/training-notes`
- `GET /organizations/:organizationId/students/me`
- `GET /organizations/:organizationId/students/me/attendance`
- `GET /organizations/:organizationId/students/me/calendar`
- `GET /organizations/:organizationId/students/me/notes`
- `GET /organizations/:organizationId/students/me/training-itinerary`
- `GET /organizations/:organizationId/training-calendar`
- `GET /organizations/:organizationId/training-calendar/class-sessions/:sessionId`
- `GET /organizations/:organizationId/training-notes/:noteId/revisions`
- `GET /organizations/:organizationId/users`
- `GET /organizations/:organizationId/users/:userId`
- `GET /public/branches/:branchId`
- `GET /public/branches/:branchId/schedules`
- `GET /public/branches/search`
- `GET /public/branches/slug/:publicSlug`
- `PATCH /organizations/:organizationId`
- `PATCH /organizations/:organizationId/academy-events/:eventId`
- `PATCH /organizations/:organizationId/branches/:branchId`
- `PATCH /organizations/:organizationId/branches/:branchId/attendance/follow-ups/:studentId`
- `PATCH /organizations/:organizationId/branches/:branchId/billing-plans/:planId`
- `PATCH /organizations/:organizationId/branches/:branchId/billing-policy`
- `PATCH /organizations/:organizationId/branches/:branchId/class-schedules/:scheduleId`
- `PATCH /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId`
- `PATCH /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/:studentId`
- `PATCH /organizations/:organizationId/communications/announcements/:announcementId`
- `PATCH /organizations/:organizationId/integrations/:integrationId`
- `PATCH /organizations/:organizationId/memberships/:membershipId/status`
- `PATCH /organizations/:organizationId/promotions/:promotionId/evaluation`
- `PATCH /organizations/:organizationId/status`
- `PATCH /organizations/:organizationId/students/:studentId`
- `PATCH /organizations/:organizationId/students/:studentId/branch-visits/:visitId`
- `PATCH /organizations/:organizationId/students/:studentId/membership`
- `PATCH /organizations/:organizationId/training-notes/:noteId`
- `POST /auth/accept-invitation`
- `POST /auth/accept-student-claim`
- `POST /auth/bootstrap`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/refresh`
- `POST /auth/signup`
- `POST /auth/step-up`
- `POST /integrations/webhooks/mercado-pago`
- `POST /internal/competitions/imports/:importRunId/smoothcomp`
- `POST /internal/competitions/publications/smoothcomp`
- `POST /organizations`
- `POST /organizations/:organizationId/academy-events`
- `POST /organizations/:organizationId/academy-events/:eventId/archive`
- `POST /organizations/:organizationId/academy-events/:eventId/cancel`
- `POST /organizations/:organizationId/academy-events/:eventId/publish`
- `POST /organizations/:organizationId/branches`
- `POST /organizations/:organizationId/branches/:branchId/billing-plans`
- `POST /organizations/:organizationId/branches/:branchId/class-schedules`
- `POST /organizations/:organizationId/branches/:branchId/class-schedules/:scheduleId/class-sessions`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/kiosk-check-in`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/qr-check-in`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/qr-token`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/self-check-in`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/generate`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/generate-missing`
- `POST /organizations/:organizationId/branches/:branchId/general-income`
- `POST /organizations/:organizationId/certificates/:certificateId/reissue`
- `POST /organizations/:organizationId/certificates/:certificateId/void`
- `POST /organizations/:organizationId/communications/announcements`
- `POST /organizations/:organizationId/communications/announcements/:announcementId/archive`
- `POST /organizations/:organizationId/communications/announcements/:announcementId/publish`
- `POST /organizations/:organizationId/communications/announcements/:announcementId/read`
- `POST /organizations/:organizationId/communications/messages`
- `POST /organizations/:organizationId/communications/messages/:messageId/acknowledge`
- `POST /organizations/:organizationId/communications/messages/:messageId/read`
- `POST /organizations/:organizationId/communications/messages/:messageId/reply`
- `POST /organizations/:organizationId/communications/requests/:messageId/operations`
- `POST /organizations/:organizationId/communications/requests/:messageId/status`
- `POST /organizations/:organizationId/communications/requests/automation/run`
- `POST /organizations/:organizationId/competitions/import-runs/:importRunId/reprocess`
- `POST /organizations/:organizationId/competitions/legacy-ownership-conflicts/:competitionProfileId/remediate-unlink`
- `POST /organizations/:organizationId/intake-requests/:requestId/convert`
- `POST /organizations/:organizationId/intake-requests/:requestId/transition`
- `POST /organizations/:organizationId/integrations`
- `POST /organizations/:organizationId/integrations/:integrationId/external-links`
- `POST /organizations/:organizationId/integrations/:integrationId/sync`
- `POST /organizations/:organizationId/integrations/:integrationId/test`
- `POST /organizations/:organizationId/integrations/:integrationId/webhook-events/:eventId/reprocess`
- `POST /organizations/:organizationId/memberships/:membershipId/sessions/revoke`
- `POST /organizations/:organizationId/notifications/:notificationId/read`
- `POST /organizations/:organizationId/notifications/delivery/process`
- `POST /organizations/:organizationId/notifications/read`
- `POST /organizations/:organizationId/notifications/read-all`
- `POST /organizations/:organizationId/promotions/:promotionId/approve`
- `POST /organizations/:organizationId/promotions/:promotionId/certificate`
- `POST /organizations/:organizationId/promotions/:promotionId/elevate`
- `POST /organizations/:organizationId/promotions/:promotionId/reject`
- `POST /organizations/:organizationId/promotions/:promotionId/review`
- `POST /organizations/:organizationId/students`
- `POST /organizations/:organizationId/students/:studentId/billing-charges`
- `POST /organizations/:organizationId/students/:studentId/billing-charges/:chargeId/mercado-pago/preference`
- `POST /organizations/:organizationId/students/:studentId/branch-visits`
- `POST /organizations/:organizationId/students/:studentId/competitions/smoothcomp/link`
- `POST /organizations/:organizationId/students/:studentId/competitions/sync`
- `POST /organizations/:organizationId/students/:studentId/invite`
- `POST /organizations/:organizationId/students/:studentId/membership`
- `POST /organizations/:organizationId/students/:studentId/payments/manual`
- `POST /organizations/:organizationId/students/:studentId/promotions`
- `POST /organizations/:organizationId/students/:studentId/training-notes`
- `POST /organizations/:organizationId/students/bulk-invite`
- `POST /organizations/:organizationId/students/me/notes`
- `POST /organizations/:organizationId/training-notes/:noteId/archive`
- `POST /organizations/:organizationId/training-notes/:noteId/void`
- `POST /organizations/:organizationId/users/invitations/:membershipId/reissue`
- `POST /organizations/:organizationId/users/invitations/:membershipId/revoke`
- `POST /organizations/:organizationId/users/invite`
- `POST /public/branches/:branchId/intake-requests`
- `POST /public/branches/:branchId/join-requests`
- `PUT /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/intent`
- `PUT /organizations/:organizationId/memberships/:membershipId/roles`
- `PUT /organizations/:organizationId/memberships/:membershipId/scopes`
## Public Catalogs

### Promotion rank catalog
`GET /catalogs/promotion-ranks`

**Roles permitted**: anonymous/public
**Capability requerida**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Response 200/201 — shape REAL del backend
```json
[
  {
    "rank": "KIDS_GREY_BLACK",
    "label": "Kids Grey/Black",
    "track": "KIDS",
    "maxStripes": 4,
    "order": 40
  },
  {
    "rank": "ADULT_BLACK",
    "label": "Adult Black",
    "track": "ADULT",
    "maxStripes": 0,
    "order": 50
  }
]
```

**Notes**
- This is a public read-only catalog with no tenant data.
- Frontend should cache this catalog aggressively; it changes only when backend rank policy changes.
- `rank` is the stable enum key. Do not parse rank labels or split enum strings to infer color/track.
- `MASTER_1..MASTER_7` and `JUVENILE_1/2` are not `PromotionRank` values; they are competition age divisions and belong in a future competition category catalog.

## 2. Autenticación

### Bootstrap inicial del sistema
`POST /auth/bootstrap`

**Roles permitidos**: no aplica, endpoint público pero disabled outside controlled setup
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Request body
```json
{
  "organizationName": "string",
  "organizationSlug": "string",
  "organizationDescription": "string",
  "organizationTimezone": "string",
  "branchName": "string",
  "branchSlug": "string",
  "branchCountryCode": "string",
  "branchRegion": "string",
  "branchCity": "string",
  "branchAddressLine1": "string",
  "branchAddressLine2": "string",
  "branchPostalCode": "string",
  "branchTimezone": "string",
  "adminEmail": "string",
  "adminPassword": "string",
  "adminFirstName": "string",
  "adminLastName": "string",
  "adminPhone": "string"
}
```

#### Response 200/201
```json
{
  "accessToken": "string",
  "principal": {
    "authContext": "TENANT",
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": null
    },
    "membership": {
      "id": "string",
      "organizationId": "string",
      "organizationSlug": "string",
      "organizationName": "string",
      "assignedRoles": ["MESTRE"],
      "scopeType": "ORGANIZATION_WIDE",
      "branchIds": ["string"],
      "primaryBranchId": "string"
    }
  }
}
```

#### Errores específicos
| Status | Caso | Mensaje |
|---|---|---|
| 403 | bootstrap disabled in runtime | Bootstrap is disabled outside controlled setup operations |
| 409 | system is not empty | Bootstrap is only allowed on an empty system |
| 422 | validation | Invalid payload |

**Nota**: este endpoint existe en código, pero en producción está deshabilitado por policy/config.

### Public signup
`POST /auth/signup`

**Roles permitidos**: público
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Request body
```json
{
  "email": "person@example.com",
  "password": "string",
  "firstName": "Camila",
  "lastName": "Prospect",
  "phone": null
}
```

#### Response 200/201 — shape REAL del backend
```json
{
  "accessToken": "string",
  "principal": {
    "authContext": "PUBLIC",
    "user": {
      "id": "usr_123",
      "email": "person@example.com",
      "firstName": "Camila",
      "lastName": "Prospect",
      "phone": null
    },
    "membership": null
  }
}
```

**Side effects**
- Sets refresh cookie.
- Sets CSRF cookie and response header.
- Creates `User` only.
- Does not return refresh token in JSON.

#### Errores específicos
| Status | Caso | Mensaje |
|---|---|---|
| 409 | email already exists | User already exists |
| 422 | validation | Invalid payload |
| 429 | auth route rate limit | Too Many Requests |

### Login
`POST /auth/login`

**Roles permitidos**: público
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Request body
```json
{
  "email": "string",
  "password": "string",
  "organizationSlug": "string"
}
```

#### Response 200/201
```json
{
  "accessToken": "string",
  "principal": {
    "authContext": "TENANT",
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": null
    },
    "membership": {
      "id": "string",
      "organizationId": "string",
      "organizationSlug": "string",
      "organizationName": "string",
      "assignedRoles": ["ORG_ADMIN"],
      "scopeType": "SELECTED_BRANCHES",
      "branchIds": ["string"],
      "primaryBranchId": "string"
    }
  }
}
```

Public user without active membership response:
```json
{
  "accessToken": "string",
  "principal": {
    "authContext": "PUBLIC",
    "user": {
      "id": "string",
      "email": "person@example.com",
      "firstName": "Camila",
      "lastName": "Prospect",
      "phone": null
    },
    "membership": null
  }
}
```

**Side effects**
- Sets refresh cookie.
- Sets CSRF cookie and response header.

#### Errores específicos
| Status | Caso | Mensaje |
|---|---|---|
| 401 | invalid credentials | Invalid credentials |

### CSRF bootstrap
`GET /auth/csrf`

**Roles permitidos**: valid refresh-cookie session
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Request
- No body.
- Browser clients must call with `credentials: include`.
- Does not require a previous `x-csrf-token` request header.
- When `REFRESH_TOKEN_COOKIE_SAMESITE=none`, the request `Origin` must exactly match one configured value in `CORS_ORIGINS`.

#### Response 200
```json
{}
```

Headers:
```http
x-csrf-token: <token>
```

**Side effects**
- Requires a valid refresh cookie/session.
- Issues or rotates the CSRF cookie.
- Exposes the CSRF token in the configured response header.
- Does not rotate the refresh cookie.
- Does not return `accessToken`.
- Does not return refresh token in JSON.

#### Errores específicos
| Status | Caso | Mensaje |
|---|---|---|
| 401 | missing/invalid refresh cookie or session | Refresh token not available |
| 403 | Origin not allowlisted in cross-site cookie mode | Origin not allowed |

### Refresh
`POST /auth/refresh`

**Roles permitidos**: JWT-authenticated session
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Response 200/201
```json
{
  "accessToken": "string"
}
```

**Side effects**
- Requires refresh cookie.
- Requires `x-csrf-token` when cross-site cookie mode is enabled.
- Rotates refresh cookie.
- Issues new CSRF cookie/header.
- Does not return refresh token in JSON.

### Logout current session
`POST /auth/logout`

**Roles permitidos**: JWT-authenticated session
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Response 200/201
```json
{
  "sessionId": "string",
  "revokedAt": "2026-05-26T10:30:00.000Z"
}
```

**Side effects**
- Requires refresh cookie.
- Clears refresh cookie.
- Clears CSRF cookie/header.

### Step-up authentication
`POST /auth/step-up`

**Roles permitidos**: JWT-authenticated session
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Request body
```json
{
  "password": "string"
}
```

#### Response 200/201
```json
{
  "sessionId": "string",
  "authenticatedAt": "2026-05-26T10:30:00.000Z"
}
```

### Current principal
`GET /auth/me`

**Roles permitidos**: JWT-authenticated session
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Response 200/201
```json
{
  "authContext": "TENANT",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": null,
    "status": "ACTIVE"
  },
  "membership": {
    "id": "string",
    "organizationId": "string",
    "organizationSlug": "string",
    "organizationName": "string",
    "assignedRoles": ["ACADEMY_MANAGER"],
    "scopeType": "ORGANIZATION_WIDE",
    "branchIds": ["string"],
    "primaryBranchId": "string"
  }
}
```

Public principal response:
```json
{
  "authContext": "PUBLIC",
  "user": {
    "id": "string",
    "email": "person@example.com",
    "firstName": "Camila",
    "lastName": "Prospect",
    "phone": null,
    "status": "ACTIVE"
  },
  "membership": null
}
```

### List user sessions
`GET /auth/sessions`

**Roles permitidos**: JWT-authenticated session
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Response 200/201
```json
[
  {
    "id": "string",
    "issuedAt": "2026-05-26T10:30:00.000Z",
    "expiresAt": "2026-05-27T10:30:00.000Z",
    "lastAuthenticatedAt": "2026-05-26T10:30:00.000Z",
    "revokedAt": null,
    "revokeReason": null,
    "ipAddress": "127.0.0.1",
    "userAgent": "string",
    "isCurrent": true,
    "status": "ACTIVE"
  }
]
```

### Logout all sessions
`POST /auth/logout-all`

**Roles permitidos**: JWT-authenticated session
**Capability requerida**: no aplica
**Step-up requerido**: sí
**Scope**: no aplica

#### Response 200/201
```json
{
  "revokedAt": "2026-05-26T10:30:00.000Z",
  "revokedCount": 3
}
```

### Accept invitation
`POST /auth/accept-invitation`

**Roles permitidos**: público
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

Accepts only organization user/member invitation tokens issued by
`POST /organizations/:organizationId/users/invite` or
`POST /organizations/:organizationId/users/invitations/:membershipId/reissue`.
These tokens are represented as `invitationToken` in Postman. They are not
valid for student account claim acceptance.
When `EXPOSE_INVITATION_TOKEN_IN_RESPONSE=false`, the response token is `null`
and the client must use the token from the delivered invitation link.

#### Request body
```json
{
  "token": "string",
  "password": "string"
}
```

#### Response 200/201
```json
{
  "accessToken": "string",
  "principal": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": null
    },
    "membership": {
      "id": "string",
      "organizationId": "string",
      "organizationSlug": "string",
      "organizationName": "string",
      "assignedRoles": ["STUDENT"],
      "scopeType": "SELECTED_BRANCHES",
      "branchIds": ["string"],
      "primaryBranchId": "string"
    }
  }
}
```

### Accept student claim
`POST /auth/accept-student-claim`

**Roles permitidos**: público
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

Accepts only existing-student account claim tokens issued by
`POST /organizations/:organizationId/students/:studentId/invite` or
`POST /organizations/:organizationId/students/bulk-invite`.
These tokens are represented as `studentClaimToken` in Postman. They are not
valid for organization user/member invitation acceptance.
When `EXPOSE_INVITATION_TOKEN_IN_RESPONSE=false`, the response token is `null`
and the client must use the token from the delivered claim link.

#### Request body
```json
{
  "token": "string",
  "password": "string"
}
```

#### Response 200/201
```json
{
  "accessToken": "string",
  "principal": {
    "user": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": null
    },
    "membership": {
      "id": "string",
      "organizationId": "string",
      "organizationSlug": "string",
      "organizationName": "string",
      "assignedRoles": ["STUDENT"],
      "scopeType": "SELECTED_BRANCHES",
      "branchIds": ["string"],
      "primaryBranchId": "string"
    }
  }
}
```

## 3. Capabilities & Roles

### Effective capabilities
`GET /organizations/:organizationId/me/capabilities`

**Roles permitidos**: JWT-authenticated member with organization access
**Capability requerida**: org access only
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
{
  "organizationId": "string",
  "userId": "string",
  "membershipId": "string",
  "organization": {
    "id": "string",
    "name": "string",
    "slug": "string"
  },
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  },
  "assignedRoles": ["ORG_ADMIN"],
  "scopeType": "SELECTED_BRANCHES",
  "primaryBranchId": "string",
  "selectedBranchIds": ["string"],
  "effectiveBranches": [
    {
      "branchId": "string",
      "branchName": "string",
      "effectiveRoles": ["HEAD_COACH"],
      "isHeadCoach": true,
      "canTeach": true,
      "canManageBranch": false
    }
  ],
  "capabilities": {
    "organizations": {
      "canReadOrganization": true,
      "canManageOrganization": false,
      "canReadBranches": true,
      "canManageBranches": false,
      "canReadGovernance": true
    },
    "usersMemberships": {
      "canInviteMembers": false,
      "canReadMembers": true,
      "canManageMemberships": false,
      "canManageRolesAndScopes": false,
      "canCreateStudentMembershipFromClaim": false
    },
    "students": {
      "canCreateStudent": true,
      "canReadStudentPrivateProfile": true,
      "canReadStudentTechnicalProfile": true,
      "canUpdateStudent": true,
      "canManageBranchVisits": true,
      "canInviteExistingStudent": false,
      "canBulkInviteStudents": false,
      "canClaimStudentAccount": false
    },
    "classes": {
      "canReadClasses": true,
      "canManageSchedules": true,
      "canAssignInstructor": true,
      "canExecuteAssignedClass": false,
      "canReadAssignedSessions": true,
      "canReadClassTechnicalRoster": true
    },
    "attendance": {
      "canReadSessionAttendance": true,
      "canValidateAttendance": true,
      "canCorrectAttendanceWithinWindow": true,
      "canCorrectAttendanceAsAdmin": true,
      "canReadAttendanceBehaviorSignals": true,
      "canReadAttendanceAnalytics": true
    },
    "promotions": {
      "canReadPromotionContext": true,
      "canProposePromotion": true,
      "canEvaluatePromotion": true,
      "canReadPromotionBranchQueue": true,
      "canReadPromotionOrgQueue": true,
      "canApprovePromotion": false,
      "canRejectPromotion": false
    },
    "certificates": {
      "canUploadCertificate": false,
      "canReadOwnCertificates": true,
      "canReadCertificateHistory": true,
      "canDownloadCertificate": true,
      "canVoidCertificate": false,
      "canReissueCertificate": false
    },
    "competitions": {
      "canReadCompetitionProfile": true,
      "canLinkCompetitionProfile": false,
      "canUnlinkCompetitionProfile": false,
      "canRequestCompetitionSync": false,
      "canOperateCompetitionImports": false,
      "canRemediateCompetitionOwnership": false
    },
    "billing": {
      "canReadBilling": true,
      "canWriteBilling": true,
      "canCreateMercadoPagoPreference": true,
      "canManagePaymentIntegrations": false,
      "canReadWebhookEvents": false,
      "canReprocessWebhookEvents": false
    },
    "communications": {
      "canReadOwnInbox": true,
      "canSendBranchAnnouncement": true,
      "canSendOrgAnnouncement": true,
      "canCreateRequest": false,
      "canReadOwnRequestQueue": true,
      "canReadRequestBoardBranch": true,
      "canReadRequestBoardOrg": true,
      "canManageRequests": true,
      "canRunRequestAutomation": false
    },
    "academyIntake": {
      "canReadBranchRequests": true,
      "canManageBranchRequests": true,
      "canProposeVisit": true,
      "canMarkVisitOutcome": true,
      "canConvertToStudent": true
    },
    "instructors": {
      "canReadInstructorRoster": true,
      "canReadInstructorCandidates": true,
      "canReadOwnInstructorCalendar": true,
      "canReadInstructorAdminCalendar": true,
      "canOpenOwnExecutionView": true,
      "canReadInstructorOperationalProfile": true
    },
    "trainingCalendar": {
      "canReadTrainingCalendar": true,
      "canReadStudentSelfCalendar": true,
      "canReadInstructorCalendar": true,
      "canReadBranchCalendar": true,
      "canReadAcademyEvents": true,
      "canManageClassCalendar": true,
      "canMarkAttendanceIntent": true
    },
    "academyEvents": {
      "canCreate": true,
      "canReadBranch": true,
      "canReadOrg": true,
      "canUpdate": true,
      "canPublish": true,
      "canCancel": true,
      "canArchive": true
    },
    "trainingNotes": {
      "canCreateTrainingNote": true,
      "canReadTrainingNote": true,
      "canReadPrivateTrainingNote": false,
      "canManageTrainingItinerary": true,
      "canUpdateOwn": false,
      "canUpdateStudentVisible": true,
      "canArchive": true,
      "canReadArchived": true,
      "canViewRevisionHistory": true,
      "canReceiveNotifications": true,
      "canNotifyStudent": true,
      "canNotifyCoach": false
    },
    "analytics": {
      "canReadBranchAnalytics": true,
      "canReadOrgAnalytics": true,
      "canReadHierarchyAnalytics": true,
      "canReadRiskRoster": true,
      "canReadBranchActionableAnalytics": true
    },
    "audit": {
      "canReadBranchAudit": true,
      "canReadOrgAudit": true
    },
    "integrations": {
      "canReadIntegrations": true,
      "canManageIntegrations": true,
      "canTestIntegrations": true,
      "canReadIntegrationWebhookEvents": true,
      "canReprocessIntegrationWebhookEvents": true
    },
    "notifications": {
      "canReadOwnNotifications": true,
      "canManageNotificationDelivery": true
    }
  },
  "limits": {
    "dynamicPermissions": false,
    "customRoles": false,
    "rbacV1": "policy-based-effective-capabilities",
    "backendEnforcement": "policies-are-authoritative",
    "sensitiveActionsMayRequireRecentAuth": true,
    "resourceScopedCapabilities": ["classes.canExecuteAssignedClass"],
    "notes": ["This endpoint is a UI-gating and onboarding read model only."]
  }
}
```

### Roles enum
`MembershipRole`

- `MESTRE`
- `ORG_ADMIN`
- `ACADEMY_MANAGER`
- `HEAD_COACH`
- `INSTRUCTOR`
- `STAFF`
- `STUDENT`

### Scopes enum
`MembershipScopeType`

- `ORGANIZATION_WIDE`
- `SELECTED_BRANCHES`

### Capability map

The backend exposes capabilities as a read model. Use these as route-family guidance:

| Capability | Protects |
|---|---|
| `organizations.canReadOrganization` | `GET /organizations/:organizationId` |
| `organizations.canManageOrganization` | `PATCH /organizations/:organizationId`, `PATCH /organizations/:organizationId/status` |
| `organizations.canReadBranches` | branch list/tree/detail routes |
| `organizations.canManageBranches` | branch create/update routes |
| `organizations.canReadGovernance` | branch governance-sensitive reads |
| `usersMemberships.canInviteMembers` | `POST /organizations/:organizationId/users/invite` |
| `usersMemberships.canReadMembers` | `GET /organizations/:organizationId/users`, `GET /organizations/:organizationId/members`, `GET /organizations/:organizationId/users/:userId` |
| `usersMemberships.canManageMemberships` | membership status changes and session revocation |
| `usersMemberships.canManageRolesAndScopes` | membership roles/scopes updates |
| `usersMemberships.canCreateStudentMembershipFromClaim` | `POST /organizations/:organizationId/students/:studentId/invite`, `POST /organizations/:organizationId/students/bulk-invite` |
| `students.canCreateStudent` | `POST /organizations/:organizationId/students` |
| `students.canReadStudentPrivateProfile` | student detail private reads |
| `students.canReadStudentTechnicalProfile` | `GET /organizations/:organizationId/students/:studentId/technical-profile` |
| `students.canUpdateStudent` | `PATCH /organizations/:organizationId/students/:studentId` |
| `students.canManageBranchVisits` | branch visit create/update |
| `students.canInviteExistingStudent` | student claim invite |
| `students.canBulkInviteStudents` | bulk claim invite |
| `classes.canReadClasses` | class schedules/sessions reads |
| `classes.canManageSchedules` | class schedule create/update and session generation |
| `classes.canAssignInstructor` | instructor assignment on class schedules/sessions |
| `classes.canExecuteAssignedClass` | instructor execution views and assigned session operations |
| `classes.canReadAssignedSessions` | assigned sessions list |
| `classes.canReadClassTechnicalRoster` | technical roster endpoint |
| `attendance.canReadSessionAttendance` | session attendance listing |
| `attendance.canValidateAttendance` | attendance record/write endpoints |
| `attendance.canCorrectAttendanceWithinWindow` | attendance correction within allowed window |
| `attendance.canCorrectAttendanceAsAdmin` | administrative attendance correction |
| `attendance.canReadAttendanceBehaviorSignals` | branch attendance signals and follow-up queues |
| `promotions.canReadPromotionContext` | student promotion context |
| `promotions.canProposePromotion` | create promotion request |
| `promotions.canEvaluatePromotion` | promotion evaluation upsert |
| `promotions.canReadPromotionBranchQueue` | branch promotions list/detail |
| `promotions.canReadPromotionOrgQueue` | org promotions list/detail |
| `promotions.canApprovePromotion` | approval routes |
| `promotions.canRejectPromotion` | rejection routes |
| `certificates.canUploadCertificate` | promotion certificate upload |
| `certificates.canReadOwnCertificates` | `/certificates/mine` |
| `certificates.canReadCertificateHistory` | student certificate history |
| `certificates.canDownloadCertificate` | certificate detail/download |
| `certificates.canVoidCertificate` | certificate void route |
| `certificates.canReissueCertificate` | certificate reissue route |
| `competitions.canReadCompetitionProfile` | competition profile reads |
| `competitions.canLinkCompetitionProfile` | link/unlink smoothcomp profile |
| `competitions.canRequestCompetitionSync` | competition sync route |
| `competitions.canOperateCompetitionImports` | import run operational routes |
| `competitions.canRemediateCompetitionOwnership` | legacy ownership remediation |
| `billing.canReadBilling` | billing reads |
| `billing.canWriteBilling` | billing create/update/payment recording |
| `billing.canCreateMercadoPagoPreference` | Mercado Pago preference creation |
| `billing.canManagePaymentIntegrations` | integration management for payment providers |
| `billing.canReadWebhookEvents` | integration webhook event listing |
| `billing.canReprocessWebhookEvents` | webhook reprocess |
| `communications.canReadOwnInbox` | own notifications/inbox |
| `communications.canSendBranchAnnouncement` | branch announcements |
| `communications.canSendOrgAnnouncement` | org announcements |
| `academyIntake.canReadBranchRequests` | intake request list/detail |
| `academyIntake.canManageBranchRequests` | intake transitions and conversion |
| `academyEvents.canCreate` | academy event create |
| `academyEvents.canReadBranch` | branch event reads |
| `academyEvents.canReadOrg` | org-wide event reads |
| `academyEvents.canUpdate` | academy event update |
| `academyEvents.canPublish` | academy event publish |
| `academyEvents.canCancel` | academy event cancel |
| `academyEvents.canArchive` | academy event archive |
| `analytics.canReadHierarchyAnalytics` | tree-summary and subtree-summary |
| `analytics.canReadBranchActionableAnalytics` | action-summary |
| `analytics.canReadRiskRoster` | risk-roster |
| `audit.canReadBranchAudit` | branch-scoped audit log |
| `audit.canReadOrgAudit` | org-scoped audit log |
| `integrations.canReadIntegrations` | integration list/detail reads |
| `integrations.canManageIntegrations` | create/update/test/sync integrations |
| `integrations.canReadIntegrationWebhookEvents` | webhook event listing/detail |
| `integrations.canReprocessIntegrationWebhookEvents` | webhook event reprocess |
| `notifications.canReadOwnNotifications` | notifications list/count/read |
| `notifications.canManageNotificationDelivery` | delivery stats/process |

### Enums

- `OrganizationStatus`: `DRAFT`, `ACTIVE`, `SUSPENDED`, `INACTIVE`, `CLOSED`
- `BranchStatus`: `DRAFT`, `ACTIVE`, `SUSPENDED`, `INACTIVE`, `CLOSED`, `TRANSITION`
- `UserStatus`: `ACTIVE`, `INVITED`, `SUSPENDED`, `INACTIVE`
- `MembershipStatus`: `INVITED`, `ACTIVE`, `SUSPENDED`, `REVOKED`
- `MembershipScopeType`: `ORGANIZATION_WIDE`, `SELECTED_BRANCHES`

## 4. Organizaciones

### Create organization
`POST /organizations`

**Roles permitidos**: authenticated member with org creation rights
**Capability requerida**: `organizations.canManageOrganization`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "defaultTimezone": "string"
}
```

#### Response 200/201
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": null,
  "defaultTimezone": "America/Argentina/Buenos_Aires",
  "status": "ACTIVE",
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z",
  "identity": {
    "organizationId": "string",
    "name": "string",
    "slug": "string"
  },
  "settings": {
    "defaultTimezone": "America/Argentina/Buenos_Aires",
    "description": null
  },
  "structure": {
    "branchesTotal": 1,
    "rootBranchesTotal": 1,
    "headquarterBranchesTotal": 1
  },
  "branchesSummary": {
    "activeBranchesTotal": 1,
    "inactiveBranchesTotal": 0,
    "listedBranchesTotal": 1,
    "publishedBranchesTotal": 1,
    "branchesNeedingReviewTotal": 0,
    "branchesWithoutOperationalOwnerTotal": 0
  },
  "attention": {
    "needsReview": false,
    "flags": []
  }
}
```

### List organizations
`GET /organizations`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canReadOrganization`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño de página |

#### Response 200/201
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": null,
      "defaultTimezone": "America/Argentina/Buenos_Aires",
      "status": "ACTIVE",
      "createdAt": "2026-05-26T10:30:00.000Z",
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "identity": { "organizationId": "string", "name": "string", "slug": "string" },
      "settings": { "defaultTimezone": "America/Argentina/Buenos_Aires", "description": null },
      "structure": { "branchesTotal": 1, "rootBranchesTotal": 1, "headquarterBranchesTotal": 1 },
      "branchesSummary": {
        "activeBranchesTotal": 1,
        "inactiveBranchesTotal": 0,
        "listedBranchesTotal": 1,
        "publishedBranchesTotal": 1,
        "branchesNeedingReviewTotal": 0,
        "branchesWithoutOperationalOwnerTotal": 0
      },
      "attention": { "needsReview": false, "flags": [] }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Get organization detail
`GET /organizations/:organizationId`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canReadOrganization`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "description": null,
  "defaultTimezone": "America/Argentina/Buenos_Aires",
  "status": "ACTIVE",
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z",
  "identity": { "organizationId": "string", "name": "string", "slug": "string" },
  "settings": { "defaultTimezone": "America/Argentina/Buenos_Aires", "description": null },
  "structure": {
    "branchesTotal": 1,
    "rootBranchesTotal": 1,
    "headquarterBranchesTotal": 1,
    "headquarterBranch": null,
    "rootBranches": [
      { "id": "string", "organizationId": "string", "parentBranchId": null, "isHeadquarter": true, "name": "HQ", "slug": "hq", "city": "Buenos Aires", "status": "ACTIVE" }
    ]
  },
  "branchesSummary": {
    "activeBranchesTotal": 1,
    "inactiveBranchesTotal": 0,
    "listedBranchesTotal": 1,
    "publishedBranchesTotal": 1,
    "branchesNeedingReviewTotal": 0,
    "branchesWithoutOperationalOwnerTotal": 0
  },
  "attention": { "needsReview": false, "flags": [] },
  "lifecycle": {
    "summary": {
      "createdAt": "2026-05-26T10:30:00.000Z",
      "statusUpdatedAt": null,
      "eventsTotal": 1
    },
    "timeline": null
  }
}
```

### Update organization settings
`PATCH /organizations/:organizationId`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canManageOrganization`
**Step-up requerido**: sí
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "name": "string",
  "description": "string",
  "defaultTimezone": "string"
}
```

#### Response
Returns the same shape as organization detail.

### Update organization status
`PATCH /organizations/:organizationId/status`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canManageOrganization`
**Step-up requerido**: sí
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "status": "ACTIVE"
}
```

#### Response
Returns the same shape as organization detail.

## 5. Branches / Filiales

### Create branch
`POST /organizations/:organizationId/branches`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canManageBranches`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "parentBranchId": "string",
  "name": "string",
  "slug": "string",
  "countryCode": "AR",
  "region": "string",
  "city": "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "postalCode": "string",
  "timezone": "America/Argentina/Buenos_Aires",
  "isPublicListed": true,
  "isHeadquarter": false,
  "publicProfile": {
    "publicSlug": "string",
    "displayName": "string",
    "shortBio": "string",
    "publicEmail": "string",
    "publicPhone": "string",
    "whatsapp": "string",
    "instagram": "string",
    "facebook": "string",
    "youtube": "string",
    "tiktok": "string",
    "website": "string",
    "latitude": -34.0,
    "longitude": -58.0,
    "publicAddressVisibility": true
  }
}
```

#### Response
Returns the branch detail shape below.

### List branches
`GET /organizations/:organizationId/branches`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canReadBranches`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño de página |
| `status` | enum | - | `BranchStatus` |
| `isHeadquarter` | boolean | - | Filtra headquarter |
| `isPublicListed` | boolean | - | Filtra visibilidad pública |
| `isPublished` | boolean | - | Perfil público publicado |
| `rootOnly` | boolean | - | Solo raíces |
| `needsAttention` | boolean | - | Solo con flags |
| `operationalReady` | boolean | - | readiness operacional |
| `communicationsReady` | boolean | - | readiness comunicaciones |
| `analyticsReady` | boolean | - | readiness analytics |
| `publicReady` | boolean | - | readiness pública |
| `hasOperationalOwner` | boolean | - | Tiene responsable |
| `hqReviewRequired` | boolean | - | Requiere revisión HQ |

#### Response 200/201
```json
{
  "items": [
    {
      "id": "string",
      "organizationId": "string",
      "parentBranchId": null,
      "name": "HQ",
      "slug": "hq",
      "city": "Buenos Aires",
      "countryCode": "AR",
      "timezone": "America/Argentina/Buenos_Aires",
      "status": "ACTIVE",
      "isHeadquarter": true,
      "isPublicListed": true,
      "headCoachMembership": null,
      "publicProfile": null,
      "parentBranch": null,
      "childrenCount": 0,
      "descendantsCount": 0,
      "createdAt": "2026-05-26T10:30:00.000Z",
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "identity": {
        "branchId": "string",
        "organizationId": "string",
        "name": "HQ",
        "slug": "hq",
        "city": "Buenos Aires",
        "countryCode": "AR"
      },
      "operational": {
        "status": "ACTIVE",
        "timezone": "America/Argentina/Buenos_Aires",
        "isHeadquarter": true,
        "headCoach": null
      },
      "publicSurface": {
        "isPublicListed": true,
        "isPublished": false,
        "publicSlug": null,
        "displayName": null,
        "latitude": null,
        "longitude": null,
        "publicAddressVisibility": false,
        "readyForPublicSurface": false
      },
      "hierarchy": {
        "isRoot": true,
        "depth": 0,
        "parentBranch": null,
        "rootBranch": null,
        "childrenCount": 0,
        "descendantsCount": 0,
        "subtreeBranchCount": 1
      },
      "privateAdmin": {
        "region": null,
        "addressLine1": null,
        "addressLine2": null,
        "postalCode": null
      },
      "attention": { "needsReview": false, "flags": [] },
      "governance": {}
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Branch tree
`GET /organizations/:organizationId/branches/tree`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canReadBranches`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
[
  {
    "id": "string",
    "organizationId": "string",
    "parentBranchId": null,
    "isHeadquarter": true,
    "name": "HQ",
    "slug": "hq",
    "city": "Buenos Aires",
    "status": "ACTIVE",
    "children": []
  }
]
```

### Get branch detail
`GET /organizations/:organizationId/branches/:branchId`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canReadGovernance`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
{
  "id": "string",
  "organizationId": "string",
  "parentBranchId": null,
  "name": "HQ",
  "slug": "hq",
  "city": "Buenos Aires",
  "countryCode": "AR",
  "timezone": "America/Argentina/Buenos_Aires",
  "status": "ACTIVE",
  "isHeadquarter": true,
  "isPublicListed": true,
  "headCoachMembership": null,
  "publicProfile": null,
  "parentBranch": null,
  "childrenCount": 0,
  "descendantsCount": 0,
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z",
  "identity": {
    "branchId": "string",
    "organizationId": "string",
    "name": "HQ",
    "slug": "hq",
    "city": "Buenos Aires",
    "countryCode": "AR"
  },
  "operational": {
    "status": "ACTIVE",
    "timezone": "America/Argentina/Buenos_Aires",
    "isHeadquarter": true,
    "headCoach": null
  },
  "publicSurface": {
    "isPublicListed": true,
    "isPublished": false,
    "publicSlug": null,
    "displayName": null,
    "latitude": null,
    "longitude": null,
    "publicAddressVisibility": false,
    "readyForPublicSurface": false,
    "profile": null
  },
  "hierarchy": {
    "isRoot": true,
    "depth": 0,
    "parentBranch": null,
    "rootBranch": null,
    "childrenCount": 0,
    "descendantsCount": 0,
    "subtreeBranchCount": 1,
    "ancestors": [],
    "children": []
  },
  "privateAdmin": {
    "region": null,
    "addressLine1": null,
    "addressLine2": null,
    "postalCode": null
  },
  "attention": { "needsReview": false, "flags": [] },
  "governance": {},
  "ancestors": [],
  "children": [],
  "lifecycle": { "summary": { "createdAt": "2026-05-26T10:30:00.000Z", "statusUpdatedAt": null, "eventsTotal": 1 }, "timeline": null }
}
```

### Update branch
`PATCH /organizations/:organizationId/branches/:branchId`

**Roles permitidos**: authenticated member
**Capability requerida**: `organizations.canManageBranches`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "parentBranchId": "string",
  "name": "string",
  "slug": "string",
  "countryCode": "AR",
  "region": "string",
  "city": "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "postalCode": "string",
  "timezone": "America/Argentina/Buenos_Aires",
  "isPublicListed": true,
  "isHeadquarter": false,
  "headCoachMembershipId": "string",
  "publicProfile": {
    "publicSlug": "string",
    "displayName": "string",
    "shortBio": "string",
    "publicEmail": "string",
    "publicPhone": "string",
    "whatsapp": "string",
    "instagram": "string",
    "facebook": "string",
    "youtube": "string",
    "tiktok": "string",
    "website": "string",
    "latitude": -34.0,
    "longitude": -58.0,
    "publicAddressVisibility": true
  }
}
```

#### Response
Returns the same shape as branch detail.

### Tree summary
`GET /organizations/:organizationId/analytics/branches/tree-summary`

**Roles permitidos**: authenticated member
**Capability requerida**: `analytics.canReadHierarchyAnalytics`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `activityWindowDays` | number | `30` | Ventana de actividad, `1..365` |

#### Response 200/201
```json
{
  "items": [
    {
      "branch": {
        "id": "string",
        "organizationId": "string",
        "parentBranchId": null,
        "isHeadquarter": true,
        "name": "HQ",
        "slug": "hq",
        "city": "Buenos Aires",
        "status": "ACTIVE"
      },
      "governance": {},
      "subtreeGovernance": {},
      "branchSummary": {},
      "subtreeSummary": {},
      "branchHealth": { "status": "HEALTHY", "score": 100, "drivers": [] },
      "subtreeHealth": { "status": "HEALTHY", "score": 100, "drivers": [] },
      "subtreeBranchCount": 1,
      "children": []
    }
  ],
  "priorityBranches": [],
  "governanceSummary": {},
  "readinessRankings": {
    "mostReady": [],
    "needsReview": [],
    "operationallyReadyButPublicNotReady": []
  },
  "activityWindowDays": 30
}
```

### Subtree summary
`GET /organizations/:organizationId/analytics/branches/:branchId/subtree-summary`

**Roles permitidos**: authenticated member
**Capability requerida**: `analytics.canReadHierarchyAnalytics`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `activityWindowDays` | number | `30` | Ventana de actividad, `1..365` |

#### Response 200/201
```json
{
  "branch": {
    "id": "string",
    "organizationId": "string",
    "parentBranchId": "string",
    "isHeadquarter": false,
    "name": "Branch",
    "slug": "branch",
    "city": "Córdoba",
    "status": "ACTIVE"
  },
  "ancestors": [],
  "branchGovernance": {},
  "governanceSummary": {},
  "branchSummary": {},
  "subtreeSummary": {},
  "branchHealth": { "status": "HEALTHY", "score": 100, "drivers": [] },
  "subtreeHealth": { "status": "HEALTHY", "score": 100, "drivers": [] },
  "priorityBranches": [],
  "readinessRankings": {
    "mostReady": [],
    "needsReview": [],
    "operationallyReadyButPublicNotReady": []
  },
  "subtreeBranchCount": 1,
  "activityWindowDays": 30
}
```

## 6. Memberships y Users

### List members
`GET /organizations/:organizationId/members`

**Roles permitidos**: authenticated member
**Capability requerida**: `usersMemberships.canReadMembers`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño |
| `branchId` | string | - | Filtra por branch |
| `search` | string | - | Busca nombre/email |
| `status` | enum | - | `MembershipStatus` |
| `scopeType` | enum | - | `MembershipScopeType` |
| `role` | enum | - | `MembershipRole` |
| `userStatus` | enum | - | `UserStatus` |

#### Response 200/201
```json
{
  "items": [
    {
      "id": "string",
      "organizationId": "string",
      "status": "ACTIVE",
      "scopeType": "SELECTED_BRANCHES",
      "primaryBranchId": "string",
      "assignedRoles": ["STUDENT"],
      "branchIds": ["string"],
      "user": {
        "id": "string",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "phone": null,
        "status": "ACTIVE",
        "emailVerifiedAt": null,
        "lastLoginAt": null,
        "hasPassword": true
      },
      "membership": {
        "id": "string",
        "status": "ACTIVE",
        "createdAt": "2026-05-26T10:30:00.000Z",
        "updatedAt": "2026-05-26T10:30:00.000Z"
      },
      "identity": {
        "userId": "string",
        "membershipId": "string",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "onboarding": {
        "hasPassword": true,
        "emailVerified": false,
        "invitationAccepted": true,
        "completed": true
      },
      "access": {
        "scopeType": "SELECTED_BRANCHES",
        "organizationWide": false,
        "assignedRoles": ["STUDENT"],
        "primaryBranch": null,
        "scopeBranches": [],
        "branchCount": 1,
        "accessState": "ACTIVE",
        "hasOperationalAccess": true
      },
      "invitation": {
        "pendingAcceptance": false,
        "expired": false,
        "expiresAt": null,
        "latestDeliveryStatus": null,
        "latestDeliveryFailureCode": null
      },
      "sessions": {
        "activeCount": 0,
        "hasActiveSessions": false,
        "latestIssuedAt": null,
        "latestAuthenticatedAt": null
      },
      "attention": { "needsReview": false, "flags": [] }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Get member detail
`GET /organizations/:organizationId/memberships/:membershipId`

**Roles permitidos**: authenticated member
**Capability requerida**: `usersMemberships.canReadMembers`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Response
Returns the membership detail shape:

```json
{
  "id": "string",
  "organizationId": "string",
  "status": "ACTIVE",
  "scopeType": "SELECTED_BRANCHES",
  "primaryBranchId": "string",
  "assignedRoles": ["STUDENT"],
  "branchIds": ["string"],
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": null,
    "status": "ACTIVE",
    "emailVerifiedAt": null,
    "lastLoginAt": null
  },
  "membership": {
    "id": "string",
    "status": "ACTIVE",
    "createdAt": "2026-05-26T10:30:00.000Z",
    "updatedAt": "2026-05-26T10:30:00.000Z"
  },
  "identity": { "userId": "string", "membershipId": "string", "fullName": "John Doe", "email": "john@example.com" },
  "access": {
    "scopeType": "SELECTED_BRANCHES",
    "organizationWide": false,
    "assignedRoles": ["STUDENT"],
    "primaryBranch": null,
    "scopeBranches": [],
    "branchCount": 1
  },
  "invitation": {
    "pendingAcceptance": false,
    "expired": false,
    "expiresAt": null,
    "latestDeliveryStatus": null,
    "latestDeliveryFailureCode": null,
    "deliveries": []
  },
  "sessions": {
    "activeSessionsCount": 0,
    "hasActiveSessions": false,
    "lastAuthenticatedAt": null
  },
  "attention": { "needsReview": false, "flags": [] },
  "lifecycle": { "summary": { "eventsTotal": 0, "createdAt": null, "acceptedAt": null }, "timeline": null }
}
```

### Update member roles
`PUT /organizations/:organizationId/memberships/:membershipId/roles`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canManageRolesAndScopes`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "roles": ["INSTRUCTOR"]
}
```

#### Response
Returns membership summary after role replacement.

### Update member scopes
`PUT /organizations/:organizationId/memberships/:membershipId/scopes`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canManageRolesAndScopes`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "scopeType": "SELECTED_BRANCHES",
  "branchIds": ["string"],
  "primaryBranchId": "string"
}
```

#### Response
Returns membership summary after scope replacement.

### Update member status
`PATCH /organizations/:organizationId/memberships/:membershipId/status`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canManageMemberships`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "status": "SUSPENDED"
}
```

#### Response
```json
{
  "membership": {
    "id": "string",
    "organizationId": "string",
    "status": "SUSPENDED",
    "scopeType": "SELECTED_BRANCHES",
    "primaryBranchId": "string",
    "assignedRoles": ["STUDENT"],
    "branchIds": ["string"]
  },
  "user": {
    "id": "string",
    "status": "SUSPENDED"
  }
}
```

### Revoke member sessions
`POST /organizations/:organizationId/memberships/:membershipId/sessions/revoke`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canManageMemberships`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
{
  "revokedAt": "2026-05-26T10:30:00.000Z",
  "revokedCount": 2
}
```

### List users
`GET /organizations/:organizationId/users`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canReadMembers`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño |
| `membershipStatus` | enum | - | `MembershipStatus` |
| `role` | enum | - | `MembershipRole` |
| `search` | string | - | Busca persona |
| `userStatus` | enum | - | `UserStatus` |
| `accessState` | enum | - | `INVITED_PENDING`, `INVITATION_EXPIRED`, `ACTIVE`, `ACTIVE_NO_SESSIONS`, `MEMBERSHIP_SUSPENDED`, `MEMBERSHIP_REVOKED`, `USER_SUSPENDED`, `ACCESS_REVIEW` |
| `hasActiveSessions` | boolean | - | Filtro |
| `needsAttention` | boolean | - | Filtro |

#### Response 200/201
```json
{
  "items": [
    {
      "id": "string",
      "userId": "string",
      "membershipId": "string",
      "organizationId": "string",
      "user": {
        "id": "string",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "phone": null,
        "status": "ACTIVE",
        "emailVerifiedAt": null,
        "lastLoginAt": null,
        "hasPassword": true
      },
      "membership": {
        "id": "string",
        "organizationId": "string",
        "status": "ACTIVE",
        "scopeType": "SELECTED_BRANCHES",
        "primaryBranchId": "string",
        "assignedRoles": ["STUDENT"],
        "branchIds": ["string"],
        "createdAt": "2026-05-26T10:30:00.000Z",
        "updatedAt": "2026-05-26T10:30:00.000Z"
      },
      "identity": {
        "userId": "string",
        "membershipId": "string",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": null
      },
      "onboarding": {
        "hasPassword": true,
        "emailVerified": false,
        "invitationAccepted": true,
        "completed": true
      },
      "access": {
        "accessState": "ACTIVE",
        "hasOperationalAccess": true,
        "scopeType": "SELECTED_BRANCHES",
        "organizationWide": false,
        "assignedRoles": ["STUDENT"],
        "primaryBranch": null,
        "scopeBranches": [],
        "branchCount": 1
      },
      "invitation": {
        "pendingAcceptance": false,
        "isExpired": false,
        "expiresAt": null,
        "latestDeliveryStatus": null,
        "latestDeliveryFailureCode": null
      },
      "sessions": {
        "activeCount": 0,
        "hasActiveSessions": false,
        "latestIssuedAt": null,
        "latestAuthenticatedAt": null
      },
      "attention": { "needsReview": false, "flags": [] }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Get user detail
`GET /organizations/:organizationId/users/:userId`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canReadMembers`
**Step-up requerido**: no
**Scope**: ORGANIZATION_WIDE

#### Response
Same as list item plus:
- `user.createdAt`
- `user.updatedAt`
- `invitation.history[]`
- `sessions.items[]`
- `lifecycle`

### Invite user
`POST /organizations/:organizationId/users/invite`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canInviteMembers`
**Step-up requerido**: sí
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "roles": ["INSTRUCTOR"],
  "scope": {
    "scopeType": "SELECTED_BRANCHES",
    "branchIds": ["string"],
    "primaryBranchId": "string"
  }
}
```

#### Response 200/201
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": null,
    "status": "INVITED"
  },
  "membership": {
    "id": "string",
    "organizationId": "string",
    "status": "INVITED",
    "assignedRoles": ["INSTRUCTOR"],
    "scopeType": "SELECTED_BRANCHES",
    "branchIds": ["string"],
    "primaryBranchId": "string"
  },
  "invitation": {
    "token": null,
    "expiresAt": "2026-06-02T10:30:00.000Z",
    "deliveryRequired": true
  },
  "delivery": {
    "channel": "EMAIL",
    "status": "SENT",
    "provider": "string",
    "requestedAt": "2026-05-26T10:30:00.000Z",
    "sentAt": "2026-05-26T10:30:00.000Z",
    "failureCode": null
  }
}
```

**Side effects**
- Sends invitation email.
- Writes audit event.

### Reissue invitation
`POST /organizations/:organizationId/users/invitations/:membershipId/reissue`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canInviteMembers`
**Step-up requerido**: sí
**Scope**: ORGANIZATION_WIDE

#### Response
Same as invite user, but `membership.status` reflects existing membership and audit action is `user.invitation.reissued`.

### Revoke invitation
`POST /organizations/:organizationId/users/invitations/:membershipId/revoke`

**Roles permitted**: authenticated member
**Capability requerida**: `usersMemberships.canInviteMembers`
**Step-up requerido**: sí
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
{
  "membership": {
    "id": "string",
    "organizationId": "string",
    "status": "REVOKED",
    "assignedRoles": ["INSTRUCTOR"],
    "scopeType": "SELECTED_BRANCHES",
    "branchIds": ["string"],
    "primaryBranchId": "string"
  },
  "user": {
    "id": "string",
    "email": "string",
    "status": "SUSPENDED"
  }
}
```

### Membership / user sessions revoke
`POST /organizations/:organizationId/memberships/:membershipId/sessions/revoke`

See membership section above.

## 7. Students

### Create student
`POST /organizations/:organizationId/students`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canCreateStudent`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "primaryBranchId": "string",
  "userId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "2026-01-01",
  "startedBjjAt": "2026-01-01",
  "joinedOrganizationAt": "2026-01-01",
  "technicalNotes": "string",
  "parentTutorName": "string",
  "parentTutorPhone": "string",
  "parentTutorRelation": "string",
  "promotionTrack": "ADULT",
  "currentBelt": "WHITE",
  "currentStripes": 0
}
```

#### Response
Returns the student admin view with private data.

### List students by branch
`GET /organizations/:organizationId/branches/:branchId/students`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canReadStudentPrivateProfile`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño |

#### Response
`{ items: [...], meta: { page, limit, total } }`

### Get student detail
`GET /organizations/:organizationId/students/:studentId`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canReadStudentPrivateProfile`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response shape
The private student view:
- list fields: `id`, `organizationId`, `primaryBranchId`, `firstName`, `lastName`, `email`, `phone`, `status`, `promotionTrack`, `currentBelt`, `currentStripes`, `createdAt`, `updatedAt`
- detail-only fields: `userId`, `dateOfBirth`, `startedBjjAt`, `joinedOrganizationAt`, `parentTutorName`, `parentTutorPhone`, `parentTutorRelation`, `primaryBranch`, `branchAssignments`, `branchVisits`, `activeBranchVisits`
- private field `technicalNotes` is hidden unless the caller has access
- `promotionCertificates` is hidden in the private view

### Get student technical profile
`GET /organizations/:organizationId/students/:studentId/technical-profile`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canReadStudentTechnicalProfile`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "firstName": "string",
  "lastName": "string",
  "primaryBranchId": "string",
  "primaryBranch": {
    "id": "string",
    "organizationId": "string",
    "name": "string",
    "slug": "string",
    "city": "string",
    "timezone": "America/Argentina/Buenos_Aires"
  },
  "promotionTrack": "ADULT",
  "currentBelt": "WHITE",
  "currentStripes": 0,
  "status": "ACTIVE"
}
```

### Update student
`PATCH /organizations/:organizationId/students/:studentId`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canUpdateStudent`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
Same writable student fields as create, plus:
```json
{
  "primaryBranchChangeReason": "string",
  "primaryBranchChangeNotes": "string"
}
```

#### Response
Same as student private detail view.

### Archive student
`PATCH /organizations/:organizationId/students/:studentId`

**Note**: archiving is represented as a status transition through the same update endpoint in current code.

### Student branch visit create
`POST /organizations/:organizationId/students/:studentId/branch-visits`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canManageBranchVisits`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "hostBranchId": "string",
  "startsAt": "2026-05-26T10:30:00.000Z",
  "endsAt": "2026-05-26T12:30:00.000Z",
  "reason": "string",
  "notes": "string"
}
```

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "studentId": "string",
  "homeBranchId": "string",
  "hostBranchId": "string",
  "startsAt": "2026-05-26T10:30:00.000Z",
  "endsAt": "2026-05-26T12:30:00.000Z",
  "status": "APPROVED",
  "reason": "string",
  "notes": "string",
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z"
}
```

### Student branch visit update
`PATCH /organizations/:organizationId/students/:studentId/branch-visits/:visitId`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canManageBranchVisits`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "startsAt": "2026-05-26T10:30:00.000Z",
  "endsAt": "2026-05-26T12:30:00.000Z",
  "status": "CANCELED",
  "reason": "string",
  "notes": "string"
}
```

#### Response
Same visit record shape as create.

### Account claim invitation
`POST /organizations/:organizationId/students/:studentId/invite`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canInviteExistingStudent`
**Step-up requerido**: sí
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "email": "string",
  "expiresInDays": 7
}
```

#### Response 200/201
```json
{
  "invitation": {
    "id": "string",
    "organizationId": "string",
    "branchId": "string",
    "studentId": "string",
    "email": "string",
    "status": "PENDING",
    "expiresAt": "2026-06-02T10:30:00.000Z",
    "createdAt": "2026-05-26T10:30:00.000Z",
    "token": null,
    "deliveryRequired": true
  },
  "delivery": {
    "channel": "EMAIL",
    "status": "SENT",
    "provider": "string",
    "requestedAt": "2026-05-26T10:30:00.000Z",
    "sentAt": "2026-05-26T10:30:00.000Z",
    "failureCode": null
  }
}
```

**Side effects**
- Sends claim invitation email.
- Writes audit event.

### Bulk invite student claims
`POST /organizations/:organizationId/students/bulk-invite`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canBulkInviteStudents`
**Step-up requerido**: sí
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "studentIds": ["string"],
  "expiresInDays": 7
}
```

#### Response 200/201
```json
{
  "summary": {
    "requested": 3,
    "invited": 2,
    "skipped": 1,
    "failed": 0
  },
  "results": [
    {
      "studentId": "string",
      "status": "INVITED",
      "reason": null,
      "invitationId": "string",
      "token": null,
      "delivery": {
        "channel": "EMAIL",
        "status": "SENT",
        "provider": "string",
        "requestedAt": "2026-05-26T10:30:00.000Z",
        "sentAt": "2026-05-26T10:30:00.000Z",
        "failureCode": null
      }
    }
  ]
}
```

## 8. Academy Intake

### Public intake create
`POST /public/branches/:branchId/intake-requests`

**Roles permitted**: público
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

**Notes**
- Public rate limiting applies.
- Duplicate active requests by branch/email are blocked.

#### Request body
```json
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "message": "string",
  "experienceLevel": "BEGINNER",
  "requestType": "INFO",
  "preferredStartAt": "2026-06-01",
  "preferredEndAt": "2026-06-30",
  "source": "PUBLIC_WEB",
  "consentToContact": true
}
```

#### Response 200/201
```json
{
  "id": "string",
  "branchId": "string",
  "status": "NEW",
  "requestType": "INFO",
  "experienceLevel": "BEGINNER",
  "preferredStartAt": "2026-06-01",
  "preferredEndAt": "2026-06-30",
  "consentToContact": true,
  "createdAt": "2026-05-26T10:30:00.000Z"
}
```

### Authenticated join request create
`POST /public/branches/:branchId/join-requests`

**Roles permitidos**: public authenticated user or tenant authenticated user
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: public requester-owned

**Notes**
- Requires bearer access token.
- Creates `AcademyIntakeRequest` with `requesterUserId=current user`.
- Does not create `Student`, `OrganizationMembership`, roles, branch access, billing, attendance, or academy access.
- Public intake route/IP throttling and branch-volume limiting apply.
- Active duplicates by `requesterUserId + organizationId + branchId` are blocked.
- Branch must be active, public-listed, and published. Hidden branches return not found.

#### Request body
```json
{
  "phone": null,
  "message": "I would like to join the beginners program.",
  "experienceLevel": "BEGINNER",
  "requestType": "JOIN_INTEREST",
  "preferredStartAt": "2026-06-01",
  "preferredEndAt": "2026-06-30",
  "source": "PUBLIC_APP",
  "consentToContact": true
}
```

#### Response 200/201 — shape REAL del backend
```json
{
  "id": "req_123",
  "branchId": "br_123",
  "status": "NEW",
  "requestType": "JOIN_INTEREST",
  "experienceLevel": "BEGINNER",
  "preferredStartAt": "2026-06-01",
  "preferredEndAt": "2026-06-30",
  "consentToContact": true,
  "createdAt": "2026-05-26T10:30:00.000Z"
}
```

#### Errores específicos del endpoint
| Status | Caso | Mensaje |
|---|---|---|
| 401 | no bearer token | Unauthorized |
| 404 | branch inactive/private/unlisted/unpublished | Branch is not accepting public intake requests |
| 409 | duplicate active requester request | ACTIVE_INTAKE_REQUEST_EXISTS |
| 422 | invalid body | Invalid payload |
| 429 | route/IP or branch-volume rate limit | Too Many Requests / PUBLIC_INTAKE_BRANCH_RATE_LIMITED |

### My intake requests
`GET /me/intake-requests`

**Roles permitidos**: authenticated user
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: requester-owned

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| page | number | 1 | Page number |
| limit | number | 20 | Page size |

#### Response 200/201 — shape REAL del backend
```json
{
  "items": [
    {
      "id": "req_123",
      "organizationId": "org_123",
      "branchId": "br_123",
      "status": "NEW",
      "requestType": "JOIN_INTEREST",
      "preferredStartAt": "2026-06-01",
      "preferredEndAt": "2026-06-30",
      "proposedStartAt": null,
      "proposedEndAt": null,
      "decisionAt": null,
      "source": "PUBLIC_APP",
      "createdAt": "2026-05-26T10:30:00.000Z",
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "branch": {
        "id": "br_123",
        "slug": "hq",
        "publicSlug": "alliance-hq",
        "displayName": "Alliance HQ",
        "city": "Buenos Aires",
        "region": null,
        "countryCode": "AR"
      },
      "organization": {
        "id": "org_123",
        "slug": "alliance",
        "name": "Alliance"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

#### Errores específicos del endpoint
| Status | Caso | Mensaje |
|---|---|---|
| 401 | no bearer token | Unauthorized |
| 422 | invalid pagination | Invalid query |

### List intake requests by branch
`GET /organizations/:organizationId/branches/:branchId/intake-requests`

**Roles permitted**: authenticated member
**Capability requerida**: `academyIntake.canReadBranchRequests`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response 200/201
```json
{
  "items": [
    {
      "id": "string",
      "organizationId": "string",
      "branchId": "string",
      "requesterUserId": null,
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "message": "string",
      "experienceLevel": "BEGINNER",
      "requestType": "INFO",
      "status": "NEW",
      "preferredStartAt": "2026-06-01",
      "preferredEndAt": "2026-06-30",
      "proposedStartAt": null,
      "proposedEndAt": null,
      "proposedByMembershipId": null,
      "assignedToMembershipId": null,
      "decisionByMembershipId": null,
      "decisionAt": null,
      "decisionReason": null,
      "convertedStudentId": null,
      "convertedMembershipId": null,
      "source": "PUBLIC_WEB",
      "consentToContact": true,
      "consentAt": "2026-05-26T10:30:00.000Z",
      "createdAt": "2026-05-26T10:30:00.000Z",
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "branch": {
        "id": "string",
        "organizationId": "string",
        "parentBranchId": null,
        "isHeadquarter": true,
        "name": "HQ",
        "slug": "hq",
        "city": "Buenos Aires",
        "status": "ACTIVE"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Intake request detail
`GET /organizations/:organizationId/intake-requests/:requestId`

**Roles permitted**: authenticated member
**Capability requerida**: `academyIntake.canReadBranchRequests`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
Same object as list item.

### Transition intake request
`POST /organizations/:organizationId/intake-requests/:requestId/transition`

**Roles permitted**: authenticated member
**Capability requerida**: `academyIntake.canManageBranchRequests`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "status": "REVIEWING",
  "proposedStartAt": "2026-06-01",
  "proposedEndAt": "2026-06-30",
  "decisionReason": "string",
  "assignedToMembershipId": "string"
}
```

#### Response
The full intake request view.

### Convert intake request
`POST /organizations/:organizationId/intake-requests/:requestId/convert`

**Roles permitted**: authenticated member
**Capability requerida**: `academyIntake.canConvertToStudent`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "conversionReason": "string"
}
```

#### Response 200/201
```json
{
  "request": {},
  "student": {},
  "membership": {
    "id": "string",
    "organizationId": "string",
    "userId": "string",
    "status": "ACTIVE",
    "scopeType": "SELECTED_BRANCHES",
    "primaryBranchId": "string",
    "roles": ["STUDENT"],
    "branchIds": ["string"]
  },
  "user": {},
  "activation": {
    "required": true,
    "status": "INVITATION_SENT",
    "expiresAt": "2026-06-02T10:30:00.000Z",
    "delivery": null
  }
}
```

## 9. Classes & Schedules

### Create class schedule
`POST /organizations/:organizationId/branches/:branchId/class-schedules`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "instructorMembershipId": "string",
  "title": "string",
  "classType": "GI",
  "description": "string",
  "weekday": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "09:30:00",
  "timezone": "America/Argentina/Buenos_Aires",
  "capacity": 20,
  "isActive": true
}
```

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "branchId": "string",
  "instructorMembershipId": "string",
  "title": "string",
  "classType": "GI",
  "description": null,
  "weekday": "MONDAY",
  "startTime": "08:00:00",
  "endTime": "09:30:00",
  "timezone": "America/Argentina/Buenos_Aires",
  "capacity": 20,
  "isActive": true,
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z",
  "instructorMembership": {
    "id": "string",
    "user": { "id": "string", "firstName": "string", "lastName": "string" }
  }
}
```

### List class schedules
`GET /organizations/:organizationId/branches/:branchId/class-schedules`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
`{ items: [...], meta: { page, limit, total } }`

### Update class schedule
`PATCH /organizations/:organizationId/branches/:branchId/class-schedules/:scheduleId`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
Same as create, all optional, `capacity` can be `null`.

#### Response
Same as schedule item.

### Create class session
`POST /organizations/:organizationId/branches/:branchId/class-sessions`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "classScheduleId": "string",
  "instructorMembershipId": "string",
  "title": "string",
  "classType": "GI",
  "scheduledDate": "2026-05-26",
  "startAt": "2026-05-26T08:00:00.000Z",
  "endAt": "2026-05-26T09:30:00.000Z",
  "capacity": 20,
  "notes": "string"
}
```

### Create class session from schedule
`POST /organizations/:organizationId/branches/:branchId/class-schedules/:scheduleId/class-sessions`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "scheduledDate": "2026-06-03",
  "notes": "Optional internal class session notes"
}
```

#### Response 200/201 — shape REAL del backend
Returns the created `ClassSession` record. The endpoint creates exactly one session instance from one active schedule for the given `scheduledDate`.

```json
{
  "id": "class_session_123",
  "organizationId": "org_123",
  "branchId": "branch_123",
  "classScheduleId": "class_schedule_123",
  "instructorMembershipId": "membership_123",
  "title": "Fundamentals",
  "classType": "GI",
  "scheduledDate": "2026-06-03T00:00:00.000Z",
  "startAt": "2026-06-03T18:00:00.000Z",
  "endAt": "2026-06-03T19:00:00.000Z",
  "capacity": 20,
  "status": "SCHEDULED",
  "cancellationReason": null,
  "notes": "Optional internal class session notes",
  "createdAt": "2026-05-27T10:30:00.000Z",
  "updatedAt": "2026-05-27T10:30:00.000Z",
  "deletedAt": null
}
```

**Behavior**
- Uses the schedule snapshot for title, class type, instructor, start/end local time, timezone and capacity.
- Requires `scheduledDate` in `YYYY-MM-DD` format and it must match the schedule weekday.
- Runs the same branch overlap and instructor overlap validations as manual session creation.
- Diff vs branch session generation: this endpoint creates one explicit session for one schedule/date; generation scans all active schedules in a date range and returns counters.
- Diff vs branch missing-session generation: this endpoint does not inspect a date range for gaps; missing-session generation scans existing materialized sessions and fills missing schedule/date instances.

#### Errores específicos del endpoint
| Status | Caso | Mensaje |
|---|---|---|
| 400 | date does not match schedule weekday or invalid time window | Scheduled date does not match schedule weekday |
| 403 | no schedule management capability for branch | Insufficient class schedule management capability |
| 404 | schedule/branch not found in organization | Class schedule not found |
| 409 | session already exists or overlaps branch/instructor session | Class session already exists for schedule/date |

### Generate class sessions
`POST /organizations/:organizationId/branches/:branchId/class-sessions/generate`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "fromDate": "2026-06-01",
  "toDate": "2026-06-30"
}
```

#### Response
```json
{
  "fromDate": "2026-06-01",
  "toDate": "2026-06-30",
  "processedSchedules": 10,
  "candidateCount": 42,
  "generatedCount": 12,
  "skippedExistingCount": 20,
  "skippedConflictCount": 10
}
```

### Generate missing class sessions
`POST /organizations/:organizationId/branches/:branchId/class-sessions/generate-missing`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
Same as generate.

#### Response
Same response shape, with `missingCandidateCount` if the backend returns that counter.

### Assigned class sessions
`GET /organizations/:organizationId/branches/:branchId/class-sessions/assigned`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadAssignedSessions`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
`{ items: [...], meta: { page, limit, total } }`

### List class sessions
`GET /organizations/:organizationId/branches/:branchId/class-sessions`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño |
| `fromDate` | date | - | inicio |
| `toDate` | date | - | fin |

#### Response
`{ items: [...], meta: { page, limit, total } }`

**Frontend contract note**
- This endpoint returns the compact branch operations list shape from `ClassSession`.
- `scheduledDate` is serialized as an ISO timestamp (`YYYY-MM-DDT00:00:00.000Z`), not a bare `YYYY-MM-DD`.
- `status` values are exactly `SCHEDULED`, `COMPLETED`, `CANCELED`; there is no `CANCELLED` or `IN_PROGRESS` status in the backend enum.
- Use `GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId` for Session Detail, because it adds branch, instructor, capacity and attendance summaries.

### Class session detail
`GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response 200/201 — shape REAL del backend
```json
{
  "id": "class_session_123",
  "organizationId": "org_123",
  "branchId": "branch_123",
  "classScheduleId": null,
  "title": "No Gi Detail Session",
  "description": "Session detail notes",
  "notes": "Session detail notes",
  "classType": "FUNDAMENTALS",
  "status": "SCHEDULED",
  "startAt": "2026-05-26T18:00:00.000Z",
  "endAt": "2026-05-26T19:00:00.000Z",
  "scheduledDate": "2026-05-26T00:00:00.000Z",
  "branch": {
    "id": "branch_123",
    "name": "Alliance Centro",
    "slug": "centro",
    "timezone": "America/Sao_Paulo"
  },
  "instructor": {
    "id": "membership_123",
    "membershipId": "membership_123",
    "userId": "user_123",
    "firstName": "Assigned",
    "lastName": "Instructor",
    "role": "INSTRUCTOR",
    "primaryBelt": {
      "rank": "ADULT_BLACK",
      "label": "Adult Black",
      "track": "ADULT",
      "maxStripes": 0,
      "order": 50
    }
  },
  "capacity": {
    "max": 20,
    "enrolled": 1,
    "waitlist": 0
  },
  "attendance": {
    "expected": 1,
    "present": 1,
    "absent": 0,
    "excused": 0,
    "late": 0
  },
  "cancellationReason": null,
  "cancelledAt": null,
  "cancelledByMembershipId": null,
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z"
}
```

**Notes**
- `description` mirrors `ClassSession.notes`; `notes` is kept for compatibility with existing class-session surfaces.
- `instructor.primaryBelt` is a rich `PromotionRank` catalog entry or `null`; frontend must not parse rank strings with `split("_")`.
- `status` uses the backend enum value `CANCELED`, not `CANCELLED`.
- `scheduledDate` is serialized as an ISO timestamp (`YYYY-MM-DDT00:00:00.000Z`) by Nest/JSON.
- `capacity.enrolled` and `attendance.expected` currently use active attendance intents; `waitlist` is `0` because there is no waitlist domain yet.
- `cancelledAt` and `cancelledByMembershipId` are derived from the latest `class_session.canceled` audit entry when available.

#### Errores específicos del endpoint
| Status | Caso | Mensaje |
|---|---|---|
| 403 | no branch class read capability | Insufficient class session read capability |
| 404 | session does not exist in branch/org | Class session not found |

### Class calendar
`GET /organizations/:organizationId/branches/:branchId/class-calendar`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `startDate` | date | required | Start of view |
| `view` | enum | `DAY` | `DAY`, `WEEK` |

#### Response
```json
{
  "view": "WEEK",
  "startDate": "2026-05-26",
  "endDate": "2026-06-01",
  "days": [
    {
      "date": "2026-05-26",
      "items": []
    }
  ]
}
```

**Frontend contract note**
- This is a branch-scoped operational calendar, not the student self calendar.
- Items use the compact class-session list shape, not the Session Detail shape.
- For student-facing calendar UI, use `GET /organizations/:organizationId/students/me/calendar` or `GET /organizations/:organizationId/training-calendar`.

### Class session gaps
`GET /organizations/:organizationId/branches/:branchId/class-session-gaps`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `fromDate` | date | required | start |
| `toDate` | date | required | end |

#### Response
```json
{
  "fromDate": "2026-06-01",
  "toDate": "2026-06-30",
  "summary": {
    "activeSchedules": 0,
    "materializedSessions": 0,
    "missingSessions": 0
  },
  "days": []
}
```

### Update class session
`PATCH /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "instructorMembershipId": "string",
  "title": "string",
  "classType": "GI",
  "scheduledDate": "2026-05-26",
  "startAt": "2026-05-26T08:00:00.000Z",
  "endAt": "2026-05-26T09:30:00.000Z",
  "capacity": 20,
  "status": "CANCELED",
  "cancellationReason": "string",
  "notes": "string"
}
```

## 10. Attendance

### Technical roster
`GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/technical-roster`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClassTechnicalRoster`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "items": [
    {
      "studentId": "string",
      "student": {
        "id": "string",
        "primaryBranchId": "string",
        "firstName": "string",
        "lastName": "string",
        "status": "ACTIVE",
        "currentBelt": "WHITE",
        "currentStripes": 0
      },
      "attendance": {
        "recordId": "string",
        "status": "PRESENT",
        "reasonCode": null,
        "source": "STAFF_MANUAL",
        "updatedAt": "2026-05-26T10:30:00.000Z"
      },
      "intent": {
        "intentId": "string",
        "status": "ACTIVE",
        "updatedAt": "2026-05-26T10:30:00.000Z"
      }
    }
  ],
  "summary": { "total": 0, "withAttendanceRecord": 0, "withIntent": 0 }
}
```

### List session attendance
`GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canReadSessionAttendance`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "items": [],
  "intents": [],
  "summary": {
    "total": 0,
    "counts": {
      "PRESENT": 0,
      "LATE": 0,
      "ABSENT": 0,
      "EXCUSED": 0
    },
    "bySource": {
      "STAFF_MANUAL": 0,
      "SELF_CHECKIN": 0,
      "QR_CHECKIN": 0,
      "KIOSK_CHECKIN": 0
    },
    "intentsTotal": 0
  },
  "behavior": {}
}
```

**Sensitive field note**
- This is an administrative attendance view, available to branch-authorized `MESTRE`, `ORG_ADMIN`, `ACADEMY_MANAGER`, effective `HEAD_COACH`, and `STAFF`.
- The backend intentionally returns operational fields needed for attendance correction/audit: student contact basics, attendance `notes`, actor membership ids, check-in token id, correction metadata, and history.
- Assigned instructors should use `technical-roster` / instructor execution views when they only need technical class execution context; those views omit student email/phone and private admin-only fields.

**Frontend summary mapping**
- Canonical UI summary: `expected`, `present`, `absent`, `excused`, `late`, `pending`.
- Current attendance list maps as: `present = summary.counts.PRESENT`, `late = summary.counts.LATE`, `absent = summary.counts.ABSENT`, `excused = summary.counts.EXCUSED`, `expected = summary.intentsTotal`, `pending = behavior.summary.pendingIntentValidationTotal`.
- Session Detail already exposes the canonical subset under `attendance`.

### Record attendance
`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canValidateAttendance`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "records": [
    {
      "studentId": "string",
      "status": "PRESENT",
      "reasonCode": "OTHER",
      "notes": "string"
    }
  ]
}
```

#### Response
```json
{
  "items": [],
  "summary": {
    "total": 0,
    "bySource": {
      "STAFF_MANUAL": 0,
      "SELF_CHECKIN": 0,
      "QR_CHECKIN": 0,
      "KIOSK_CHECKIN": 0
    }
  }
}
```

### Self check-in
`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/self-check-in`

**Roles permitted**: authenticated student or authorized actor
**Capability required**: `attendance.canValidateAttendance` or student self route access depending on policy
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
`{ item: attendanceRecord, created: boolean }`

### Issue QR token
`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/qr-token`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canValidateAttendance`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "expiresInMinutes": 15
}
```

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "branchId": "string",
  "classSessionId": "string",
  "mode": "QR",
  "issuedByMembershipId": "string",
  "expiresAt": "2026-05-26T10:45:00.000Z",
  "revokedAt": null,
  "createdAt": "2026-05-26T10:30:00.000Z",
  "token": "string"
}
```

### QR check-in
`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/qr-check-in`

**Roles permitted**: authenticated member or student
**Capability requerida**: `attendance.canValidateAttendance`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "token": "string"
}
```

#### Response
`{ item: attendanceRecord, created: boolean }`

### Kiosk check-in
`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/kiosk-check-in`

**Roles permitted**: authenticated member or kiosk actor
**Capability requerida**: `attendance.canValidateAttendance`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "studentId": "string",
  "notes": "string"
}
```

#### Response
`{ item: attendanceRecord, created: boolean }`

### Own attendance intent
`GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/intent`

**Roles permitted**: authenticated student
**Capability requerida**: `trainingCalendar.canMarkAttendanceIntent`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "item": null,
  "hasIntent": false,
  "attendanceRecord": null,
  "hasAttendanceRecord": false
}
```

### Upsert own attendance intent
`PUT /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/intent`

**Roles permitted**: authenticated student
**Capability requerida**: `trainingCalendar.canMarkAttendanceIntent`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
No body or optional intent creation payload, depending on use case wiring.

#### Response
```json
{
  "item": {},
  "created": true,
  "reactivated": false
}
```

### Cancel own attendance intent
`DELETE /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/intent`

**Roles permitted**: authenticated student
**Capability requerida**: `trainingCalendar.canMarkAttendanceIntent`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "canceled": true,
  "item": {}
}
```

### Update attendance record
`PATCH /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/:studentId`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canCorrectAttendanceWithinWindow` or `attendance.canCorrectAttendanceAsAdmin`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "status": "PRESENT",
  "reasonCode": "OTHER",
  "correctionReasonCode": "STATUS_CORRECTION",
  "notes": "string",
  "correctionNote": "string"
}
```

### Delete attendance record
`DELETE /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/:studentId`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canCorrectAttendanceAsAdmin`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "removed": true,
  "studentId": "string",
  "correctionReasonCode": "MANUAL_OVERRIDE"
}
```

### Attendance follow-up queue
`GET /organizations/:organizationId/branches/:branchId/attendance/follow-ups`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canReadAttendanceBehaviorSignals`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `windowDays` | number | `30` | Ventana analítica |

#### Response
```json
{
  "outcomeWindowDays": 30,
  "summary": {},
  "items": [
    {
      "studentId": "string",
      "firstName": "string",
      "lastName": "string",
      "queueStatus": "PENDING",
      "isAssigned": false,
      "reopened": false,
      "currentRiskLevel": "MEDIUM",
      "currentRiskFlags": [],
      "recommendedAction": "string",
      "behavior": {},
      "financialContext": {},
      "followUp": {
        "id": "string",
        "status": "PENDING",
        "responsibleMembershipId": null,
        "responsibleMembership": null,
        "lastActionType": "FOLLOW_UP_STARTED",
        "lastActionNote": null,
        "lastActionAt": "2026-05-26T10:30:00.000Z",
        "startedAt": null,
        "contactedAt": null,
        "resolvedAt": null,
        "lastResolvedStatus": null
      }
    }
  ]
}
```

### Attendance behavior signals
`GET /organizations/:organizationId/branches/:branchId/attendance/behavior-signals`

**Roles permitted**: MESTRE, ORG_ADMIN, ACADEMY_MANAGER, HEAD_COACH, STAFF
**Capability requerida**: `attendance.canReadAttendanceBehaviorSignals`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `windowDays` | number | `30` | Ventana analítica branch-local |

#### Response 200 — shape REAL del backend
```json
{
  "windowDays": 30,
  "summary": {
    "studentsTotal": 0,
    "lowRiskTotal": 0,
    "mediumRiskTotal": 0,
    "highRiskTotal": 0,
    "flaggedTotal": 0
  },
  "items": [
    {
      "studentId": "student_123",
      "primaryBranchId": "branch_123",
      "firstName": "Student",
      "lastName": "Name",
      "metrics": {
        "presentOrLateCurrentWindow": 0,
        "presentOrLatePreviousWindow": 0,
        "lateCurrentWindow": 0,
        "absentCurrentWindow": 0,
        "excusedCurrentWindow": 0,
        "activeIntentsCurrentWindow": 0,
        "canceledIntentsCurrentWindow": 0,
        "noShowCurrentWindow": 0,
        "consistencyWeeksAttended": 0,
        "consistencyWeeksTotal": 5,
        "consistencyRate": 0,
        "attendanceDropRatio": null,
        "daysSinceLastAttendance": null,
        "lastAttendanceAt": null
      },
      "financialContext": {
        "financialStatus": null,
        "attendanceRestricted": false
      },
      "risk": {
        "level": "LOW",
        "flags": [],
        "recommendedAction": "MONITOR"
      }
    }
  ]
}
```

**Sensitive field note**
- This endpoint is branch-local and intentionally includes student-level retention/risk signals for operational follow-up.
- It does not expose billing balances or charges; `financialContext` is reduced to attendance restriction context.

### Update attendance follow-up
`PATCH /organizations/:organizationId/branches/:branchId/attendance/follow-ups/:studentId`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canReadAttendanceBehaviorSignals`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "actionType": "FOLLOW_UP_STARTED",
  "responsibleMembershipId": "string",
  "note": "string"
}
```

## 11. Training Calendar

### Branch/org training calendar
`GET /organizations/:organizationId/training-calendar`

**Roles permitted**: authenticated member
**Capability requerida**: `trainingCalendar.canReadTrainingCalendar`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | date | required | Start date |
| `to` | date | required | End date |
| `view` | enum | `LIST` | `MONTH`, `WEEK`, `DAY`, `LIST` |
| `branchId` | string | - | branch filter |
| `instructorMembershipId` | string | - | instructor filter |
| `studentId` | string | - | student filter |
| `status` | enum | - | item status filter |
| `classType` | enum | - | class type filter |
| `category` | enum | - | category filter |
| `itemType` | enum | - | `CLASS_SESSION`, `ACADEMY_EVENT`, `ALL` |
| `tag` | string | - | tag filter |
| `color` | string | - | color filter |
| `search` | string | - | search filter |

#### Response
```json
{
  "organizationId": "string",
  "view": "LIST",
  "range": { "from": "2026-05-26", "to": "2026-05-26" },
  "context": "ADMIN",
  "student": null,
  "items": [],
  "days": []
}
```

### Calendar item shapes

#### Class session item
```json
{
  "id": "string",
  "type": "CLASS_SESSION",
  "title": "string",
  "description": null,
  "branch": { "id": "string", "name": "string", "slug": "string" },
  "instructor": {
    "membershipId": "string",
    "userId": "string",
    "firstName": "string",
    "lastName": "string",
    "displayName": "string"
  },
  "classSession": {
    "id": "string",
    "classScheduleId": "string",
    "classType": "GI",
    "capacity": 20,
    "cancellationReason": null
  },
  "startAt": "2026-05-26T10:30:00.000Z",
  "endAt": "2026-05-26T12:30:00.000Z",
  "scheduledDate": "2026-05-26",
  "status": "SCHEDULED",
  "category": "CLASS",
  "tags": [],
  "color": null,
  "attendanceSummary": {},
  "userAttendanceIntent": null,
  "userAttendanceRecord": null,
  "capabilities": {},
  "links": {}
}
```

#### Academy event item
```json
{
  "id": "string",
  "type": "ACADEMY_EVENT",
  "title": "string",
  "description": null,
  "branch": { "id": "string", "name": "string", "slug": "string" },
  "academyEvent": {
    "id": "string",
    "eventType": "SEMINAR",
    "visibility": "STUDENTS",
    "cancelledAt": null,
    "cancelReason": null
  },
  "startAt": "2026-05-26T10:30:00.000Z",
  "endAt": "2026-05-26T12:30:00.000Z",
  "scheduledDate": null,
  "status": "PUBLISHED",
  "category": "ACADEMY_EVENT",
  "tags": [],
  "color": null,
  "capabilities": {},
  "links": {}
}
```

### Student self profile
`GET /organizations/:organizationId/students/me`

**Roles permitted**: authenticated student
**Capability required**: `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "firstName": "string",
  "lastName": "string",
  "status": "ACTIVE",
  "primaryBranchId": "string",
  "primaryBranch": { "id": "string", "name": "string", "slug": "string" },
  "activeVisitBranchIds": ["string"],
  "currentBelt": "WHITE",
  "currentStripes": 0,
  "links": {}
}
```

### Student self calendar
`GET /organizations/:organizationId/students/me/calendar`

**Roles permitted**: authenticated student
**Capability required**: `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Student self attendance
`GET /organizations/:organizationId/students/me/attendance`

**Roles permitted**: authenticated student
**Capability required**: `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "studentId": "string",
  "items": [
    {
      "id": "string",
      "classSessionId": "string",
      "branchId": "string",
      "status": "PRESENT",
      "reasonCode": null,
      "source": "SELF_CHECKIN",
      "createdAt": "2026-05-26T10:30:00.000Z",
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "session": {
        "id": "string",
        "title": "string",
        "classType": "GI",
        "startAt": "2026-05-26T10:30:00.000Z",
        "endAt": "2026-05-26T12:30:00.000Z",
        "scheduledDate": "2026-05-26",
        "status": "SCHEDULED",
        "category": "CLASS",
        "tags": [],
        "color": null
      }
    }
  ]
}
```

### Student training itinerary
`GET /organizations/:organizationId/students/me/training-itinerary`

**Roles permitted**: authenticated student
**Capability required**: `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
Same as training calendar response, with student itinerary notes included in the read model.

### Training calendar class session detail
`GET /organizations/:organizationId/training-calendar/class-sessions/:sessionId`

**Roles permitted**: authenticated member
**Capability required**: `trainingCalendar.canReadTrainingCalendar`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Response
Same class session item shape used by the training calendar, with the selected session and its current capability links.

**Security notes**
- The endpoint returns `404 Class session not found` both when the session id does not exist and when it belongs to a branch the principal cannot read. This avoids cross-branch id inference.
- For student/self context, `ClassSession.notes` is treated as internal operational notes and is not exposed as `description`; `description` is `null`.
- For admin/manager or assigned-instructor context, `description` may contain `ClassSession.notes`.

**Validation**
- `status` must be one of the backend enum values used by class sessions or academy events. Invalid values return validation error instead of silently filtering to an empty result.
- `category` must be one of `CLASS`, `OPEN_MAT`, `SEMINAR`, `PRIVATE_LESSON`, `COMPETITION_PREP`, `GRADING_DAY`, `SPECIAL_TRAINING`, `WORKSHOP`, `MEETING`, `HOLIDAY_CLOSURE`, `ACADEMY_EVENT`.

## 12. Academy Events

### Create academy event
`POST /organizations/:organizationId/academy-events`

**Roles permitted**: authenticated member
**Capability requerida**: `academyEvents.canCreate`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE depending on event branch scope

#### Request body
```json
{
  "branchId": "string",
  "title": "string",
  "description": "string",
  "eventType": "SEMINAR",
  "startAt": "2026-05-26T10:30:00.000Z",
  "endAt": "2026-05-26T12:30:00.000Z",
  "visibility": "STUDENTS",
  "category": "ACADEMY_EVENT",
  "color": "string",
  "tags": ["string"]
}
```

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "branchId": "string",
  "branch": { "id": "string", "name": "string", "slug": "string", "timezone": "America/Argentina/Buenos_Aires" },
  "title": "string",
  "description": "string",
  "eventType": "SEMINAR",
  "startAt": "2026-05-26T10:30:00.000Z",
  "endAt": "2026-05-26T12:30:00.000Z",
  "status": "DRAFT",
  "visibility": "STUDENTS",
  "category": "ACADEMY_EVENT",
  "color": null,
  "tags": [],
  "cancelledAt": null,
  "cancelReason": null,
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z",
  "capabilities": {},
  "links": {}
}
```

### List academy events
`GET /organizations/:organizationId/academy-events`

**Roles permitted**: authenticated member
**Capability requerida**: `academyEvents.canReadBranch` or `academyEvents.canReadOrg`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

#### Response
`{ items: [...], meta: { page, limit, total } }`

### Get academy event detail
`GET /organizations/:organizationId/academy-events/:eventId`

**Roles permitted**: authenticated member
**Capability requerida**: `academyEvents.canReadBranch` or `academyEvents.canReadOrg`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

### Update academy event
`PATCH /organizations/:organizationId/academy-events/:eventId`

**Roles permitted**: authenticated member
**Capability requerida**: `academyEvents.canUpdate`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

### Publish academy event
`POST /organizations/:organizationId/academy-events/:eventId/publish`

**Roles permitted**: authenticated member
**Capability requerida**: `academyEvents.canPublish`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

### Cancel academy event
`POST /organizations/:organizationId/academy-events/:eventId/cancel`

**Roles permitted**: authenticated member
**Capability requerida**: `academyEvents.canCancel`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

### Archive academy event
`POST /organizations/:organizationId/academy-events/:eventId/archive`

**Roles permitted**: authenticated member
**Capability requerida**: `academyEvents.canArchive`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

## 13. Training Notes

Training notes are implemented in `src/training-notes/training-notes.controller.ts`. The active endpoints are listed in the controller-verified index above and covered by the official Postman collection.

## 14. Instructors

### List branch instructors
`GET /organizations/:organizationId/branches/:branchId/instructors`

**Roles permitted**: MESTRE, ORG_ADMIN, ACADEMY_MANAGER, HEAD_COACH, INSTRUCTOR, STAFF
**Capability requerida**: `instructors.canReadBranchRoster`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "items": [
    {
      "membershipId": "membership_123",
      "userId": "user_123",
      "user": {
        "id": "user_123",
        "firstName": "Coach",
        "lastName": "Name",
        "displayName": "Coach Name"
      },
      "roles": ["INSTRUCTOR"],
      "effectiveRoles": ["INSTRUCTOR"],
      "scope": {
        "scopeType": "SELECTED_BRANCHES",
        "primaryBranchId": "branch_123",
        "branchIds": ["branch_123"]
      },
      "isEffectiveHeadCoach": false,
      "status": "ACTIVE"
    }
  ],
  "meta": { "total": 1 }
}
```

### List instructor candidates
`GET /organizations/:organizationId/branches/:branchId/instructors/candidates`

**Roles permitted**: MESTRE, ORG_ADMIN, ACADEMY_MANAGER, HEAD_COACH, STAFF
**Capability requerida**: `classes.canAssignClassInstructor`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "items": [
    {
      "membershipId": "membership_123",
      "userId": "user_123",
      "displayName": "Coach Name",
      "roles": ["INSTRUCTOR"],
      "scopeType": "SELECTED_BRANCHES",
      "branchAccess": {
        "branchId": "branch_123",
        "primaryBranchId": "branch_123",
        "branchIds": ["branch_123"]
      },
      "isEffectiveHeadCoachForBranch": false,
      "canBeAssignedAsInstructor": true,
      "upcomingAssignedSessionCount": 0,
      "status": "ACTIVE",
      "user": {
        "id": "user_123",
        "firstName": "Coach",
        "lastName": "Name"
      },
      "effectiveRoles": ["INSTRUCTOR"]
    }
  ],
  "meta": { "total": 1 }
}
```

### My instructor profile
`GET /organizations/:organizationId/instructors/me`

**Roles permitted**: active tenant member with instructional capability in at least one readable branch
**Capability requerida**: `instructors.canReadOwnProfile`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "membershipId": "membership_123",
  "user": {
    "id": "user_123",
    "email": "coach@example.com",
    "firstName": "Coach",
    "lastName": "Name",
    "displayName": "Coach Name"
  },
  "assignedRoles": ["INSTRUCTOR"],
  "branches": [
    {
      "id": "branch_123",
      "name": "HQ",
      "slug": "hq",
      "timezone": "America/Sao_Paulo",
      "effectiveRoles": ["INSTRUCTOR"],
      "isEffectiveHeadCoach": false
    }
  ],
  "assignedSessionsSummary": {
    "upcomingAssignedSessions": 0,
    "recentAssignedSessions": 0,
    "nextSessionAt": null
  },
  "instructionalCapabilities": [
    "INSTRUCTOR_ASSIGNED_CLASSES_READ",
    "INSTRUCTOR_CLASS_EXECUTE",
    "ATTENDANCE_TECHNICAL_ROSTER_READ",
    "ATTENDANCE_VALIDATE_ASSIGNED_SESSION",
    "ATTENDANCE_CORRECT_WITHIN_WINDOW_ASSIGNED_SESSION"
  ]
}
```

### My instructor class sessions / calendar
`GET /organizations/:organizationId/instructors/me/class-sessions`
`GET /organizations/:organizationId/instructors/me/calendar`

**Roles permitted**: instructor-capable tenant member
**Capability requerida**: `instructors.canReadOwnAssignedSessions`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño |
| `fromDate` | date | - | inicio |
| `toDate` | date | - | fin |
| `branchId` | string | - | branch dentro de scope docente |
| `status` | enum | - | `SCHEDULED`, `COMPLETED`, `CANCELED` |

#### Response
```json
{
  "items": [
    {
      "sessionId": "session_123",
      "scheduleId": "schedule_123",
      "branchId": "branch_123",
      "branch": {
        "id": "branch_123",
        "name": "HQ",
        "slug": "hq",
        "timezone": "America/Sao_Paulo"
      },
      "title": "No Gi",
      "classType": "NO_GI",
      "scheduledDate": "2026-05-26T00:00:00.000Z",
      "startAt": "2026-05-26T18:00:00.000Z",
      "endAt": "2026-05-26T19:00:00.000Z",
      "status": "SCHEDULED",
      "isToday": false,
      "attendanceSummary": {
        "recordsTotal": 0,
        "intentsTotal": 0,
        "totalExpected": 0,
        "presentCount": 0,
        "lateCount": 0,
        "absentCount": 0,
        "excusedCount": 0,
        "pendingCount": 0
      },
      "canExecute": true,
      "canValidateAttendance": true,
      "canCorrectWithinWindow": true,
      "hasTechnicalRoster": true,
      "executionPath": "/organizations/org_123/instructors/me/class-sessions/session_123/execution",
      "technicalRosterPath": "/organizations/org_123/branches/branch_123/class-sessions/session_123/attendance/technical-roster"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Instructor admin calendar
`GET /organizations/:organizationId/instructors/:membershipId/calendar`

**Roles permitted**: MESTRE, ORG_ADMIN, ACADEMY_MANAGER, HEAD_COACH with branch visibility over the target instructor
**Capability requerida**: `instructors.canReadInstructorAdminCalendar`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
Same paginated session item shape as instructor calendar plus an `instructor` object and aggregate `summary`. It does not expose student contact, billing, or attendance record history.

### My instructor session execution
`GET /organizations/:organizationId/instructors/me/class-sessions/:sessionId/execution`

**Roles permitted**: assigned instructor or authorized branch leadership according to class execution policy
**Capability requerida**: `instructors.canExecuteAssignedSession`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "session": {
    "id": "session_123",
    "organizationId": "org_123",
    "branchId": "branch_123",
    "classScheduleId": "schedule_123",
    "instructorMembershipId": "membership_123",
    "title": "No Gi",
    "classType": "NO_GI",
    "scheduledDate": "2026-05-26T00:00:00.000Z",
    "startAt": "2026-05-26T18:00:00.000Z",
    "endAt": "2026-05-26T19:00:00.000Z",
    "capacity": 20,
    "status": "SCHEDULED",
    "cancellationReason": null
  },
  "schedule": null,
  "branch": {
    "id": "branch_123",
    "name": "HQ",
    "slug": "hq",
    "timezone": "America/Sao_Paulo"
  },
  "instructorAssignment": {
    "instructorMembershipId": "membership_123"
  },
  "technicalRoster": {
    "items": [],
    "summary": {
      "total": 0,
      "withAttendanceRecord": 0,
      "withIntent": 0
    }
  },
  "capabilities": {
    "canValidateAttendance": true,
    "canCorrectWithinWindow": true,
    "canReadTechnicalRoster": true
  }
}
```

**Sensitive field note**
- Instructor execution uses the safe technical roster shape. It must not expose student contact data, parent/tutor data, billing data, or attendance admin history.

## 15. Promotions & Certificates

### Create promotion request
`POST /organizations/:organizationId/students/:studentId/promotions`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canProposePromotion`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "type": "BELT",
  "targetBelt": "ADULT_BLUE",
  "targetStripes": 0,
  "proposalNotes": "string"
}
```

#### Response
Returns the full promotion detail shape.

### Promotion catalog
`GET /organizations/:organizationId/promotions/catalog`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canReadPromotionContext`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
{
  "tracks": [
    { "code": "ADULT", "label": "Adult / Juvenile", "initialRank": "ADULT_WHITE", "minAgeYears": 16, "maxAgeYears": null }
  ],
  "ranks": [
    {
      "code": "ADULT_WHITE",
      "label": "White",
      "track": "ADULT",
      "trackLabel": "Adult / Juvenile",
      "maxStripes": 4,
      "order": 1,
      "isInitialRank": true,
      "isTerminalRank": false,
      "nextValidRank": "ADULT_BLUE"
    }
  ]
}
```

**Notes**
- This is the tenant-bound promotion workflow catalog. It keeps the existing `code` field for backward compatibility.
- Use public `GET /catalogs/promotion-ranks` when the frontend only needs belt/rank rendering metadata.
- `PromotionTrack` is a graduation track (`KIDS`, `ADULT`), not a competition age division.
- Do not model `MASTER_1..MASTER_7` or `JUVENILE_1/2` as promotion tracks/ranks unless a future explicit domain decision changes that.

### List promotions
`GET /organizations/:organizationId/promotions`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canReadPromotionBranchQueue` or `promotions.canReadPromotionOrgQueue`
**Step-up required**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño |
| `status` | enum | - | `PromotionRequestStatus` |
| `studentId` | string | - | Filtro |
| `branchId` | string | - | Filtro |
| `type` | enum | - | `PromotionType` |
| `track` | enum | - | `PromotionTrack` |
| `targetBelt` | enum | - | `PromotionRank` |
| `proposedByMembershipId` | string | - | Filtro |
| `reviewedByMembershipId` | string | - | Filtro |
| `snapshotOutOfDate` | boolean | - | Queue signal |
| `recommendation` | enum | - | `PromotionRecommendation` |
| `pendingOlderThanDays` | number | - | Age filter |
| `sortBy` | enum | - | list sort |
| `dateFrom` | date | - | Filter |
| `dateTo` | date | - | Filter |

#### Response
```json
{
  "items": [
    {
      "id": "string",
      "organizationId": "string",
      "branchId": "string",
      "studentId": "string",
      "type": "BELT",
      "status": "PENDING_REVIEW",
      "trackSnapshot": "ADULT",
      "currentBeltSnapshot": "ADULT_BLUE",
      "currentStripesSnapshot": 0,
      "targetBelt": "ADULT_PURPLE",
      "targetStripes": 0,
      "effectiveDate": null,
      "createdAt": "2026-05-26T10:30:00.000Z",
      "student": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "promotionTrack": "ADULT",
        "currentBelt": "ADULT_BLUE",
        "currentStripes": 0
      },
      "evaluation": {
        "recommendation": "RECOMMEND",
        "updatedAt": "2026-05-26T10:30:00.000Z"
      },
      "comparisonSummary": {}
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Promotion detail
`GET /organizations/:organizationId/promotions/:promotionId`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canReadPromotionBranchQueue` or `promotions.canReadPromotionOrgQueue`
**Step-up required**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE

#### Response
Full promotion detail view including:
- `branch`
- `student`
- `proposedByMembership`
- `reviewedByMembership`
- `evaluation`
- `authorityRequests[]`
- `certificates[]`
- `certificate` alias

### Student promotion context
`GET /organizations/:organizationId/students/:studentId/promotion-context`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canReadPromotionContext`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "student": {
    "studentId": "string",
    "firstName": "string",
    "lastName": "string",
    "branch": { "id": "string", "name": "string" },
    "promotionTrack": "ADULT",
    "currentBelt": "ADULT_BLUE",
    "currentStripes": 0,
    "startedBjjAt": null,
    "joinedOrganizationAt": null,
    "daysSinceLastApprovedPromotion": null
  },
  "history": {
    "lastApprovedPromotion": null,
    "totalApprovedPromotions": 0,
    "currentPendingRequest": null,
    "recentHistory": []
  },
  "signals": {
    "classesSinceLastPromotion": 0,
    "attendanceLast30Days": 0,
    "attendanceLast90Days": 0,
    "daysSinceLastPromotion": null,
    "recentActivity": {
      "classesSinceLastPromotion": 0,
      "attendanceLast30Days": 0,
      "attendanceLast90Days": 0,
      "daysSinceLastPromotion": null
    }
  },
  "comparison": {
    "currentState": { "track": "ADULT", "trackLabel": "Adult / Juvenile", "belt": null, "beltLabel": null, "stripes": 0 },
    "lastApprovedPromotion": null,
    "pendingRequest": null,
    "deltas": {
      "currentVsLastApproved": null,
      "pendingVsCurrent": null,
      "pendingVsLastApproved": null
    }
  },
  "evaluation": null,
  "competitionSummary": null
}
```

### Update promotion evaluation
`PATCH /organizations/:organizationId/promotions/:promotionId/evaluation`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canEvaluatePromotion`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "guardScore": 5,
  "passingScore": 5,
  "controlScore": 5,
  "escapesDefenseScore": 5,
  "submissionsScore": 5,
  "tacticalUnderstandingScore": 5,
  "attitudeDisciplineScore": 5,
  "commitmentConsistencyScore": 5,
  "teamworkRespectScore": 5,
  "coachNotes": "string",
  "recommendation": "RECOMMEND"
}
```

### Elevate promotion for authority review
`POST /organizations/:organizationId/promotions/:promotionId/elevate`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canApprovePromotion`
**Step-up required**: no
**Scope**: BRANCH_SCOPED or ORGANIZATION_WIDE depending on promotion type

#### Request body
```json
{
  "requestPriority": "HIGH"
}
```

**Side effects**
- Creates an institutional communication/request message.

### Review promotion authority
`POST /organizations/:organizationId/promotions/:promotionId/review`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canApprovePromotion`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE for belt workflows, branch-scoped for stripe workflows

#### Request body
```json
{
  "status": "HQ_IN_REVIEW",
  "authorityReviewNote": "string"
}
```

### Approve promotion
`POST /organizations/:organizationId/promotions/:promotionId/approve`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canApprovePromotion`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE for belt, BRANCH_SCOPED for stripe

#### Request body
```json
{
  "effectiveDate": "2026-05-26",
  "decisionNotes": "string"
}
```

### Reject promotion
`POST /organizations/:organizationId/promotions/:promotionId/reject`

**Roles permitted**: authenticated member
**Capability requerida**: `promotions.canRejectPromotion`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE for belt, BRANCH_SCOPED for stripe

#### Request body
```json
{
  "rejectionReason": "string",
  "decisionNotes": "string"
}
```

### Upload promotion certificate
`POST /organizations/:organizationId/promotions/:promotionId/certificate`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canUploadCertificate`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "certificateNumber": "string",
  "title": "string",
  "issuedAt": "2026-05-26T10:30:00.000Z",
  "authorityName": "string",
  "authorityTitle": "string",
  "fileName": "string.pdf",
  "fileBase64": "string"
}
```

#### Response
Promotion certificate detail:
```json
{
  "id": "string",
  "organizationId": "string",
  "promotionRequestId": "string",
  "studentId": "string",
  "uploadedByMembershipId": "string",
  "approvedByMembershipId": "string",
  "statusChangedByMembershipId": null,
  "certificateNumber": "string",
  "title": "string",
  "issuedAt": "2026-05-26T10:30:00.000Z",
  "status": "ACTIVE",
  "statusReasonCode": null,
  "statusReasonNote": null,
  "statusChangedAt": null,
  "authorityName": null,
  "authorityTitle": null,
  "fileName": "string.pdf",
  "fileMimeType": "application/pdf",
  "fileSizeBytes": 12345,
  "fileSha256": "string",
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z",
  "replacementOfCertificateId": null,
  "replacementOfCertificate": null,
  "replacedByCertificate": null,
  "promotionRequest": {
    "id": "string",
    "type": "BELT",
    "effectiveDate": "2026-05-26",
    "targetBelt": "ADULT_BLUE",
    "targetStripes": 0,
    "branch": {
      "id": "string",
      "organizationId": "string",
      "headCoachMembershipId": "string",
      "name": "HQ"
    }
  },
  "student": {
    "id": "string",
    "userId": "string",
    "firstName": "string",
    "lastName": "string",
    "primaryBranch": {
      "id": "string",
      "organizationId": "string",
      "headCoachMembershipId": "string",
      "name": "HQ"
    }
  }
}
```

### Get promotion certificate detail
`GET /organizations/:organizationId/promotions/:promotionId/certificate`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canDownloadCertificate`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### List student certificates
`GET /organizations/:organizationId/students/:studentId/certificates`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canReadCertificateHistory`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
Array of certificate summary objects:
- `id`, `certificateNumber`, `title`, `issuedAt`, `status`, `statusReasonCode`, `statusReasonNote`, `statusChangedAt`, `authorityName`, `authorityTitle`, `fileName`, `fileMimeType`, `fileSizeBytes`, `fileSha256`, `createdAt`
- `replacementOfCertificate`, `replacedByCertificate`
- `promotionRequest`

### List my certificates
`GET /organizations/:organizationId/certificates/mine`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canReadOwnCertificates`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

### Get certificate detail
`GET /organizations/:organizationId/certificates/:certificateId`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canDownloadCertificate`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Void certificate
`POST /organizations/:organizationId/certificates/:certificateId/void`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canVoidCertificate`
**Step-up required**: sí
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "reasonCode": "ISSUED_IN_ERROR",
  "reasonNote": "string"
}
```

### Reissue certificate
`POST /organizations/:organizationId/certificates/:certificateId/reissue`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canReissueCertificate`
**Step-up required**: sí
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "reasonCode": "DOCUMENT_CORRECTION",
  "reasonNote": "string",
  "certificateNumber": "string",
  "title": "string",
  "issuedAt": "2026-05-26T10:30:00.000Z",
  "authorityName": "string",
  "authorityTitle": "string",
  "fileName": "string.pdf",
  "fileBase64": "string"
}
```

### Download certificate
`GET /organizations/:organizationId/certificates/:certificateId/download`

**Roles permitted**: authenticated member
**Capability requerida**: `certificates.canDownloadCertificate`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

**Response**
- `StreamableFile` with PDF bytes
- Headers:
  - `Content-Type` = certificate mime type
  - `Content-Disposition` attachment
  - `Content-Length`

## 16. Communications & Notifications

Communications are implemented through announcements, institutional messages, inbox, request queue, board, metrics, and request operations endpoints. The active endpoints are listed in the controller-verified index above and covered by the official Postman collection.

### Notifications unread count
`GET /organizations/:organizationId/notifications/unread-count`

**Roles permitted**: authenticated member
**Capability requerida**: `notifications.canReadOwnNotifications`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Response 200/201
```json
{
  "unreadCount": 0
}
```

### List notifications
`GET /organizations/:organizationId/notifications`

**Roles permitted**: authenticated member
**Capability requerida**: `notifications.canReadOwnNotifications`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | Página |
| `limit` | number | `20` | Tamaño |

#### Response
```json
{
  "items": [
    {
      "id": "string",
      "type": "ACADEMY_INTAKE_REQUEST_CREATED",
      "resourceType": "ACADEMY_INTAKE_REQUEST",
      "resourceId": "string",
      "payload": {},
      "createdAt": "2026-05-26T10:30:00.000Z",
      "readAt": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Mark many notifications read
`POST /organizations/:organizationId/notifications/read`

**Roles permitted**: authenticated member
**Capability requerida**: `notifications.canReadOwnNotifications`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "notificationIds": ["string"]
}
```

### Mark all notifications read
`POST /organizations/:organizationId/notifications/read-all`

**Roles permitted**: authenticated member
**Capability requerida**: `notifications.canReadOwnNotifications`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

### Process notification delivery
`POST /organizations/:organizationId/notifications/delivery/process`

**Roles permitted**: authenticated member
**Capability requerida**: `notifications.canManageNotificationDelivery`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "eventId": "string",
  "force": true,
  "limit": 200
}
```

### Notification delivery stats
`GET /organizations/:organizationId/notifications/delivery/stats`

**Roles permitted**: authenticated member
**Capability requerida**: `notifications.canManageNotificationDelivery`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Response
```json
{
  "dueEventCount": 0,
  "pendingEventCount": 0,
  "processingEventCount": 0,
  "failedEventCount": 0,
  "retriedEventCount": 0,
  "oldestDueEventNextAttemptAt": null,
  "dueDeliveryCount": 0,
  "pendingDeliveryCount": 0,
  "processingDeliveryCount": 0,
  "failedDeliveryCount": 0,
  "retriedDeliveryCount": 0,
  "oldestDueDeliveryNextAttemptAt": null,
  "observedAt": "2026-05-26T10:30:00.000Z"
}
```

### Mark single notification read
`POST /organizations/:organizationId/notifications/:notificationId/read`

**Roles permitted**: authenticated member
**Capability requerida**: `notifications.canReadOwnNotifications`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

### Notification types

- `ANNOUNCEMENT_PUBLISHED`
- `INVITATION_ACCEPTED`
- `ACADEMY_INTAKE_REQUEST_CREATED`
- `INSTITUTIONAL_REQUEST_ACTION_REQUIRED`
- `INSTITUTIONAL_REQUEST_ASSIGNED`
- `INSTITUTIONAL_REQUEST_CLOSED`
- `INSTITUTIONAL_REQUEST_REMINDER`
- `INSTITUTIONAL_REQUEST_ESCALATED`
- `ATTENDANCE_FOLLOW_UP_ASSIGNED`
- `TRAINING_NOTE_VISIBLE`
- `TRAINING_NOTE_COACH_REVIEW`

## 17. Public Profile (Discovery)

### Public search
`GET /public/branches/search`

**Roles permitted**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `countryCode` | string | required unless geo search | ISO country code |
| `q` | string | - | search string |
| `city` | string | - | city filter |
| `region` | string | - | region filter |
| `lat` | number | - | geosearch |
| `lng` | number | - | geosearch |
| `radiusKm` | number | - | geosearch radius |
| `page` | number | `1` | page |
| `limit` | number | `20` | page size |

#### Response
```json
{
  "items": [
    {
      "id": "string",
      "slug": "string",
      "publicSlug": "string",
      "displayName": "string",
      "shortBio": null,
      "location": {
        "city": "Buenos Aires",
        "region": "CABA",
        "countryCode": "AR",
        "address": null,
        "latitude": null,
        "longitude": null,
        "distanceKm": null
      },
      "classTypes": ["GI"],
      "contacts": {
        "publicEmail": null,
        "publicPhone": null,
        "whatsapp": null,
        "website": null
      },
      "socials": {
        "instagram": null
      },
      "organization": {
        "id": "string",
        "name": "string",
        "slug": "string"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Public branch detail by branch id
`GET /public/branches/:branchId`

**Roles permitted**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

### Public branch detail by slug
`GET /public/branches/slug/:publicSlug`

**Roles permitted**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

### Public branch schedules
`GET /public/branches/:branchId/schedules`

**Roles permitted**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Response
```json
{
  "items": [
    {
      "weekday": "MONDAY",
      "entries": [
        {
          "id": "string",
          "title": "string",
          "classType": "GI",
          "startTime": "08:00:00",
          "endTime": "09:30:00",
          "timezone": "America/Argentina/Buenos_Aires"
        }
      ]
    }
  ]
}
```

## 18. Billing (Mercado Pago)

### Create billing plan
`POST /organizations/:organizationId/branches/:branchId/billing-plans`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "name": "string",
  "description": "string",
  "billingFrequency": "MONTHLY",
  "amount": 10000,
  "currency": "ARS",
  "enrollmentFeeAmount": 0,
  "isActive": true
}
```

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "branchId": "string",
  "name": "string",
  "description": null,
  "billingFrequency": "MONTHLY",
  "amount": 10000,
  "currency": "ARS",
  "enrollmentFeeAmount": 0,
  "isActive": true,
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z"
}
```

### List billing plans
`GET /organizations/:organizationId/branches/:branchId/billing-plans`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Update billing plan
`PATCH /organizations/:organizationId/branches/:branchId/billing-plans/:planId`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Create student membership
`POST /organizations/:organizationId/students/:studentId/membership`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "billingPlanId": "string",
  "startedAt": "2026-05-26",
  "nextBillingDate": "2026-06-01",
  "freezeStartAt": "2026-07-01",
  "freezeEndAt": "2026-07-31",
  "status": "ACTIVE",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "notes": "string"
}
```

### Get student membership
`GET /organizations/:organizationId/students/:studentId/membership`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Update student membership
`PATCH /organizations/:organizationId/students/:studentId/membership`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
Same as create, plus:
```json
{
  "endedAt": "2026-12-31",
  "clearFreezeSchedule": true,
  "clearDiscount": true
}
```

### Create billing charge
`POST /organizations/:organizationId/students/:studentId/billing-charges`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "studentMembershipId": "string",
  "billingPlanId": "string",
  "chargeType": "MEMBERSHIP",
  "periodStart": "2026-05-01",
  "periodEnd": "2026-05-31",
  "dueDate": "2026-05-05",
  "amount": 10000,
  "currency": "ARS",
  "description": "string",
  "externalProvider": "string",
  "externalReference": "string"
}
```

### Create Mercado Pago preference
`POST /organizations/:organizationId/students/:studentId/billing-charges/:chargeId/mercado-pago/preference`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canCreateMercadoPagoPreference`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "chargeId": "string",
  "provider": "MERCADO_PAGO",
  "publicKey": "string",
  "preferenceId": "string",
  "externalReference": "string",
  "initPoint": "string",
  "sandboxInitPoint": "string",
  "environment": "production",
  "reused": false
}
```

### List student billing charges
`GET /organizations/:organizationId/students/:studentId/billing-charges`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | page |
| `limit` | number | `20` | size |
| `studentId` | string | - | filter |
| `billingPlanId` | string | - | filter |
| `chargeType` | enum | - | `BillingChargeType` |
| `status` | enum | - | `BillingChargeStatus` |
| `currency` | string | - | currency |
| `dateFrom` | date | - | filter |
| `dateTo` | date | - | filter |

#### Response
`{ items: [...], meta: { page, limit, total } }`

### List branch billing charges
`GET /organizations/:organizationId/branches/:branchId/billing-charges`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Branch student financial statuses
`GET /organizations/:organizationId/branches/:branchId/student-financial-statuses`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | page |
| `limit` | number | `20` | size |
| `financialStatus` | string | - | domain financial status |

#### Response
```json
{
  "items": [
    {
      "student": { "id": "string", "firstName": "string", "lastName": "string" },
      "membership": { "id": "string", "status": "ACTIVE" },
      "financialStatus": "OK",
      "daysOverdue": 0,
      "nextDueDate": "2026-06-01",
      "hasOverdueCharges": false,
      "hasPendingCharges": false,
      "activeRestrictionFlags": { "attendanceRestricted": false, "appUsageRestricted": false },
      "totalDue": 0
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Record manual student payment
`POST /organizations/:organizationId/students/:studentId/payments/manual`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "billingChargeId": "string",
  "grossAmount": 10000,
  "netAmount": 9800,
  "currency": "ARS",
  "method": "CASH",
  "status": "APPROVED",
  "description": "string",
  "externalProvider": "string",
  "externalReference": "string",
  "recordedAt": "2026-05-26T10:30:00.000Z",
  "notes": "string"
}
```

### Record general income
`POST /organizations/:organizationId/branches/:branchId/general-income`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "grossAmount": 10000,
  "netAmount": 9800,
  "currency": "ARS",
  "method": "CASH",
  "status": "APPROVED",
  "description": "string",
  "externalProvider": "string",
  "externalReference": "string",
  "recordedAt": "2026-05-26T10:30:00.000Z",
  "notes": "string"
}
```

### List student payments
`GET /organizations/:organizationId/students/:studentId/payments`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### List branch payments
`GET /organizations/:organizationId/branches/:branchId/payments`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Get student billing context
`GET /organizations/:organizationId/students/:studentId/billing-context`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "membership": null,
  "financialStatus": "OK",
  "daysOverdue": 0,
  "nextDueDate": null,
  "hasOverdueCharges": false,
  "hasPendingCharges": false,
  "upcomingCharges": [],
  "pendingCharges": [],
  "overdueCharges": [],
  "totalDue": 0,
  "totalPaidRecent": 0,
  "activeRestrictionFlags": { "attendanceRestricted": false, "appUsageRestricted": false },
  "flags": { "restrictAttendance": false, "restrictAppUsage": false }
}
```

### Get billing policy
`GET /organizations/:organizationId/branches/:branchId/billing-policy`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Update billing policy
`PATCH /organizations/:organizationId/branches/:branchId/billing-policy`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canWriteBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body
```json
{
  "graceDays": 10,
  "restrictAttendanceWhenOverdue": true,
  "restrictAppUsageWhenOverdue": false,
  "allowFreeze": true,
  "maxFreezeDaysPerYear": 30,
  "allowManualDiscounts": true,
  "allowPartialPayments": true
}
```

### Review possible duplicate payments
`GET /organizations/:organizationId/branches/:branchId/payments/possible-duplicates`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `dateFrom` | date | - | filter |
| `dateTo` | date | - | filter |
| `method` | enum | - | `PaymentMethod` |
| `status` | enum | - | `PaymentStatus` |
| `paymentKind` | enum | - | `PaymentKind` |
| `currency` | string | - | currency |
| `studentId` | string | - | filter |
| `windowDays` | number | - | 1..14 |
| `limit` | number | - | 1..250 |

#### Response
```json
{
  "items": [],
  "meta": {
    "inspectedPayments": 0,
    "totalGroups": 0,
    "windowDays": 14,
    "period": { "dateFrom": "2026-05-01", "dateTo": "2026-05-26" }
  }
}
```

### Branch billing summary
`GET /organizations/:organizationId/branches/:branchId/billing-summary`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `dateFrom` | date | - | filter |
| `dateTo` | date | - | filter |
| `currency` | string | - | filter |

#### Response
```json
{
  "period": { "dateFrom": "2026-05-01", "dateTo": "2026-05-26" },
  "currency": "ARS",
  "operationalSnapshot": {
    "asOf": "2026-05-26T10:30:00.000Z",
    "studentFinancialStatusCounts": {},
    "overdueStudentsCount": 0,
    "dueSoonStudentsCount": 0,
    "restrictedStudentsCount": 0
  }
}
```

### Billing enums

- `BillingFrequency`: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `ONE_TIME`
- `StudentMembershipStatus`: `ACTIVE`, `PAUSED`, `FROZEN`, `CANCELED`, `ENDED`
- `DiscountType`: `PERCENTAGE`, `FIXED`
- `BillingChargeType`: `MEMBERSHIP`, `ENROLLMENT`, `ADJUSTMENT`, `MANUAL`
- `BillingChargeStatus`: `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELED`, `VOID`
- `PaymentKind`: `STUDENT_PAYMENT`, `GENERAL_INCOME`
- `PaymentMethod`: `CASH`, `BANK_TRANSFER`, `DEBIT_CARD`, `CREDIT_CARD`, `MERCADO_PAGO`, `TAKENOS`, `OTHER`
- `PaymentStatus`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELED`, `FAILED`, `REFUNDED`, `CHARGED_BACK`

### Mercado Pago webhooks
`POST /integrations/webhooks/mercado-pago`

**Roles permitted**: public webhook
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

**Notes**
- Public, rate-limited, and processed by the webhook ingest pipeline.
- Response is handled by the integration ingest flow and may be `200`, `202`, or error depending on validation/processing state.

## 19. Competitions (Smoothcomp)

### Link Smoothcomp profile
`POST /organizations/:organizationId/students/:studentId/competitions/smoothcomp/link`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canLinkCompetitionProfile`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
Full student competition profile response.

### Sync competition profile
`POST /organizations/:organizationId/students/:studentId/competitions/sync`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canRequestCompetitionSync`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### Competition profile detail
`GET /organizations/:organizationId/students/:studentId/competitions/profile`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canReadCompetitionProfile`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
```json
{
  "studentId": "string",
  "provider": "SMOOTHCOMP",
  "linked": false,
  "profile": null,
  "sync": null,
  "statsSnapshot": null,
  "participantSupport": null,
  "latestImportWarnings": [],
  "counts": {
    "importRuns": 0,
    "matchRecords": 0
  }
}
```

### Competition matches
`GET /organizations/:organizationId/students/:studentId/competitions/matches`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canReadCompetitionProfile`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response
`{ studentId, page, limit, total, items }`

### Unlink Smoothcomp profile
`DELETE /organizations/:organizationId/students/:studentId/competitions/smoothcomp/link`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canUnlinkCompetitionProfile`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

### External profile links
`GET /organizations/:organizationId/competitions/external-profile-links`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canOperateCompetitionImports`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

### Legacy ownership conflicts
`GET /organizations/:organizationId/competitions/legacy-ownership-conflicts`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canRemediateCompetitionOwnership`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

### Import runs
`GET /organizations/:organizationId/competitions/import-runs`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canOperateCompetitionImports`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

### Import runs operational snapshot
`GET /organizations/:organizationId/competitions/import-runs/operational-snapshot`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canOperateCompetitionImports`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

### Reprocess competition import run
`POST /organizations/:organizationId/competitions/import-runs/:importRunId/reprocess`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canOperateCompetitionImports`
**Step-up required**: sí
**Scope**: ORGANIZATION_WIDE

### Remediate legacy ownership conflict
`POST /organizations/:organizationId/competitions/legacy-ownership-conflicts/:competitionProfileId/remediate-unlink`

**Roles permitted**: authenticated member
**Capability requerida**: `competitions.canRemediateCompetitionOwnership`
**Step-up required**: sí
**Scope**: ORGANIZATION_WIDE

### Internal ingest
`POST /internal/competitions/imports/:importRunId/smoothcomp`

**Roles permitted**: internal ingest only
**Capability requerida**: no aplica
**Step-up required**: no
**Scope**: internal

#### Response
`202 Accepted`

### Internal publication ingest
`POST /internal/competitions/publications/smoothcomp`

**Roles permitted**: internal ingest only
**Capability requerida**: no aplica
**Step-up required**: no
**Scope**: internal

#### Response
`202 Accepted`

## 20. Analytics

### Tree summary
`GET /organizations/:organizationId/analytics/branches/tree-summary`

See branches section for detailed response shape.

### Subtree summary
`GET /organizations/:organizationId/analytics/branches/:branchId/subtree-summary`

See branches section for detailed response shape.

### Action summary
`GET /organizations/:organizationId/analytics/branches/:branchId/action-summary`

**Roles permitted**: authenticated member
**Capability requerida**: `analytics.canReadBranchActionableAnalytics`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `activityWindowDays` | number | `30` | `1..365` |

#### Response
```json
{
  "branch": {},
  "activityWindowDays": 30,
  "health": { "status": "HEALTHY", "score": 100, "drivers": [] },
  "population": {
    "studentsTotal": 0,
    "activeStudentsTotal": 0,
    "inactiveStudentsTotal": 0,
    "activeRate": 0
  },
  "technical": {
    "adultsTotal": 0,
    "kidsTotal": 0,
    "beltDistribution": [],
    "activeBlackBeltsTotal": 0,
    "inactiveBlackBeltsTotal": 0,
    "purpleBeltsTotal": 0,
    "brownBeltsTotal": 0,
    "competitorTrackingAvailable": false,
    "activeCompetitorsTotal": null
  },
  "attendance": {
    "trackedStudentsTotal": 0,
    "attendedStudentsCurrentWindow": 0,
    "atRiskStudentsTotal": 0,
    "highRiskStudentsTotal": 0,
    "payingButInactiveStudentsTotal": 0,
    "repeatedNoShowStudentsTotal": 0,
    "habitDropStudentsTotal": 0,
    "highIntentLowAttendanceStudentsTotal": 0,
    "lowConsistencyStudentsTotal": 0,
    "prolongedAbsenceStudentsTotal": 0,
    "noShowRate": 0,
    "lateRate": 0,
    "averageConsistencyRate": 0,
    "averageDaysSinceLastAttendance": null,
    "atRiskRate": 0,
    "activeIntentTotal": 0,
    "canceledIntentTotal": 0,
    "noShowTotal": 0
  },
  "followUp": {
    "currentQueueTotal": 0,
    "pendingTotal": 0,
    "inProgressTotal": 0,
    "contactedTotal": 0,
    "assignedTotal": 0,
    "unassignedQueueTotal": 0,
    "reactivatedTotal": 0,
    "unresponsiveTotal": 0,
    "recoveryRate": 0
  },
  "requests": {
    "backlogTotal": 0,
    "overdueTotal": 0,
    "unassignedTotal": 0,
    "urgentTotal": 0,
    "highPriorityTotal": 0,
    "resolvedLastWindow": 0,
    "averageBacklogAgeHours": null,
    "oldestOpenAgeHours": null
  },
  "promotions": {},
  "classes": { "strongest": [], "weakest": [] },
  "governance": {
    "readinessSummary": {
      "readyAreasTotal": 0,
      "blockedAreasTotal": 0,
      "readyAreas": [],
      "blockedAreas": []
    }
  },
  "riskBuckets": {},
  "priorityStudents": [],
  "riskRosterPreview": [],
  "recommendedActions": []
}
```

### Risk roster
`GET /organizations/:organizationId/analytics/branches/:branchId/risk-roster`

**Roles permitted**: authenticated member
**Capability requerida**: `analytics.canReadRiskRoster`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `activityWindowDays` | number | `30` | `1..365` |
| `limit` | number | `25` | `1..100` |

#### Response
```json
{
  "branch": {},
  "activityWindowDays": 30,
  "limit": 25,
  "items": [
    {
      "rank": 1,
      "studentId": "string",
      "firstName": "string",
      "lastName": "string",
      "riskLevel": "HIGH",
      "attentionCategory": "IMMEDIATE",
      "riskScore": 100,
      "riskFlags": [],
      "attentionReasons": [],
      "recommendedAction": "string",
      "metrics": {
        "daysSinceLastAttendance": 0,
        "lastAttendanceAt": null,
        "consistencyRate": 0,
        "attendanceDropRatio": null,
        "presentOrLateCurrentWindow": 0,
        "activeIntentsCurrentWindow": 0,
        "noShowCurrentWindow": 0
      },
      "financialContext": {},
      "followUp": {
        "queueStatus": "NONE",
        "isAssigned": false,
        "reopened": false,
        "responsibleMembershipId": null,
        "lastActionNote": null
      },
      "derivedSignals": {
        "prolongedAbsence": false,
        "lowConsistency": false
      }
    }
  ],
  "summary": {}
}
```

### Branch tree summary helper endpoints
The active exact route for the tree summary requested in the prompt is under analytics, not `/branches/tree-summary`.

## 21. Audit

### List audit events
`GET /organizations/:organizationId/audit`

**Roles permitted**: authenticated member
**Capability requerida**: `audit.canReadOrgAudit` or `audit.canReadBranchAudit`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE or BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | page |
| `limit` | number | `20` | size |
| `branchId` | string | - | filter |
| `requestId` | string | - | filter |
| `actorMembershipId` | string | - | filter |
| `entityType` | string | - | filter |
| `entityId` | string | - | filter |
| `action` | string | - | filter |
| `from` | date-time | - | filter |
| `to` | date-time | - | filter |

#### Response
```json
{
  "items": [
    {
      "id": "string",
      "branchId": "string",
      "actorUserId": "string",
      "actorMembershipId": "string",
      "requestId": "string",
      "ipAddress": "127.0.0.1",
      "userAgent": "string",
      "action": "user.invited",
      "entityType": "OrganizationMembership",
      "entityId": "string",
      "metadata": {},
      "createdAt": "2026-05-26T10:30:00.000Z",
      "actor": {},
      "summary": {
        "actorLabel": "string",
        "actionLabel": "string",
        "entityLabel": "string",
        "text": "string"
      },
      "actionContext": { "family": "string", "hasNetworkContext": false },
      "change": null,
      "relatedEntities": []
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Entity timeline
`GET /organizations/:organizationId/audit/entities/:entityType/:entityId/timeline`

**Roles permitted**: authenticated member
**Capability requerida**: `audit.canReadOrgAudit` or `audit.canReadBranchAudit`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE or BRANCH_SCOPED

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `limit` | number | `100` | max `200` |
| `relatedLimit` | number | `25` | max `100` |

#### Response
```json
{
  "case": {
    "entityType": "string",
    "entityId": "string",
    "entityLabel": "string",
    "category": "string",
    "eventsTotal": 0,
    "firstEventAt": null,
    "lastEventAt": null,
    "actionsSeen": [],
    "actorLabels": [],
    "branchIds": [],
    "relatedEntities": []
  },
  "items": []
}
```

## 22. Integrations

### Create integration connection
`POST /organizations/:organizationId/integrations`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canManageIntegrations`
**Step-up required**: yes
**Scope**: ORGANIZATION_WIDE or BRANCH_SCOPED depending on scopeType

#### Request body
```json
{
  "provider": "MERCADO_PAGO",
  "scopeType": "BRANCH",
  "branchId": "string",
  "displayName": "string",
  "status": "ACTIVE",
  "configJson": {}
}
```

#### Response
```json
{
  "id": "string",
  "organizationId": "string",
  "branchId": "string",
  "provider": "MERCADO_PAGO",
  "status": "ACTIVE",
  "scopeType": "BRANCH",
  "displayName": "string",
  "lastSyncAt": null,
  "lastSyncStatus": null,
  "lastSyncError": null,
  "createdByMembershipId": "string",
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z"
}
```

### List integration connections
`GET /organizations/:organizationId/integrations`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canReadIntegrations`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | page |
| `limit` | number | `20` | size |
| `branchId` | string | - | filter |
| `provider` | enum | - | `IntegrationProvider` |
| `status` | enum | - | `IntegrationStatus` |
| `scopeType` | enum | - | `IntegrationScopeType` |

#### Response
`{ items: [...], meta: { page, limit, total } }`

### Update integration connection
`PATCH /organizations/:organizationId/integrations/:integrationId`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canManageIntegrations`
**Step-up required**: yes
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "displayName": "string",
  "status": "ACTIVE",
  "configJson": {}
}
```

### Test integration connection
`POST /organizations/:organizationId/integrations/:integrationId/test`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canTestIntegrations`
**Step-up required**: yes
**Scope**: ORGANIZATION_WIDE

### Sync integration connection
`POST /organizations/:organizationId/integrations/:integrationId/sync`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canManageIntegrations`
**Step-up required**: yes
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "syncKind": "SYNC_PAYMENT_STATUS"
}
```

### List sync jobs
`GET /organizations/:organizationId/integrations/:integrationId/sync-jobs`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canReadIntegrations`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | page |
| `limit` | number | `20` | size |
| `syncKind` | enum | - | `IntegrationSyncKind` |
| `status` | enum | - | `IntegrationSyncStatus` |

### List integration webhook events
`GET /organizations/:organizationId/integrations/:integrationId/webhook-events`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canReadIntegrationWebhookEvents`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | page |
| `limit` | number | `20` | size |
| `validationStatus` | enum | - | `IntegrationWebhookValidationStatus` |
| `processingStatus` | enum | - | `IntegrationWebhookProcessingStatus` |
| `notificationType` | string | - | notification type |
| `dateFrom` | date-time | - | filter |
| `dateTo` | date-time | - | filter |
| `onlyRecoverable` | boolean | - | filter |
| `externalResourceId` | string | - | filter |

#### Response
```json
{
  "items": [
    {
      "id": "string",
      "provider": "MERCADO_PAGO",
      "notificationType": "payment",
      "action": "updated",
      "externalEventId": "string",
      "externalResourceId": "string",
      "requestId": "string",
      "validationStatus": "VALID",
      "processingStatus": "RECEIVED",
      "errorSummary": null,
      "isRecoverable": true,
      "recoverabilityReason": "received_not_processed_yet",
      "reprocessCount": 0,
      "lastReprocessedAt": null,
      "receivedAt": "2026-05-26T10:30:00.000Z",
      "processedAt": null,
      "createdAt": "2026-05-26T10:30:00.000Z",
      "updatedAt": "2026-05-26T10:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

### Get integration webhook event detail
`GET /organizations/:organizationId/integrations/:integrationId/webhook-events/:eventId`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canReadIntegrationWebhookEvents`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Response
Same as list item plus:
- `validationError`
- `processingError`
- `wasReprocessed`
- `payload`
- `query`
- `resource`

### Create external entity link
`POST /organizations/:organizationId/integrations/:integrationId/external-links`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canManageIntegrations`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Request body
```json
{
  "entityType": "PAYMENT",
  "internalEntityId": "string",
  "externalEntityId": "string",
  "externalReference": "string",
  "metadataJson": {}
}
```

### List external entity links
`GET /organizations/:organizationId/integrations/:integrationId/external-links`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canReadIntegrations`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Query params
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | number | `1` | page |
| `limit` | number | `20` | size |
| `entityType` | enum | - | `ExternalEntityType` |
| `internalEntityId` | string | - | filter |
| `externalEntityId` | string | - | filter |

### Reprocess webhook event
`POST /organizations/:organizationId/integrations/:integrationId/webhook-events/:eventId/reprocess`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canReprocessIntegrationWebhookEvents`
**Step-up required**: yes
**Scope**: ORGANIZATION_WIDE

### Integration enums

- `IntegrationProvider`: `MERCADO_PAGO`, `TAKENOS`, `SMOOTHCOMP`
- `IntegrationStatus`: `ACTIVE`, `INACTIVE`, `ERROR`, `DISCONNECTED`
- `IntegrationScopeType`: `ORGANIZATION`, `BRANCH`
- `IntegrationSyncKind`: `TEST_CONNECTION`, `IMPORT_STUDENT_COMPETITIONS`, `SYNC_PAYMENT_STATUS`, `IMPORT_EXTERNAL_TRANSACTIONS`
- `IntegrationSyncStatus`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `PARTIALLY_SUCCEEDED`
- `IntegrationWebhookValidationStatus`: `VALID`, `INVALID`
- `IntegrationWebhookProcessingStatus`: `RECEIVED`, `PROCESSING`, `PROCESSED`, `IGNORED`, `FAILED`
- `ExternalEntityType`: `STUDENT`, `PAYMENT`, `BILLING_CHARGE`, `COMPETITION_PROFILE`, `COMPETITION_EVENT`, `COMPETITION_MATCH`

## 23. Health / Observability

### API liveness
`GET /health/live`

**Roles permitidos**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Response 200/201
```json
{
  "status": "live",
  "service": "string",
  "timestamp": "2026-05-26T10:30:00.000Z"
}
```

### API readiness
`GET /health/ready`

**Roles permitidos**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Response 200/201
```json
{
  "status": "ready",
  "service": "string",
  "timestamp": "2026-05-26T10:30:00.000Z",
  "checks": {
    "database": "up",
    "notificationsWorker": "separate_runtime_required"
  }
}
```

### Notifications worker liveness
`GET /health/live` in the worker process

**Roles permitidos**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Response
```json
{
  "live": true,
  "startedAt": "2026-05-26T10:30:00.000Z",
  "shutdownRequestedAt": null,
  "activeTickId": null,
  "activeTickStartedAt": null
}
```

### Notifications worker readiness
`GET /health/ready` in the worker process

**Roles permitidos**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Response
```json
{
  "ready": true,
  "status": "HEALTHY",
  "evaluatedAt": "2026-05-26T10:30:00.000Z",
  "reasons": [],
  "runtime": {
    "startedAt": "2026-05-26T10:30:00.000Z",
    "shutdownRequestedAt": null,
    "activeTickId": null,
    "activeTickStartedAt": null,
    "lastTickStartedAt": null,
    "lastTickCompletedAt": null,
    "lastSuccessfulTickAt": null,
    "lastFailedTickAt": null,
    "lastTickDurationMs": null,
    "consecutiveTickFailures": 0,
    "totalSuccessfulTicks": 0,
    "totalFailedTicks": 0
  },
  "queue": {
    "statsAvailable": true,
    "dueEventCount": 0,
    "pendingEventCount": 0,
    "processingEventCount": 0,
    "failedEventCount": 0,
    "retriedEventCount": 0,
    "oldestDueEventLagMs": null,
    "dueDeliveryCount": 0,
    "pendingDeliveryCount": 0,
    "processingDeliveryCount": 0,
    "failedDeliveryCount": 0,
    "retriedDeliveryCount": 0,
    "oldestDueDeliveryLagMs": null,
    "failedItemCount": 0,
    "oldestDueLagMs": null
  },
  "throughput": {
    "lastTick": null,
    "cumulative": {}
  }
}
```

### Metrics
`GET /metrics`

**Roles permitidos**: public worker metrics
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

**Response**
- Prometheus text format

## 24. Errores comunes globales

| Status | Error | Message shape |
|---|---|---|
| 401 | Unauthorized | token absent, expired, invalid, or membership unavailable |
| 403 | Forbidden | missing capability, scope mismatch, recent-auth required |
| 404 | Not Found | resource not found or hidden by tenant isolation |
| 409 | Conflict | duplicate resource, invalid state transition, or lifecycle conflict |
| 422 | Validation Error | invalid request body/query structure |
| 429 | Too Many Requests | rate-limited endpoint, especially public intake/webhooks |
| 500 | Internal Server Error | unexpected backend failure |

### Global error shape
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Missing capability",
  "path": "/api/v1/organizations/org_123",
  "requestId": "uuid",
  "timestamp": "2026-05-26T10:30:00.000Z"
}
```

## 25. Pendientes / no expuestos como activos

- The requested branch tree-summary shortcut route does not exist as an active route. The active equivalent is `GET /organizations/:organizationId/analytics/branches/tree-summary`.
- `shop` module is present but has no active controller routes in this workspace snapshot.

## 26. Appendix: complete enums

### Academy intake
- `AcademyIntakeExperienceLevel`: `NEVER_TRAINED`, `BEGINNER`, `WHITE_BELT`, `BLUE_BELT`, `PURPLE_BELT`, `BROWN_BELT`, `BLACK_BELT`, `OTHER`
- `AcademyIntakeRequestType`: `INFO`, `VISIT`, `EVALUATION`, `JOIN_INTEREST`
- `AcademyIntakeRequestStatus`: `NEW`, `REVIEWING`, `CONTACTED`, `VISIT_PROPOSED`, `VISIT_SCHEDULED`, `VISIT_COMPLETED`, `NO_SHOW`, `DECLINED_BY_PROSPECT`, `REJECTED_BY_ACADEMY`, `READY_TO_CONVERT`, `CONVERTED`, `CANCELLED`
- `AcademyIntakeRequestSource`: `PUBLIC_APP`, `PUBLIC_WEB`, `MANUAL`, `REFERRAL_FUTURE`
- `StudentAccountClaimInvitationStatus`: `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`, `SUPERSEDED`

### Class domain
- `Weekday`: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`
- `ClassType`: `GI`, `NO_GI`, `FUNDAMENTALS`, `ADVANCED`, `KIDS`, `COMPETITION`, `OPEN_MAT`, `SEMINAR`, `PRIVATE`
- `ClassSessionStatus`: `SCHEDULED`, `COMPLETED`, `CANCELED`

### Attendance domain
- `AttendanceStatus`: `PRESENT`, `LATE`, `ABSENT`, `EXCUSED`
- `AttendanceReasonCode`: `INJURY`, `TRAVEL`, `SCHEDULE_CONFLICT`, `TEMPORARY_SUSPENSION`, `VALID_VISIT`, `OPERATIONAL_ERROR`, `OTHER`
- `AttendanceRecordSource`: `STAFF_MANUAL`, `SELF_CHECKIN`, `QR_CHECKIN`, `KIOSK_CHECKIN`
- `AttendanceIntentStatus`: `ACTIVE`, `CANCELED`
- `AttendanceIntentCancelReasonCode`: `PLAN_CHANGED`, `INJURY`, `TRAVEL`, `SCHEDULE_CONFLICT`, `TEMPORARY_SUSPENSION`, `OTHER`
- `AttendanceFollowUpStatus`: `PENDING`, `IN_PROGRESS`, `CONTACTED`, `REACTIVATED`, `UNRESPONSIVE`
- `AttendanceFollowUpActionType`: `ASSIGNMENT_UPDATED`, `FOLLOW_UP_STARTED`, `CONTACT_RECORDED`, `REACTIVATED`, `UNRESPONSIVE_MARKED`
- `AttendanceCheckInTokenMode`: `QR`
- `AttendanceCorrectionReasonCode`: `STATUS_CORRECTION`, `DUPLICATE_CHECKIN`, `WRONG_STUDENT`, `LATE_CONFIRMATION`, `VISIT_VERIFIED`, `MANUAL_OVERRIDE`, `OTHER`
- `AttendanceRecordEventType`: `CHECKED_IN`, `CORRECTED`, `REMOVED`

### Training calendar
- `TrainingCalendarView`: `MONTH`, `WEEK`, `DAY`, `LIST`
- `TrainingCalendarCategory`: `CLASS`, `OPEN_MAT`, `SEMINAR`, `PRIVATE_LESSON`, `COMPETITION_PREP`, `GRADING_DAY`, `SPECIAL_TRAINING`, `WORKSHOP`, `MEETING`, `HOLIDAY_CLOSURE`, `ACADEMY_EVENT`
- `TrainingCalendarItemType`: `CLASS_SESSION`, `ACADEMY_EVENT`, `ALL`

### Academy events
- `AcademyEventType`: `SEMINAR`, `OPEN_MAT`, `GRADING_DAY`, `SPECIAL_TRAINING`, `WORKSHOP`, `MEETING`, `HOLIDAY_CLOSURE`, `OTHER`
- `AcademyEventStatus`: `DRAFT`, `PUBLISHED`, `CANCELLED`, `ARCHIVED`
- `AcademyEventVisibility`: `INTERNAL_STAFF`, `STUDENTS`, `MEMBERS`, `PUBLIC_LISTING`

### Promotions
- `PromotionType`: `BELT`, `STRIPE`
- `PromotionRequestStatus`: `PENDING_REVIEW`, `ELEVATED_FOR_APPROVAL`, `HQ_IN_REVIEW`, `HQ_NEEDS_MORE_INFO`, `APPROVED`, `REJECTED`
- `PromotionRecommendation`: `DO_NOT_RECOMMEND`, `NEEDS_MORE_TIME`, `RECOMMEND`, `STRONGLY_RECOMMEND`
- `PromotionTrack`: `KIDS`, `ADULT`
- `PromotionCertificateStatus`: `ACTIVE`, `VOIDED`, `REPLACED`
- `PromotionCertificateStatusReasonCode`: `UPLOAD_ERROR`, `DOCUMENT_CORRECTION`, `ISSUED_IN_ERROR`, `AUTHORITY_UPDATE`, `OTHER`
- `PromotionRank`: `KIDS_WHITE`, `KIDS_GREY_WHITE`, `KIDS_GREY`, `KIDS_GREY_BLACK`, `KIDS_YELLOW_WHITE`, `KIDS_YELLOW`, `KIDS_YELLOW_BLACK`, `KIDS_ORANGE_WHITE`, `KIDS_ORANGE`, `KIDS_ORANGE_BLACK`, `KIDS_GREEN_WHITE`, `KIDS_GREEN`, `KIDS_GREEN_BLACK`, `ADULT_WHITE`, `ADULT_BLUE`, `ADULT_PURPLE`, `ADULT_BROWN`, `ADULT_BLACK`

### Students
- `StudentStatus`: `ACTIVE`, `PAUSED`, `DELINQUENT`, `SUSPENDED`, `INACTIVE`
- `StudentBranchVisitStatus`: `APPROVED`, `CANCELED`

### Billing
- `BillingFrequency`: `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `ONE_TIME`
- `StudentMembershipStatus`: `ACTIVE`, `PAUSED`, `FROZEN`, `CANCELED`, `ENDED`
- `DiscountType`: `PERCENTAGE`, `FIXED`
- `BillingChargeType`: `MEMBERSHIP`, `ENROLLMENT`, `ADJUSTMENT`, `MANUAL`
- `BillingChargeStatus`: `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `CANCELED`, `VOID`
- `PaymentKind`: `STUDENT_PAYMENT`, `GENERAL_INCOME`
- `PaymentMethod`: `CASH`, `BANK_TRANSFER`, `DEBIT_CARD`, `CREDIT_CARD`, `MERCADO_PAGO`, `TAKENOS`, `OTHER`
- `PaymentStatus`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELED`, `FAILED`, `REFUNDED`, `CHARGED_BACK`
- `PaymentReversalType`: `REFUND`, `CHARGEBACK`

### Integrations
- `IntegrationProvider`: `MERCADO_PAGO`, `TAKENOS`, `SMOOTHCOMP`
- `IntegrationStatus`: `ACTIVE`, `INACTIVE`, `ERROR`, `DISCONNECTED`
- `IntegrationScopeType`: `ORGANIZATION`, `BRANCH`
- `IntegrationSyncKind`: `TEST_CONNECTION`, `IMPORT_STUDENT_COMPETITIONS`, `SYNC_PAYMENT_STATUS`, `IMPORT_EXTERNAL_TRANSACTIONS`
- `IntegrationSyncStatus`: `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `PARTIALLY_SUCCEEDED`
- `IntegrationWebhookValidationStatus`: `VALID`, `INVALID`
- `IntegrationWebhookProcessingStatus`: `RECEIVED`, `PROCESSING`, `PROCESSED`, `IGNORED`, `FAILED`
- `ExternalEntityType`: `STUDENT`, `PAYMENT`, `BILLING_CHARGE`, `COMPETITION_PROFILE`, `COMPETITION_EVENT`, `COMPETITION_MATCH`

### Notifications
- `NotificationType`: `ANNOUNCEMENT_PUBLISHED`, `INVITATION_ACCEPTED`, `ACADEMY_INTAKE_REQUEST_CREATED`, `INSTITUTIONAL_REQUEST_ACTION_REQUIRED`, `INSTITUTIONAL_REQUEST_ASSIGNED`, `INSTITUTIONAL_REQUEST_CLOSED`, `INSTITUTIONAL_REQUEST_REMINDER`, `INSTITUTIONAL_REQUEST_ESCALATED`, `ATTENDANCE_FOLLOW_UP_ASSIGNED`, `TRAINING_NOTE_VISIBLE`, `TRAINING_NOTE_COACH_REVIEW`
- `NotificationResourceType`: `ANNOUNCEMENT`, `MEMBERSHIP`, `ACADEMY_INTAKE_REQUEST`, `INSTITUTIONAL_MESSAGE`, `ATTENDANCE_FOLLOW_UP`, `TRAINING_NOTE`
- `NotificationEventStatus`: `PENDING`, `PROCESSING`, `FANNED_OUT`, `FAILED`
- `NotificationDeliveryChannel`: `IN_APP`
- `NotificationDeliveryStatus`: `PENDING`, `PROCESSING`, `DELIVERED`, `FAILED`

### Core tenant and auth
- `OrganizationStatus`: `DRAFT`, `ACTIVE`, `SUSPENDED`, `INACTIVE`, `CLOSED`
- `BranchStatus`: `DRAFT`, `ACTIVE`, `SUSPENDED`, `INACTIVE`, `CLOSED`, `TRANSITION`
- `UserStatus`: `ACTIVE`, `INVITED`, `SUSPENDED`, `INACTIVE`
- `MembershipRole`: `MESTRE`, `ORG_ADMIN`, `ACADEMY_MANAGER`, `HEAD_COACH`, `INSTRUCTOR`, `STAFF`, `STUDENT`
- `MembershipStatus`: `INVITED`, `ACTIVE`, `SUSPENDED`, `REVOKED`
- `MembershipScopeType`: `ORGANIZATION_WIDE`, `SELECTED_BRANCHES`
- `UserSessionRevokeReason`: `LOGOUT_CURRENT`, `LOGOUT_ALL`, `USER_STATUS_CHANGED`, `MEMBERSHIP_STATUS_CHANGED`, `MEMBERSHIP_AUTHORIZATION_CHANGED`, `ORGANIZATION_STATUS_CHANGED`, `ADMIN_FORCED_LOGOUT`, `SECURITY_FORCED_LOGOUT`
