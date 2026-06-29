# API Contract

- Generated at: 2026-06-22
- Backend version: `0.0.1`
- Source basis: current backend code in this repository
- API version: `v1`
- Base URL production: `https://bjj-ops-api.onrender.com/api/v1`
- Base URL development: `http://localhost:3001/api/v1`
- Auth model: Bearer access token + refresh cookie + CSRF for cookie-backed session csrf/refresh/logout flows
- Note: this document reflects the backend source in this workspace. If Render differs, the backend and this contract are out of sync and the contract must be updated.

## Frontend Scope Notes

This contract mirrors the backend API in full. The KURO web frontend consumes
only the operator-facing surface:

- All endpoints under `/organizations/:organizationId/...` operating on
  branches, students, classes, attendance (staff/instructor perspective),
  intake, promotions, billing, communications, analytics, audit.
- All `/auth/*` endpoints.
- All `/public/*` endpoints (Fase 3 anonymous discovery).
- `/me/intake-requests` (post-signup student follow-up screen, only intake).

The web frontend does NOT consume student-facing endpoints. These are documented
for completeness and are consumed by the KURO mobile app (Flutter, separate repo):

- `GET /organizations/:organizationId/students/me/home`
- `GET /organizations/:organizationId/students/me/profile`
- `GET /organizations/:organizationId/students/me/calendar`
- `GET /organizations/:organizationId/students/me/attendance`
- `GET /organizations/:organizationId/students/me/attendance-suggestions`
- `GET /organizations/:organizationId/students/me/training-itinerary`
- `GET /organizations/:organizationId/students/me/notes`
- `POST /organizations/:organizationId/students/me/check-ins/qr`
- `POST /organizations/:organizationId/students/me/attendance-suggestions/:id/accept`
- `POST /organizations/:organizationId/students/me/attendance-suggestions/:id/decline`
- The deprecated `POST .../self-check-in` endpoint (never to be surfaced).

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
  "code": "OPTIONAL_STABLE_CODE",
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

- Missing recent-auth / step-up returns `403` and does not invalidate the
  session:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "code": "RECENT_AUTH_REQUIRED",
  "message": "Recent authentication required",
  "path": "/api/v1/organizations/org_123/students/student_123/invite",
  "requestId": "uuid",
  "timestamp": "2026-05-26T10:30:00.000Z"
}
```

- Student/User identity ambiguity returns a stable conflict body:

```json
{
  "code": "STUDENT_USER_IDENTITY_CONFLICT",
  "message": "A student and user/membership with this email already exist in this organization and are not linked.",
  "existingStudentId": "string | null",
  "existingUserId": "string | null",
  "existingMembershipId": "string | null",
  "suggestedAction": "INVITE_STUDENT_CLAIM | CREATE_STUDENT_WITH_EXISTING_USER | LINK_STUDENT_TO_USER | CONTACT_ADMIN"
}
```

Email is a conflict signal only. Backend never autolinks `Student` and
`User`/`OrganizationMembership` by email alone.

## Active Endpoint Index

Controller-verified on 2026-06-21. This index is the parity list used to keep the official Postman collection aligned with implemented NestJS controllers. Detailed request/response notes remain in the domain sections below.

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
- `GET /organizations/:organizationId/branches/:branchId/class-schedules/:scheduleId`
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
- `GET /organizations/:organizationId/me/profile`
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
- `GET /organizations/:organizationId/students/me/billing`
- `GET /organizations/:organizationId/students/me/billing-charges/:chargeId`
- `GET /organizations/:organizationId/students/me/payments`
- `GET /organizations/:organizationId/students/me/payments/:paymentId`
- `GET /organizations/:organizationId/students/me/calendar`
- `GET /organizations/:organizationId/students/me/class-sessions/:sessionId`
- `GET /organizations/:organizationId/students/me/class-sessions/:sessionId/personal-notes`
- `GET /organizations/:organizationId/students/me/class-sessions/:sessionId/attendance/participants`
- `POST /organizations/:organizationId/students/me/check-ins/qr`
- `GET /organizations/:organizationId/students/me/home`
- `GET /organizations/:organizationId/students/me/notes`
- `GET /organizations/:organizationId/students/me/profile`
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
- `PATCH /organizations/:organizationId/students/me/class-sessions/:sessionId/personal-notes/:noteId`
- `PATCH /organizations/:organizationId/training-notes/:noteId`
- `POST /auth/accept-invitation`
- `POST /auth/accept-student-claim`
- `POST /auth/bootstrap`
- `POST /auth/forgot-password`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/refresh`
- `POST /auth/reset-password`
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
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/suggestions`
- `GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/suggestions`
- `POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/suggestions/:suggestionId/cancel`
- `GET /organizations/:organizationId/students/me/attendance-suggestions`
- `POST /organizations/:organizationId/students/me/attendance-suggestions/:suggestionId/accept`
- `POST /organizations/:organizationId/students/me/attendance-suggestions/:suggestionId/decline`
- `POST /organizations/:organizationId/students/me/class-sessions/:sessionId/personal-notes`
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
- `POST /organizations/:organizationId/students/me/billing-charges/:chargeId/mercado-pago/preference`
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

### Common person belt DTO

Student/person-visible read models that expose a compact belt summary should use this shape when the endpoint contract includes a `belt` field:

```ts
type PersonBeltDto = {
  rank: string;
  degree: number | null;
  stripeCount: number;
  label: string;
} | null;
```

Rules:

- `rank` is a `PromotionRank` enum value.
- `label` is resolved by the backend from the official promotion rank catalog.
- `degree` is always `null` in the current backend because there is no reliable degree source yet.
- `stripeCount` comes from the current rank source used by that endpoint.
- This DTO is a visual/read-model contract only. It does not change the current rank source-of-truth; student-bound surfaces still read `Student.currentBelt/currentStripes` until a future technical profile read/writer migration is approved.

### Common visible person DTO

Read models that expose compact people inside KURO should converge on this shape when the endpoint contract allows a person object:

```ts
type VisiblePersonDto = {
  userId: string | null;
  membershipId: string | null;
  studentId?: string | null;
  displayName: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string | null;
  roleLabel?: string | null;
  publicTitle?: string | null;
  belt?: PersonBeltDto;
};
```

Rules:

- `displayName` is built by the backend from the available real name source.
- `avatarUrl` is resolved first from the visible `OrganizationMembershipProfile` for the membership represented by that DTO. If that profile has no public active avatar, compatible admin/web and student-visible read models may fall back to another active membership profile for the same `userId` inside the same `organizationId`. If neither source has a safe public URL, it is `null`.
- Avatar fallback is person-scoped inside one organization only. It must not resolve from global `User`, cross-tenant memberships, inactive memberships, hidden/deleted profiles, inactive/deleted assets, or storage internals.
- `roleLabel` is included only when derived from real membership/branch/profile data.
- `publicTitle` is included only when a real organization-scoped membership profile source provides it; it does not replace `roleLabel` or permissions.
- `belt` uses `PersonBeltDto` and is included only when the endpoint has a real rank source for that person.
- Student-safe views must not expose email, phone, billing data, date of birth, internal notes, technical notes, raw permissions, provider payloads, payment data, or private operational metadata.
- `avatarUrl` resolution does not create `OrganizationMembershipTechnicalProfile`, rank migration, or a new identity source-of-truth.

### Media asset foundation

`MediaAsset` is an internal metadata model for controlled media references. Public APIs never expose object-storage internals; upload/delete support is limited to self membership avatar endpoints.

Internal model intent:

```ts
type MediaAssetReference = {
  id: string;
  organizationId: string | null;
  ownerUserId: string | null;
  ownerMembershipId: string | null;
  purpose: 'MEMBER_AVATAR' | 'BRANCH_IMAGE' | 'CERTIFICATE_ASSET' | 'OTHER';
  mimeType: string;
  sizeBytes: number;
  sha256: string | null;
  width: number | null;
  height: number | null;
  status: 'PENDING' | 'ACTIVE' | 'REPLACED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
```

Rules:

- `MediaAsset` stores metadata and external object references only; image/avatar bytes must not be stored in Postgres.
- `objectKey`, `bucket`, and provider-specific storage internals are not public DTO fields.
- Tenant-owned reads and state changes must be filtered by `organizationId`.
- Membership-owned assets require `organizationId` and use the tenant-scoped membership identity.
- `VisiblePersonDto.avatarUrl` may be populated only through the membership profile/avatar resolver; public DTOs still must not expose `MediaAsset` ids or storage internals.
- Current promotion certificates keep their existing narrow DB-backed PDF implementation; this foundation does not migrate certificates or create generic document upload behavior.

### Media storage port foundation

KURO storage integration is provider-agnostic. Business controllers and use-cases must depend on `MediaStoragePort`, not on R2, S3, Cloudinary, SDKs, buckets, object keys, or credentials.

Internal port:

```ts
interface MediaStoragePort {
  putObject(input: PutObjectInput): Promise<StoredObjectResult>;
  deleteObject(input: DeleteObjectInput): Promise<void>;
  getPublicUrl(input: GetMediaUrlInput): string | null;
}
```

Adapters available in this foundation:

- `LocalDevMediaStorageAdapter`: dev/test only, writes under `MEDIA_LOCAL_ROOT`, blocks path traversal, and can return a configured local/public base URL.
- `R2MediaStorageAdapter`: production candidate, talks to Cloudflare R2 through an S3-compatible API endpoint using env configuration.

Rules:

- Public upload/delete remains limited to self membership avatar endpoints.
- Presigned URLs and public admin avatar management are not implemented.
- `MEDIA_STORAGE_PROVIDER=local` is intended for development/test and is blocked in production unless explicitly allowed.
- `MEDIA_STORAGE_PROVIDER=r2` requires bucket, endpoint, access key id, and secret access key env vars.
- Public DTOs must not expose `bucket`, `objectKey`, storage provider, access keys, or `mediaAssetId`.

### Organization membership profile foundation

`OrganizationMembershipProfile` is an internal organization-scoped profile model for visible membership metadata. It has no public API endpoints in this phase and does not change existing student/mobile/admin response contracts unless a future endpoint explicitly opts into the mapper.

Internal model intent:

```ts
type OrganizationMembershipProfileReference = {
  id: string;
  organizationId: string;
  membershipId: string;
  preferredName: string | null;
  publicTitle: string | null;
  bio: string | null;
  avatarMediaAssetId: string | null;
  isVisibleToMembers: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
```

Rules:

- The profile is scoped to `organizationId + membershipId`; it is not a global user profile.
- Each membership can have at most one profile per organization.
- `avatarMediaAssetId`, when present, must point to a `MediaAsset` in the same organization with `MEMBER_AVATAR` purpose.
- Storage internals from `MediaAsset` (`objectKey`, `bucket`, provider details) must not appear in public DTOs.
- `preferredName` may enrich `VisiblePersonDto.displayName` only through the common mapper.
- `publicTitle` is visible metadata, not a role, permission, or replacement for `roleLabel`.
- `bio` is not exposed on student-safe surfaces until a product decision explicitly approves it.
- `avatarUrl` may be resolved from this profile only through the membership-profile avatar resolver when an active avatar asset and safe public storage URL are available.

### Organization membership technical profile foundation

`OrganizationMembershipTechnicalProfile` is an internal organization-scoped technical BJJ profile for a membership. It creates a future-safe place for rank/stripes on instructors, mestres, staff, admins, and students without using `Student` as a universal proxy.

Internal model intent:

```ts
type OrganizationMembershipTechnicalProfileReference = {
  id: string;
  organizationId: string;
  membershipId: string;
  currentBelt: PromotionRank | null;
  currentStripes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
```

Rules:

- The profile is scoped to `organizationId + membershipId`; it is not global user state.
- Each membership can have at most one technical profile per organization.
- `currentBelt` uses the existing `PromotionRank` enum. No new belt enum or catalog is introduced.
- `currentStripes` is the stripe count for the current technical rank.
- `degree` is not modeled in this foundation because KURO has no confirmed degree source yet; `PersonBeltDto.degree` remains `null`.
- Read helpers can map this profile to `PersonBeltDto`.
- Deleted technical profiles are ignored by read services.
- Authorized backoffice writes can create, update, or restore the membership technical profile through the tenant-scoped membership management endpoint.
- Setting `currentBelt` to `null` clears the visible technical rank; reads return `PersonBeltDto | null` and will return `null` until a rank is set again.
- Technical profile writes do not update `Student.currentBelt/currentStripes`, `PromotionRequest`, certificates, notifications, or historical snapshots.
- This foundation does not backfill from `Student`, migrate Promotions, migrate student writers, or change student/mobile/admin read models.
- `Student.currentBelt/currentStripes` remain the current legacy source for student-bound surfaces until a later migration is explicitly approved.
- `PromotionRequest.currentBeltSnapshot/currentStripesSnapshot` remain historical snapshots and are not changed.

### Backend avatar service internal foundation

KURO has internal avatar lifecycle services for organization membership profiles. Public HTTP exposure is currently limited to self membership avatar upload/delete.

Internal flow:

- validates target `organizationId + membershipId`
- ensures an `OrganizationMembershipProfile` exists for the membership
- validates avatar bytes as JPEG, PNG, or WebP using magic bytes and image dimensions
- rejects SVG, GIF, HEIC/HEIF, empty files, unknown binaries, oversized files, and images outside `128x128..4096x4096`
- creates a `MediaAsset` with `PENDING` status and purpose `MEMBER_AVATAR`
- generates a non-PII object key under `organizations/{organizationId}/memberships/{membershipId}/avatars/`
- uploads through `MediaStoragePort`
- transactionally attaches the new avatar and marks the previous avatar `REPLACED`
- delete clears the profile avatar, marks the asset `DELETED`, and attempts best-effort storage deletion

Rules:

- Public upload/delete endpoints exist only for the authenticated user's own organization-scoped membership avatar.
- Admin/member-management avatar endpoints do not exist yet.
- Public DTOs still must not expose `bucket`, `objectKey`, provider, access keys, or `mediaAssetId`.
- `VisiblePersonDto.avatarUrl` is wired into compatible read models that already expose an avatar field. The resolver prefers the specific membership profile and can fall back to another active same-organization membership profile for the same user when the specific profile has no avatar.
- Original filenames are ignored for object key generation and are not audited.
- Avatar upload currently validates but does not re-encode images; EXIF stripping/re-encoding remains a future hardening phase before opening broad public upload if product/security requires it.

### Self membership avatar endpoints

These endpoints allow an authenticated tenant principal to manage only their own organization-scoped membership avatar.

`POST /organizations/:organizationId/me/avatar`

**Auth required**: yes
**Capability**: self active membership in `organizationId`
**Request**: `multipart/form-data` with exactly one file field named `file`

Validation:

- file is required
- maximum size is `MEDIA_MAX_AVATAR_BYTES` (default `2097152`)
- allowed images are JPEG, PNG, and WebP
- MIME is verified from bytes, not trusted only from headers
- dimensions must be between `128x128` and `4096x4096`
- SVG, GIF, HEIC/HEIF, unknown binaries, and oversized files are rejected

Success response:

```json
{
  "avatarUrl": "https://media.example.test/organizations/org_1/memberships/membership_1/avatars/media_1-random.webp"
}
```

If storage does not have a public base URL configured or the storage adapter cannot return a safe URL:

```json
{
  "avatarUrl": null
}
```

`DELETE /organizations/:organizationId/me/avatar`

**Auth required**: yes
**Capability**: self active membership in `organizationId`

Success response:

```json
{
  "avatarUrl": null
}
```

Expected errors:

- `400` missing or invalid file request
- `401` unauthenticated request
- `403` token membership does not belong to `organizationId`
- `413` avatar exceeds configured max bytes
- `415` unsupported or untrusted image type
- `503` storage unavailable during upload

Privacy/security rules:

- the target membership is always the authenticated principal's membership
- no cross-tenant avatar updates are allowed
- no endpoint exists for changing another member's avatar
- public responses never include `objectKey`, `bucket`, provider, access keys, or `mediaAssetId`
- Existing participants/class-detail/student-home response shapes are unchanged; their existing `avatarUrl` fields may now be populated when a visible membership profile has an active avatar and the storage adapter returns a safe public URL.

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

| Status | Caso                          | Mensaje                                                   |
| ------ | ----------------------------- | --------------------------------------------------------- |
| 403    | bootstrap disabled in runtime | Bootstrap is disabled outside controlled setup operations |
| 409    | system is not empty           | Bootstrap is only allowed on an empty system              |
| 422    | validation                    | Invalid payload                                           |

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

| Status | Caso                  | Mensaje             |
| ------ | --------------------- | ------------------- |
| 409    | email already exists  | User already exists |
| 422    | validation            | Invalid payload     |
| 429    | auth route rate limit | Too Many Requests   |

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

| Status | Caso                | Mensaje             |
| ------ | ------------------- | ------------------- |
| 401    | invalid credentials | Invalid credentials |

### Forgot password

`POST /auth/forgot-password`

**Roles permitidos**: público
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Request body

```json
{
  "email": "user@example.com"
}
```

#### Response 202

```json
{
  "ok": true,
  "message": "If an account exists, password reset instructions will be sent."
}
```

**Side effects**

- Always returns the same public response whether the email exists or not.
- When the user exists and is active, issues a single-use password reset token.
- Stores only `PasswordResetToken.tokenHash`, never the plain token.
- Invalidates older pending password reset tokens for the same user by setting `usedAt`.
- Sends a transactional email through the configured provider.
- Does not create a session.
- Does not return any token in the response.

#### Errores específicos

| Status | Caso                  | Mensaje           |
| ------ | --------------------- | ----------------- |
| 422    | validation            | Invalid payload   |
| 429    | auth route rate limit | Too Many Requests |

### Reset password

`POST /auth/reset-password`

**Roles permitidos**: público
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: no aplica

#### Request body

```json
{
  "token": "plain-token-from-link",
  "newPassword": "NewPassword123!"
}
```

#### Response 200

```json
{
  "ok": true
}
```

**Side effects**

- Validates that the reset token exists, is unexpired, and was not used before.
- Hashes the new password with `argon2id`.
- Marks the current reset token as used.
- Invalidates any remaining pending reset tokens for the same user.
- Revokes all active `UserSession` and `RefreshToken` records for that `userId`.

#### Errores específicos

| Status | Caso                       | Mensaje                            |
| ------ | -------------------------- | ---------------------------------- |
| 400    | invalid/expired/used token | Password reset token not available |
| 400    | invalid token error code   | `PASSWORD_RESET_TOKEN_INVALID`     |
| 422    | validation                 | Invalid payload                    |
| 429    | auth route rate limit      | Too Many Requests                  |

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

| Status | Caso                                             | Mensaje                     |
| ------ | ------------------------------------------------ | --------------------------- |
| 401    | missing/invalid refresh cookie or session        | Refresh token not available |
| 403    | Origin not allowlisted in cross-site cookie mode | Origin not allowed          |

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

Step-up is password-based in the current API. It updates
`lastAuthenticatedAt` for the current tenant session only. The recent-auth
window is controlled by `AUTH_RECENT_AUTH_WINDOW_SECONDS`; default runtime
configuration is `900` seconds.

#### Recent-auth flow

1. A sensitive endpoint may return `403` with `code=RECENT_AUTH_REQUIRED`.
2. The frontend calls `POST /auth/step-up` with `{ "password": "..." }` using
   the same access token/session.
3. On `200`, the frontend retries the original sensitive request.

Invalid step-up credentials return `401` and do not mark the session as
recently authenticated.

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

Notes:

- `/auth/me` is a global authenticated principal snapshot.
- It does not return membership avatar fields such as `avatarUrl`.

## 3. Capabilities & Roles

### Current organization visible profile

`GET /organizations/:organizationId/me/profile`

**Roles permitidos**: JWT-authenticated member with organization access
**Capability requerida**: org access only
**Step-up requerido**: no
**Scope**: current authenticated membership in `organizationId`

#### Response 200/201

```json
{
  "organizationId": "string",
  "membershipId": "string",
  "userId": "string",
  "displayName": "Marcos Coach",
  "firstName": "Marcos",
  "lastName": "Coach",
  "email": "marcos@example.com",
  "avatarUrl": "https://media.example.test/organizations/org_1/memberships/membership_1/avatars/media_1-random.webp",
  "roleLabel": "Instructor"
}
```

Behavior:

- the response is organization-scoped and reflects the current authenticated
  membership, not a global `User` profile
- `displayName` may be enriched by membership `preferredName`
- `avatarUrl` resolves from `OrganizationMembershipProfile.avatarMediaAsset`
  and returns `null` when there is no active safe public URL
- `roleLabel` is the visible primary role label and may be `null`
- `HEAD_COACH` may appear as `roleLabel` when the membership is effective head
  coach for at least one branch even though it is not a generic assignable role
- the response must never expose storage internals such as `bucket`,
  `objectKey`, `provider`, or `mediaAssetId`

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

| Capability                                             | Protects                                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `organizations.canReadOrganization`                    | `GET /organizations/:organizationId`                                                                                                         |
| `organizations.canManageOrganization`                  | `PATCH /organizations/:organizationId`, `PATCH /organizations/:organizationId/status`                                                        |
| `organizations.canReadBranches`                        | branch list/tree/detail routes                                                                                                               |
| `organizations.canManageBranches`                      | branch create/update routes                                                                                                                  |
| `organizations.canReadGovernance`                      | branch governance-sensitive reads                                                                                                            |
| `usersMemberships.canInviteMembers`                    | `POST /organizations/:organizationId/users/invite`                                                                                           |
| `usersMemberships.canReadMembers`                      | `GET /organizations/:organizationId/users`, `GET /organizations/:organizationId/members`, `GET /organizations/:organizationId/users/:userId` |
| `usersMemberships.canManageMemberships`                | membership status changes and session revocation                                                                                             |
| `usersMemberships.canManageRolesAndScopes`             | membership roles/scopes updates                                                                                                              |
| `usersMemberships.canCreateStudentMembershipFromClaim` | `POST /organizations/:organizationId/students/:studentId/invite`, `POST /organizations/:organizationId/students/bulk-invite`                 |
| `students.canCreateStudent`                            | `POST /organizations/:organizationId/students`                                                                                               |
| `students.canReadStudentPrivateProfile`                | student detail private reads                                                                                                                 |
| `students.canReadStudentTechnicalProfile`              | `GET /organizations/:organizationId/students/:studentId/technical-profile`                                                                   |
| `students.canUpdateStudent`                            | `PATCH /organizations/:organizationId/students/:studentId`                                                                                   |
| `students.canManageBranchVisits`                       | branch visit create/update                                                                                                                   |
| `students.canInviteExistingStudent`                    | student claim invite                                                                                                                         |
| `students.canBulkInviteStudents`                       | bulk claim invite                                                                                                                            |
| `classes.canReadClasses`                               | class schedules/sessions reads                                                                                                               |
| `classes.canManageSchedules`                           | class schedule create/update/delete and session generation                                                                                   |
| `classes.canAssignInstructor`                          | instructor assignment on class schedules/sessions                                                                                            |
| `classes.canExecuteAssignedClass`                      | instructor execution views and assigned session operations                                                                                   |
| `classes.canReadAssignedSessions`                      | assigned sessions list                                                                                                                       |
| `classes.canReadClassTechnicalRoster`                  | technical roster endpoint                                                                                                                    |
| `attendance.canReadSessionAttendance`                  | session attendance listing                                                                                                                   |
| `attendance.canValidateAttendance`                     | attendance record/write endpoints                                                                                                            |
| `attendance.canSuggestAttendance`                      | class-session attendance suggestion endpoint                                                                                                 |
| `attendance.canCorrectAttendanceWithinWindow`          | attendance correction within allowed window                                                                                                  |
| `attendance.canCorrectAttendanceAsAdmin`               | administrative attendance correction                                                                                                         |
| `attendance.canReadAttendanceBehaviorSignals`          | branch attendance signals and follow-up queues                                                                                               |
| `promotions.canReadPromotionContext`                   | student promotion context                                                                                                                    |
| `promotions.canProposePromotion`                       | create promotion request                                                                                                                     |
| `promotions.canEvaluatePromotion`                      | promotion evaluation upsert                                                                                                                  |
| `promotions.canReadPromotionBranchQueue`               | branch promotions list/detail                                                                                                                |
| `promotions.canReadPromotionOrgQueue`                  | org promotions list/detail                                                                                                                   |
| `promotions.canApprovePromotion`                       | approval routes                                                                                                                              |
| `promotions.canRejectPromotion`                        | rejection routes                                                                                                                             |
| `certificates.canUploadCertificate`                    | promotion certificate upload                                                                                                                 |
| `certificates.canReadOwnCertificates`                  | `/certificates/mine`                                                                                                                         |
| `certificates.canReadCertificateHistory`               | student certificate history                                                                                                                  |
| `certificates.canDownloadCertificate`                  | certificate detail/download                                                                                                                  |
| `certificates.canVoidCertificate`                      | certificate void route                                                                                                                       |
| `certificates.canReissueCertificate`                   | certificate reissue route                                                                                                                    |
| `competitions.canReadCompetitionProfile`               | competition profile reads                                                                                                                    |
| `competitions.canLinkCompetitionProfile`               | link/unlink smoothcomp profile                                                                                                               |
| `competitions.canRequestCompetitionSync`               | competition sync route                                                                                                                       |
| `competitions.canOperateCompetitionImports`            | import run operational routes                                                                                                                |
| `competitions.canRemediateCompetitionOwnership`        | legacy ownership remediation                                                                                                                 |
| `billing.canReadBilling`                               | billing reads                                                                                                                                |
| `billing.canWriteBilling`                              | billing create/update/payment recording                                                                                                      |
| `billing.canCreateMercadoPagoPreference`               | Mercado Pago preference creation                                                                                                             |
| `billing.canManagePaymentIntegrations`                 | integration management for payment providers                                                                                                 |
| `billing.canReadWebhookEvents`                         | integration webhook event listing                                                                                                            |
| `billing.canReprocessWebhookEvents`                    | webhook reprocess                                                                                                                            |
| `communications.canReadOwnInbox`                       | own notifications/inbox                                                                                                                      |
| `communications.canSendBranchAnnouncement`             | branch announcements                                                                                                                         |
| `communications.canSendOrgAnnouncement`                | org announcements                                                                                                                            |
| `academyIntake.canReadBranchRequests`                  | intake request list/detail                                                                                                                   |
| `academyIntake.canManageBranchRequests`                | intake transitions and conversion                                                                                                            |
| `academyEvents.canCreate`                              | academy event create                                                                                                                         |
| `academyEvents.canReadBranch`                          | branch event reads                                                                                                                           |
| `academyEvents.canReadOrg`                             | org-wide event reads                                                                                                                         |
| `academyEvents.canUpdate`                              | academy event update                                                                                                                         |
| `academyEvents.canPublish`                             | academy event publish                                                                                                                        |
| `academyEvents.canCancel`                              | academy event cancel                                                                                                                         |
| `academyEvents.canArchive`                             | academy event archive                                                                                                                        |
| `analytics.canReadHierarchyAnalytics`                  | tree-summary and subtree-summary                                                                                                             |
| `analytics.canReadBranchActionableAnalytics`           | action-summary                                                                                                                               |
| `analytics.canReadRiskRoster`                          | risk-roster                                                                                                                                  |
| `audit.canReadBranchAudit`                             | branch-scoped audit log                                                                                                                      |
| `audit.canReadOrgAudit`                                | org-scoped audit log                                                                                                                         |
| `integrations.canReadIntegrations`                     | integration list/detail reads                                                                                                                |
| `integrations.canManageIntegrations`                   | create/update/test/sync integrations                                                                                                         |
| `integrations.canReadIntegrationWebhookEvents`         | webhook event listing/detail                                                                                                                 |
| `integrations.canReprocessIntegrationWebhookEvents`    | webhook event reprocess                                                                                                                      |
| `notifications.canReadOwnNotifications`                | notifications list/count/read                                                                                                                |
| `notifications.canManageNotificationDelivery`          | delivery stats/process                                                                                                                       |

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

| Param   | Tipo   | Default | Descripción      |
| ------- | ------ | ------- | ---------------- |
| `page`  | number | `1`     | Página           |
| `limit` | number | `20`    | Tamaño de página |

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
    "headquarterBranchesTotal": 1,
    "headquarterBranch": null,
    "rootBranches": [
      {
        "id": "string",
        "organizationId": "string",
        "parentBranchId": null,
        "isHeadquarter": true,
        "name": "HQ",
        "slug": "hq",
        "city": "Buenos Aires",
        "status": "ACTIVE"
      }
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

| Param                 | Tipo    | Default | Descripción                |
| --------------------- | ------- | ------- | -------------------------- |
| `page`                | number  | `1`     | Página                     |
| `limit`               | number  | `20`    | Tamaño de página           |
| `status`              | enum    | -       | `BranchStatus`             |
| `isHeadquarter`       | boolean | -       | Filtra headquarter         |
| `isPublicListed`      | boolean | -       | Filtra visibilidad pública |
| `isPublished`         | boolean | -       | Perfil público publicado   |
| `rootOnly`            | boolean | -       | Solo raíces                |
| `needsAttention`      | boolean | -       | Solo con flags             |
| `operationalReady`    | boolean | -       | readiness operacional      |
| `communicationsReady` | boolean | -       | readiness comunicaciones   |
| `analyticsReady`      | boolean | -       | readiness analytics        |
| `publicReady`         | boolean | -       | readiness pública          |
| `hasOperationalOwner` | boolean | -       | Tiene responsable          |
| `hqReviewRequired`    | boolean | -       | Requiere revisión HQ       |

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

| Param                | Tipo   | Default | Descripción                    |
| -------------------- | ------ | ------- | ------------------------------ |
| `activityWindowDays` | number | `30`    | Ventana de actividad, `1..365` |

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

| Param                | Tipo   | Default | Descripción                    |
| -------------------- | ------ | ------- | ------------------------------ |
| `activityWindowDays` | number | `30`    | Ventana de actividad, `1..365` |

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

| Param        | Tipo   | Default | Descripción           |
| ------------ | ------ | ------- | --------------------- |
| `page`       | number | `1`     | Página                |
| `limit`      | number | `20`    | Tamaño                |
| `branchId`   | string | -       | Filtra por branch     |
| `search`     | string | -       | Busca nombre/email    |
| `status`     | enum   | -       | `MembershipStatus`    |
| `scopeType`  | enum   | -       | `MembershipScopeType` |
| `role`       | enum   | -       | `MembershipRole`      |
| `userStatus` | enum   | -       | `UserStatus`          |

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
  "identity": {
    "userId": "string",
    "membershipId": "string",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
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
  "lifecycle": {
    "summary": { "eventsTotal": 0, "createdAt": null, "acceptedAt": null },
    "timeline": null
  }
}
```

### Upsert membership technical profile

`PUT /organizations/:organizationId/memberships/:membershipId/technical-profile`

**Roles permitted**: authenticated member with organization-wide `MESTRE`/`ORG_ADMIN`, or branch-authorized leadership with effective branch access at `HEAD_COACH` or above for the target membership primary branch.
**Step-up requerido**: yes, recent authentication required.
**Scope**: tenant-scoped by `organizationId + membershipId`; branch-scoped leadership is limited to the target membership primary branch.

#### Request body

```json
{
  "currentBelt": "ADULT_BLACK",
  "currentStripes": 2
}
```

`currentBelt` must be a value from the existing `PromotionRank` enum or `null` to clear the visible rank. `currentStripes` must be an integer from `0` to `4`.

#### Response

```json
{
  "organizationId": "string",
  "membershipId": "string",
  "belt": {
    "rank": "ADULT_BLACK",
    "degree": null,
    "stripeCount": 2,
    "label": "Adult Black"
  }
}
```

When `currentBelt` is `null`, `belt` is `null`.

#### Business rules

- Creates `OrganizationMembershipTechnicalProfile` when the target membership has none.
- Updates the active profile when it exists.
- Restores a soft-deleted profile by setting `deletedAt = null` and applying the explicit new values.
- `ACADEMY_MANAGER` may manage only memberships inside its effective branch/academy scope.
- `ACADEMY_MANAGER` cannot use `ORGANIZATION_WIDE` scope as multi-branch authority for this endpoint.
- `ACADEMY_MANAGER` and `HEAD_COACH` cannot manage organization leadership technical profiles.
- Branch-authorized leadership cannot manage targets without a clear `primaryBranchId`.
- For target memberships linked to an active `Student` in the same organization through the same `userId`, the writer also updates `Student.currentBelt/currentStripes` in the same transaction. The historical Student contract remains the source consumed by `GET /students/:studentId` and branch student list responses for student rank display.
- If the target membership is not linked to an active Student, the membership technical profile write still succeeds and no Student row is updated.
- Does not update `PromotionRequest`, promotion history, certificates, notifications, or snapshots.

Frontend/admin should edit student rank by calling this membership technical profile writer with the `membershipId` exposed by student detail/list, then refetch student detail or branch student list. No separate Student rank writer exists in V1.
- Does not infer rank from `Student`, `user.students[0]`, Promotion snapshots, certificates, or attendance signals.
- Does not expose email, phone, billing, notes, date of birth, or storage internals.
- Writes an audit log entry with actor, target membership, previous rank/stripes, next rank/stripes, and source `ADMIN_TECHNICAL_PROFILE_UPDATE`.

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

#### Identity conflict 409

When adding `STUDENT` to an existing membership, backend checks whether a
same-organization unlinked `Student` already uses the membership user's email.
If so, role replacement is blocked with `STUDENT_USER_IDENTITY_CONFLICT`.
Backend does not autolink by email.

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

| Param               | Tipo    | Default | Descripción                                                                                                                                              |
| ------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`              | number  | `1`     | Página                                                                                                                                                   |
| `limit`             | number  | `20`    | Tamaño                                                                                                                                                   |
| `membershipStatus`  | enum    | -       | `MembershipStatus`                                                                                                                                       |
| `role`              | enum    | -       | `MembershipRole`                                                                                                                                         |
| `search`            | string  | -       | Busca persona                                                                                                                                            |
| `userStatus`        | enum    | -       | `UserStatus`                                                                                                                                             |
| `accessState`       | enum    | -       | `INVITED_PENDING`, `INVITATION_EXPIRED`, `ACTIVE`, `ACTIVE_NO_SESSIONS`, `MEMBERSHIP_SUSPENDED`, `MEMBERSHIP_REVOKED`, `USER_SUSPENDED`, `ACCESS_REVIEW` |
| `hasActiveSessions` | boolean | -       | Filtro                                                                                                                                                   |
| `needsAttention`    | boolean | -       | Filtro                                                                                                                                                   |

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

#### Identity conflict 409

This endpoint is for operational users/members who are not reclaiming an
existing student record. If the requested email already belongs to a same-
organization `Student` with `userId = null`, the API returns
`STUDENT_USER_IDENTITY_CONFLICT` and does not create a separate
`User`/`OrganizationMembership`.

```json
{
  "code": "STUDENT_USER_IDENTITY_CONFLICT",
  "message": "A student with this email already exists without a linked user account.",
  "existingStudentId": "student_123",
  "existingUserId": null,
  "existingMembershipId": null,
  "suggestedAction": "INVITE_STUDENT_CLAIM"
}
```

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

#### Identity rules

- `Student` is the academy's operational athlete/practitioner record.
- `User` + `OrganizationMembership` is the login, access, roles and avatar identity.
- `Student.userId` is the formal link between both worlds.
- Creating a student with no `userId` is blocked when a same-organization membership already owns the email.
- Creating a student with explicit `userId` remains valid when that user has a membership in the same organization and is not already linked to another student.

#### Identity conflict 409

```json
{
  "code": "STUDENT_USER_IDENTITY_CONFLICT",
  "message": "A user or member with this email already exists in the organization.",
  "existingStudentId": null,
  "existingUserId": "user_123",
  "existingMembershipId": "membership_123",
  "suggestedAction": "CREATE_STUDENT_WITH_EXISTING_USER"
}
```

### List students by branch

`GET /organizations/:organizationId/branches/:branchId/students`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canReadStudentPrivateProfile`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Query params

| Param   | Tipo   | Default | Descripción                                                                                                                                                                                                                                              |
| ------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`  | number | `1`     | Página                                                                                                                                                                                                                                                   |
| `limit` | number | `20`    | Tamaño                                                                                                                                                                                                                                                   |
| `q`     | string | -       | Basic server-side search across `firstName`, `lastName`, `email`, and `phone`. Trimmed; blank values are ignored. Case-insensitive partial matching. Multi-word input matches tokens across the same exposed fields, supporting names like `juan perez`. |

#### Response

`{ items: [...], meta: { page, limit, total } }`

Each student item now may include:

- `membershipId: string | null`
- `avatarUrl: string | null`

`membershipId` is the linked student's active `STUDENT` organization membership id when the student is linked to a `User` and active membership in the same organization. It is `null` for unclaimed/unlinked students or students without a matching active student membership. Use this id with `PUT /organizations/:organizationId/memberships/:membershipId/technical-profile` when editing BJJ technical rank from the admin student profile.

`avatarUrl` resolves from the linked student's active `STUDENT` organization membership profile avatar when that profile has an active avatar asset and storage can return a safe public URL. If the student membership profile has no avatar, backend may fall back to another active membership profile for the same `userId` inside the same `organizationId`. It is `null` when no same-organization active membership profile can provide a safe public avatar URL. Storage internals are never exposed.

#### Frontend contract note

- `q` is the V1 server-side search for branch-local student lookup, intended for attendance/check-in walk-ins and large academies.
- Search remains scoped to the requested organization and branch primary assignment. It does not search other branches in the organization.
- The endpoint keeps the existing `page`/`limit` pagination and response shape; do not use `offset`.
- Frontend should stop fetching the first 100 students for local filtering when a search term is available. Send `q` with a small `limit` instead.

### Get student detail

`GET /organizations/:organizationId/students/:studentId`

**Roles permitted**: authenticated member
**Capability requerida**: `students.canReadStudentPrivateProfile`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response shape

The private student view:

- list fields: `id`, `organizationId`, `primaryBranchId`, `firstName`, `lastName`, `email`, `phone`, `status`, `promotionTrack`, `currentBelt`, `currentStripes`, `createdAt`, `updatedAt`
- detail-only fields: `membershipId`, `userId`, `dateOfBirth`, `startedBjjAt`, `joinedOrganizationAt`, `parentTutorName`, `parentTutorPhone`, `parentTutorRelation`, `primaryBranch`, `branchAssignments`, `branchVisits`, `activeBranchVisits`
- private field `technicalNotes` is hidden unless the caller has access
- `promotionCertificates` is hidden in the private view
- `membershipId` follows the same linked active `STUDENT` membership rule as the branch student list and is the id to use with the membership technical profile writer
- `avatarUrl` follows the same rule as the branch student list: active student membership profile first, then same-user active same-organization membership avatar fallback, otherwise `null`

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

#### Identity conflict 409

If the resulting `email`/`userId` pair would leave a same-organization
`Student` and `User`/`OrganizationMembership` with the same email but without
the formal `Student.userId` link, the update is blocked with
`STUDENT_USER_IDENTITY_CONFLICT`.

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
  "id": "string",
  "studentId": "string",
  "email": "student@example.test",
  "expiresAt": "2026-06-02T10:30:00.000Z",
  "deliveryRequired": true,
  "delivery": {
    "channel": "EMAIL",
    "status": "SENT",
    "provider": "NOOP | RESEND",
    "requestedAt": "2026-05-26T10:30:00.000Z",
    "sentAt": "2026-05-26T10:30:00.000Z",
    "failureCode": null
  },
  "token": null,
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
  }
}
```

Top-level fields are the official frontend/mobile contract. `invitation` is
kept for backward compatibility with earlier admin clients.

`delivery.status=FAILED` is returned when the transactional provider rejects
the send; `failureCode` is sanitized and never contains a plaintext token.

When `EXPOSE_INVITATION_TOKEN_IN_RESPONSE=true` and `NODE_ENV` is not
`production`, `token` may contain the plaintext smoke token. In production,
`token` is always `null`.

#### Email contract

- Subject: `Claim your {organizationName} student account`
- Text fallback: required and includes the web claim URL.
- HTML: included when the provider supports HTML, with a `Claim my account`
  CTA button, visible fallback URL, expiration, support contact, and security
  footer.
- Web URL: `{APP_WEB_URL}/accept-student-claim?token=<token>`
- Mobile deep link: `{APP_MOBILE_DEEP_LINK}/accept-student-claim?token=<token>`
  only when `APP_MOBILE_DEEP_LINK` is configured.
- The email never includes a password, and the token appears only inside claim
  links.

**Side effects**

- Sends claim invitation email.
- Writes audit event.

#### Stable business outcomes and errors

- Missing recent-auth / step-up: `403` with `code=RECENT_AUTH_REQUIRED`.
- Student already linked to a user: `409` with
  `code=STUDENT_ACCOUNT_ALREADY_LINKED`.
- Individual invite for a student with an active pending claim invitation is
  allowed: the new invitation supersedes prior pending invitations.
- Bulk invite for a student with an active pending claim invitation is not an
  HTTP error; the per-student result is
  `status=SKIPPED_EXISTING_PENDING_INVITE`.
- Student/User email ambiguity is represented by the shared
  `STUDENT_USER_IDENTITY_CONFLICT` contract where implemented. The claim invite
  endpoint does not autolink by email alone.
- Email delivery failure is not an HTTP error for a created invitation. The
  response remains successful and returns `delivery.status=FAILED`,
  `delivery.sentAt=null`, and a sanitized `delivery.failureCode`.

Example already-linked response:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "STUDENT_ACCOUNT_ALREADY_LINKED",
  "message": "Student account is already linked to a user",
  "path": "/api/v1/organizations/org_123/students/student_123/invite",
  "requestId": "uuid",
  "timestamp": "2026-05-26T10:30:00.000Z"
}
```

This remains the official flow for an existing `Student` with no linked user
account. Backend creates or reuses the `User`, creates or reuses the
`OrganizationMembership`, ensures `STUDENT`, and sets `Student.userId` only
through claim acceptance. Backend does not autolink by email outside this
token-bound flow.

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

| Status | Caso                                         | Mensaje                                               |
| ------ | -------------------------------------------- | ----------------------------------------------------- |
| 401    | no bearer token                              | Unauthorized                                          |
| 404    | branch inactive/private/unlisted/unpublished | Branch is not accepting public intake requests        |
| 409    | duplicate active requester request           | ACTIVE_INTAKE_REQUEST_EXISTS                          |
| 422    | invalid body                                 | Invalid payload                                       |
| 429    | route/IP or branch-volume rate limit         | Too Many Requests / PUBLIC_INTAKE_BRANCH_RATE_LIMITED |

### My intake requests

`GET /me/intake-requests`

**Roles permitidos**: authenticated user
**Capability requerida**: no aplica
**Step-up requerido**: no
**Scope**: requester-owned

#### Query params

| Param | Tipo   | Default | Descripción |
| ----- | ------ | ------- | ----------- |
| page  | number | 1       | Page number |
| limit | number | 20      | Page size   |

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

| Status | Caso               | Mensaje       |
| ------ | ------------------ | ------------- |
| 401    | no bearer token    | Unauthorized  |
| 422    | invalid pagination | Invalid query |

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
  "request": {
    "id": "string",
    "convertedStudentId": "student_123",
    "convertedMembershipId": "membership_123"
  },
  "student": {
    "id": "student_123",
    "organizationId": "string",
    "primaryBranchId": "string",
    "userId": "string"
  },
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

After conversion, admin clients can call
`POST /organizations/:organizationId/students/:convertedStudentId/invite`
using either `response.request.convertedStudentId` or `response.student.id`.

#### Identity conflict 409

Conversion never creates a duplicate student/user identity silently. If the
intake email already belongs to an existing same-organization `Student`, linked
`User`, or incompatible `OrganizationMembership`, the API returns
`STUDENT_USER_IDENTITY_CONFLICT` with the relevant existing IDs and a stable
`suggestedAction`.

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

### Class schedule detail

`GET /organizations/:organizationId/branches/:branchId/class-schedules/:scheduleId`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response

Same schedule item shape used by create, update, and list items, without pagination wrapper.

#### Errores específicos del endpoint

| Status | Caso                                  | Mensaje                                     |
| ------ | ------------------------------------- | ------------------------------------------- |
| 403    | no branch class read capability       | Insufficient class schedule read capability |
| 404    | schedule does not exist in branch/org | Class schedule not found                    |

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

### Delete class schedule

`DELETE /organizations/:organizationId/branches/:branchId/class-schedules/:scheduleId`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response

`204 No Content`

#### Contract rules

- This is a soft delete: backend sets `ClassSchedule.deletedAt`.
- Existing `ClassSession` rows are not deleted, canceled, or detached.
- Deleted schedules are excluded from class schedule list/detail and from schedule-based session generation.
- Deleting a schedule that does not exist in the requested organization/branch returns `404`.
- Deleting a schedule that is already soft-deleted returns `404`.

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

#### Conflict 409

Manual creation validates branch overlap and instructor overlap before insert. When a conflict is detected the response is stable and parseable:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "CLASS_SESSION_CONFLICT",
  "message": "Class session conflicts with an existing session.",
  "conflict": {
    "type": "BRANCH_OVERLAP",
    "classSessionId": "class_session_existing",
    "branchId": "branch_123",
    "instructorMembershipId": "membership_123",
    "startAt": "2026-06-01T18:00:00.000Z",
    "endAt": "2026-06-01T19:00:00.000Z"
  }
}
```

`conflict.type` can be `BRANCH_OVERLAP`, `INSTRUCTOR_OVERLAP` or `SCHEDULE_OVERLAP`. The payload intentionally does not include class title, notes or other private session fields.

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
  "updatedAt": "2026-05-27T10:30:00.000Z"
}
```

**Behavior**

- Uses the schedule snapshot for title, class type, instructor, start/end local time, timezone and capacity.
- Requires `scheduledDate` in `YYYY-MM-DD` format and it must match the schedule weekday.
- Runs the same branch overlap and instructor overlap validations as manual session creation.
- Diff vs branch session generation: this endpoint creates one explicit session for one schedule/date; generation scans all active schedules in a date range and returns counters.
- Diff vs branch missing-session generation: this endpoint does not inspect a date range for gaps; missing-session generation scans existing materialized sessions and fills missing schedule/date instances.

#### Errores específicos del endpoint

| Status | Caso                                                         | Mensaje / código                                            |
| ------ | ------------------------------------------------------------ | ----------------------------------------------------------- |
| 400    | date does not match schedule weekday or invalid time window  | Scheduled date does not match schedule weekday              |
| 403    | no schedule management capability for branch                 | Insufficient class schedule management capability           |
| 404    | schedule/branch not found in organization                    | Class schedule not found                                    |
| 409    | session already exists or overlaps branch/instructor session | `CLASS_SESSION_CONFLICT`; see conflict response shape above |

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
  "status": "COMPLETED",
  "fromDate": "2026-06-01",
  "toDate": "2026-06-30",
  "processedSchedules": 10,
  "candidateCount": 42,
  "created": 12,
  "skipped": 20,
  "conflicts": 10,
  "errors": 0,
  "generatedCount": 12,
  "skippedExistingCount": 20,
  "skippedConflictCount": 10,
  "items": [
    {
      "scheduleId": "class_schedule_123",
      "classSessionId": "class_session_123",
      "date": "2026-06-01",
      "status": "CREATED"
    },
    {
      "scheduleId": "class_schedule_124",
      "classSessionId": "class_session_existing",
      "date": "2026-06-02",
      "status": "SKIPPED_EXISTING"
    },
    {
      "scheduleId": "class_schedule_125",
      "classSessionId": "class_session_conflict",
      "date": "2026-06-03",
      "status": "CONFLICT",
      "conflict": {
        "type": "BRANCH_OVERLAP",
        "classSessionId": "class_session_conflict",
        "branchId": "branch_123",
        "instructorMembershipId": "membership_123",
        "startAt": "2026-06-03T18:00:00.000Z",
        "endAt": "2026-06-03T19:00:00.000Z"
      }
    }
  ]
}
```

**Behavior**

- Synchronous operation. There is no job/status endpoint for this flow.
- Date range is limited by backend policy to 42 calendar days.
- Generation is protected by branch and instructor advisory locks inside a serializable transaction.
- Existing schedule/date materializations are skipped, not duplicated.
- Branch or instructor overlaps are skipped and reported per item as `status: "CONFLICT"`.
- Legacy counters (`generatedCount`, `skippedExistingCount`, `skippedConflictCount`) remain for compatibility; frontend should prefer `created`, `skipped`, `conflicts`, `errors` for UI summaries.

### Generate missing class sessions

`POST /organizations/:organizationId/branches/:branchId/class-sessions/generate-missing`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canManageSchedules`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Request body

Same as generate.

#### Response

Same synchronous response shape as generate, plus:

```json
{
  "status": "COMPLETED",
  "fromDate": "2026-06-01",
  "toDate": "2026-06-30",
  "processedSchedules": 10,
  "candidateCount": 42,
  "missingCandidateCount": 12,
  "created": 12,
  "skipped": 30,
  "conflicts": 0,
  "errors": 0,
  "generatedCount": 12,
  "skippedExistingCount": 30,
  "skippedConflictCount": 0,
  "items": [
    {
      "scheduleId": "class_schedule_123",
      "classSessionId": "class_session_existing",
      "date": "2026-06-01",
      "status": "SKIPPED_EXISTING"
    },
    {
      "scheduleId": "class_schedule_123",
      "classSessionId": "class_session_created",
      "date": "2026-06-08",
      "status": "CREATED"
    }
  ]
}
```

**Behavior**

- Synchronous operation. There is no job/status endpoint for this flow.
- Date range is limited by backend policy to 42 calendar days.
- Idempotent for existing schedule/date pairs: re-running the same range reports `SKIPPED_EXISTING` instead of creating duplicates.
- `candidateCount` is the total expected schedule/date pairs in range; `missingCandidateCount` is the subset sent to generation after already materialized sessions are excluded.

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

| Param      | Tipo   | Default | Descripción |
| ---------- | ------ | ------- | ----------- |
| `page`     | number | `1`     | Página      |
| `limit`    | number | `20`    | Tamaño      |
| `fromDate` | date   | -       | inicio      |
| `toDate`   | date   | -       | fin         |

#### Response

`{ items: [...], meta: { page, limit, total } }`

**Frontend contract note**

- This endpoint returns the compact branch operations list shape from `ClassSession`.
- Canonical compact list items expose instructor identity through `instructor`, not `instructorMembership`, and expose capacity as `{ "max": number | null, "enrolled": number }`.
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
    "avatarUrl": "https://media.example.test/organizations/org_123/memberships/membership_123/avatars/media_1-random.webp",
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
  "suggestions": {
    "total": 0,
    "pending": 0,
    "accepted": 0,
    "declined": 0,
    "canceled": 0
  },
  "cancellationReason": null,
  "cancelledAt": null,
  "cancelledByMembershipId": null,
  "createdAt": "2026-05-26T10:30:00.000Z",
  "updatedAt": "2026-05-26T10:30:00.000Z"
}
```

**Notes**

- In this branch-operational detail endpoint, `description` mirrors `ClassSession.notes`; `notes` is kept for compatibility with existing class-session surfaces.
- `ClassSession.notes` is treated as internal/operational session text, not as a guaranteed student-safe public class description.
- There is no dedicated session-level `publicDescription` field in the current `ClassSession` model. Student-safe public description currently comes only from `ClassSchedule.description` in the dedicated student session-detail read model.
- `instructor.avatarUrl` resolves from the instructor membership's visible `OrganizationMembershipProfile.avatarMediaAsset` first. If that membership profile has no public active avatar, backend may fall back to another active membership profile for the same `userId` inside the same `organizationId`. It is `null` when no same-organization active profile can provide a safe public URL.
- `instructor.primaryBelt` is a rich `PromotionRank` catalog entry or `null`; frontend must not parse rank strings with `split("_")`.
- `status` uses the backend enum value `CANCELED`, not `CANCELLED`.
- `scheduledDate` is serialized as an ISO timestamp (`YYYY-MM-DDT00:00:00.000Z`) by Nest/JSON.
- `capacity.enrolled` and `attendance.expected` currently use active attendance intents; `waitlist` is `0` because there is no waitlist domain yet.
- `suggestions` is a summary only. Use the dedicated attendance suggestions endpoint when the frontend needs the full list.
- `cancelledAt` and `cancelledByMembershipId` are derived from the latest `class_session.canceled` audit entry when available.

#### Errores específicos del endpoint

| Status | Caso                                 | Mensaje                                    |
| ------ | ------------------------------------ | ------------------------------------------ |
| 403    | no branch class read capability      | Insufficient class session read capability |
| 404    | session does not exist in branch/org | Class session not found                    |

### Class calendar

`GET /organizations/:organizationId/branches/:branchId/class-calendar`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Query params

| Param       | Tipo | Default  | Descripción                    |
| ----------- | ---- | -------- | ------------------------------ |
| `startDate` | date | required | Start of view                  |
| `view`      | enum | `DAY`    | `DAY`, `WEEK`, `MONTH`, `LIST` |

#### Range behavior

- `DAY`: returns `startDate` only.
- `WEEK`: returns seven days starting at `startDate`; it does not auto-align to Monday/Sunday.
- `MONTH`: returns the complete calendar UI grid containing the month of `startDate`, aligned Monday to Sunday. The range includes neighboring days from the previous/next month when needed and is always 35 or 42 days.
- `LIST`: returns the full calendar month containing `startDate`, with frontend expected to render the top-level flat `items` array chronologically.
- The endpoint groups by the persisted `ClassSession.scheduledDate` calendar date. Session timestamps remain UTC ISO strings.

#### Response

```json
{
  "view": "WEEK",
  "startDate": "2026-05-26",
  "endDate": "2026-06-01",
  "items": [
    {
      "id": "class_session_123",
      "organizationId": "org_123",
      "branchId": "branch_123",
      "classScheduleId": "class_schedule_123",
      "instructorMembershipId": "membership_123",
      "title": "Fundamentals",
      "classType": "GI",
      "scheduledDate": "2026-05-26T00:00:00.000Z",
      "startAt": "2026-05-26T18:00:00.000Z",
      "endAt": "2026-05-26T19:00:00.000Z",
      "capacity": {
        "max": 20,
        "enrolled": 3
      },
      "status": "SCHEDULED",
      "cancellationReason": null,
      "notes": null,
      "createdAt": "2026-05-26T10:30:00.000Z",
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "instructor": {
        "membershipId": "membership_123",
        "userId": "user_123",
        "firstName": "Assigned",
        "lastName": "Instructor",
        "displayName": "Assigned Instructor"
      }
    }
  ],
  "days": [
    {
      "date": "2026-05-26",
      "items": [
        {
          "id": "class_session_123",
          "organizationId": "org_123",
          "branchId": "branch_123",
          "classScheduleId": "class_schedule_123",
          "instructorMembershipId": "membership_123",
          "title": "Fundamentals",
          "classType": "GI",
          "scheduledDate": "2026-05-26T00:00:00.000Z",
          "startAt": "2026-05-26T18:00:00.000Z",
          "endAt": "2026-05-26T19:00:00.000Z",
          "capacity": {
            "max": 20,
            "enrolled": 3
          },
          "status": "SCHEDULED",
          "cancellationReason": null,
          "notes": null,
          "createdAt": "2026-05-26T10:30:00.000Z",
          "updatedAt": "2026-05-26T10:30:00.000Z",
          "instructor": {
            "membershipId": "membership_123",
            "userId": "user_123",
            "firstName": "Assigned",
            "lastName": "Instructor",
            "displayName": "Assigned Instructor"
          }
        }
      ]
    }
  ]
}
```

**Frontend contract note**

- This is a branch-scoped operational calendar, not the student self calendar.
- Items use the compact class-session list shape, not the Session Detail shape.
- The canonical compact item shape is shared by `GET /class-calendar`, `GET /class-sessions`, and `GET /class-sessions/assigned`: `instructor` is flat membership/user identity and `capacity` is an object with `max` and `enrolled`.
- `items` is always chronological and flat. `days` is kept for grouped DAY/WEEK/MONTH compatibility.
- For `LIST`, consume `items`; `days` remains present but should not be required for a linear UI.
- For student-facing calendar UI, use `GET /organizations/:organizationId/students/me/calendar` or `GET /organizations/:organizationId/training-calendar`.

### Class session gaps

`GET /organizations/:organizationId/branches/:branchId/class-session-gaps`

**Roles permitted**: authenticated member
**Capability requerida**: `classes.canReadClasses`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params

| Param      | Tipo | Default  | Descripción |
| ---------- | ---- | -------- | ----------- |
| `fromDate` | date | required | start       |
| `toDate`   | date | required | end         |

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

#### Conflict 409

Uses the same `CLASS_SESSION_CONFLICT` response shape documented under create class session. `PATCH` excludes the session being updated from overlap detection.

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
        "avatarUrl": "https://media.example.test/organizations/org_123/memberships/membership_student/avatars/media_1-random.webp",
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

`student.avatarUrl` resolves from the linked student's active `STUDENT` organization membership profile avatar when storage can return a safe public URL. If that profile has no avatar, backend may fall back to another active membership profile for the same `userId` inside the same `organizationId`. It is `null` otherwise. The roster still must not expose `bucket`, `objectKey`, provider, or `mediaAssetId`.

### List session attendance

`GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canReadSessionAttendance`
**Step-up requerido**: no
**Scope**: BRANCH_SCOPED

#### Response

```json
{
  "items": [
    {
      "id": "attendance_123",
      "studentId": "student_123",
      "status": "PRESENT",
      "reasonCode": null,
      "source": "STAFF_MANUAL",
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "student": {
        "id": "student_123",
        "primaryBranchId": "branch_123",
        "firstName": "Roger",
        "lastName": "Silva",
        "avatarUrl": "https://media.example.test/organizations/org_123/memberships/membership_student/avatars/media_1-random.webp",
        "status": "ACTIVE",
        "currentBelt": "ADULT_BLUE",
        "currentStripes": 2
      }
    }
  ],
  "intents": [
    {
      "id": "intent_123",
      "studentId": "student_124",
      "status": "ACTIVE",
      "canceledAt": null,
      "cancelReasonCode": null,
      "cancelReasonNote": null,
      "updatedAt": "2026-05-26T10:30:00.000Z",
      "student": {
        "id": "student_124",
        "primaryBranchId": "branch_123",
        "firstName": "Ana",
        "lastName": "Silva",
        "avatarUrl": null,
        "status": "ACTIVE",
        "currentBelt": "WHITE",
        "currentStripes": 0
      }
    }
  ],
  "summary": {
    "total": 1,
    "counts": {
      "PRESENT": 1,
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
- `items[].student.avatarUrl` and `intents[].student.avatarUrl` are public URL strings or `null`; storage internals are never exposed.
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

#### Window conflict

When staff attendance is attempted outside the staff attendance operation window, the API returns `409` with a stable code and window metadata while preserving the legacy `message`:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "ATTENDANCE_OUTSIDE_WINDOW",
  "message": "Staff attendance operation is only allowed between 2026-06-01T17:00:00.000Z and 2026-06-01T21:00:00.000Z",
  "windowStart": "2026-06-01T17:00:00.000Z",
  "windowEnd": "2026-06-01T21:00:00.000Z",
  "path": "/api/v1/organizations/org_1/branches/branch_1/class-sessions/session_1/attendance",
  "requestId": "request_1",
  "timestamp": "2026-06-01T12:00:00.000Z"
}
```

### Self check-in (DEPRECATED — legacy, not recommended)

> **DEPRECATED / LEGACY — DO NOT USE FOR NEW CLIENTS.**
> In KURO V1 student self-check-in (trust-based attendance with no proof of presence) is **not** a supported or recommended flow. The official student attendance flow is **QR check-in** (`POST /organizations/:organizationId/students/me/check-ins/qr`), which records attendance against a token the instructor issues in class.
> This endpoint is retained only for backward compatibility. It is **not** exposed in the Android Student Home (`checkIn.action` never returns `OPEN_SELF_CHECK_IN`) and **must not** be surfaced in the web frontend as a student self-attendance action. No configuration exists, or will be added, to re-enable it as a recommended flow.

`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/self-check-in`

**Roles permitted**: authenticated student (linked student profile), self only — resolved from the JWT, never marks another student
**Capability required**: student self route access (`AttendancePolicy.ensureCanSelfCheckIn`, organization role `STUDENT`)
**Step-up required**: no
**Scope**: BRANCH_SCOPED
**Status**: DEPRECATED. Records attendance with source `SELF_CHECKIN`.

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

Request `expiresInMinutes` is optional and kept for backward compatibility as a technical token TTL hint. When present it must be between `1` and `15` minutes. The QR attendance operational window is not derived from this value; clients must use `validFrom` and `validUntil` from the response.

Response `expiresInMinutes` is the effective number of minutes from issuance time until `expiresAt`. It can be greater than the request max of 15 when a token is generated before `validFrom` and `expiresAt` is aligned to `validUntil`.

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
  "token": "string",
  "qrCodeData": "string",
  "validFrom": "2026-05-26T10:15:00.000Z",
  "validUntil": "2026-05-26T12:30:00.000Z",
  "currentStatus": "SCHEDULED",
  "expiresInMinutes": 120
}
```

#### Contract rules

- QR generation is allowed before the attendance QR window so staff can prepare a screen, tablet, or print material in advance.
- QR usage remains server-side restricted to the QR attendance window: 45 minutes before class start through 30 minutes after class end.
- `currentStatus` is `SCHEDULED` when `now < validFrom` and `ACTIVE` when `validFrom <= now <= validUntil`.
- If generation happens before `validFrom`, the issued token is allowed to live until `validUntil` so it can become usable later. Check-in still fails before `validFrom`.
- If generation happens inside the active window and `expiresInMinutes` is provided, `expiresAt` is capped to `min(now + expiresInMinutes, validUntil)`.
- Request `expiresInMinutes` and response `expiresInMinutes` are not the same semantic field: request is a legacy TTL hint capped at 15; response is the effective TTL until `expiresAt`.
- Canceled sessions never issue QR tokens.
- Sessions whose QR attendance window already ended do not issue new QR tokens.
- `token` and `qrCodeData` contain the raw QR secret and must not be logged, persisted in frontend storage, or exposed in analytics.

#### Structured errors

| HTTP | Code                           | Notes                                                               |
| ---- | ------------------------------ | ------------------------------------------------------------------- |
| 409  | `QR_SESSION_CANCELED`          | Session is canceled and cannot issue or accept QR attendance.       |
| 409  | `QR_ATTENDANCE_WINDOW_EXPIRED` | QR generation requested after the QR attendance window ended.       |
| 409  | `QR_TOKEN_EXPIRATION_TOO_LONG` | Requested `expiresInMinutes` exceeds the current max of 15 minutes. |
| 409  | `QR_OUTSIDE_CHECK_IN_WINDOW`   | QR check-in attempted before `validFrom` or after `validUntil`.     |

Structured QR window errors keep the legacy `message` field and include `validFrom`, `validUntil`, and `currentStatus` when the session window is available.

### QR check-in (session-scoped — LEGACY/compatibility)

> **LEGACY / COMPATIBILITY.** This session-scoped QR endpoint requires the caller to know `branchId` and `sessionId` before scanning. It is kept for backward compatibility (web/Postman/existing tests). New mobile clients **must** use the branchless **Student self QR check-in** (`POST /organizations/:organizationId/students/me/check-ins/qr`) below, which derives branch/session from the scanned token.
> Both endpoints apply identical validations (token validity/expiration/revocation, check-in window, branch access including approved visits, billing restriction, idempotency) and both record attendance with source `QR_CHECKIN`. There is no security or visit-support difference between them.

`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/qr-check-in`

**Roles permitted**: authenticated student (linked student profile), self only — resolved from the JWT
**Capability requerida**: student self QR check-in (`AttendancePolicy.ensureCanQrCheckIn`, organization role `STUDENT`)
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

### Student self QR check-in (RECOMMENDED for mobile)

`POST /organizations/:organizationId/students/me/check-ins/qr`

**Roles permitted**: authenticated student with linked student profile
**Capability required**: student self QR check-in through attendance policy
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE request path, but execution is validated against the class session branch and the linked student's primary/approved-visit context

#### Request body

```json
{
  "code": "string"
}
```

#### Response

```json
{
  "status": "CHECKED_IN",
  "classSessionId": "session_123",
  "className": "Fundamentals - Gi",
  "checkedInAt": "2026-06-01T18:25:00.000Z",
  "checkedInAtEpochMs": 1780347900000,
  "alreadyCheckedIn": false,
  "message": "Check-in successful"
}
```

#### Contract rules

- This endpoint exists for mobile/app QR scanner flows so Android does not need `branchId` or `sessionId` in advance.
- The scanned `code` is treated as the QR token raw value. Home never returns this raw value.
- Success is idempotent: if the student was already checked in for that session, the endpoint still returns `status=CHECKED_IN` with `alreadyCheckedIn=true`.
- `checkedInAt` uses the canonical attendance record creation timestamp and `checkedInAtEpochMs` is the same moment in epoch milliseconds.

#### Error semantics

- `403`: tenant mismatch, missing linked student, or the linked student is not allowed to operate in the session branch.
- `404`: QR code/token does not exist in the organization.
- `409`: QR token expired, QR token revoked, session is no longer inside the check-in window (`QR_OUTSIDE_CHECK_IN_WINDOW`), session canceled (`QR_SESSION_CANCELED`), or attendance is blocked by billing restrictions.

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

### Create class-session attendance suggestions

`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/suggestions`

Creates staff-authored attendance suggestions for one or more students. This persists `AttendanceSuggestion` as the source of truth and enqueues an in-app notification event for each newly created valid suggestion. The actor-facing `Notification` is materialized asynchronously by the notifications worker. This is not official attendance, not QR check-in, not staff manual attendance, and not enrollment/RSVP.

**Roles permitted**: `MESTRE`, `ORG_ADMIN`, `ACADEMY_MANAGER`, branch/effective `HEAD_COACH`, `STAFF`, and the assigned `INSTRUCTOR` for the target session
**Capability requerida**: `attendance.canSuggestAttendance`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Request body

```json
{
  "studentIds": ["student_1", "student_2", "student_3"],
  "message": "Te recomendamos asistir a esta clase para preparar tu próxima graduación."
}
```

Rules:

- `studentIds`: required, 1..300 unique strings.
- `message`: optional, trimmed, max 280 characters.
- Target is currently `CLASS_SESSION` only.
- The class session must belong to the requested organization and branch, be `SCHEDULED`, and not be finished.
- Students must belong to the organization, be active, and be allowed in the branch by primary branch or an approved visit overlapping the session window.
- Students must have an active recipient `OrganizationMembership` to receive the in-app notification event.
- Existing pending suggestions for the same student/session are deduplicated and returned as `created: false`.
- Creating a suggestion does not create `AttendanceIntent` or `AttendanceRecord`.

#### Response

```json
{
  "classSessionId": "session_123",
  "created": 2,
  "skipped": 1,
  "alreadySuggested": 1,
  "notificationFailures": [],
  "invalidStudents": [
    {
      "studentId": "student_4",
      "reason": "NO_BRANCH_ACCESS"
    }
  ],
  "items": [
    {
      "studentId": "student_1",
      "suggestionId": "suggestion_1",
      "status": "PENDING",
      "notificationId": null,
      "created": true
    },
    {
      "studentId": "student_2",
      "suggestionId": "suggestion_existing",
      "status": "PENDING",
      "notificationId": "notification_existing",
      "created": false
    }
  ]
}
```

`invalidStudents[].reason` can be:

- `NOT_FOUND`
- `INACTIVE`
- `NO_BRANCH_ACCESS`
- `NO_ACTIVE_RECIPIENT_MEMBERSHIP`

#### Errors

| Status | Condition                                       | Message                                                                                                                 |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 403    | missing organization/branch capability          | Organization access denied / Branch access denied / missing capability                                                  |
| 404    | branch or class session does not exist in scope | Branch not found / Class session not found                                                                              |
| 409    | session not scheduled or already finished       | Attendance suggestions can only be created for scheduled class sessions / cannot be created for finished class sessions |
| 422    | invalid body                                    | validation error                                                                                                        |

#### Notification

For every newly created valid suggestion, the backend enqueues one worker-backed in-app notification event for the student's active membership. The notification center item appears after the next notifications worker tick or after an authorized operator runs `POST /organizations/:organizationId/notifications/delivery/process`:

```json
{
  "type": "ATTENDANCE_SUGGESTION",
  "resourceType": "ATTENDANCE_SUGGESTION",
  "resourceId": "suggestion_123",
  "payload": {
    "summary": "Te recomendaron asistir a Fundamentals - Gi.",
    "organizationId": "org_123",
    "branchId": "branch_123",
    "classSessionId": "session_123",
    "suggestionId": "suggestion_123",
    "message": "Te recomendamos asistir a esta clase para preparar tu próxima graduación."
  }
}
```

Notification payloads intentionally omit `ClassSession.notes`, attendance operational notes, private staff notes, and internal actor details. Existing pending suggestions do not create a second notification.

Notification event production is best-effort after `AttendanceSuggestion` persistence. If event enqueue fails, the request still returns `201`, the persisted suggestion remains the source of truth, `notificationId` is `null` for that item, and `notificationFailures[]` identifies the affected `suggestionId`/`studentId`.

`notificationId` is not available synchronously for newly created suggestions because the worker creates the final `Notification` row. Existing suggestions created before this worker-backed contract may still expose a historical `notificationId`.

#### Relation to attendance intent and enrolledCount

- The student confirms independently through `PUT /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/intent`.
- Creating an attendance suggestion does not create an `AttendanceIntent`.
- Creating an attendance suggestion does not create an `AttendanceRecord`.
- `enrolledCount` continues to count active attendance intents only; suggestions do not increment it.
- Student `accept` changes the suggestion to `ACCEPTED` and creates/reactivates an active `AttendanceIntent`.
- Student `decline` changes the suggestion to `DECLINED` and does not create an intent.
- Manual student intent creation through `PUT .../attendance/intent` closes matching pending suggestions for that same student/session as `ACCEPTED`.
- `AttendanceRecord` remains independent and is created only by actual attendance/check-in/validation flows.

### List class-session attendance suggestions

`GET /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/suggestions`

**Roles permitted**: `MESTRE`, `ORG_ADMIN`, `ACADEMY_MANAGER`, branch/effective `HEAD_COACH`, `STAFF`, and the assigned `INSTRUCTOR` for the target session
**Capability requerida**: `attendance.canSuggestAttendance`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response

```json
{
  "classSessionId": "session_123",
  "summary": {
    "total": 3,
    "pending": 1,
    "accepted": 1,
    "declined": 1,
    "canceled": 0
  },
  "items": [
    {
      "id": "suggestion_1",
      "organizationId": "org_123",
      "branchId": "branch_123",
      "targetType": "CLASS_SESSION",
      "classSessionId": "session_123",
      "studentId": "student_123",
      "suggestedByMembershipId": "membership_staff",
      "status": "PENDING",
      "message": "Te recomendamos asistir a esta clase.",
      "notificationId": null,
      "respondedAt": null,
      "canceledAt": null,
      "expiresAt": null,
      "createdAt": "2026-06-05T12:00:00.000Z",
      "updatedAt": "2026-06-05T12:00:00.000Z",
      "student": {
        "id": "student_123",
        "primaryBranchId": "branch_123",
        "firstName": "Ana",
        "lastName": "Silva",
        "avatarUrl": "https://media.example.test/organizations/org_123/memberships/membership_student/avatars/media_1-random.webp",
        "email": "ana@example.com",
        "phone": null,
        "status": "ACTIVE",
        "currentBelt": "WHITE",
        "currentStripes": 0
      }
    }
  ]
}
```

`items[].student.avatarUrl` resolves from the linked student's active `STUDENT` organization membership profile avatar when storage can return a safe public URL. If that profile has no avatar, backend may fall back to another active membership profile for the same `userId` inside the same `organizationId`. It is `null` otherwise. The endpoint still must not expose `bucket`, `objectKey`, provider, or `mediaAssetId`.

### Cancel class-session attendance suggestion

`POST /organizations/:organizationId/branches/:branchId/class-sessions/:sessionId/attendance/suggestions/:suggestionId/cancel`

Cancels a pending suggestion by staff/instructor. It does not delete the row and does not create/cancel attendance intent or attendance record.

**Roles permitted**: same as create/list suggestions
**Capability requerida**: `attendance.canSuggestAttendance`
**Scope**: BRANCH_SCOPED

#### Response

```json
{
  "id": "suggestion_1",
  "status": "CANCELED",
  "canceledAt": "2026-06-05T12:15:00.000Z"
}
```

### List my attendance suggestions

`GET /organizations/:organizationId/students/me/attendance-suggestions`

Returns only suggestions for the authenticated user's linked `Student` in the organization. If a suggestion belongs to another student, it is not returned.

**Roles permitted**: authenticated `STUDENT`
**Capability requerida**: student organization access
**Scope**: ORGANIZATION_SCOPED self view

#### Response

```json
{
  "studentId": "student_123",
  "items": [
    {
      "id": "suggestion_1",
      "organizationId": "org_123",
      "branchId": "branch_123",
      "targetType": "CLASS_SESSION",
      "classSessionId": "session_123",
      "studentId": "student_123",
      "suggestedByMembershipId": "membership_staff",
      "status": "PENDING",
      "message": "Te recomendamos asistir a esta clase.",
      "notificationId": null,
      "respondedAt": null,
      "canceledAt": null,
      "expiresAt": null,
      "createdAt": "2026-06-05T12:00:00.000Z",
      "updatedAt": "2026-06-05T12:00:00.000Z",
      "branch": {
        "id": "branch_123",
        "name": "Alliance Centro",
        "slug": "centro",
        "timezone": "America/Sao_Paulo"
      },
      "classSession": {
        "id": "session_123",
        "organizationId": "org_123",
        "branchId": "branch_123",
        "instructorMembershipId": "membership_instructor",
        "title": "Fundamentals",
        "classType": "GI",
        "status": "SCHEDULED",
        "startAt": "2026-06-05T18:00:00.000Z",
        "endAt": "2026-06-05T19:00:00.000Z",
        "scheduledDate": "2026-06-05T00:00:00.000Z"
      }
    }
  ]
}
```

Student-facing responses expose `message` as the visible student message. There is no staff-only note field in the current API; do not place private staff notes in `message`.

### Accept my attendance suggestion

`POST /organizations/:organizationId/students/me/attendance-suggestions/:suggestionId/accept`

Accepts a pending suggestion owned by the authenticated student's linked student profile and creates/reactivates the active `AttendanceIntent` for the suggestion's class session.

#### Response

```json
{
  "suggestion": {
    "id": "suggestion_1",
    "status": "ACCEPTED",
    "respondedAt": "2026-06-05T12:20:00.000Z"
  },
  "attendanceIntent": {
    "id": "attendance_intent_1",
    "status": "ACTIVE",
    "classSessionId": "session_123",
    "studentId": "student_123"
  },
  "intentCreated": true,
  "intentReactivated": false
}
```

Errors:

| Status | Condition                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| 404    | suggestion does not exist for the authenticated student                        |
| 409    | suggestion is no longer pending or session no longer accepts attendance intent |

### Decline my attendance suggestion

`POST /organizations/:organizationId/students/me/attendance-suggestions/:suggestionId/decline`

Declines a pending suggestion owned by the authenticated student. It does not create an `AttendanceIntent`.

#### Response

```json
{
  "id": "suggestion_1",
  "status": "DECLINED",
  "respondedAt": "2026-06-05T12:20:00.000Z"
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

#### Correction window conflict

When an authorized attendance operator attempts a correction after the correction window has closed, the API returns `409` with `ATTENDANCE_CORRECTION_WINDOW_CLOSED`, `windowStart`, and `windowEnd`. Branch leadership/admin correction roles keep the existing extended correction behavior.

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "ATTENDANCE_CORRECTION_WINDOW_CLOSED",
  "message": "Attendance correction window is closed for this class session",
  "windowStart": "2026-06-01T18:00:00.000Z",
  "windowEnd": "2026-06-02T19:00:00.000Z",
  "path": "/api/v1/organizations/org_1/branches/branch_1/class-sessions/session_1/attendance/student_1",
  "requestId": "request_1",
  "timestamp": "2026-06-03T12:00:00.000Z"
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

Uses the same `ATTENDANCE_CORRECTION_WINDOW_CLOSED` response shape documented under update attendance record when the correction window is closed for an authorized attendance operator.

### Attendance follow-up queue

`GET /organizations/:organizationId/branches/:branchId/attendance/follow-ups`

**Roles permitted**: authenticated member
**Capability requerida**: `attendance.canReadAttendanceBehaviorSignals`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params

| Param        | Tipo   | Default | Descripción       |
| ------------ | ------ | ------- | ----------------- |
| `windowDays` | number | `30`    | Ventana analítica |

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

| Param        | Tipo   | Default | Descripción                    |
| ------------ | ------ | ------- | ------------------------------ |
| `windowDays` | number | `30`    | Ventana analítica branch-local |

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

| Param                    | Tipo   | Default  | Descripción                             |
| ------------------------ | ------ | -------- | --------------------------------------- |
| `from`                   | date   | required | Start date                              |
| `to`                     | date   | required | End date                                |
| `view`                   | enum   | `LIST`   | `MONTH`, `WEEK`, `DAY`, `LIST`          |
| `branchId`               | string | -        | branch filter                           |
| `instructorMembershipId` | string | -        | instructor filter                       |
| `studentId`              | string | -        | student filter                          |
| `status`                 | enum   | -        | item status filter                      |
| `classType`              | enum   | -        | class type filter                       |
| `category`               | enum   | -        | category filter                         |
| `itemType`               | enum   | -        | `CLASS_SESSION`, `ACADEMY_EVENT`, `ALL` |
| `tag`                    | string | -        | tag filter                              |
| `color`                  | string | -        | color filter                            |
| `search`                 | string | -        | search filter                           |

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

#### Calendar class-session semantics

- `ClassSchedule.description` is the only current student-safe public class-description source.
- `ClassSession.notes` is an internal/operational field. In student/self context it must not be exposed as `description`.
- `description` in calendar/session read models is context-sensitive:
  - student/self context: `null` when the source would be `ClassSession.notes`
  - admin/manager/assigned-instructor context: may mirror `ClassSession.notes`
- `links.notes` is context-sensitive:
  - student/self calendar: `/organizations/:organizationId/students/me/notes?classSessionId=:sessionId`
  - admin/instructor calendar with a concrete student context: `/organizations/:organizationId/students/:studentId/training-notes?classSessionId=:sessionId`
  - branch/org calendar without a concrete student context: `null`

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

### Student Profile Screen read model

`GET /organizations/:organizationId/students/me/profile`

**Roles permitted**: authenticated tenant user linked to a `Student` in the organization
**Capability required**: self student access; no `studentId` route param is accepted
**Step-up required**: no
**Scope**: own linked student only

This endpoint is a read-only composite model for the mobile/web Profile screen. It does not replace operational billing, competition, promotion, or student admin endpoints.

Security rules:

- Resolves the student from `Student.userId === principal.sub` inside `organizationId`.
- Returns `404` when the authenticated tenant user has no linked student in the organization.
- Returns `403` for cross-organization access if a token for another organization attempts to read a profile.
- Does not expose `technicalNotes`, parent/tutor fields, private notes, billing notes, external payment references, raw provider payloads, import envelopes, or private branch data.
- Billing summary is branch-local to the student's current `primaryBranchId`; it is not a cross-branch financial history view.

Response:

```json
{
  "user": {
    "id": "user_123",
    "fullName": "Ana Silva",
    "firstName": "Ana",
    "lastName": "Silva",
    "email": "ana@example.com",
    "phone": "+5511999999999",
    "photoUrl": null,
    "roleLabel": "Student",
    "status": "ACTIVE"
  },
  "student": {
    "id": "student_123",
    "memberSince": "2025-02-15",
    "status": "ACTIVE"
  },
  "academy": {
    "organizationId": "org_123",
    "organizationName": "Alliance",
    "organizationSlug": "alliance",
    "branchId": "branch_123",
    "branchName": "Alliance Matrix",
    "branchCity": "Sao Paulo",
    "branchCountryCode": "BR"
  },
  "rank": {
    "rank": "ADULT_BLUE",
    "color": "BLUE",
    "track": "ADULT",
    "label": "Adult Blue",
    "stripes": 2,
    "maxStripes": 4,
    "lastBeltPromotionDate": "2025-08-20"
  },
  "billing": {
    "status": "ACTIVE",
    "nextPaymentDueDate": "2026-06-10",
    "nextPaymentAmount": {
      "amount": 35000,
      "currency": "BRL",
      "formatted": "R$ 350,00"
    },
    "lastPayment": {
      "date": "2026-05-10",
      "amount": {
        "amount": 35000,
        "currency": "BRL",
        "formatted": "R$ 350,00"
      },
      "method": "MANUAL",
      "status": "PAID"
    },
    "recentPayments": []
  },
  "competitions": {
    "smoothcomp": {
      "linked": true,
      "verified": true,
      "externalId": "7788",
      "lastSyncAt": "2026-05-20"
    },
    "summary": {
      "totalMatches": 10,
      "winLossRatio": 70,
      "medals": null,
      "methods": null,
      "worldRank": null
    },
    "recentCompetitions": []
  },
  "links": {
    "billingDetail": "/organizations/org_123/students/me/billing",
    "competitionsDetail": "/organizations/org_123/students/me/competitions"
  }
}
```

Current null/degraded fields:

- `user.photoUrl` is always `null` in this version because neither `User` nor `Student` has a photo/avatar/image URL column.
- `student.memberSince` comes from `Student.joinedOrganizationAt`; it is `null` when that field is not set.
- `rank.lastBeltPromotionDate` comes only from the latest approved `PromotionRequest` with `type=BELT` and a non-null `effectiveDate`; stripe-only promotions are ignored.
- `billing.status` is `UNKNOWN` with null amount/date fields when there is no branch-local membership, charge, or payment data for the current primary branch.
- `billing.nextPaymentDueDate` comes from the next open charge when present; otherwise from `StudentMembership.nextBillingDate` when an active membership exists. There is no frontend hardcoded day-of-month rule.
- `billing.nextPaymentAmount` comes from open charge outstanding amount; otherwise from the linked billing plan amount when only `nextBillingDate` is available.
- Payment methods are normalized for student display: `CASH`, `CARD`, or `MANUAL`. PIX is not a separate backend enum yet.
- `competitions.summary.medals`, `competitions.summary.methods`, `competitions.summary.worldRank`, and `competitions.recentCompetitions` are `null`/empty because current Smoothcomp phase 1 stores profiles, imported matches, and win/loss snapshots, but not medals, method percentages, rankings, tournament placements, or competition-level result records.
- `competitions.smoothcomp.verified` is true only when there is an active link and the last sync status is `SUCCEEDED`; there is no separate verification lifecycle field yet.

### Student self calendar

`GET /organizations/:organizationId/students/me/calendar`

**Roles permitted**: authenticated student
**Capability required**: `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Notes

- This is the endpoint Android should use for Home `Upcoming Classes -> View All`.
- Recommended upcoming-classes request shape:
  `GET /organizations/:organizationId/students/me/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&view=LIST&itemType=CLASS_SESSION&status=SCHEDULED`
- The response is chronologically ordered and contains only student-visible branches: primary branch plus approved visit branches in the requested range.

### Student class session detail

`GET /organizations/:organizationId/students/me/class-sessions/:sessionId`

**Roles permitted**: authenticated tenant member with linked student profile
**Capability required**: student self access through `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED, restricted to the linked student and the student's primary branch plus approved visit branches active on the class date

#### Response

```json
{
  "id": "session_123",
  "type": "CLASS_SESSION",
  "title": "No-Gi Fundamentals",
  "description": "Base weekly fundamentals class",
  "note": "guard focus",
  "startAt": "2026-06-01T22:00:00.000Z",
  "endAt": "2026-06-01T23:00:00.000Z",
  "durationMinutes": 60,
  "status": "SCHEDULED",
  "studentPersonalNotes": [
    {
      "id": "personal_note_123",
      "body": "Frame first, then hip escape and recover guard.",
      "createdAt": "2026-06-01T23:10:00.000Z",
      "updatedAt": "2026-06-02T09:00:00.000Z"
    }
  ],
  "branch": {
    "id": "branch_123",
    "name": "HQ",
    "slug": "hq",
    "timezone": "America/Buenos_Aires"
  },
  "mat": null,
  "instructor": {
    "membershipId": "membership_instructor",
    "userId": "user_instructor",
    "firstName": "Andre",
    "lastName": "Coach",
    "displayName": "Andre Coach",
    "avatarUrl": "https://media.example.test/organizations/org_1/memberships/membership_instructor/avatars/media_1-random.webp",
    "roleLabel": "Instructor",
    "belt": {
      "rank": "ADULT_BLACK",
      "degree": null,
      "stripeCount": 3,
      "label": "Adult Black"
    }
  },
  "sessionOverview": {
    "capacity": 24,
    "goingCount": 9,
    "availableSpots": 15,
    "isFull": false,
    "difficultyLabel": null,
    "uniform": null
  },
  "userAttendanceIntent": {
    "id": "intent_123",
    "status": "GOING"
  },
  "capabilities": {
    "canView": true,
    "canMarkIntent": true,
    "canCancelIntent": true,
    "canCheckIn": false
  }
}
```

#### Contract rules

- This is the mobile/student optimized class detail endpoint. It is separate from the admin/calendar detail endpoint and does not change that existing contract.
- `description` comes from the linked `ClassSchedule.description` when the session was created from a schedule and that description exists. It is `null` for ad hoc sessions or schedules without description.
- `note` comes from `ClassSession.notes`. It is a public session-specific note for students when present and `null` otherwise.
- `studentPersonalNotes` contains only the authenticated student's private notes for that class session. Backend never mixes notes from another student, instructor, or admin into this array.
- `mat`, `difficultyLabel`, and `uniform` are `null` because the current data model has no dedicated student-safe source fields for them.
- `instructor.roleLabel` is derived from real membership/branch data only: branch `headCoachMembershipId` takes precedence, then membership roles such as `MESTRE`, `HEAD_COACH`, `INSTRUCTOR`, `ACADEMY_MANAGER`, or `STAFF`. It is `null` only when no visible role source exists.
- `instructor.avatarUrl` comes from the instructor membership's visible `OrganizationMembershipProfile.avatarMediaAsset` first. If that membership profile has no public active avatar, backend may fall back to another active membership profile for the same `userId` inside the same `organizationId`. It is `null` otherwise.
- `instructor.belt` is `PersonBeltDto | null` and comes only from `OrganizationMembershipTechnicalProfile` for the session `instructorMembershipId`. If there is no technical profile, the profile is deleted, or `currentBelt` is `null`, the field is `null`.
- `Student.currentBelt/currentStripes` are not used as an instructor-profile proxy, even if the instructor user also has a student record.
- `sessionOverview.goingCount` is the count of active `AttendanceIntent` rows for this session whose student is active and not deleted.
- `userAttendanceIntent.status` is `GOING` for active intent, `CANCELED` for canceled intent, or `null` when no intent exists.
- The response does not include the participants list. Use the paginated participants endpoint below for that section.

#### Privacy and security

- Requires a valid access token and a linked student profile in the requested organization.
- Returns `404 Class session not found` when the session does not exist, belongs to another tenant, or is outside the student's visible branch set.
- Does not expose emails, phone numbers, billing data, attendance history, medical data, payment ids, raw provider payloads, private roles, provider secrets, or permission internals.

#### Errors

- `401 Unauthorized`: missing or invalid token.
- `403 Forbidden`: authenticated user has no linked student profile in the organization.
- `404 Not Found`: session missing or not visible to the student.

### Student class session personal notes

`GET /organizations/:organizationId/students/me/class-sessions/:sessionId/personal-notes`

`POST /organizations/:organizationId/students/me/class-sessions/:sessionId/personal-notes`

`PATCH /organizations/:organizationId/students/me/class-sessions/:sessionId/personal-notes/:noteId`

**Roles permitted**: authenticated tenant member with linked student profile
**Capability required**: student self access through `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED, restricted to the linked student and the student's primary branch plus approved visit branches active on the class date

#### Response shapes

`GET`

```json
{
  "items": [
    {
      "id": "personal_note_123",
      "body": "Frame first, then hip escape and recover guard.",
      "createdAt": "2026-06-01T23:10:00.000Z",
      "updatedAt": "2026-06-02T09:00:00.000Z"
    }
  ]
}
```

`POST` and `PATCH`

```json
{
  "id": "personal_note_123",
  "body": "Frame first, hip escape, then recover to open guard.",
  "createdAt": "2026-06-01T23:10:00.000Z",
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### Contract rules

- These notes are student-private and are not exposed through instructor/admin training-note endpoints.
- Backend resolves the student exclusively from the authenticated principal; there is no `studentId` parameter in these self-service routes.
- `PATCH` returns `404` when `noteId` does not belong to the authenticated student's note set for that session.
- Empty or no-op updates are rejected instead of silently rewriting timestamps.

### Student class session attendance participants

`GET /organizations/:organizationId/students/me/class-sessions/:sessionId/attendance/participants?limit=7&cursor=...`

**Roles permitted**: authenticated tenant member with linked student profile
**Capability required**: student self access through `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED, restricted to the linked student and the student's primary branch plus approved visit branches active on the class date

#### Query params

- `limit`: optional integer, default `7`, max `20`.
- `cursor`: optional opaque cursor returned by `pagination.nextCursor`.

#### Response

```json
{
  "items": [
    {
      "studentId": "student_123",
      "membershipId": "membership_123",
      "fullName": "Joao Silva",
      "avatarUrl": "https://media.example.test/organizations/org_1/memberships/membership_123/avatars/media_1-random.webp",
      "belt": {
        "rank": "ADULT_BLUE",
        "degree": null,
        "stripeCount": 2,
        "label": "Adult Blue"
      },
      "attendanceStatus": "GOING",
      "attendanceLabel": "Asistirá"
    }
  ],
  "pagination": {
    "limit": 7,
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA2LTAxVDEwOjA3OjAwLjAwMFoiLCJpZCI6ImludGVudF83In0"
  }
}
```

#### Contract rules

- "Asistirá" means an active `AttendanceIntent` with `status=ACTIVE` for the exact `classSessionId`.
- Pending, declined, canceled, expired, or rejected `AttendanceSuggestion` rows are not included.
- Canceled attendance intents are not included.
- Historical `AttendanceRecord` rows are not included unless they also have an active current intent; attendance history is not a participant source.
- Inactive or deleted students are not included.
- Ordering is stable: current student first when they are going and the request has no cursor, then active intents by `createdAt ASC`, then intent `id ASC`.
- `membershipId` is the student's organization membership id only when the student has a linked user account and membership in the organization. It is `null` for unclaimed/unlinked student profiles because the current `Student` model does not guarantee an `OrganizationMembership`.
- `avatarUrl` comes from the student's linked organization membership profile only when a linked membership exists, the profile is visible to members, not deleted, points to an active avatar asset, and storage can return a safe public URL. It is `null` for unlinked students, hidden/deleted profiles, missing/inactive avatars, or storage without a public base URL.
- `belt` is `null` when the student has no current rank.

#### Privacy and security

- The endpoint returns only `studentId`, `membershipId`, `fullName`, `avatarUrl`, public rank/stripe summary, and the fixed going label/status.
- It does not expose email, phone, date of birth, billing status, payment data, attendance history, internal notes, medical data, roles, permissions, cancellation reasons, suggestion messages, or provider payloads.
- Returns `404 Class session not found` when the session does not exist, belongs to another tenant, or is outside the student's visible branch set.

#### Errors

- `400 Bad Request`: invalid `limit` or query shape.
- `401 Unauthorized`: missing or invalid token.
- `403 Forbidden`: authenticated user has no linked student profile in the organization.
- `404 Not Found`: session missing or not visible to the student.

### Student mobile home

`GET /organizations/:organizationId/students/me/home`

**Roles permitted**: authenticated tenant member with linked student profile
**Capability required**: student self access through `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED, restricted to the linked student and the student's primary branch plus currently approved visit branches

#### Response

```json
{
  "user": {
    "id": "user_123",
    "displayName": "Joao Silva",
    "avatarUrl": "https://media.example.test/organizations/org_1/memberships/membership_123/avatars/media_1-random.webp"
  },
  "student": {
    "id": "student_123",
    "primaryBranchId": "branch_123",
    "currentStripes": 2,
    "beltName": "Adult Blue",
    "beltColor": "BLUE",
    "primaryBelt": {
      "rank": "ADULT_BLUE",
      "label": "Adult Blue",
      "track": "ADULT",
      "maxStripes": 4,
      "order": 20
    }
  },
  "notifications": {
    "unreadCount": 3
  },
  "stats": {
    "classesThisMonth": 12,
    "trainingStreakDays": 5,
    "totalTrainingHours": 87,
    "monthlyClassesDelta": 3,
    "totalHoursDelta": 6
  },
  "activeClass": {
    "classSessionId": "session_123",
    "branchId": "branch_123",
    "title": "Fundamentals - Gi",
    "subtitle": "Starting soon",
    "startsAt": "2026-06-01T18:30:00.000Z",
    "endsAt": "2026-06-01T19:30:00.000Z",
    "status": "SCHEDULED",
    "checkIn": {
      "available": true,
      "mode": "QR_CHECKIN",
      "action": "OPEN_QR_SCANNER",
      "cta": "SCAN_QR",
      "label": "Scan QR"
    }
  },
  "nextClass": {
    "classSessionId": "session_456",
    "branchId": "branch_123",
    "title": "Fundamentals - Gi",
    "startsAt": "2026-06-01T18:30:00.000Z",
    "endsAt": "2026-06-01T19:30:00.000Z",
    "instructorName": "Professor Silva",
    "durationMinutes": 60,
    "enrolledCount": 12,
    "capacity": 24,
    "status": "SCHEDULED"
  },
  "upcomingClasses": [
    {
      "classSessionId": "session_789",
      "branchId": "branch_123",
      "title": "Advanced - No Gi",
      "instructorName": "Professor Santos",
      "startsAt": "2026-06-02T19:00:00.000Z",
      "endsAt": "2026-06-02T20:30:00.000Z",
      "durationMinutes": 90,
      "enrolledCount": 18,
      "capacity": 24,
      "status": "SCHEDULED"
    }
  ],
  "shortcuts": {
    "attendance": {
      "enabled": true
    },
    "trainingNotes": {
      "enabled": true,
      "unreadCount": null,
      "latestAt": null
    }
  }
}
```

#### Contract rules

- This is a compact mobile Home snapshot. Android should use drill-down endpoints for full profile, full calendar, attendance history, notes, or check-in execution.
- `user.avatarUrl` comes from the authenticated user's organization membership profile first. If that membership profile has no public active avatar, backend may fall back to another active membership profile for the same `userId` inside the same `organizationId`. It is `null` otherwise.
- The endpoint is intentionally not a class detail endpoint, not an attendance history endpoint, not a training-notes index endpoint, and not a check-in execution endpoint.
- `currentStripes` is the student's current stripe count for the current belt state. This is the canonical, legacy-stable field; the Home does not return a duplicate `stripesNumber`. `primaryBelt.maxStripes` is the maximum stripes allowed for that rank.
- `beltName` is the current student-facing belt label and `beltColor` is a stable backend color token for the active rank.
- `primaryBelt` is `null` when the student has no current rank; otherwise it uses the promotion rank catalog shape from `GET /catalogs/promotion-ranks`.
- `classesThisMonth` counts validated `PRESENT`/`LATE` attendance records whose class session belongs to the current UTC calendar month.
- `totalTrainingHours` sums validated `PRESENT`/`LATE` attendance durations from `ClassSession.startAt/endAt`; decimal values are possible for non-hour sessions.
- `monthlyClassesDelta` is current calendar month classes minus previous calendar month classes.
- `totalHoursDelta` is current calendar month training hours minus previous calendar month training hours.
- `trainingStreakDays` is derived from consecutive attended calendar dates, anchored on today when the student trained today or yesterday when the latest attended class was yesterday. It is `0` when no recent attendance exists.
- Metrics return `0` when there is no attendance history. They should become `null` only if a future data model makes the calculation ambiguous.
- `activeClass` is the scheduled class inside the student self check-in window, or `null`.
- `nextClass` is the next scheduled class in the readable student branch set. `upcomingClasses` returns the next short list after `nextClass`.
- `checkIn.mode` may be `QR_CHECKIN` or `NONE` for the current student Home. `STAFF_MANUAL` and `KIOSK_CHECKIN` are reserved semantic values for staff/admin attendance flows but are not direct mobile student Home actions. `SELF_CHECKIN` is **deprecated** and is never returned by the Home.
- `checkIn.action` is semantic navigation/action intent only. The only allowed values are `OPEN_QR_SCANNER`, `VIEW_DETAILS`, and `NONE`. `OPEN_SELF_CHECK_IN` is **removed** and is never returned: KURO V1 does not expose student self check-in.
  - `OPEN_QR_SCANNER`: an instructor-issued QR token is active for the class; Android opens the scanner and posts the scanned code to `POST /organizations/:organizationId/students/me/check-ins/qr`.
  - `VIEW_DETAILS`: a class is in the student action window but there is no actionable QR token (or check-in is not available); Android opens the session detail. No check-in is executed from Home.
  - `NONE`: no actionable class, or the student is already checked in.
- `checkIn.cta` may be `SCAN_QR`, `VIEW_DETAILS`, `CHECKED_IN`, or `NOT_AVAILABLE`. The self check-in `CHECK_IN` CTA is removed.
- The endpoint never returns QR raw payloads. For QR check-in, Android must open the dedicated QR check-in flow.
- `nextClass` and `upcomingClasses` expose only summary information plus ids needed for drill-down navigation.
- `enrolledCount` is the active attendance-intent count for the class session. It does not expose enrolled student identities and is not a separate enrollment domain.
- `trainingNotes.unreadCount` is `null` because the current notes model has no per-student note read receipt. `latestAt` reports the latest active `VISIBLE_TO_STUDENT` note update when present.
- All datetime fields use ISO-8601 UTC strings. Android may derive epoch millis client-side when needed.

#### Visibility and security

- Tenant access is checked before resolving `Student.userId`.
- The endpoint only resolves the authenticated user's linked student profile; it cannot read another student's Home.
- Student-visible sessions are limited to the student's primary branch and approved active visit branches.
- `ClassSession.notes`, attendance operational notes, correction metadata, check-in token payload/hash, training note bodies, staff-private notes, instructor-private notes, rosters, and other students' personal data are never included.
- Notifications are reduced to unread count only.

#### Drill-down endpoints

- Profile: `GET /organizations/:organizationId/students/me`
- Upcoming Classes / View All: `GET /organizations/:organizationId/students/me/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&view=LIST&itemType=CLASS_SESSION&status=SCHEDULED`
- Attendance history: `GET /organizations/:organizationId/students/me/attendance`
- Training notes: `GET /organizations/:organizationId/students/me/notes`
- Session detail: `GET /organizations/:organizationId/students/me/class-sessions/:sessionId`
- Session participants: `GET /organizations/:organizationId/students/me/class-sessions/:sessionId/attendance/participants?limit=7`
- Training itinerary: `GET /organizations/:organizationId/students/me/training-itinerary`
- Student QR check-in (official student attendance flow): `POST /organizations/:organizationId/students/me/check-ins/qr`
- Note: there is no Home drill-down to self check-in. `SELF_CHECKIN` / `OPEN_SELF_CHECK_IN` are deprecated and never emitted by the Home.

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

#### Notes

- This is the student-safe attendance history endpoint Android should use for the Attendance module.
- It returns the student's own validated attendance records plus a safe class-session summary.
- It does not expose operational attendance notes, correction history, other students, or administrative actor metadata.

### Student training itinerary

`GET /organizations/:organizationId/students/me/training-itinerary`

**Roles permitted**: authenticated student
**Capability required**: `trainingCalendar.canReadStudentSelfCalendar`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Response

Same as training calendar response, with student itinerary notes included in the read model.

#### Notes

- This is richer than the Home snapshot and includes visible periodized notes inside the requested range.
- Android should use it only when the itinerary/calendar notes experience is needed, not for the Home initial load.

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
- For student/self context, `description` in this generic endpoint remains `null`. Student-safe public description is only exposed through `GET /organizations/:organizationId/students/me/class-sessions/:sessionId`.
- For admin/manager or assigned-instructor context, `description` may contain `ClassSession.notes`.
- There is no dedicated session-level public-description field in this generic endpoint. `ClassSession.notes` continues to power the operational/admin meaning of `description` here.
- Mobile/student should prefer `GET /organizations/:organizationId/students/me/class-sessions/:sessionId` for Next Class / View Details and class card drill-downs from Home. This generic calendar detail remains for existing admin/instructor-compatible calendar flows.

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
  "branch": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "timezone": "America/Argentina/Buenos_Aires"
  },
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

### Student self training notes

`GET /organizations/:organizationId/students/me/notes`

**Roles permitted**: authenticated student with linked student profile
**Capability required**: student self training note read through training-notes policy
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Supported query params

- `branchId` optional, but student self is restricted to the student's primary branch in this phase.
- `classSessionId` optional.
- `from` optional `YYYY-MM-DD`.
- `to` optional `YYYY-MM-DD`.
- `status` optional, but student self is restricted to `ACTIVE`.
- `visibility` optional.
- `noteType` optional.

#### Response

```json
{
  "studentId": "student_123",
  "items": [
    {
      "id": "note_123",
      "title": "Plan semanal",
      "body": "Weekly plan: passing entries and guard retention.",
      "bodyPreview": "Weekly plan: passing entries and guard retention.",
      "source": "INSTRUCTOR",
      "sourceLabel": "Instructor",
      "status": "ACTIVE",
      "classSessionId": null,
      "periodStart": "2026-06-01T00:00:00.000Z",
      "periodEnd": "2026-06-07T00:00:00.000Z",
      "visibility": "VISIBLE_TO_STUDENT",
      "noteType": "WEEKLY_PLAN",
      "classSession": null,
      "author": {
        "id": "membership_456",
        "name": "Coach Name"
      },
      "updatedBy": {
        "id": "membership_456",
        "name": "Coach Name"
      },
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-06-01T10:00:00.000Z"
    }
  ]
}
```

#### Notes

- This is the student-safe endpoint Android should use for the Training Notes module.
- Student self reads are filtered by note visibility and status. `INSTRUCTOR_PRIVATE` and `STAFF_PRIVATE` notes must never appear here.
- Student self reads only materialize notes with `status=ACTIVE` that pass the policy visibility check for the linked student. In practice today, student self should rely on `visibility=VISIBLE_TO_STUDENT`; `SHARED_WITH_COACHES`, `INSTRUCTOR_PRIVATE`, and `STAFF_PRIVATE` are not student-visible.
- `title` is a backend-derived mobile field mapped from real `TrainingNoteType` values:
  - `WEEKLY_PLAN` -> `Plan semanal`
  - `MONTHLY_PLAN` -> `Plan mensual`
  - `TRAINING_FOCUS` -> `Nota tecnica`
  - `INSTRUCTOR_FEEDBACK` -> `Nota de progreso`
  - `SESSION_NOTE` -> `Nota de entrenamiento`
  - `STUDENT_REQUEST` -> `Solicitud del alumno`
- `bodyPreview` is derived in backend from `body` and truncated to 140 chars when needed.
- `source` / `sourceLabel` are mobile read-model fields:
  - self-authored note -> `SELF` / `Private`
  - coach/admin/leadership authored visible note -> `INSTRUCTOR` / `Instructor`
  - fallback -> `ACADEMY` / `Academy`
- `classSession` is reduced to a student-safe mobile shape with `id`, `date`, `name`, `trainingMode`, and `level`.
- `trainingMode` only resolves when the linked `ClassSession.classType` is `GI` or `NO_GI`; otherwise it is `null`.
- `level` is always `null` today because `ClassSession` has no level field in the current schema.
- `tags` are not supported by this endpoint today.
- The current model has no note read-receipt domain, so unread counts are not available.

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

| Param      | Tipo   | Default | Descripción                          |
| ---------- | ------ | ------- | ------------------------------------ |
| `page`     | number | `1`     | Página                               |
| `limit`    | number | `20`    | Tamaño                               |
| `fromDate` | date   | -       | inicio                               |
| `toDate`   | date   | -       | fin                                  |
| `branchId` | string | -       | branch dentro de scope docente       |
| `status`   | enum   | -       | `SCHEDULED`, `COMPLETED`, `CANCELED` |

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
    {
      "code": "ADULT",
      "label": "Adult / Juvenile",
      "initialRank": "ADULT_WHITE",
      "minAgeYears": 16,
      "maxAgeYears": null
    }
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

| Param                    | Tipo    | Default | Descripción               |
| ------------------------ | ------- | ------- | ------------------------- |
| `page`                   | number  | `1`     | Página                    |
| `limit`                  | number  | `20`    | Tamaño                    |
| `status`                 | enum    | -       | `PromotionRequestStatus`  |
| `studentId`              | string  | -       | Filtro                    |
| `branchId`               | string  | -       | Filtro                    |
| `type`                   | enum    | -       | `PromotionType`           |
| `track`                  | enum    | -       | `PromotionTrack`          |
| `targetBelt`             | enum    | -       | `PromotionRank`           |
| `proposedByMembershipId` | string  | -       | Filtro                    |
| `reviewedByMembershipId` | string  | -       | Filtro                    |
| `snapshotOutOfDate`      | boolean | -       | Queue signal              |
| `recommendation`         | enum    | -       | `PromotionRecommendation` |
| `pendingOlderThanDays`   | number  | -       | Age filter                |
| `sortBy`                 | enum    | -       | list sort                 |
| `dateFrom`               | date    | -       | Filter                    |
| `dateTo`                 | date    | -       | Filter                    |

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
    "currentState": {
      "track": "ADULT",
      "trackLabel": "Adult / Juvenile",
      "belt": null,
      "beltLabel": null,
      "stripes": 0
    },
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

Product in-app notifications are worker-backed by default. Business producers persist `NotificationEvent` records, the notifications worker creates `NotificationDelivery` rows, and the actor-facing `Notification` feed is materialized asynchronously. `GET /organizations/:organizationId/notifications` therefore reflects delivered notifications, not merely queued events. In Postman/manual QA, run `POST /organizations/:organizationId/notifications/delivery/process` with an authorized notification-delivery manager before asserting that a newly triggered product notification appears in the feed.

Current worker-backed product notification types:

- `ANNOUNCEMENT_PUBLISHED`
- `INVITATION_ACCEPTED`
- `ACADEMY_INTAKE_REQUEST_CREATED`
- `INSTITUTIONAL_REQUEST_ACTION_REQUIRED`
- `INSTITUTIONAL_REQUEST_ASSIGNED`
- `INSTITUTIONAL_REQUEST_CLOSED`
- `INSTITUTIONAL_REQUEST_REMINDER`
- `INSTITUTIONAL_REQUEST_ESCALATED`
- `ATTENDANCE_FOLLOW_UP_ASSIGNED`
- `ATTENDANCE_SUGGESTION`
- `TRAINING_NOTE_VISIBLE`
- `TRAINING_NOTE_COACH_REVIEW`
- `NEW_CLASS_SESSION_CREATED`
- `CLASS_SESSION_UPDATED`
- `CLASS_SESSION_CANCELED`
- `CLASS_SESSION_NOTE_PUBLISHED`
- `BILLING_CHARGE_CREATED`
- `BILLING_PAYMENT_CONFIRMED`

Implemented class/billing notification producers:

| NotificationType | Trigger | Audience | ResourceType | Mobile action |
| --- | --- | --- | --- | --- |
| `NEW_CLASS_SESSION_CREATED` | `ClassSession` created manually or from a schedule | active linked students with access to the session branch/scope | `CLASS_SESSION` | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `CLASS_SESSION_UPDATED` | student-facing fields change: title/type/date/start/end/capacity/instructor | active linked students with `AttendanceIntent.ACTIVE` or an attendance record for the session | `CLASS_SESSION` | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `CLASS_SESSION_CANCELED` | session transitions to `CANCELED` | active linked students with `AttendanceIntent.ACTIVE` or an attendance record for the session | `CLASS_SESSION` | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `CLASS_SESSION_NOTE_PUBLISHED` | public `ClassSession.notes` becomes or remains non-empty and changes | active linked students with `AttendanceIntent.ACTIVE` or an attendance record for the session | `CLASS_SESSION` | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `BILLING_CHARGE_CREATED` | branch-local student billing charge is created | owner student's active student membership only | `BILLING_CHARGE` | `OPEN_BILLING` -> `kuro://billing` |
| `BILLING_PAYMENT_CONFIRMED` | manual or Mercado Pago student payment is `APPROVED` | owner student's active student membership only | `PAYMENT_RECORD` | `OPEN_BILLING` -> `kuro://billing` |

Pending producers:

- `CLASS_STARTING_SOON`: requires a scheduler/job that selects upcoming sessions and dedupes reminder windows; not implemented in this phase.
- `BILLING_CHARGE_DUE_SOON`: requires a billing scheduler/lifecycle pass; not implemented in this phase.
- `BILLING_CHARGE_OVERDUE`: requires a billing scheduler/lifecycle pass; not implemented in this phase.

Class notification payloads are summarized and use this shape:

```json
{
  "summary": "Class session updated",
  "classSessionId": "class_session_id",
  "classTitle": "Fundamentals AM",
  "branchId": "branch_id",
  "branchName": "Alliance Matrix",
  "startAt": "2026-06-01T10:00:00.000Z",
  "instructorName": "Coach Name"
}
```

Billing charge/payment payloads are summarized and use:

```json
{
  "summary": "Billing charge created",
  "billingChargeId": "billing_charge_id",
  "studentId": "student_id",
  "branchId": "branch_id",
  "dueDate": "2026-06-30T00:00:00.000Z",
  "amount": "100.00",
  "currency": "ARS"
}
```

```json
{
  "summary": "Billing payment confirmed",
  "paymentRecordId": "payment_record_id",
  "billingChargeId": "billing_charge_id",
  "studentId": "student_id",
  "branchId": "branch_id",
  "amount": "100.00",
  "currency": "ARS",
  "status": "APPROVED"
}
```

Events that do not notify:

- `studentPersonalNotes` under `/students/me/class-sessions/:sessionId/personal-notes` never create notifications.
- Class updates that do not change student-facing important fields do not create `CLASS_SESSION_UPDATED`.
- Billing general income and non-approved student payments do not create student mobile notifications.
- Firebase/FCM push notifications, device tokens, OS permissions, email, WhatsApp, SMS, and notification preferences are out of scope for this phase.

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

| Param   | Tipo   | Default | Descripción |
| ------- | ------ | ------- | ----------- |
| `page`  | number | `1`     | Página      |
| `limit` | number | `20`    | Tamaño      |

#### Response

```json
{
  "items": [
    {
      "id": "notif_123",
      "type": "TRAINING_NOTE_VISIBLE",
      "title": "Nueva nota de entrenamiento",
      "message": "Coach Name compartio una nota contigo.",
      "resourceType": "TRAINING_NOTE",
      "resourceId": "note_123",
      "payload": {
        "summary": "New training note available",
        "studentId": "student_123",
        "branchId": "branch_123",
        "noteType": "WEEKLY_PLAN",
        "actorName": "Coach Name"
      },
      "action": {
        "type": "OPEN_TRAINING_NOTE",
        "deepLink": "kuro://training-notes/note_123"
      },
      "icon": "training-note",
      "category": "TRAINING",
      "createdAt": "2026-06-25T10:30:00.000Z",
      "readAt": null,
      "isUnread": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

Notes:

- `readAt === null` means unread, and the response also includes derived `isUnread`.
- `payload` remains present, but mobile should rely on the derived `title`, `message`, `action`, `icon`, and `category` instead of branching on raw payload structure.
- Current dedicated mobile mappings are `TRAINING_NOTE_VISIBLE`, `ATTENDANCE_SUGGESTION`, `ANNOUNCEMENT_PUBLISHED`, `NEW_CLASS_SESSION_CREATED`, `CLASS_SESSION_UPDATED`, `CLASS_SESSION_CANCELED`, `CLASS_SESSION_NOTE_PUBLISHED`, `CLASS_STARTING_SOON`, `BILLING_CHARGE_CREATED`, `BILLING_CHARGE_DUE_SOON`, `BILLING_CHARGE_OVERDUE`, and `BILLING_PAYMENT_CONFIRMED`. Other current types fall back to a safe generic notification card and `OPEN_NOTIFICATIONS`.

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
- `ATTENDANCE_SUGGESTION`
- `TRAINING_NOTE_VISIBLE`
- `TRAINING_NOTE_COACH_REVIEW`
- `NEW_CLASS_SESSION_CREATED`
- `CLASS_SESSION_UPDATED`
- `CLASS_SESSION_CANCELED`
- `CLASS_SESSION_NOTE_PUBLISHED`
- `CLASS_STARTING_SOON`
- `BILLING_CHARGE_CREATED`
- `BILLING_CHARGE_DUE_SOON`
- `BILLING_CHARGE_OVERDUE`
- `BILLING_PAYMENT_CONFIRMED`

## Mobile Student App

Audited on 2026-06-25 against controller, use-case, policy, repository, and notification-producer code. Examples below use representative ids/values, but the field set and nesting reflect the real response shapes produced by backend today.

### Billing

Verdict: `Ready`

Current contract:

- `GET /organizations/:organizationId/students/me/billing` is the mobile-safe summary read model. It covers `summary.status`, `summary.nextPaymentDueDate`, `summary.nextPaymentAmount`, `summary.openBalance`, `membership`, `openCharges`, and `recentPayments`.
- `GET /organizations/:organizationId/students/me/payments` is the paginated self-service payment history endpoint.
- `GET /organizations/:organizationId/students/me/payments/:paymentId` is the self-service payment detail endpoint.
- `GET /organizations/:organizationId/students/me/billing-charges/:chargeId` remains the charge-centric self-service detail endpoint. It includes the payment rows attached to that charge.
- `POST /organizations/:organizationId/students/me/billing-charges/:chargeId/mercado-pago/preference` creates or reuses a Checkout Pro preference and returns the redirect/open URLs.

Clarifications:

- `paymentMethods.mercadoPago.publicKey` is the client-safe Mercado Pago publishable key for the branch integration. In the current contract it is mainly a readiness signal for Checkout Pro availability, not the source of truth for which URL mobile must open.
- Mobile should use `sandboxInitPoint` or `initPoint` from the preference response for the current Checkout Pro flow. The backend already decides environment and generates the provider preference. `publicKey` is safe to expose, but mobile does not need to derive checkout from it today.
- Mercado Pago `accessToken` is never exposed by any self-service billing response. It stays server-side in integration config and provider client code only.
- `GET /students/me/billing` is enough for:
  - payment status: yes, via `summary.status`
  - next payment due: yes, via `summary.nextPaymentDueDate` and `summary.nextPaymentAmount`
  - last payment: yes, via `recentPayments[0]` when present
  - payment history: yes, through `GET /organizations/:organizationId/students/me/payments`; `recentPayments` remains a 5-item preview
- `View Full Billing Details` contract:
  - payment-history preview uses `recentPayments`
  - full list can open `GET /organizations/:organizationId/students/me/payments`
  - open-charge cards can open `GET /organizations/:organizationId/students/me/billing-charges/:chargeId`
  - payment items can open `GET /organizations/:organizationId/students/me/payments/:paymentId`

Real response example: `GET /organizations/:organizationId/students/me/billing`

```json
{
  "summary": {
    "status": "DUE_SOON",
    "nextPaymentDueDate": "2026-06-10",
    "nextPaymentAmount": {
      "amount": 100,
      "currency": "BRL",
      "formatted": "R$ 100,00"
    },
    "openBalance": {
      "amount": 100,
      "currency": "BRL",
      "formatted": "R$ 100,00"
    }
  },
  "membership": {
    "studentId": "student_1",
    "branchId": "branch_1",
    "branchName": "SNP Centro",
    "planName": "Mensal",
    "nextBillingDate": "2026-06-10"
  },
  "openCharges": [
    {
      "id": "charge_1",
      "description": "June membership",
      "status": "OPEN",
      "dueDate": "2026-06-10",
      "amount": {
        "amount": 100,
        "currency": "BRL",
        "formatted": "R$ 100,00"
      },
      "amountPaid": {
        "amount": 0,
        "currency": "BRL",
        "formatted": "R$ 0,00"
      },
      "outstandingAmount": {
        "amount": 100,
        "currency": "BRL",
        "formatted": "R$ 100,00"
      },
      "canPayWithMercadoPago": true
    }
  ],
  "recentPayments": [
    {
      "id": "payment_1",
      "date": "2026-05-10",
      "status": "PAID",
      "method": "MERCADO_PAGO",
      "amount": {
        "amount": 90,
        "currency": "BRL",
        "formatted": "R$ 90,00"
      },
      "chargeId": "charge_previous"
    }
  ],
  "paymentMethods": {
    "mercadoPago": {
      "available": true,
      "environment": "test",
      "publicKey": "APP_USR-public"
    }
  },
  "links": {
    "profile": "/organizations/org_1/students/me/profile"
  }
}
```

Real response example: `GET /organizations/:organizationId/students/me/billing-charges/:chargeId`

```json
{
  "id": "charge_123",
  "status": "OPEN",
  "description": "June membership",
  "dueDate": "2026-06-10",
  "amount": {
    "amount": 100,
    "currency": "BRL",
    "formatted": "R$ 100,00"
  },
  "amountPaid": {
    "amount": 0,
    "currency": "BRL",
    "formatted": "R$ 0,00"
  },
  "outstandingAmount": {
    "amount": 100,
    "currency": "BRL",
    "formatted": "R$ 100,00"
  },
  "payments": [
    {
      "id": "payment_123",
      "status": "PENDING",
      "provider": "MERCADO_PAGO",
      "method": "MERCADO_PAGO",
      "date": "2026-06-09",
      "amount": {
        "amount": 100,
        "currency": "BRL",
        "formatted": "R$ 100,00"
      }
    }
  ],
  "checkout": {
    "canCreatePreference": true,
    "lastPreferenceId": "pref_123"
  }
}
```

Real response example: `GET /organizations/:organizationId/students/me/payments`

```json
{
  "items": [
    {
      "id": "payment_1",
      "chargeId": "charge_1",
      "date": "2026-04-20",
      "status": "PAID",
      "method": "MERCADO_PAGO",
      "provider": "MERCADO_PAGO",
      "amount": {
        "amount": 350,
        "currency": "BRL",
        "formatted": "R$ 350,00"
      },
      "description": "Mensualidad Abril 2026"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 35
  }
}
```

Real response example: `GET /organizations/:organizationId/students/me/payments/:paymentId`

```json
{
  "id": "payment_1",
  "chargeId": "charge_1",
  "charge": {
    "id": "charge_1",
    "description": "Mensualidad Abril 2026",
    "dueDate": "2026-04-20"
  },
  "date": "2026-04-20",
  "status": "PAID",
  "method": "MERCADO_PAGO",
  "provider": "MERCADO_PAGO",
  "amount": {
    "amount": 350,
    "currency": "BRL",
    "formatted": "R$ 350,00"
  },
  "externalProvider": "MERCADO_PAGO",
  "externalReference": "provider_payment_id_or_reference",
  "recordedAt": "2026-04-20T12:00:00.000Z"
}
```

Real response example: `POST /organizations/:organizationId/students/me/billing-charges/:chargeId/mercado-pago/preference`

```json
{
  "chargeId": "charge_1",
  "provider": "MERCADO_PAGO",
  "publicKey": "APP_USR-123456-public",
  "preferenceId": "pref_123",
  "externalReference": "billing_charge:charge_1",
  "initPoint": "https://www.mercadopago.com/init/pref_123",
  "sandboxInitPoint": "https://sandbox.mercadopago.com/init/pref_123",
  "amount": 100,
  "currency": "ARS",
  "status": "READY",
  "environment": "test",
  "reused": false
}
```

### Training Notes

Verdict: `Ready`

Current contract:

- `GET /organizations/:organizationId/students/me/notes` returns a student/mobile read model, while staff flows keep using the canonical staff note view on `GET /students/:studentId/training-notes`.
- Notes created by instructor/admin appear in `/students/me/notes` when they remain `ACTIVE` and `visibility` allows student access. In practice today that means student-visible notes, not instructor/staff private notes.
- Student self list is sorted by `createdAt desc`.
- Student/self can filter by class with `GET /organizations/:organizationId/students/me/notes?classSessionId=:sessionId`.

Visibility and status rules for student self:

- Visible to the student: `status=ACTIVE` and `visibility=VISIBLE_TO_STUDENT`
- Not visible to the student: `INSTRUCTOR_PRIVATE`, `STAFF_PRIVATE`, `SHARED_WITH_COACHES`, `ARCHIVED`, `VOIDED`
- `noteType` does not independently grant visibility. For student self-create, the only allowed combination is `noteType=STUDENT_REQUEST` plus `visibility=VISIBLE_TO_STUDENT`. For coach-created visible notes, current types can include `INSTRUCTOR_FEEDBACK`, `TRAINING_FOCUS`, `SESSION_NOTE`, `MONTHLY_PLAN`, or `WEEKLY_PLAN`

Field-level audit:

- Author/source: yes, the response now includes `source`, `sourceLabel`, `author`, and `updatedBy`
- Class session: yes, `classSession` is embedded when `classSessionId` exists
- Navigate to past class: yes. Mobile can use `classSessionId` with `GET /organizations/:organizationId/students/me/class-sessions/:sessionId`
- Sufficient today for:
  - title: yes, backend-derived from real `TrainingNoteType`
  - body preview: yes, backend-derived as `bodyPreview`
  - fecha: yes, from `createdAt` and/or `periodStart` / `periodEnd`
  - programa/clase: yes, from `classSession.name` when linked
  - Gi/No-Gi: yes when `ClassSession.classType` is `GI` or `NO_GI`, otherwise `null`
  - nivel: no, current schema has no class-session level field so response returns `null`
  - tags/chips: no dedicated field

Gap classification:

- `title`: resolved by current mobile read model
- `source` label such as `Instructor` or `Admin`: resolved by current mobile read model
- `Gi/No-Gi`: resolved when session type is explicitly `GI` or `NO_GI`
- `nivel`: current gap is schema-level; response returns `null`
- `tags/chips`: unsupported; UI should not expect them from backend today

Permission matrix:

- Student can create a training note: yes, but only `visibility=VISIBLE_TO_STUDENT` plus `noteType=STUDENT_REQUEST`
- Student can link their own note to `classSessionId`: yes, when the class session belongs to the student's primary branch in this phase
- Student-created note linked to `classSessionId` is visible to:
  - the student through `GET /students/me/notes`
  - coach roles with branch access (`MESTRE`, `ORG_ADMIN`, `ACADEMY_MANAGER`, `HEAD_COACH`, `INSTRUCTOR`) through staff endpoints
- Student-private visibility exists: no
- Coach-visible-only visibility exists: yes, `SHARED_WITH_COACHES`, but student self cannot create it
- Staff-only internal visibility exists: yes, `STAFF_PRIVATE`
- Instructor can read student-created visible note: yes
- Mestre/admin can read student-created visible note: yes
- Generic `STAFF` can read student-created visible note: no, unless that membership also carries a coach/leadership role; `STAFF_PRIVATE` is a separate internal visibility
- Student can edit their own note: yes, only while it remains their own active `VISIBLE_TO_STUDENT` + `STUDENT_REQUEST`
- Student can archive or void their own note: no
- Instructor/admin can respond in-thread: no dedicated reply/thread model exists
- Instructor/admin can follow up by updating the same note when policy allows it: yes, but that is a revision of one note, not a threaded conversation
- Notes support revisions/history: yes
- Notes support replies/threading: no
- Notes linked to a past class remain linkable/readable by `classSessionId`; there is no separate past-class conversation domain

Product case: student asks the professor about a class

- Status: `B. Parcialmente soportado`
- Supported today:
  - student can create a `STUDENT_REQUEST`
  - student can attach `classSessionId`
  - branch coach roles can see that note
  - notification hooks can notify head coach / academy manager / assigned instructor
- Missing for full support:
  - dedicated conversation or reply model
  - separate question/comment semantics distinct from general training notes
  - message threading, resolution state, or instructor reply record
- Current recommendation:
  - do not present this as a chat/thread feature
  - mobile may treat it as a one-note request/follow-up flow only

Why current solution uses a self-service read model:

- The current canonical note model is intentionally body-first and policy-shaped.
- Adding `title` and `tags` directly to the canonical `TrainingNote` should not happen casually.
- Mobile-specific cards are solved by the existing self-service endpoint deriving stable display fields from note + class-session context, without changing the canonical `TrainingNote` schema.

Real response example: `GET /organizations/:organizationId/students/me/notes`

```json
{
  "studentId": "student_123",
  "items": [
    {
      "id": "note_123",
      "title": "Plan semanal",
      "body": "Focus on guard retention and hip movement this week.",
      "bodyPreview": "Focus on guard retention and hip movement this week.",
      "source": "INSTRUCTOR",
      "sourceLabel": "Instructor",
      "status": "ACTIVE",
      "classSessionId": null,
      "periodStart": "2026-06-01T00:00:00.000Z",
      "periodEnd": "2026-06-07T00:00:00.000Z",
      "visibility": "VISIBLE_TO_STUDENT",
      "noteType": "WEEKLY_PLAN",
      "classSession": null,
      "author": {
        "id": "membership_456",
        "name": "Coach Name"
      },
      "updatedBy": {
        "id": "membership_456",
        "name": "Coach Name"
      },
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-06-02T09:30:00.000Z"
    }
  ]
}
```

### Notifications

Verdict: `Ready`

Current contract:

- `GET /organizations/:organizationId/notifications/unread-count` is sufficient for the bell badge. It returns `{ "unreadCount": number }` scoped to the authenticated membership.
- `GET /organizations/:organizationId/notifications?page=1&limit=20` now returns delivered notification rows enriched with `title`, `message`, `action`, `icon`, `category`, and `isUnread`, while keeping `type`, `resourceType`, `resourceId`, `payload`, `createdAt`, and `readAt`.
- `POST /organizations/:organizationId/notifications/:notificationId/read` and `POST /organizations/:organizationId/notifications/read-all` support read state.

Current mobile read model:

- Every item includes `id`, `type`, `title`, `message`, `resourceType`, `resourceId`, `payload`, `action.type`, `action.deepLink`, `icon`, `category`, `createdAt`, `readAt`, and `isUnread`.
- `unread-count` remains sufficient for the bell badge and does not require any client-side derivation from the feed.
- `mark read`, `mark many`, and `read all` keep the same semantics; `isUnread` is derived from persisted `readAt`.

Supported `NotificationType` audit:

| NotificationType | Producer module | ResourceType | Payload shape delivered today | Student mobile? | Expected title/message | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| `ANNOUNCEMENT_PUBLISHED` | `communications` publish announcement flow | `ANNOUNCEMENT` | `{ summary, title, scopeType, branchId }` | `Conditional` | title: `Nuevo aviso de la academia`; message: payload `title` when present, otherwise fallback estable | `OPEN_ANNOUNCEMENT` -> `kuro://announcements/{resourceId}` |
| `INVITATION_ACCEPTED` | `auth` invitation acceptance flow | `MEMBERSHIP` | `{ summary, organizationName }` | `Conditional` | title: membership active; message: organization name | open student home/profile |
| `ACADEMY_INTAKE_REQUEST_CREATED` | `public-branch intake` flow | `ACADEMY_INTAKE_REQUEST` | `{ requestId, branchId, fullName, requestType }` | `No` | operational intake alert | no student-mobile deep link |
| `INSTITUTIONAL_REQUEST_ACTION_REQUIRED` | `communications` request creation/reply flow | `INSTITUTIONAL_MESSAGE` | `{ summary, title, requestStatus, requestPriority, branchId }` | `No` in normal flow | request requires action | no student-mobile deep link |
| `INSTITUTIONAL_REQUEST_ASSIGNED` | `communications` request operations flow | `INSTITUTIONAL_MESSAGE` | `{ summary, title, requestPriority, branchId }` | `No` in normal flow | request assigned | no student-mobile deep link |
| `INSTITUTIONAL_REQUEST_CLOSED` | `communications` request status flow | `INSTITUTIONAL_MESSAGE` | `{ summary, title, requestStatus, resolutionCategory, branchId }` | `Conditional` | request closed | open own institutional request detail if student created it |
| `INSTITUTIONAL_REQUEST_REMINDER` | `communications` automation flow | `INSTITUTIONAL_MESSAGE` | `{ summary, messageId, title, automationKind, requestStatus, requestPriority, branchId }` | `No` in normal flow | request reminder | no student-mobile deep link |
| `INSTITUTIONAL_REQUEST_ESCALATED` | `communications` automation flow | `INSTITUTIONAL_MESSAGE` | `{ summary, messageId, title, automationKind, requestPriority, branchId }` | `No` in normal flow | request escalation | no student-mobile deep link |
| `ATTENDANCE_FOLLOW_UP_ASSIGNED` | `attendance` follow-up assignment flow | `ATTENDANCE_FOLLOW_UP` | `{ summary, studentId, studentName, branchId, riskLevel, recommendedAction }` | `No` in expected flow | follow-up assigned | no student-mobile deep link |
| `ATTENDANCE_SUGGESTION` | `attendance suggestions` flow | `ATTENDANCE_SUGGESTION` | `{ summary, organizationId, branchId, classSessionId, suggestionId, message }` | `Yes` | title: `Sugerencia de asistencia`; message: payload `message` when present, otherwise fallback estable | `OPEN_ATTENDANCE` -> `kuro://attendance` |
| `TRAINING_NOTE_VISIBLE` | `training-notes` visible-note hook | `TRAINING_NOTE` | `{ summary, studentId, branchId, noteType, actorName }` | `Yes` | title: `Nueva nota de entrenamiento`; message: actor-aware fallback estable | `OPEN_TRAINING_NOTE` -> `kuro://training-notes/{resourceId}` |
| `TRAINING_NOTE_COACH_REVIEW` | `training-notes` student-request hook | `TRAINING_NOTE` | `{ summary, studentId, studentName, branchId, noteType, classSessionId }` | `No` | coach review needed | no student-mobile deep link |
| `NEW_CLASS_SESSION_CREATED` | `classes` create session/create from schedule flows | `CLASS_SESSION` | `{ summary, classSessionId, classTitle, branchId, branchName, startAt, instructorName }` | `Yes` | title: `Nueva clase disponible`; message: class-title aware | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `CLASS_SESSION_UPDATED` | `classes` update session flow | `CLASS_SESSION` | `{ summary, classSessionId, classTitle, branchId, branchName, startAt, instructorName }` | `Yes` | title: `Clase actualizada`; message: class-title aware | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `CLASS_SESSION_CANCELED` | `classes` cancel session flow | `CLASS_SESSION` | `{ summary, classSessionId, classTitle, branchId, branchName, startAt, instructorName }` | `Yes` | title: `Clase cancelada`; message: class-title aware | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `CLASS_SESSION_NOTE_PUBLISHED` | `classes` update public `ClassSession.notes` flow | `CLASS_SESSION` | `{ summary, classSessionId, classTitle, branchId, branchName, startAt, instructorName }` | `Yes` | title: `Nueva nota de clase`; message: class-title aware | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `CLASS_STARTING_SOON` | pending scheduler/job | `CLASS_SESSION` | same class session summary payload when implemented | `Yes` when implemented | title: `Tu clase empieza pronto` | `OPEN_CLASS_SESSION` -> `kuro://class-sessions/{classSessionId}` |
| `BILLING_CHARGE_CREATED` | `billing` create charge flow | `BILLING_CHARGE` | `{ summary, billingChargeId, studentId, branchId, dueDate, amount, currency }` | `Yes` | title: `Nuevo pago pendiente`; message: stable billing copy | `OPEN_BILLING` -> `kuro://billing` |
| `BILLING_CHARGE_DUE_SOON` | pending billing scheduler/lifecycle | `BILLING_CHARGE` | same billing charge summary payload when implemented | `Yes` when implemented | title: `Pago proximo a vencer` | `OPEN_BILLING` -> `kuro://billing` |
| `BILLING_CHARGE_OVERDUE` | pending billing scheduler/lifecycle | `BILLING_CHARGE` | same billing charge summary payload when implemented | `Yes` when implemented | title: `Pago vencido` | `OPEN_BILLING` -> `kuro://billing` |
| `BILLING_PAYMENT_CONFIRMED` | `billing` manual payment and Mercado Pago reconciliation flows | `PAYMENT_RECORD` | `{ summary, paymentRecordId, billingChargeId, studentId, branchId, amount, currency, status }` | `Yes` | title: `Pago confirmado`; message: stable billing copy | `OPEN_BILLING` -> `kuro://billing` |

Student-mobile coverage today:

- billing notifications: yes for `BILLING_CHARGE_CREATED` and `BILLING_PAYMENT_CONFIRMED`; due-soon/overdue remain pending scheduler/lifecycle producers
- training notes: yes, `TRAINING_NOTE_VISIBLE`
- class starting soon: mobile mapping exists, producer pending scheduler/job
- schedule changes: yes for created/updated/canceled/public `ClassSession.notes`
- attendance milestones: no producer today
- announcements: yes, when a student membership is part of the audience resolved by announcement visibility/scope
- academy intake/messages:
  - academy intake created: no, operational only
  - institutional messages: only `INSTITUTIONAL_REQUEST_CLOSED` can reasonably hit a student when the student created the request

Pending producer gaps:

- billing alerts: no producer today
- class starting soon: no producer today
- schedule changes: no producer today
- attendance milestones: no producer today

## 17. Public Profile (Discovery)

### Public search

`GET /public/branches/search`

**Roles permitted**: public
**Capability required**: no aplica
**Step-up required**: no
**Scope**: no aplica

#### Query params

| Param         | Tipo   | Default                       | Descripción                                               |
| ------------- | ------ | ----------------------------- | --------------------------------------------------------- |
| `countryCode` | string | required unless `lat` + `lng` | ISO country code                                          |
| `q`           | string | -                             | search string matched against branch/profile/city/region  |
| `city`        | string | -                             | city filter                                               |
| `region`      | string | -                             | region filter                                             |
| `lat`         | number | -                             | geosearch origin latitude                                 |
| `lng`         | number | -                             | geosearch origin longitude                                |
| `radiusKm`    | number | `25` when origin is provided  | geosearch radius, `1..100`; values above max return `422` |
| `page`        | number | `1`                           | page                                                      |
| `limit`       | number | `20`                          | page size                                                 |

Rules:

- `lat` and `lng` must be provided together.
- `radiusKm` is optional when `lat` + `lng` are present; default is `25`.
- `lat` must be between `-90` and `90`; `lng` must be between `-180` and `180`.
- distance search uses PostGIS `geography(Point,4326)` and excludes profiles without `location`.
- distance results are ordered by nearest first and include `distance`.
- public search returns only active organizations, active branches with `isPublicListed=true`, and `BranchPublicProfile.isPublished=true`.
- `addressLine1` is `null` when `publicAddressVisibility=false`.
- Backend does not store end-user location and does not call map-provider Directions APIs.

Validation errors:

- `422` when only one coordinate is provided.
- `422` when coordinate ranges are invalid.
- `422` when `radiusKm` is outside `1..100`.

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
        "timezone": "America/Argentina/Buenos_Aires",
        "address": null,
        "addressLine1": null,
        "publicAddressVisibility": false,
        "latitude": -34.6,
        "longitude": -58.4,
        "distanceKm": null
      },
      "distance": {
        "meters": 2350,
        "kilometers": 2.35
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
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "hasDistanceSort": true,
    "origin": { "lat": -34.6, "lng": -58.4, "radiusKm": 25 }
  }
}
```

`distance` appears only when `lat` + `lng` are provided. The legacy
`location.distanceKm` remains for compatibility and is `null` without origin.
Public coordinates are still returned from `BranchPublicProfile` even when
`publicAddressVisibility=false`; if the product later needs "show on map" and
"show exact address" to diverge, add a separate approved flag such as
`isMapVisible`.

### Public branch geocoding preview

`POST /organizations/:organizationId/branches/:branchId/geocode-preview`

**Roles permitted**: authenticated organization admin
**Capability required**: backend authorization
**Step-up required**: no
**Scope**: organization

Request:

```json
{
  "address": "La Rioja 619",
  "city": "Buenos Aires",
  "region": "CABA",
  "countryCode": "AR"
}
```

Response:

```json
{
  "status": "VERIFIED",
  "candidates": [
    {
      "latitude": -34.585,
      "longitude": -58.421,
      "formattedAddress": "La Rioja 619, Buenos Aires, Argentina",
      "provider": "MAPBOX",
      "status": "VERIFIED",
      "providerPlaceId": "mapbox.feature-id",
      "confidence": "exact"
    }
  ]
}
```

`status` values: `NOT_PROVIDED`, `VERIFIED`, `NEEDS_REVIEW`, `FAILED`.
Ambiguous or low-confidence candidates are not auto-persisted as verified.
The endpoint returns normalized candidates only and never returns the full raw
provider payload.

Confirmed candidate persistence uses the existing branch update endpoint:

```json
{
  "publicProfile": {
    "confirmedGeocodingCandidate": {
      "latitude": -34.585,
      "longitude": -58.421,
      "formattedAddress": "La Rioja 619, Buenos Aires, Argentina",
      "provider": "MAPBOX",
      "providerPlaceId": "mapbox.feature-id"
    }
  }
}
```

Direct manual coordinates are also accepted through `publicProfile.latitude`
and `publicProfile.longitude`; both must be present together or both set to
`null` to clear location. Saving coordinates updates the PostGIS `location`
column through the database trigger. Manual coordinates are treated as operator
confirmed geography, persist with `geocodingProvider=MANUAL`, and do not persist
`providerPlaceId`.

Provider note: Mapbox is the initial backend geocoding provider and is stored as
`geocodingProvider=MAPBOX`, but persisted geography is provider-agnostic:
`latitude`, `longitude`, and PostGIS `location` are the standard source for
public discovery. Storing Mapbox geocoding results requires using the Mapbox
permanent geocoding mode/plan. Server-side Mapbox requests use
`MAPBOX_SECRET_TOKEN`; persistent storage should only be enabled when
`MAPBOX_PERMANENT_GEOCODING_ENABLED=true` is contractually allowed.
When `MAPBOX_PERMANENT_GEOCODING_ENABLED=false`, preview may still return
temporary Mapbox candidates for immediate UX, but PATCH with
`confirmedGeocodingCandidate.provider=MAPBOX` returns `422`:
`Permanent geocoding storage is not enabled for this provider`.

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
  "amount": 100,
  "currency": "BRL",
  "status": "READY",
  "environment": "production",
  "reused": false
}
```

Notes:

- Backward-compatible addition: `amount`, `currency`, and `status` are now included.
- Backend calculates `amount` from the current `BillingCharge` outstanding balance; clients must not send amount or currency.
- Returns `503` when Mercado Pago is not configured for the branch.

### Student self billing summary

`GET /organizations/:organizationId/students/me/billing`

**Roles permitted**: authenticated TENANT student with linked `Student`
**Capability required**: self-service, no operator billing capability required
**Step-up required**: no
**Scope**: SELF, branch-local to `Student.primaryBranchId`

This is the mobile-safe billing read model for Flutter. The backend resolves the student from the current principal and never accepts `studentId` in the path.

#### Response

```json
{
  "summary": {
    "status": "CURRENT",
    "nextPaymentDueDate": "2026-06-10",
    "nextPaymentAmount": {
      "amount": 100,
      "currency": "BRL",
      "formatted": "R$ 100,00"
    },
    "openBalance": {
      "amount": 100,
      "currency": "BRL",
      "formatted": "R$ 100,00"
    }
  },
  "membership": {
    "studentId": "student_123",
    "branchId": "branch_123",
    "branchName": "SNP Centro",
    "planName": "Mensal",
    "nextBillingDate": "2026-06-10"
  },
  "openCharges": [
    {
      "id": "charge_123",
      "description": "June membership",
      "status": "OPEN",
      "dueDate": "2026-06-10",
      "amount": {
        "amount": 100,
        "currency": "BRL",
        "formatted": "R$ 100,00"
      },
      "amountPaid": {
        "amount": 0,
        "currency": "BRL",
        "formatted": "R$ 0,00"
      },
      "outstandingAmount": {
        "amount": 100,
        "currency": "BRL",
        "formatted": "R$ 100,00"
      },
      "canPayWithMercadoPago": true
    }
  ],
  "recentPayments": [
    {
      "id": "payment_123",
      "date": "2026-06-09",
      "status": "PAID",
      "method": "MERCADO_PAGO",
      "amount": {
        "amount": 100,
        "currency": "BRL",
        "formatted": "R$ 100,00"
      },
      "chargeId": "charge_123"
    }
  ],
  "paymentMethods": {
    "mercadoPago": {
      "available": true,
      "environment": "test",
      "publicKey": "APP_USR-public"
    }
  },
  "links": {
    "profile": "/organizations/org_123/students/me/profile"
  }
}
```

Empty state:

- If no real billing exists for the current primary branch, `summary.status` is `UNKNOWN`, amounts/dates are `null`, arrays are empty, and no amounts are invented.

Security:

- `studentId` is resolved from `Student.userId === principal.sub`.
- Financial reads are limited to the student's current `primaryBranchId`.
- The response never exposes Mercado Pago access token, webhook secret, raw provider payloads, private billing notes, or external provider raw references.
- `recentPayments` is intentionally limited to the latest 5 `PaymentRecord` rows and is not a paginated full payment-history feed.
- `paymentMethods.mercadoPago.publicKey` is the client-safe Mercado Pago publishable key. It is exposed only to signal Checkout Pro availability for the current branch and must not be confused with the provider `accessToken`, which is never returned.

### Student self billing charge detail

`GET /organizations/:organizationId/students/me/billing-charges/:chargeId`

**Roles permitted**: authenticated TENANT student with linked `Student`
**Capability required**: self-service, no operator billing capability required
**Step-up required**: no
**Scope**: SELF, branch-local to `Student.primaryBranchId`

Used by Flutter after returning from Mercado Pago `success`, `failure`, or `pending` redirects to refresh backend state.

#### Response

```json
{
  "id": "charge_123",
  "status": "OPEN",
  "description": "June membership",
  "dueDate": "2026-06-10",
  "amount": {
    "amount": 100,
    "currency": "BRL",
    "formatted": "R$ 100,00"
  },
  "amountPaid": {
    "amount": 0,
    "currency": "BRL",
    "formatted": "R$ 0,00"
  },
  "outstandingAmount": {
    "amount": 100,
    "currency": "BRL",
    "formatted": "R$ 100,00"
  },
  "payments": [
    {
      "id": "payment_123",
      "status": "PENDING",
      "provider": "MERCADO_PAGO",
      "method": "MERCADO_PAGO",
      "date": "2026-06-09",
      "amount": {
        "amount": 100,
        "currency": "BRL",
        "formatted": "R$ 100,00"
      }
    }
  ],
  "checkout": {
    "canCreatePreference": true,
    "lastPreferenceId": "pref_123"
  }
}
```

Errors:

- `404` when the charge does not exist or does not belong to the authenticated student's current branch-local billing context.
- `403` for cross-organization access according to the standard auth context checks.

### Student self payment history

`GET /organizations/:organizationId/students/me/payments`

**Roles permitted**: authenticated TENANT student with linked `Student`
**Capability required**: self-service, no operator billing capability required
**Step-up required**: no
**Scope**: SELF, branch-local to `Student.primaryBranchId`

This is the paginated payment-history endpoint for student mobile self-service. It returns only `PaymentRecord` rows for the authenticated student's current branch-local billing context.

#### Query params

| Param      | Tipo   | Default | Descripción                       |
| ---------- | ------ | ------- | --------------------------------- |
| `page`     | number | `1`     | page                              |
| `limit`    | number | `20`    | size                              |
| `method`   | enum   | -       | optional `PaymentMethod` filter   |
| `status`   | enum   | -       | optional `PaymentStatus` filter   |
| `currency` | string | -       | optional currency filter          |
| `dateFrom` | date   | -       | optional `recordedAt` lower bound |
| `dateTo`   | date   | -       | optional `recordedAt` upper bound |

#### Response

```json
{
  "items": [
    {
      "id": "payment_1",
      "chargeId": "charge_1",
      "date": "2026-04-20",
      "status": "PAID",
      "method": "MERCADO_PAGO",
      "provider": "MERCADO_PAGO",
      "amount": {
        "amount": 350,
        "currency": "BRL",
        "formatted": "R$ 350,00"
      },
      "description": "Mensualidad Abril 2026"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 35
  }
}
```

Security:

- Backend resolves the student from `principal.sub + organizationId`; there is no `studentId` path or query contract in self-service.
- Never exposes Mercado Pago `accessToken`, provider config, webhook secrets, or raw provider payloads.

### Student self payment detail

`GET /organizations/:organizationId/students/me/payments/:paymentId`

**Roles permitted**: authenticated TENANT student with linked `Student`
**Capability required**: self-service, no operator billing capability required
**Step-up required**: no
**Scope**: SELF, branch-local to `Student.primaryBranchId`

#### Response

```json
{
  "id": "payment_1",
  "chargeId": "charge_1",
  "charge": {
    "id": "charge_1",
    "description": "Mensualidad Abril 2026",
    "dueDate": "2026-04-20"
  },
  "date": "2026-04-20",
  "status": "PAID",
  "method": "MERCADO_PAGO",
  "provider": "MERCADO_PAGO",
  "amount": {
    "amount": 350,
    "currency": "BRL",
    "formatted": "R$ 350,00"
  },
  "externalProvider": "MERCADO_PAGO",
  "externalReference": "provider_payment_id_or_reference",
  "recordedAt": "2026-04-20T12:00:00.000Z"
}
```

Errors:

- `404` when the payment does not exist or does not belong to the authenticated student in the current branch-local billing context.
- `403` for cross-organization access according to the standard auth context checks.

### Student self Mercado Pago preference

`POST /organizations/:organizationId/students/me/billing-charges/:chargeId/mercado-pago/preference`

**Roles permitted**: authenticated TENANT student with linked `Student`
**Capability required**: self-service, no operator billing capability required
**Step-up required**: no
**Scope**: SELF, branch-local to `Student.primaryBranchId`

#### Response

```json
{
  "chargeId": "charge_123",
  "provider": "MERCADO_PAGO",
  "preferenceId": "pref_123",
  "externalReference": "billing_charge:charge_123",
  "initPoint": "https://www.mercadopago.com/checkout/...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com/checkout/...",
  "publicKey": "APP_USR-public",
  "amount": 100,
  "currency": "BRL",
  "status": "READY",
  "environment": "test",
  "reused": false
}
```

Rules:

- Backend calculates `amount` and `currency` from the `BillingCharge`; Flutter must not send these fields.
- `404` when the charge does not belong to the authenticated student.
- `409` when the charge is paid, canceled, void, already linked to a different provider, or has no outstanding balance.
- `503` when Mercado Pago is not configured for the student's current branch.
- Current mobile flow is Checkout Pro redirect/open. Flutter should open `sandboxInitPoint` when `environment !== "production"` and `sandboxInitPoint` is present; otherwise it should open `initPoint`. The returned `publicKey` is client-safe but not sufficient by itself to complete checkout in the current contract.
- `environment !== "production"` plus non-null `sandboxInitPoint` means Flutter should open `sandboxInitPoint`; production should open `initPoint`.
- Success, failure, or pending redirect is not payment confirmation. Flutter must call the charge-detail endpoint after redirect; webhook/reconciliation remains the source of truth.

### List student billing charges

`GET /organizations/:organizationId/students/:studentId/billing-charges`

**Roles permitted**: authenticated member
**Capability requerida**: `billing.canReadBilling`
**Step-up required**: no
**Scope**: BRANCH_SCOPED

#### Query params

| Param           | Tipo   | Default | Descripción           |
| --------------- | ------ | ------- | --------------------- |
| `page`          | number | `1`     | page                  |
| `limit`         | number | `20`    | size                  |
| `studentId`     | string | -       | filter                |
| `billingPlanId` | string | -       | filter                |
| `chargeType`    | enum   | -       | `BillingChargeType`   |
| `status`        | enum   | -       | `BillingChargeStatus` |
| `currency`      | string | -       | currency              |
| `dateFrom`      | date   | -       | filter                |
| `dateTo`        | date   | -       | filter                |

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

| Param             | Tipo   | Default | Descripción             |
| ----------------- | ------ | ------- | ----------------------- |
| `page`            | number | `1`     | page                    |
| `limit`           | number | `20`    | size                    |
| `financialStatus` | string | -       | domain financial status |

#### Response

```json
{
  "items": [
    {
      "student": {
        "id": "string",
        "firstName": "string",
        "lastName": "string"
      },
      "membership": { "id": "string", "status": "ACTIVE" },
      "financialStatus": "OK",
      "daysOverdue": 0,
      "nextDueDate": "2026-06-01",
      "hasOverdueCharges": false,
      "hasPendingCharges": false,
      "activeRestrictionFlags": {
        "attendanceRestricted": false,
        "appUsageRestricted": false
      },
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
  "activeRestrictionFlags": {
    "attendanceRestricted": false,
    "appUsageRestricted": false
  },
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

| Param         | Tipo   | Default | Descripción     |
| ------------- | ------ | ------- | --------------- |
| `dateFrom`    | date   | -       | filter          |
| `dateTo`      | date   | -       | filter          |
| `method`      | enum   | -       | `PaymentMethod` |
| `status`      | enum   | -       | `PaymentStatus` |
| `paymentKind` | enum   | -       | `PaymentKind`   |
| `currency`    | string | -       | currency        |
| `studentId`   | string | -       | filter          |
| `windowDays`  | number | -       | 1..14           |
| `limit`       | number | -       | 1..250          |

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

| Param      | Tipo   | Default | Descripción |
| ---------- | ------ | ------- | ----------- |
| `dateFrom` | date   | -       | filter      |
| `dateTo`   | date   | -       | filter      |
| `currency` | string | -       | filter      |

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

| Param                | Tipo   | Default | Descripción |
| -------------------- | ------ | ------- | ----------- |
| `activityWindowDays` | number | `30`    | `1..365`    |

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

| Param                | Tipo   | Default | Descripción |
| -------------------- | ------ | ------- | ----------- |
| `activityWindowDays` | number | `30`    | `1..365`    |
| `limit`              | number | `25`    | `1..100`    |

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

| Param               | Tipo      | Default | Descripción |
| ------------------- | --------- | ------- | ----------- |
| `page`              | number    | `1`     | page        |
| `limit`             | number    | `20`    | size        |
| `branchId`          | string    | -       | filter      |
| `requestId`         | string    | -       | filter      |
| `actorMembershipId` | string    | -       | filter      |
| `entityType`        | string    | -       | filter      |
| `entityId`          | string    | -       | filter      |
| `action`            | string    | -       | filter      |
| `from`              | date-time | -       | filter      |
| `to`                | date-time | -       | filter      |

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

| Param          | Tipo   | Default | Descripción |
| -------------- | ------ | ------- | ----------- |
| `limit`        | number | `100`   | max `200`   |
| `relatedLimit` | number | `25`    | max `100`   |

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

| Param       | Tipo   | Default | Descripción            |
| ----------- | ------ | ------- | ---------------------- |
| `page`      | number | `1`     | page                   |
| `limit`     | number | `20`    | size                   |
| `branchId`  | string | -       | filter                 |
| `provider`  | enum   | -       | `IntegrationProvider`  |
| `status`    | enum   | -       | `IntegrationStatus`    |
| `scopeType` | enum   | -       | `IntegrationScopeType` |

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

| Param      | Tipo   | Default | Descripción             |
| ---------- | ------ | ------- | ----------------------- |
| `page`     | number | `1`     | page                    |
| `limit`    | number | `20`    | size                    |
| `syncKind` | enum   | -       | `IntegrationSyncKind`   |
| `status`   | enum   | -       | `IntegrationSyncStatus` |

### List integration webhook events

`GET /organizations/:organizationId/integrations/:integrationId/webhook-events`

**Roles permitted**: authenticated member
**Capability required**: `integrations.canReadIntegrationWebhookEvents`
**Step-up required**: no
**Scope**: ORGANIZATION_WIDE

#### Query params

| Param                | Tipo      | Default | Descripción                          |
| -------------------- | --------- | ------- | ------------------------------------ |
| `page`               | number    | `1`     | page                                 |
| `limit`              | number    | `20`    | size                                 |
| `validationStatus`   | enum      | -       | `IntegrationWebhookValidationStatus` |
| `processingStatus`   | enum      | -       | `IntegrationWebhookProcessingStatus` |
| `notificationType`   | string    | -       | notification type                    |
| `dateFrom`           | date-time | -       | filter                               |
| `dateTo`             | date-time | -       | filter                               |
| `onlyRecoverable`    | boolean   | -       | filter                               |
| `externalResourceId` | string    | -       | filter                               |

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

| Param              | Tipo   | Default | Descripción          |
| ------------------ | ------ | ------- | -------------------- |
| `page`             | number | `1`     | page                 |
| `limit`            | number | `20`    | size                 |
| `entityType`       | enum   | -       | `ExternalEntityType` |
| `internalEntityId` | string | -       | filter               |
| `externalEntityId` | string | -       | filter               |

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

| Status | Error                 | Message shape                                                       |
| ------ | --------------------- | ------------------------------------------------------------------- |
| 401    | Unauthorized          | token absent, expired, invalid, or membership unavailable           |
| 403    | Forbidden             | missing capability, scope mismatch, or `RECENT_AUTH_REQUIRED`       |
| 404    | Not Found             | resource not found or hidden by tenant isolation                    |
| 409    | Conflict              | duplicate resource, invalid state transition, or lifecycle conflict |
| 422    | Validation Error      | invalid request body/query structure                                |
| 429    | Too Many Requests     | rate-limited endpoint, especially public intake/webhooks            |
| 500    | Internal Server Error | unexpected backend failure                                          |

### Global error shape

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "code": "OPTIONAL_STABLE_CODE",
  "message": "Missing capability",
  "path": "/api/v1/organizations/org_123",
  "requestId": "uuid",
  "timestamp": "2026-05-26T10:30:00.000Z"
}
```

### Recent-auth required

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "code": "RECENT_AUTH_REQUIRED",
  "message": "Recent authentication required",
  "path": "/api/v1/organizations/org_123/students/student_123/invite",
  "requestId": "uuid",
  "timestamp": "2026-05-26T10:30:00.000Z"
}
```

### Student/User identity conflict

```json
{
  "code": "STUDENT_USER_IDENTITY_CONFLICT",
  "message": "A student and user/membership with this email already exist in this organization and are not linked.",
  "existingStudentId": "string | null",
  "existingUserId": "string | null",
  "existingMembershipId": "string | null",
  "suggestedAction": "INVITE_STUDENT_CLAIM | CREATE_STUDENT_WITH_EXISTING_USER | LINK_STUDENT_TO_USER | CONTACT_ADMIN"
}
```

This conflict is organization-scoped. Email is only a conflict signal; it is
not enough to autolink identities. Existing students without accounts use
student account claim, existing members who need student life use explicit
student creation with `userId`, and unresolved mismatches stay blocked for
administrative resolution.

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
  - `QR_CHECKIN`: **official student attendance.** The student scans an instructor-issued QR token. Records proof-of-presence. Endpoints: `POST /students/me/check-ins/qr` (recommended, branchless) and `POST .../attendance/qr-check-in` (legacy, session-scoped).
  - `SELF_CHECKIN`: **DEPRECATED / legacy.** Trust-based self-declared attendance with no proof of presence. Not exposed in the Android Student Home nor the web frontend. Endpoint `POST .../attendance/self-check-in` is retained only for backward compatibility.
  - `STAFF_MANUAL`: staff/instructor records attendance for one or more students via `POST .../attendance` (roles STAFF/INSTRUCTOR/HEAD_COACH/ACADEMY_MANAGER/ORG_ADMIN/MESTRE). Not a student action.
  - `KIOSK_CHECKIN`: staff/kiosk actor checks in a specific student via `POST .../attendance/kiosk-check-in` (passes `studentId`). Not a student action.
  - `AttendanceIntent` (separate from records): a student's non-binding "planning to attend" signal (`PUT/GET/DELETE .../attendance/intent`). It is not an attendance record and feeds `enrolledCount`.
  - `AttendanceSuggestion` (separate from records and intents): a staff-authored recommendation for a student to consider attending one class session (`POST .../attendance/suggestions`). It notifies the student but does not mark real attendance and does not feed `enrolledCount`.
- `AttendanceIntentStatus`: `ACTIVE`, `CANCELED`
- `AttendanceSuggestionTargetType`: `CLASS_SESSION`
- `AttendanceSuggestionStatus`: `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELED`, `EXPIRED`
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

- `NotificationType`: `ANNOUNCEMENT_PUBLISHED`, `INVITATION_ACCEPTED`, `ACADEMY_INTAKE_REQUEST_CREATED`, `INSTITUTIONAL_REQUEST_ACTION_REQUIRED`, `INSTITUTIONAL_REQUEST_ASSIGNED`, `INSTITUTIONAL_REQUEST_CLOSED`, `INSTITUTIONAL_REQUEST_REMINDER`, `INSTITUTIONAL_REQUEST_ESCALATED`, `ATTENDANCE_FOLLOW_UP_ASSIGNED`, `ATTENDANCE_SUGGESTION`, `TRAINING_NOTE_VISIBLE`, `TRAINING_NOTE_COACH_REVIEW`, `NEW_CLASS_SESSION_CREATED`, `CLASS_SESSION_UPDATED`, `CLASS_SESSION_CANCELED`, `CLASS_SESSION_NOTE_PUBLISHED`, `CLASS_STARTING_SOON`, `BILLING_CHARGE_CREATED`, `BILLING_CHARGE_DUE_SOON`, `BILLING_CHARGE_OVERDUE`, `BILLING_PAYMENT_CONFIRMED`
- `NotificationResourceType`: `ANNOUNCEMENT`, `MEMBERSHIP`, `ACADEMY_INTAKE_REQUEST`, `INSTITUTIONAL_MESSAGE`, `ATTENDANCE_FOLLOW_UP`, `ATTENDANCE_SUGGESTION`, `TRAINING_NOTE`, `CLASS_SESSION`, `BILLING_CHARGE`, `PAYMENT_RECORD`
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
