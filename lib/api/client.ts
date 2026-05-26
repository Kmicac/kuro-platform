import { useAuthStore } from '@/stores/auth.store'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://bjj-ops-api.onrender.com/api/v1'

  export interface LoginResponse {
  accessToken: string
  principal: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      phone: string | null
    }
    membership: {
      id: string
      organizationId: string
      organizationSlug: string
      organizationName: string
      assignedRoles: string[]
      scopeType: string
      branchIds: string[]
      primaryBranchId: string | null
    }
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    public readonly requestId?: string
  ) {
    super(`ApiError ${status}`)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { getAuthHeader, logout } = useAuthStore.getState()

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': crypto.randomUUID(),
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
  })

  // Token expirado → cerrar sesión
  if (res.status === 401) {
    logout()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new ApiError(401, null)
  }

  const requestId = res.headers.get('x-request-id') ?? undefined

  if (!res.ok) {
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      // ignorar error de parsing
    }
    throw new ApiError(res.status, body, requestId)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string, opts?: RequestInit) =>
    request<T>(path, { method: 'GET', ...opts }),
  post:   <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined, ...opts }),
  patch:  <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined, ...opts }),
  put:    <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined, ...opts }),
  delete: <T>(path: string, opts?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...opts }),
}

// ── Auth endpoints ──────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string, organizationSlug?: string) =>
  api.post<LoginResponse>('/auth/login', {
    email, password,
    ...(organizationSlug ? { organizationSlug } : {}),
  }),

  me: () => api.get<unknown>('/auth/me'),

  logout: () => api.post<void>('/auth/logout'),

  stepUp: (password: string) =>
    api.post<void>('/auth/step-up', { password }),
}

// ── Capabilities ────────────────────────────────────────────

export const capabilitiesApi = {
  get: (organizationId: string) =>
    api.get<Record<string, boolean>>(
      `/organizations/${organizationId}/me/capabilities`
    ),
}

// ── Organizations ───────────────────────────────────────────

export interface KuroOrganization {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  createdAt?: string
}

export const organizationsApi = {
  get: (organizationId: string) =>
    api.get<KuroOrganization>(`/organizations/${organizationId}`),
}

// ── Analytics ───────────────────────────────────────────────

export interface BranchTreeSummary {
  branches: Array<{
    id: string
    name: string
    activeStudents?: number
    classesToday?: number
    pendingIntake?: number
  }>
  totals?: {
    branches?: number
    activeStudents?: number
    classesToday?: number
    pendingIntake?: number
  }
}

export interface BranchActionSummary {
  branchId: string
  activeStudents: number
  classesToday: number
  pendingIntake: number
  pendingClaims?: number
  upcomingPromotions?: number
}

export const analyticsApi = {
  treeSummary: (organizationId: string) =>
    api.get<BranchTreeSummary>(
      `/organizations/${organizationId}/analytics/branches/tree-summary`
    ),

  actionSummary: (organizationId: string, branchId: string) =>
    api.get<BranchActionSummary>(
      `/organizations/${organizationId}/analytics/branches/${branchId}/action-summary`
    ),
}

// ── Response types (expandir según necesidad) ───────────────

export interface KuroUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface KuroMembership {
  id: string
  organizationId: string
  primaryBranchId: string | null
  organization: {
    id: string
    name: string
    slug: string
  }
  roles: Array<{ role: string }>
}