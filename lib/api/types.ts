/**
 * KURO API — TypeScript types
 * Generados desde las respuestas reales del backend bjj-ops-api
 */

// ── Shared ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export type NotificationItem = {
  id: string
  type: string
  resourceType: string
  resourceId: string
  payload: Record<string, unknown>
  createdAt: string
  readAt: string | null
}

export type NotificationsListResponse = {
  items: NotificationItem[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export type UnreadNotificationsCountResponse = {
  unreadCount: number
}

/**
 * Track de promoción — fuente única de verdad del backend.
 * NOTE: MASTER no es un track válido aquí; las age divisions
 * (MASTER_1..MASTER_7, JUVENILE_1/2) viven en un catálogo separado.
 */
export type PromotionTrack = 'KIDS' | 'ADULT'

/**
 * PromotionRank — 18 valores REALES del backend (13 KIDS + 5 ADULT).
 * Catálogo público en GET /catalogs/promotion-ranks.
 * NO parsear los strings; usar `PromotionRankCatalogEntry` para metadata visual.
 */
export type PromotionRank =
  | 'KIDS_WHITE' | 'KIDS_GREY_WHITE' | 'KIDS_GREY' | 'KIDS_GREY_BLACK'
  | 'KIDS_YELLOW_WHITE' | 'KIDS_YELLOW' | 'KIDS_YELLOW_BLACK'
  | 'KIDS_ORANGE_WHITE' | 'KIDS_ORANGE' | 'KIDS_ORANGE_BLACK'
  | 'KIDS_GREEN_WHITE' | 'KIDS_GREEN' | 'KIDS_GREEN_BLACK'
  | 'ADULT_WHITE' | 'ADULT_BLUE' | 'ADULT_PURPLE' | 'ADULT_BROWN' | 'ADULT_BLACK'

export interface PromotionRankCatalogEntry {
  rank: PromotionRank
  label: string
  track: PromotionTrack
  maxStripes: number
  order: number
}
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type AttentionCategory = 'IMMEDIATE' | 'MONITOR' | 'WATCH'
export type IntakeStatus =
  | 'NEW' | 'REVIEWING' | 'CONTACTED'
  | 'VISIT_PROPOSED' | 'VISIT_SCHEDULED' | 'VISIT_COMPLETED'
  | 'NO_SHOW' | 'DECLINED_BY_PROSPECT' | 'REJECTED_BY_ACADEMY'
  | 'READY_TO_CONVERT' | 'CONVERTED' | 'CANCELLED'
export type CalendarItemType = 'CLASS_SESSION' | 'ACADEMY_EVENT'
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
// El backend devuelve ORGANIZATION_WIDE o SELECTED_BRANCHES (ver
// API-CONTRACT.md). BRANCH_SCOPED se mantiene por compatibilidad con
// código previo; toda la lógica trata "no ORGANIZATION_WIDE" como
// branch-scoped, así que es resiliente a las tres variantes.
export type ScopeType =
  | 'ORGANIZATION_WIDE'
  | 'SELECTED_BRANCHES'
  | 'BRANCH_SCOPED'

// ── Auth ─────────────────────────────────────────────────────

export interface AuthPrincipalUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  /** Presente en /auth/me; ausente en el principal de /auth/login. */
  status?: string
}

export interface AuthPrincipalMembership {
  id: string
  organizationId: string
  organizationSlug: string
  organizationName: string
  assignedRoles: string[]
  scopeType: ScopeType
  branchIds: string[]
  primaryBranchId: string | null
}

/**
 * Principal canónico — shape compartido por el `principal` de /auth/login
 * y el body de /auth/me. `membership` es null para usuarios PUBLIC sin
 * membresía de tenant activa.
 */
export interface AuthPrincipal {
  authContext?: string
  user: AuthPrincipalUser
  membership: AuthPrincipalMembership | null
}

/** Body de GET /auth/me — es el principal directo (sin envoltura). */
export type MeResponse = AuthPrincipal

export interface LoginResponse {
  accessToken: string
  principal: AuthPrincipal
}

// ── Capabilities ─────────────────────────────────────────────

export interface EffectiveBranch {
  branchId: string
  branchName: string
  effectiveRoles: string[]
  isHeadCoach: boolean
  canTeach: boolean
  canManageBranch: boolean
}

export interface CapabilitiesResponse {
  organizationId: string
  userId: string
  membershipId: string
  organization: { id: string; name: string; slug: string }
  user: { id: string; email: string; firstName: string; lastName: string }
  assignedRoles: string[]
  scopeType: string
  primaryBranchId: string | null
  selectedBranchIds: string[]
  effectiveBranches: EffectiveBranch[]
  capabilities: Record<string, Record<string, boolean>>
  limits: {
    dynamicPermissions: boolean
    customRoles: boolean
    sensitiveActionsMayRequireRecentAuth: boolean
    notes: string[]
  }
}

// ── Current Membership Visible Profile ───────────────────────

export type CurrentMembershipVisibleProfile = {
  organizationId: string
  membershipId: string
  userId: string
  displayName: string
  firstName: string | null
  lastName: string | null
  email: string | null
  avatarUrl: string | null
  roleLabel: string | null
}

export type AvatarResponseDto = {
  avatarUrl: string | null
}

// ── Branch ───────────────────────────────────────────────────

export interface BranchPublicSurface {
  isPublicListed: boolean
  isPublished: boolean
  publicSlug: string
  profile: Record<string, unknown>
}

export interface BranchAttention {
  needsReview: boolean
  flags: string[]
}

export interface Branch {
  id: string
  organizationId: string
  parentBranchId: string | null
  name: string
  slug: string
  city: string
  countryCode: string
  timezone: string
  status: BranchStatus
  isHeadquarter: boolean
  isPublicListed: boolean
  headCoachMembership: unknown | null
  publicProfile: Record<string, unknown>
  parentBranch: Branch | null
  ancestors: Branch[]
  children: Branch[]
  identity: Record<string, unknown>
  operational: Record<string, unknown>
  publicSurface: BranchPublicSurface
  hierarchy: Record<string, unknown>
  privateAdmin: Record<string, unknown>
  attention: BranchAttention
  governance: Record<string, unknown>
  lifecycle: Record<string, unknown>
}

// ── Analytics — Tree Summary ──────────────────────────────────

export interface TreeSummaryBranchNode {
  id: string
  name: string
  slug?: string
  city?: string
  status?: BranchStatus
  isHeadquarter?: boolean
  parentBranchId?: string | null
  population?: Partial<BranchPopulation>
  classes?: { todayCount?: number }
  requests?: { pendingIntake?: number; pendingClaims?: number }
  attention?: BranchAttention
}

export interface BranchTreeSummaryTotals {
  branches?: number
  activeStudents?: number
  classesToday?: number
  pendingIntake?: number
}

export interface BranchTreeSummary {
  branches: TreeSummaryBranchNode[]
  totals?: BranchTreeSummaryTotals
}

// ── Analytics — Action Summary ────────────────────────────────

export interface BranchPopulation {
  studentsTotal: number
  activeStudentsTotal: number
  inactiveStudentsTotal: number
  activeRate: number
}

export interface BranchAttendanceSummary {
  scheduledInstructors?: number
  expectedAttendance?: number
  checkedInTotal?: number
  classesTodayCount?: number
  upcomingSessions?: number
  [key: string]: unknown
}

export interface BranchRequestsSummary {
  pendingIntake?: number
  pendingClaims?: number
  pendingInvites?: number
  pipeline?: Array<{ stage: IntakeStatus | string; count: number }>
  [key: string]: unknown
}

export interface BranchActionSummary {
  branch: {
    id: string
    organizationId: string
    parentBranchId: string | null
    isHeadquarter: boolean
    name: string
    slug: string
    city: string
    status: BranchStatus
  }
  activityWindowDays: number
  health: Record<string, unknown>
  population: BranchPopulation
  technical: Record<string, unknown>
  attendance: BranchAttendanceSummary
  followUp: Record<string, unknown>
  requests: BranchRequestsSummary
  promotions: Record<string, unknown>
  classes: {
    strongest: unknown[]
    weakest: unknown[]
    todayCount?: number
  }
  governance: Record<string, unknown>
  riskBuckets: Record<string, unknown>
  priorityStudents: unknown[]
  riskRosterPreview: unknown[]
  recommendedActions: unknown[]
}

// ── Analytics — Risk Roster ───────────────────────────────────

export interface RiskMetrics {
  daysSinceLastAttendance: number
  lastAttendanceAt: string | null
  consistencyRate: number
  attendanceDropRatio: number
  presentOrLateCurrentWindow: number
  activeIntentsCurrentWindow: number
  noShowCurrentWindow: number
}

export interface RiskItem {
  rank: number
  studentId: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  riskLevel: RiskLevel
  attentionCategory: AttentionCategory
  riskScore: number
  riskFlags: string[]
  attentionReasons: string[]
  recommendedAction: string
  metrics: RiskMetrics
  financialContext: Record<string, unknown>
  followUp: {
    queueStatus: string
    isAssigned: boolean
    reopened: boolean
    responsibleMembershipId: string | null
    lastActionNote: string | null
  }
  derivedSignals: {
    prolongedAbsence: boolean
    lowConsistency: boolean
    [key: string]: boolean
  }
}

export interface RiskRosterSummary {
  trackedStudentsTotal: number
  atRiskStudentsTotal: number
  highRiskStudentsTotal: number
  buckets: Record<string, unknown>
}

export interface RiskRoster {
  branch: {
    id: string
    organizationId: string
    name: string
    slug: string
    city: string
    status: BranchStatus
  }
  activityWindowDays: number
  limit: number
  items: RiskItem[]
  summary: RiskRosterSummary
}

// ── Training Calendar ─────────────────────────────────────────

export interface CalendarItemBranch {
  id: string
  name: string
  slug: string
  timezone: string
}

export interface CalendarClassSession {
  id: string
  classScheduleId: string
  classType: string
  capacity: number
  cancellationReason: string | null
}

export interface CalendarInstructor {
  id?: string
  membershipId?: string
  userId?: string
  firstName?: string
  lastName?: string
  fullName?: string
  displayName?: string
  avatarUrl?: string | null
}

export interface CalendarItem {
  id: string
  type: CalendarItemType
  title: string
  description: string | null
  branch: CalendarItemBranch
  instructor: CalendarInstructor | null
  classSession: CalendarClassSession | null
  startAt: string
  endAt: string
  scheduledDate: string
  status: SessionStatus
  category: string
  tags: string[]
  color: string
  attendanceSummary: Record<string, unknown>
  userAttendanceIntent: unknown | null
  userAttendanceRecord: unknown | null
  capabilities: Record<string, unknown>
  links: Record<string, unknown>
}

export interface TrainingCalendarResponse {
  organizationId: string
  view: string
  range: { from: string; to: string }
  context: string
  student: unknown | null
  items: CalendarItem[]
  days: unknown[]
}

// ── Class Schedules & Sessions ────────────────────────────────

/**
 * Enums REALES del backend (sección 9 del contract):
 *  - status del ClassSession: SCHEDULED | COMPLETED | CANCELED
 *    (NO existe IN_PROGRESS, NO es CANCELLED con doble L)
 *  - classType: enum compartido por schedule y session
 */
export type ClassSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED'

export type ClassType =
  | 'GI'
  | 'NO_GI'
  | 'FUNDAMENTALS'
  | 'ADVANCED'
  | 'KIDS'
  | 'COMPETITION'
  | 'OPEN_MAT'
  | 'SEMINAR'
  | 'PRIVATE'

export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

// ── ClassSchedule (template recurrente que genera ClassSessions) ──

export interface ClassScheduleInstructorMembership {
  id: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }
}

export interface ClassSchedule {
  id: string
  organizationId: string
  branchId: string
  instructorMembershipId: string | null
  title: string
  classType: ClassType | string
  description: string | null
  weekday: Weekday
  startTime: string // 'HH:MM:SS'
  endTime: string
  timezone: string
  capacity: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  instructorMembership?: ClassScheduleInstructorMembership | null
}

// ── ClassSessionDetail (GET /class-sessions/:sessionId) ──

export interface ClassSessionBranchRef {
  id: string
  name: string
  slug: string
  timezone: string
}

export interface ClassSessionInstructor {
  id: string
  membershipId: string
  userId: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  role: string
  /**
   * Catálogo rico de promotion rank o null si el instructor no tiene
   * rank asignado. El backend ya resuelve el lookup contra
   * /catalogs/promotion-ranks; la UI no debe parsear strings.
   */
  primaryBelt: PromotionRankCatalogEntry | null
}

export interface ClassSessionCapacity {
  max: number
  enrolled: number
  /** Siempre 0 por ahora — el backend no tiene dominio de waitlist. */
  waitlist: number
}

export interface ClassSessionAttendanceCounts {
  expected: number
  present: number
  absent: number
  excused: number
  late: number
}

export interface ClassSessionDetail {
  id: string
  organizationId: string
  branchId: string
  classScheduleId: string | null
  title: string
  description: string | null
  notes: string | null
  classType: ClassType | string
  status: ClassSessionStatus
  startAt: string
  endAt: string
  scheduledDate: string
  branch: ClassSessionBranchRef
  instructor: ClassSessionInstructor | null
  capacity: ClassSessionCapacity
  attendance: ClassSessionAttendanceCounts
  /**
   * Resumen inline de attendance suggestions de esta sesión (API-CONTRACT
   * §"Get class session" → `suggestions`). Es solo un summary: para la lista
   * completa usar el endpoint dedicado (`GET .../attendance/suggestions`).
   */
  suggestions: AttendanceSuggestionSummary
  cancellationReason: string | null
  cancelledAt: string | null
  cancelledByMembershipId: string | null
  createdAt: string
  updatedAt: string
}

// ── ClassSessionListItem (GET .../class-sessions list) ──
//
// El list endpoint retorna un superset reducido del detail. El contract
// describe el shape como "items: [...]" sin detallar — declaramos como
// un subset estable que cubre los campos que la UI consume hoy desde
// las listas (mini-cards en agenda, vistas LIST del calendar, etc.).
// Cualquier campo extra que el backend agregue queda accesible por
// indexación `unknown` segura.

export interface ClassSessionListItem {
  id: string
  organizationId: string
  branchId: string
  classScheduleId: string | null
  title: string
  classType: ClassType | string
  status: ClassSessionStatus
  startAt: string
  endAt: string
  scheduledDate: string
  capacity?: {
    max: number
    enrolled: number
  }
  // Shape canónico confirmado por el backend (class-calendar). `displayName`
  // es el nombre listo para mostrar; firstName/lastName quedan para fallback.
  instructor?: {
    membershipId?: string
    userId?: string
    firstName?: string
    lastName?: string
    displayName?: string
    avatarUrl?: string | null
  } | null
  cancellationReason?: string | null
}

// ── Class calendar (GET .../class-calendar) ──

export interface ClassCalendarDay {
  date: string // YYYY-MM-DD
  items: ClassSessionListItem[]
}

export interface ClassCalendarResponse {
  view: 'DAY' | 'WEEK' | 'MONTH' | 'LIST'
  startDate: string
  endDate: string
  /**
   * Lista plana y cronológica de todas las sesiones del rango. El backend
   * la devuelve para todas las views (es la fuente canónica para LIST).
   * Opcional por compatibilidad: si falta, derivar de `days[].items`.
   */
  items?: ClassSessionListItem[]
  /** Agrupación por día — se mantiene para vistas DAY/WEEK/MONTH. */
  days: ClassCalendarDay[]
}

// ── Class session gaps (GET .../class-session-gaps) ──

export interface ClassSessionGapsSummary {
  activeSchedules: number
  materializedSessions: number
  missingSessions: number
}

export interface ClassSessionGapDay {
  date: string
  missing: Array<Record<string, unknown>>
}

export interface ClassSessionGap {
  fromDate: string
  toDate: string
  summary: ClassSessionGapsSummary
  days: ClassSessionGapDay[]
}

/**
 * Alias retro-compatible — el código previo usaba `ClassSession`
 * para el shape del detalle. Se mantiene exportado para que los
 * imports existentes sigan compilando, pero el nombre canónico nuevo
 * es `ClassSessionDetail`.
 */
export type ClassSession = ClassSessionDetail

// ── Attendance ────────────────────────────────────────────────

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'

export type AttendanceSource =
  | 'STAFF_MANUAL'
  | 'SELF_CHECKIN'
  | 'QR_CHECKIN'
  | 'KIOSK_CHECKIN'

export interface SessionAttendanceCounts {
  PRESENT: number
  LATE: number
  ABSENT: number
  EXCUSED: number
}

export interface SessionAttendanceBySource {
  STAFF_MANUAL: number
  SELF_CHECKIN: number
  QR_CHECKIN: number
  KIOSK_CHECKIN: number
}

export interface SessionAttendanceSummary {
  total: number
  counts: SessionAttendanceCounts
  bySource: SessionAttendanceBySource
  intentsTotal: number
}

export interface AttendanceRecord {
  recordId: string
  studentId: string
  status: AttendanceStatus
  reasonCode: string | null
  notes?: string | null
  source: AttendanceSource
  updatedAt: string
}

export interface AttendanceIntent {
  intentId: string
  studentId: string
  status: string
  updatedAt: string
}

export interface SessionAttendance {
  items: AttendanceRecord[]
  intents: AttendanceIntent[]
  summary: SessionAttendanceSummary
  behavior: Record<string, unknown>
}

// ── Session Technical Roster ──────────────────────────────────

export interface TechnicalRosterStudent {
  id: string
  primaryBranchId: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  status: StudentStatus
  currentBelt: PromotionRank
  currentStripes: number
}

export interface TechnicalRosterAttendance {
  recordId: string
  status: AttendanceStatus
  reasonCode: string | null
  notes?: string | null
  source: AttendanceSource
  updatedAt: string
}

export interface TechnicalRosterIntent {
  intentId: string
  status: string
  updatedAt: string
}

export interface TechnicalRosterItem {
  studentId: string
  student: TechnicalRosterStudent
  attendance: TechnicalRosterAttendance | null
  intent: TechnicalRosterIntent | null
}

export interface SessionTechnicalRoster {
  items: TechnicalRosterItem[]
  summary: {
    total: number
    withAttendanceRecord: number
    withIntent: number
  }
}

// ── Attendance — inputs (mutations Fase 2.2.4) ─────────────────

export type AttendanceReasonCode =
  | 'INJURY'
  | 'TRAVEL'
  | 'SCHEDULE_CONFLICT'
  | 'TEMPORARY_SUSPENSION'
  | 'VALID_VISIT'
  | 'OPERATIONAL_ERROR'
  | 'OTHER'

export type AttendanceCorrectionReasonCode =
  | 'STATUS_CORRECTION'
  | 'DUPLICATE_CHECKIN'
  | 'WRONG_STUDENT'
  | 'LATE_CONFIRMATION'
  | 'VISIT_VERIFIED'
  | 'MANUAL_OVERRIDE'
  | 'OTHER'

export interface AttendanceRecordInput {
  studentId: string
  status: AttendanceStatus
  reasonCode?: AttendanceReasonCode
  notes?: string
}

export interface RecordAttendanceBody {
  records: AttendanceRecordInput[]
}

export interface UpdateAttendanceBody {
  status?: AttendanceStatus
  reasonCode?: AttendanceReasonCode
  correctionReasonCode?: AttendanceCorrectionReasonCode
  notes?: string
  correctionNote?: string
}

/**
 * Código estructurado de los 409 de ventana de asistencia del backend
 * (API-CONTRACT §10 Attendance):
 *  - `ATTENDANCE_OUTSIDE_WINDOW`: staff intenta registrar asistencia
 *    (`POST .../attendance`) fuera de la ventana operativa STAFF_MANUAL.
 *  - `ATTENDANCE_CORRECTION_WINDOW_CLOSED`: corrección/borrado
 *    (`PATCH`/`DELETE .../attendance/:studentId`) después de cerrada la
 *    ventana de corrección. Liderazgo/admin conservan una ventana extendida.
 *
 * `windowStart`/`windowEnd` son ISO-8601 UTC; el formateo a hora local se
 * hace en el UI vía `useFormatter()`.
 */
export type AttendanceWindowErrorCode =
  | 'ATTENDANCE_OUTSIDE_WINDOW'
  | 'ATTENDANCE_CORRECTION_WINDOW_CLOSED'

export interface AttendanceWindowError {
  code: AttendanceWindowErrorCode
  message: string
  windowStart: string
  windowEnd: string
}

// ── QR check-in token (POST .../attendance/qr-token) ───────────

export interface IssueQRTokenBody {
  /**
   * (Legacy/opcional) TTL hint en minutos, rango 1–15. El backend YA NO lo
   * necesita: la ventana operativa se deriva de `validFrom`/`validUntil`. No
   * enviarlo — si se manda > 15 el backend responde `QR_TOKEN_EXPIRATION_TOO_LONG`.
   */
  expiresInMinutes?: number
}

/**
 * Estado de la ventana operativa del QR en el momento de emisión:
 * - `SCHEDULED`: `now < validFrom` (token generado pero ventana no abierta).
 * - `ACTIVE`: `validFrom <= now <= validUntil` (alumnos ya pueden hacer check-in).
 */
export type QRCurrentStatus = 'SCHEDULED' | 'ACTIVE'

/**
 * Token QR emitido por el instructor/staff. El alumno lo escanea desde la app
 * y el backend registra asistencia con source `QR_CHECKIN`. `token` es el valor
 * crudo a renderizar en el código; nunca se persiste en el cliente.
 */
export interface QRTokenResponse {
  id: string
  organizationId: string
  branchId: string
  classSessionId: string
  mode: 'QR'
  issuedByMembershipId: string
  expiresAt: string
  revokedAt: string | null
  createdAt: string
  token: string
  /** Payload crudo del QR (no loguear, no persistir, no exponer en analytics). */
  qrCodeData: string
  /** Inicio de la ventana operativa (45 min antes del inicio de la clase). */
  validFrom: string
  /** Fin de la ventana operativa (30 min después del fin de la clase). */
  validUntil: string
  /** Estado de la ventana al emitir (SCHEDULED | ACTIVE). */
  currentStatus: QRCurrentStatus
  /** TTL efectivo en minutos hasta `expiresAt`, calculado por el backend. */
  expiresInMinutes: number
}

// ── Attendance suggestions (POST .../attendance/suggestions) ───
//
// Recomendación de asistencia hecha por staff. NO es asistencia real, ni
// intent, ni QR check-in, ni enrollment: solo notifica al alumno para que
// decida confirmar por su cuenta (API-CONTRACT §"Create class-session
// attendance suggestions"). No crea AttendanceRecord/AttendanceIntent ni
// incrementa enrolledCount.

export interface SuggestAttendanceBody {
  /** 1..300 ids únicos. */
  studentIds: string[]
  /** Opcional, max 280 chars (trim del backend). */
  message?: string
}

// Enum canónico del backend (API-CONTRACT §"Enums" → AttendanceSuggestionStatus).
// PENDING (enviada) · ACCEPTED (alumno aceptó) · DECLINED (alumno rechazó) ·
// CANCELED (operador canceló) · EXPIRED (venció).
export type AttendanceSuggestionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CANCELED'
  | 'EXPIRED'

/** Motivo por el que un alumno no pudo ser sugerido. */
export type AttendanceSuggestionInvalidReason =
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'NO_BRANCH_ACCESS'
  | 'NO_ACTIVE_RECIPIENT_MEMBERSHIP'

export interface SuggestAttendanceItem {
  studentId: string
  suggestionId: string
  status: AttendanceSuggestionStatus
  notificationId: string
  /** false si ya existía una sugerencia PENDING (deduplicada). */
  created: boolean
}

export interface SuggestAttendanceInvalidStudent {
  studentId: string
  reason: AttendanceSuggestionInvalidReason | string
}

export interface SuggestAttendanceResponse {
  classSessionId: string
  created: number
  skipped: number
  alreadySuggested: number
  invalidStudents: SuggestAttendanceInvalidStudent[]
  items: SuggestAttendanceItem[]
}

/**
 * Resumen de suggestions de una sesión. Viene inline en el detail
 * (`ClassSessionDetail.suggestions`) y también como `summary` en el response
 * del listado dedicado (GET .../attendance/suggestions).
 */
export interface AttendanceSuggestionSummary {
  total: number
  pending: number
  accepted: number
  declined: number
  canceled: number
}

/** Alumno embebido en cada suggestion del listado. */
export interface AttendanceSuggestionStudent {
  id: string
  primaryBranchId: string | null
  firstName: string
  lastName: string
  avatarUrl?: string | null
  email: string | null
  phone: string | null
  status: string
  currentBelt: PromotionRank | string | null
  currentStripes: number | null
}

/**
 * Suggestion completa (GET .../attendance/suggestions → items[]).
 * Source of truth: API-CONTRACT §"List class-session attendance suggestions".
 */
export interface AttendanceSuggestionListItem {
  id: string
  organizationId: string
  branchId: string
  targetType: string
  classSessionId: string
  studentId: string
  suggestedByMembershipId: string
  status: AttendanceSuggestionStatus
  message: string | null
  notificationId: string | null
  respondedAt: string | null
  canceledAt: string | null
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  student: AttendanceSuggestionStudent
}

/** Response del listado dedicado de suggestions. */
export interface SuggestionsListResponse {
  classSessionId: string
  summary: AttendanceSuggestionSummary
  items: AttendanceSuggestionListItem[]
}

/** Response del cancel de una suggestion (POST .../suggestions/:id/cancel). */
export interface CancelSuggestionResponse {
  id: string
  status: AttendanceSuggestionStatus
  canceledAt: string | null
}

// ── Instructor candidates (GET .../instructors/candidates) ─────

export interface InstructorCandidate {
  membershipId: string
  userId: string
  displayName: string
  avatarUrl?: string | null
  roles: string[]
  scopeType?: string
  branchAccess?: {
    branchId: string
    primaryBranchId: string | null
    branchIds: string[]
  }
  isEffectiveHeadCoachForBranch?: boolean
  canBeAssignedAsInstructor: boolean
  upcomingAssignedSessionCount?: number
  status?: string
  user?: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }
  effectiveRoles?: string[]
}

export interface InstructorCandidatesResponse {
  items: InstructorCandidate[]
  meta: { total: number }
}

// ── Intake ────────────────────────────────────────────────────

export interface IntakeRequest {
  id: string
  organizationId: string
  branchId: string
  requesterUserId: string | null
  fullName: string
  email: string
  phone: string | null
  message: string | null
  notes?: string | null
  experienceLevel: string | null
  requestType: string
  status: IntakeStatus
  preferredStartAt: string | null
  preferredEndAt: string | null
  proposedStartAt: string | null
  proposedEndAt: string | null
  proposedByMembershipId?: string | null
  assignedToMembershipId: string | null
  decisionByMembershipId?: string | null
  decisionAt?: string | null
  decisionReason?: string | null
  convertedStudentId: string | null
  convertedMembershipId?: string | null
  source: string
  consentToContact: boolean
  consentAt: string
  createdAt: string
  updatedAt: string
  branch: Record<string, unknown>
}

export type IntakeRequestDetail = IntakeRequest

export type IntakeTransitionBody = {
  status: IntakeStatus
  proposedStartAt?: string | null
  proposedEndAt?: string | null
  decisionReason?: string | null
  assignedToMembershipId?: string | null
}

// ── Students ──────────────────────────────────────────────────

export interface StudentListItem {
  id: string
  organizationId: string
  primaryBranchId: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  email: string
  phone: string
  status: StudentStatus
  promotionTrack: PromotionTrack
  currentBelt: PromotionRank
  currentStripes: number
  createdAt: string
  updatedAt: string
}

export interface StudentDetail extends StudentListItem {
  userId: string | null
  dateOfBirth: string | null
  startedBjjAt: string | null
  joinedOrganizationAt: string | null
  technicalNotes: string | null
  parentTutorName: string | null
  parentTutorPhone: string | null
  parentTutorRelation: string | null
  primaryBranch: Record<string, unknown>
  branchAssignments: unknown[]
  branchVisits: unknown[]
  activeBranchVisits: unknown[]
  promotionCertificates: unknown[]
}
