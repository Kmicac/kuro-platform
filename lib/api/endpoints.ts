/**
 * KURO API — Endpoints tipados
 * Usar junto con lib/api/client.ts (api.get/post/patch/delete)
 */

import { api } from './client'
import type {
  Branch,
  BranchActionSummary,
  BranchTreeSummary,
  ClassCalendarResponse,
  ClassSchedule,
  ClassSessionDetail,
  ClassSessionGap,
  ClassSessionListItem,
  ClassSessionStatus,
  ClassType,
  InstructorCandidatesResponse,
  IssueQRTokenBody,
  NotificationsListResponse,
  PromotionRankCatalogEntry,
  QRTokenResponse,
  RecordAttendanceBody,
  SuggestAttendanceBody,
  SuggestAttendanceResponse,
  SuggestionsListResponse,
  CancelSuggestionResponse,
  UnreadNotificationsCountResponse,
  RiskRoster,
  SessionAttendance,
  SessionTechnicalRoster,
  UpdateAttendanceBody,
  TrainingCalendarResponse,
  AvatarResponseDto,
  CapabilitiesResponse,
  CurrentMembershipVisibleProfile,
  IntakeConvertBody,
  IntakeConvertResponse,
  PaginatedResponse,
  IntakeRequest,
  IntakeRequestDetail,
  IntakeTransitionBody,
  StudentListItem,
  StudentDetail,
  StudentAccountInviteResponse,
  Weekday,
} from './types'
import type {
  BillingPlanResponse,
  BillingChargeListQuery,
  BillingChargesResponse,
  BranchBillingSummaryQuery,
  BranchBillingSummaryResponse,
  BranchStudentFinancialStatusesQuery,
  BranchStudentFinancialStatusesResponse,
  CreateBillingChargeRequest,
  CreateBillingPlanRequest,
  CreatePaymentIntegrationRequest,
  CreateStudentMembershipRequest,
  CreatedBillingChargeResponse,
  ManualStudentPaymentResponse,
  GeneralIncomeResponse,
  IntegrationWebhookEventDetailResponse,
  IntegrationWebhookEventsQuery,
  IntegrationWebhookEventsResponse,
  MercadoPagoPreferenceResponse,
  PaymentListQuery,
  PaymentIntegrationsQuery,
  PaymentIntegrationsResponse,
  PaymentIntegrationResponse,
  PaymentsResponse,
  PossibleDuplicatePaymentsQuery,
  PossibleDuplicatePaymentsResponse,
  RecordManualStudentPaymentRequest,
  RecordGeneralIncomeRequest,
  ReprocessWebhookEventResponse,
  StudentMembershipResponse,
  StudentPaymentsQuery,
  StudentBillingChargesQuery,
  SyncPaymentIntegrationRequest,
  SyncPaymentIntegrationResponse,
  TestPaymentIntegrationResponse,
  UpdatePaymentIntegrationRequest,
  UpdateStudentMembershipRequest,
  UpdateBillingPlanRequest,
} from './billing.types'

// ── Public catalogs (sin tenant scope) ───────────────────────

export const catalogsApi = {
  /** GET /catalogs/promotion-ranks — público, cacheable indefinidamente */
  promotionRanks: () =>
    api.get<PromotionRankCatalogEntry[]>('/catalogs/promotion-ranks'),
}

// ── Organizations ────────────────────────────────────────────

export const organizationsApi = {
  get: (orgId: string) =>
    api.get<{
      id: string
      name: string
      slug: string
      status: string
      description: string | null
      timezone: string | null
      countryCode: string | null
    }>(`/organizations/${orgId}`),
}

// ── Capabilities ─────────────────────────────────────────────

export const capabilitiesApi = {
  get: (orgId: string) =>
    api.get<CapabilitiesResponse>(`/organizations/${orgId}/me/capabilities`),
}

export const currentMembershipVisibleProfileApi = {
  get: (orgId: string) =>
    api.getNullable<CurrentMembershipVisibleProfile>(
      `/organizations/${orgId}/me/profile`
    ),
}

// ── Notifications ─────────────────────────────────────────────

export const notificationsApi = {
  list: (
    orgId: string,
    params?: {
      page?: number
      limit?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.page) p.set('page', String(params.page))
    if (params?.limit) p.set('limit', String(params.limit))
    const q = p.toString() ? `?${p}` : ''
    return api.get<NotificationsListResponse>(
      `/organizations/${orgId}/notifications${q}`
    )
  },

  getUnreadCount: (orgId: string) =>
    api.get<UnreadNotificationsCountResponse>(
      `/organizations/${orgId}/notifications/unread-count`
    ),

  markRead: (orgId: string, notificationId: string) =>
    api.post<void>(
      `/organizations/${orgId}/notifications/${notificationId}/read`
    ),

  markManyRead: (orgId: string, notificationIds: string[]) =>
    api.post<void>(`/organizations/${orgId}/notifications/read`, {
      notificationIds,
    }),

  markAllRead: (orgId: string) =>
    api.post<void>(`/organizations/${orgId}/notifications/read-all`),
}

export function uploadMyAvatar(
  organizationId: string,
  file: File,
): Promise<AvatarResponseDto> {
  const body = new FormData()
  body.append('file', file)
  return api.postForm<AvatarResponseDto>(
    `/organizations/${organizationId}/me/avatar`,
    body,
  )
}

export function deleteMyAvatar(
  organizationId: string,
): Promise<AvatarResponseDto> {
  return api.delete<AvatarResponseDto>(
    `/organizations/${organizationId}/me/avatar`
  )
}

// ── Branches ─────────────────────────────────────────────────

export const branchesApi = {
  /**
   * Lista de filiales — normaliza varios envelopes posibles del backend:
   *   - Branch[]                  → array directo
   *   - { items: Branch[] }       → paginated envelope
   *   - { branches: Branch[] }    → resource envelope
   *   - { data: Branch[] }        → genérico
   */
  list: async (orgId: string): Promise<Branch[]> => {
    const raw = await api.get<unknown>(`/organizations/${orgId}/branches`)
    if (Array.isArray(raw)) return raw as Branch[]
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      if (Array.isArray(obj.items)) return obj.items as Branch[]
      if (Array.isArray(obj.branches)) return obj.branches as Branch[]
      if (Array.isArray(obj.data)) return obj.data as Branch[]
    }
    return []
  },

  tree: (orgId: string) =>
    api.get<unknown>(`/organizations/${orgId}/branches/tree`),

  get: (orgId: string, branchId: string) =>
    api.get<Branch>(`/organizations/${orgId}/branches/${branchId}`),

  create: (orgId: string, body: {
    name: string
    slug: string
    city: string
    countryCode: string
    timezone?: string
    parentBranchId?: string
  }) =>
    api.post<Branch>(`/organizations/${orgId}/branches`, body),

  update: (orgId: string, branchId: string, body: Partial<{
    name: string
    city: string
    countryCode: string
    timezone: string
  }>) =>
    api.patch<Branch>(`/organizations/${orgId}/branches/${branchId}`, body),
}

// ── Analytics ─────────────────────────────────────────────────

export const analyticsApi = {
  treeSummary: (orgId: string, params?: { activityWindowDays?: number }) => {
    const q = params?.activityWindowDays
      ? `?activityWindowDays=${params.activityWindowDays}`
      : ''
    return api.get<BranchTreeSummary>(
      `/organizations/${orgId}/analytics/branches/tree-summary${q}`
    )
  },

  actionSummary: (
    orgId: string,
    branchId: string,
    params?: { activityWindowDays?: number }
  ) => {
    const q = params?.activityWindowDays
      ? `?activityWindowDays=${params.activityWindowDays}`
      : ''
    return api.get<BranchActionSummary>(
      `/organizations/${orgId}/analytics/branches/${branchId}/action-summary${q}`
    )
  },

  riskRoster: (
    orgId: string,
    branchId: string,
    params?: { activityWindowDays?: number; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.activityWindowDays)
      p.set('activityWindowDays', String(params.activityWindowDays))
    if (params?.limit) p.set('limit', String(params.limit))
    const q = p.toString() ? `?${p}` : ''
    return api.get<RiskRoster>(
      `/organizations/${orgId}/analytics/branches/${branchId}/risk-roster${q}`
    )
  },
}

// ── Billing ───────────────────────────────────────────────────

function billingQuery(
  params?: Record<string, string | number | boolean | undefined>
) {
  const p = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') p.set(key, String(value))
  })
  const q = p.toString()
  return q ? `?${q}` : ''
}

export const billingApi = {
  /**
   * GET /organizations/:orgId/branches/:branchId/billing-plans
   *
   * Response is a direct BillingPlanResponse[]; no pagination envelope.
   */
  plans: (orgId: string, branchId: string) =>
    api.get<BillingPlanResponse[]>(
      `/organizations/${orgId}/branches/${branchId}/billing-plans`
    ),

  createPlan: (
    orgId: string,
    branchId: string,
    body: CreateBillingPlanRequest
  ) =>
    api.post<BillingPlanResponse>(
      `/organizations/${orgId}/branches/${branchId}/billing-plans`,
      body
    ),

  updatePlan: (
    orgId: string,
    branchId: string,
    planId: string,
    body: UpdateBillingPlanRequest
  ) =>
    api.patch<BillingPlanResponse>(
      `/organizations/${orgId}/branches/${branchId}/billing-plans/${planId}`,
      body
    ),

  studentMembership: (orgId: string, studentId: string) =>
    api.getNullable<StudentMembershipResponse>(
      `/organizations/${orgId}/students/${studentId}/membership`
    ),

  createStudentMembership: (
    orgId: string,
    studentId: string,
    body: CreateStudentMembershipRequest
  ) =>
    api.post<StudentMembershipResponse>(
      `/organizations/${orgId}/students/${studentId}/membership`,
      body
    ),

  updateStudentMembership: (
    orgId: string,
    studentId: string,
    body: UpdateStudentMembershipRequest
  ) =>
    api.patch<StudentMembershipResponse>(
      `/organizations/${orgId}/students/${studentId}/membership`,
      body
    ),

  /**
   * GET /organizations/:orgId/branches/:branchId/billing-charges
   *
   * Uses dueDate ascending + createdAt descending by backend default.
   */
  branchCharges: (
    orgId: string,
    branchId: string,
    params?: BillingChargeListQuery
  ) => {
    const q = billingQuery({
      page: params?.page,
      limit: params?.limit,
      studentId: params?.studentId,
      billingPlanId: params?.billingPlanId,
      chargeType: params?.chargeType,
      status: params?.status,
      currency: params?.currency?.trim().toUpperCase(),
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    })
    return api.get<BillingChargesResponse>(
      `/organizations/${orgId}/branches/${branchId}/billing-charges${q}`
    )
  },

  /**
   * GET /organizations/:orgId/students/:studentId/billing-charges
   *
   * Same envelope and item shape as branchCharges. The backend ignores
   * query.studentId here; the path studentId is authoritative.
   */
  studentCharges: (
    orgId: string,
    studentId: string,
    params?: StudentBillingChargesQuery
  ) => {
    const q = billingQuery({
      page: params?.page,
      limit: params?.limit,
      billingPlanId: params?.billingPlanId,
      chargeType: params?.chargeType,
      status: params?.status,
      currency: params?.currency?.trim().toUpperCase(),
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    })
    return api.get<BillingChargesResponse>(
      `/organizations/${orgId}/students/${studentId}/billing-charges${q}`
    )
  },

  createCharge: (
    orgId: string,
    studentId: string,
    body: CreateBillingChargeRequest
  ) =>
    api.post<CreatedBillingChargeResponse>(
      `/organizations/${orgId}/students/${studentId}/billing-charges`,
      body
    ),

  recordManualStudentPayment: (
    orgId: string,
    studentId: string,
    body: RecordManualStudentPaymentRequest
  ) =>
    api.post<ManualStudentPaymentResponse>(
      `/organizations/${orgId}/students/${studentId}/payments/manual`,
      body
    ),

  branchPayments: (
    orgId: string,
    branchId: string,
    params?: PaymentListQuery
  ) => {
    const q = billingQuery({
      page: params?.page,
      limit: params?.limit,
      studentId: params?.studentId,
      method: params?.method,
      status: params?.status,
      paymentKind: params?.paymentKind,
      currency: params?.currency?.trim().toUpperCase(),
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    })
    return api.get<PaymentsResponse>(
      `/organizations/${orgId}/branches/${branchId}/payments${q}`
    )
  },

  studentPayments: (
    orgId: string,
    studentId: string,
    params?: StudentPaymentsQuery
  ) => {
    const q = billingQuery({
      page: params?.page,
      limit: params?.limit,
      method: params?.method,
      status: params?.status,
      currency: params?.currency?.trim().toUpperCase(),
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    })
    return api.get<PaymentsResponse>(
      `/organizations/${orgId}/students/${studentId}/payments${q}`
    )
  },

  possibleDuplicatePayments: (
    orgId: string,
    branchId: string,
    params?: PossibleDuplicatePaymentsQuery
  ) => {
    const q = billingQuery({
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      method: params?.method,
      status: params?.status,
      paymentKind: params?.paymentKind,
      currency: params?.currency?.trim().toUpperCase(),
      studentId: params?.studentId,
      windowDays: params?.windowDays,
      limit: params?.limit,
    })
    return api.get<PossibleDuplicatePaymentsResponse>(
      `/organizations/${orgId}/branches/${branchId}/payments/possible-duplicates${q}`
    )
  },

  recordGeneralIncome: (
    orgId: string,
    branchId: string,
    body: RecordGeneralIncomeRequest
  ) =>
    api.post<GeneralIncomeResponse>(
      `/organizations/${orgId}/branches/${branchId}/general-income`,
      body
    ),

  createMercadoPagoPreference: (
    orgId: string,
    studentId: string,
    chargeId: string
  ) =>
    api.post<MercadoPagoPreferenceResponse>(
      `/organizations/${orgId}/students/${studentId}/billing-charges/${chargeId}/mercado-pago/preference`
    ),

  integrations: (orgId: string, params?: PaymentIntegrationsQuery) => {
    const q = billingQuery({
      page: params?.page,
      limit: params?.limit,
      branchId: params?.branchId,
      provider: params?.provider,
      status: params?.status,
      scopeType: params?.scopeType,
    })
    return api.get<PaymentIntegrationsResponse>(
      `/organizations/${orgId}/integrations${q}`
    )
  },

  createIntegration: (
    orgId: string,
    body: CreatePaymentIntegrationRequest
  ) =>
    api.post<PaymentIntegrationResponse>(
      `/organizations/${orgId}/integrations`,
      body
    ),

  updateIntegration: (
    orgId: string,
    integrationId: string,
    body: UpdatePaymentIntegrationRequest
  ) =>
    api.patch<PaymentIntegrationResponse>(
      `/organizations/${orgId}/integrations/${integrationId}`,
      body
    ),

  testIntegration: (orgId: string, integrationId: string) =>
    api.post<TestPaymentIntegrationResponse>(
      `/organizations/${orgId}/integrations/${integrationId}/test`
    ),

  syncIntegration: (
    orgId: string,
    integrationId: string,
    body: SyncPaymentIntegrationRequest
  ) =>
    api.post<SyncPaymentIntegrationResponse>(
      `/organizations/${orgId}/integrations/${integrationId}/sync`,
      body
    ),

  integrationWebhookEvents: (
    orgId: string,
    integrationId: string,
    params?: IntegrationWebhookEventsQuery
  ) => {
    const q = billingQuery({
      page: params?.page,
      limit: params?.limit,
      validationStatus: params?.validationStatus,
      processingStatus: params?.processingStatus,
      notificationType: params?.notificationType,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      onlyRecoverable: params?.onlyRecoverable,
      externalResourceId: params?.externalResourceId,
    })
    return api.get<IntegrationWebhookEventsResponse>(
      `/organizations/${orgId}/integrations/${integrationId}/webhook-events${q}`
    )
  },

  integrationWebhookEvent: (
    orgId: string,
    integrationId: string,
    eventId: string
  ) =>
    api.get<IntegrationWebhookEventDetailResponse>(
      `/organizations/${orgId}/integrations/${integrationId}/webhook-events/${eventId}`
    ),

  reprocessWebhookEvent: (
    orgId: string,
    integrationId: string,
    eventId: string
  ) =>
    api.post<ReprocessWebhookEventResponse>(
      `/organizations/${orgId}/integrations/${integrationId}/webhook-events/${eventId}/reprocess`
    ),

  /**
   * GET /organizations/:orgId/branches/:branchId/billing-summary
   *
   * Backend returns decimal JSON strings for money totals. Do not treat them
   * as minor units; rendering belongs in lib/billing adapters.
   */
  branchSummary: (
    orgId: string,
    branchId: string,
    params?: BranchBillingSummaryQuery
  ) => {
    const q = billingQuery({
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
      currency: params?.currency?.trim().toUpperCase(),
    })
    return api.get<BranchBillingSummaryResponse>(
      `/organizations/${orgId}/branches/${branchId}/billing-summary${q}`
    )
  },

  /**
   * GET /organizations/:orgId/branches/:branchId/student-financial-statuses
   */
  studentFinancialStatuses: (
    orgId: string,
    branchId: string,
    params?: BranchStudentFinancialStatusesQuery
  ) => {
    const q = billingQuery({
      page: params?.page,
      limit: params?.limit,
      financialStatus: params?.financialStatus,
    })
    return api.get<BranchStudentFinancialStatusesResponse>(
      `/organizations/${orgId}/branches/${branchId}/student-financial-statuses${q}`
    )
  },
}

// ── Training Calendar ─────────────────────────────────────────

export const trainingCalendarApi = {
  get: (
    orgId: string,
    params: {
      from: string  // YYYY-MM-DD (obligatorio)
      to: string    // YYYY-MM-DD (obligatorio)
      branchId?: string
      view?: 'MONTH' | 'WEEK' | 'DAY' | 'LIST'
      itemType?: 'CLASS_SESSION' | 'ACADEMY_EVENT' | 'ALL'
      status?: string
    }
  ) => {
    const p = new URLSearchParams({ from: params.from, to: params.to })
    if (params.branchId)  p.set('branchId', params.branchId)
    if (params.view)      p.set('view', params.view)
    if (params.itemType)  p.set('itemType', params.itemType)
    if (params.status)    p.set('status', params.status)
    return api.get<TrainingCalendarResponse>(
      `/organizations/${orgId}/training-calendar?${p}`
    )
  },
}

// ── Class Schedules ───────────────────────────────────────────

/**
 * Schedules son templates recurrentes que generan ClassSessions.
 * Todos los endpoints son branch-scoped.
 */
export interface ClassScheduleCreateBody {
  instructorMembershipId: string
  title: string
  classType: ClassType
  description?: string
  weekday: Weekday
  startTime: string
  endTime: string
  timezone: string
  capacity?: number
  isActive?: boolean
}

export type ClassScheduleUpdateBody = Partial<
  Omit<ClassScheduleCreateBody, 'capacity'>
> & {
  capacity?: number | null
}

export const classSchedulesApi = {
  /** GET /organizations/:orgId/branches/:branchId/class-schedules */
  list: (
    orgId: string,
    branchId: string,
    params?: { page?: number; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.page) p.set('page', String(params.page))
    if (params?.limit) p.set('limit', String(params.limit))
    const q = p.toString() ? `?${p}` : ''
    return api.get<PaginatedResponse<ClassSchedule>>(
      `/organizations/${orgId}/branches/${branchId}/class-schedules${q}`
    )
  },

  /** GET /organizations/:orgId/branches/:branchId/class-schedules/:scheduleId */
  get: (orgId: string, branchId: string, scheduleId: string) =>
    api.get<ClassSchedule>(
      `/organizations/${orgId}/branches/${branchId}/class-schedules/${scheduleId}`
    ),

  /** POST /organizations/:orgId/branches/:branchId/class-schedules */
  create: (orgId: string, branchId: string, body: ClassScheduleCreateBody) =>
    api.post<ClassSchedule>(
      `/organizations/${orgId}/branches/${branchId}/class-schedules`,
      body
    ),

  /** PATCH /organizations/:orgId/branches/:branchId/class-schedules/:scheduleId */
  update: (
    orgId: string,
    branchId: string,
    scheduleId: string,
    body: ClassScheduleUpdateBody
  ) =>
    api.patch<ClassSchedule>(
      `/organizations/${orgId}/branches/${branchId}/class-schedules/${scheduleId}`,
      body
    ),
}

// ── Class Sessions ────────────────────────────────────────────

/**
 * Endpoints branch-scoped. El backend NO expone una variante org-scoped:
 * cualquier acceso a una sesión requiere branchId en la ruta.
 */
export interface ClassSessionCreateBody {
  classScheduleId?: string
  instructorMembershipId?: string
  title: string
  classType: ClassType
  scheduledDate: string
  startAt: string
  endAt: string
  capacity?: number
  notes?: string
}

export interface ClassSessionUpdateBody {
  instructorMembershipId?: string
  title?: string
  classType?: ClassType
  scheduledDate?: string
  startAt?: string
  endAt?: string
  capacity?: number
  status?: ClassSessionStatus
  cancellationReason?: string
  notes?: string
}

export interface SessionsGenerateBody {
  fromDate: string
  toDate: string
}

/** Estado por par schedule/fecha en la respuesta de generación. */
export type SessionsGenerateItemStatus =
  | 'CREATED'
  | 'SKIPPED_EXISTING'
  | 'CONFLICT'
  | 'ERROR'

export interface SessionsGenerateItem {
  scheduleId: string
  classSessionId?: string | null
  date: string
  status: SessionsGenerateItemStatus
  /** Presente cuando status === 'CONFLICT' (mismo shape que el 409). */
  conflict?: {
    type: string
    classSessionId?: string
    branchId?: string
    instructorMembershipId?: string
    startAt?: string
    endAt?: string
  }
}

/**
 * Respuesta síncrona de generación (generate / generate-missing).
 *
 * El backend ahora prefiere los counters `created`/`skipped`/`conflicts`/
 * `errors` (API-CONTRACT §"Generate class sessions"); los legacy
 * (`generatedCount`/`skippedExistingCount`/`skippedConflictCount`) se
 * mantienen opcionales por compatibilidad. La UI debe coalescer
 * (`created ?? generatedCount ?? 0`) para ser robusta a ambos shapes.
 *
 * Este mismo shape lo produce también la generación por-schedule del
 * frontend (loop del endpoint single-date agregado client-side), para que
 * el summary se renderice con un único componente.
 */
export interface SessionsGenerateResponse {
  status?: string
  fromDate: string
  toDate: string
  processedSchedules?: number
  candidateCount?: number
  missingCandidateCount?: number
  created?: number
  skipped?: number
  conflicts?: number
  errors?: number
  // Legacy counters (compatibilidad).
  generatedCount?: number
  skippedExistingCount?: number
  skippedConflictCount?: number
  items?: SessionsGenerateItem[]
}

export interface ClassSessionsListParams {
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export const classSessionsApi = {
  /** GET .../class-sessions/:sessionId — endpoint de detalle individual */
  get: (orgId: string, branchId: string, sessionId: string) =>
    api.get<ClassSessionDetail>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}`
    ),

  /** GET .../class-sessions — list paginado por rango de fechas */
  list: (
    orgId: string,
    branchId: string,
    params?: ClassSessionsListParams
  ) => {
    const p = new URLSearchParams()
    if (params?.fromDate) p.set('fromDate', params.fromDate)
    if (params?.toDate) p.set('toDate', params.toDate)
    if (params?.page) p.set('page', String(params.page))
    if (params?.limit) p.set('limit', String(params.limit))
    const q = p.toString() ? `?${p}` : ''
    return api.get<PaginatedResponse<ClassSessionListItem>>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions${q}`
    )
  },

  /** GET .../class-sessions/assigned — sesiones donde el caller es instructor */
  assigned: (
    orgId: string,
    branchId: string,
    params?: { page?: number; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.page) p.set('page', String(params.page))
    if (params?.limit) p.set('limit', String(params.limit))
    const q = p.toString() ? `?${p}` : ''
    return api.get<PaginatedResponse<ClassSessionListItem>>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/assigned${q}`
    )
  },

  /** GET .../class-calendar — view nativa DAY/WEEK/MONTH/LIST en 1 request */
  calendar: (
    orgId: string,
    branchId: string,
    params: { startDate: string; view?: 'DAY' | 'WEEK' | 'MONTH' | 'LIST' }
  ) => {
    const p = new URLSearchParams({ startDate: params.startDate })
    if (params.view) p.set('view', params.view)
    return api.get<ClassCalendarResponse>(
      `/organizations/${orgId}/branches/${branchId}/class-calendar?${p}`
    )
  },

  /** GET .../class-session-gaps — huecos entre schedules y sesiones materializadas */
  gaps: (
    orgId: string,
    branchId: string,
    params: { fromDate: string; toDate: string }
  ) => {
    const p = new URLSearchParams({
      fromDate: params.fromDate,
      toDate: params.toDate,
    })
    return api.get<ClassSessionGap>(
      `/organizations/${orgId}/branches/${branchId}/class-session-gaps?${p}`
    )
  },

  /** POST .../class-sessions */
  create: (orgId: string, branchId: string, body: ClassSessionCreateBody) =>
    api.post<ClassSessionDetail>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions`,
      body
    ),

  /** PATCH .../class-sessions/:sessionId */
  update: (
    orgId: string,
    branchId: string,
    sessionId: string,
    body: ClassSessionUpdateBody
  ) =>
    api.patch<ClassSessionDetail>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}`,
      body
    ),

  /** POST .../class-sessions/generate */
  generate: (orgId: string, branchId: string, body: SessionsGenerateBody) =>
    api.post<SessionsGenerateResponse>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/generate`,
      body
    ),

  /** POST .../class-sessions/generate-missing */
  generateMissing: (
    orgId: string,
    branchId: string,
    body: SessionsGenerateBody
  ) =>
    api.post<SessionsGenerateResponse>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/generate-missing`,
      body
    ),

  /**
   * POST .../class-schedules/:scheduleId/class-sessions
   *
   * Crea una única sesión materializada para una fecha específica desde
   * un schedule activo. Diferente de `generate` (rango + counters) y de
   * `generateMissing` (solo huecos del rango). Útil cuando el manager
   * quiere instanciar una sesión puntual fuera del flujo automático.
   */
  generateFromSchedule: (
    orgId: string,
    branchId: string,
    scheduleId: string,
    body: { scheduledDate: string; notes?: string }
  ) =>
    api.post<ClassSessionDetail>(
      `/organizations/${orgId}/branches/${branchId}/class-schedules/${scheduleId}/class-sessions`,
      body
    ),

  /** GET .../class-sessions/:sessionId/attendance */
  attendance: (orgId: string, branchId: string, sessionId: string) =>
    api.get<SessionAttendance>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance`
    ),

  /** GET .../class-sessions/:sessionId/attendance/technical-roster */
  technicalRoster: (orgId: string, branchId: string, sessionId: string) =>
    api.get<SessionTechnicalRoster>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance/technical-roster`
    ),

  /** POST .../class-sessions/:sessionId/attendance — registro bulk (STAFF_MANUAL) */
  recordAttendance: (
    orgId: string,
    branchId: string,
    sessionId: string,
    body: RecordAttendanceBody
  ) =>
    api.post<SessionAttendance>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance`,
      body
    ),

  /** PATCH .../class-sessions/:sessionId/attendance/:studentId — corrección individual */
  updateAttendance: (
    orgId: string,
    branchId: string,
    sessionId: string,
    studentId: string,
    body: UpdateAttendanceBody
  ) =>
    api.patch<unknown>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance/${studentId}`,
      body
    ),

  /** DELETE .../class-sessions/:sessionId/attendance/:studentId — elimina el registro */
  deleteAttendance: (
    orgId: string,
    branchId: string,
    sessionId: string,
    studentId: string
  ) =>
    api.delete<unknown>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance/${studentId}`
    ),

  /** POST .../class-sessions/:sessionId/attendance/qr-token — emite token QR */
  issueQRToken: (
    orgId: string,
    branchId: string,
    sessionId: string,
    body: IssueQRTokenBody
  ) =>
    api.post<QRTokenResponse>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance/qr-token`,
      body
    ),

  /** POST .../class-sessions/:sessionId/attendance/suggestions — sugerir asistencia (no marca) */
  suggestAttendance: (
    orgId: string,
    branchId: string,
    sessionId: string,
    body: SuggestAttendanceBody
  ) =>
    api.post<SuggestAttendanceResponse>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance/suggestions`,
      body
    ),

  /** GET .../class-sessions/:sessionId/attendance/suggestions — listado completo (operador) */
  listSuggestions: (orgId: string, branchId: string, sessionId: string) =>
    api.get<SuggestionsListResponse>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance/suggestions`
    ),

  /** POST .../suggestions/:suggestionId/cancel — cancelar una suggestion PENDING (operador) */
  cancelSuggestion: (
    orgId: string,
    branchId: string,
    sessionId: string,
    suggestionId: string
  ) =>
    api.post<CancelSuggestionResponse>(
      `/organizations/${orgId}/branches/${branchId}/class-sessions/${sessionId}/attendance/suggestions/${suggestionId}/cancel`
    ),
}

// ── Instructors ───────────────────────────────────────────────

export const instructorsApi = {
  /**
   * GET .../branches/:branchId/instructors/candidates — membresías que
   * pueden asignarse como instructor de una clase en esta filial.
   * Cap: classes.canAssignClassInstructor.
   */
  candidates: (orgId: string, branchId: string) =>
    api.get<InstructorCandidatesResponse>(
      `/organizations/${orgId}/branches/${branchId}/instructors/candidates`
    ),
}

// ── Intake ────────────────────────────────────────────────────

export const intakeApi = {
  getById: (orgId: string, requestId: string) =>
    api.get<IntakeRequestDetail>(
      `/organizations/${orgId}/intake-requests/${requestId}`
    ),

  transition: (
    orgId: string,
    requestId: string,
    body: IntakeTransitionBody,
  ) =>
    api.post<IntakeRequestDetail>(
      `/organizations/${orgId}/intake-requests/${requestId}/transition`,
      body,
    ),

  convert: (
    orgId: string,
    requestId: string,
    body: IntakeConvertBody,
  ) =>
    api.post<IntakeConvertResponse>(
      `/organizations/${orgId}/intake-requests/${requestId}/convert`,
      body,
    ),

  list: (
    orgId: string,
    branchId: string,
    params?: {
      page?: number
      limit?: number
      status?: string
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.page)   p.set('page', String(params.page))
    if (params?.limit)  p.set('limit', String(params.limit))
    if (params?.status) p.set('status', params.status)
    const q = p.toString() ? `?${p}` : ''
    return api.get<PaginatedResponse<IntakeRequest>>(
      `/organizations/${orgId}/branches/${branchId}/intake-requests${q}`
    )
  },
}

// ── Students ──────────────────────────────────────────────────

export const studentsApi = {
  listByBranch: (
    orgId: string,
    branchId: string,
    params?: { page?: number; limit?: number; q?: string }
  ) => {
    const p = new URLSearchParams()
    if (params?.page)  p.set('page', String(params.page))
    if (params?.limit) p.set('limit', String(params.limit))
    if (params?.q)     p.set('q', params.q)
    const qs = p.toString() ? `?${p}` : ''
    return api.get<PaginatedResponse<StudentListItem>>(
      `/organizations/${orgId}/branches/${branchId}/students${qs}`
    )
  },

  get: (orgId: string, studentId: string) =>
    api.get<StudentDetail>(`/organizations/${orgId}/students/${studentId}`),

  update: (orgId: string, studentId: string, body: Partial<StudentDetail>) =>
    api.patch<StudentDetail>(
      `/organizations/${orgId}/students/${studentId}`,
      body
    ),

  invite: (
    orgId: string,
    studentId: string,
    body?: { email?: string; expiresInDays?: number }
  ) =>
    api.post<StudentAccountInviteResponse>(
      `/organizations/${orgId}/students/${studentId}/invite`,
      body ?? {}
    ),
}
