/**
 * KURO API Client — v3
 *
 * Implementa el contrato de seguridad completo:
 *
 * ✅ Access token en memoria (Zustand) — NUNCA localStorage/sessionStorage
 * ✅ Refresh token en httpOnly cookie — JS nunca lo ve, browser lo maneja
 * ✅ CSRF double-submit — leído de header x-csrf-token, guardado en store
 * ✅ credentials: 'include' en login / refresh / logout
 * ✅ Refresh mutex (single-flight) — 1 solo /auth/refresh aunque haya N requests con 401
 * ✅ No-retry loop — auth endpoints nunca disparan refresh automático
 * ✅ Bootstrap F5 — intenta /auth/refresh al montar el platform layout
 * ✅ CSRF bootstrap F5 — re-obtiene el csrf vía GET /auth/csrf cuando el
 *    store está vacío, antes de /auth/refresh (evita el 403 double-submit)
 */

import * as Sentry from '@sentry/nextjs'
import { useAuthStore } from '@/stores/auth.store'
import type { HydrateSessionPayload } from '@/stores/auth.store'
import type { AuthPrincipal, LoginResponse, MeResponse } from './types'

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://bjj-ops-api.onrender.com/api/v1'

// ── Error tipado ──────────────────────────────────────────────

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

// ── Refresh mutex — single-flight ─────────────────────────────
//
// El backend usa reuse detection agresivo:
// si dos /auth/refresh llegan simultáneamente con la misma cookie,
// el segundo se trata como replay attack y revoca la sesión.
//
// Esta variable garantiza que N requests con 401 disparen exactamente
// UN solo /auth/refresh. El resto espera la misma promesa.

let _refreshPromise: Promise<string | null> | null = null

// ── Mapper principal API → estado del store ───────────────────
//
// Unifica el principal de /auth/login y de /auth/me en el payload
// atómico del store, para que el estado tras login y tras F5 sea
// idéntico. `membership` puede ser null (usuario PUBLIC sin tenant).
export function principalToSession(
  accessToken: string,
  principal: AuthPrincipal
): HydrateSessionPayload {
  const { user, membership } = principal
  return {
    accessToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      primaryRole: membership?.assignedRoles[0] ?? 'STAFF',
    },
    organizationId: membership?.organizationId ?? null,
    membershipId: membership?.id ?? null,
    currentOrg: membership
      ? {
          id: membership.organizationId,
          name: membership.organizationName,
          slug: membership.organizationSlug,
        }
      : null,
    branchIds: membership?.branchIds ?? [],
    primaryBranchId: membership?.primaryBranchId ?? null,
  }
}

// ── CSRF bootstrap (recuperación post-F5) ─────────────────────
//
// Tras un F5 el store arranca vacío (csrfToken vive solo en memoria,
// sin persist). El refresh double-submit necesita el csrf, así que lo
// re-bootstrapeamos desde GET /auth/csrf — endpoint autenticado por la
// cookie httpOnly + SameSite, que NO requiere csrf previo.
//
// Se invoca dentro de _executeRefresh (cubierto por el mismo mutex),
// así que nunca hay dos bootstraps en paralelo.

// Semántica de retorno/throw:
//  - 401  → null   (no hay cookie de refresh válida → no hay sesión que
//                    restaurar; el caller debe ir a /login limpio)
//  - 403 / otro / header ausente → throw ApiError (error real → el caller
//                    muestra error state, NO loop a login)
async function bootstrapCsrf(): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
  })

  // 401: sin sesión que restaurar.
  if (res.status === 401) return null

  const requestId = res.headers.get('x-request-id') ?? undefined

  // 403 (Origin no allowlisted) u otro status → error real.
  if (!res.ok) {
    let body: unknown = null
    try { body = await res.json() } catch { /* body no es JSON */ }
    throw new ApiError(res.status, body, requestId)
  }

  // Contrato: csrf en el header x-csrf-token, body {}.
  const token = res.headers.get('x-csrf-token')
  if (!token) {
    throw new ApiError(
      res.status,
      { message: 'CSRF token ausente en la respuesta de /auth/csrf' },
      requestId
    )
  }

  useAuthStore.getState().setCsrfToken(token)
  return token
}

async function _executeRefresh(): Promise<string | null> {
  try {
    // F5 / nueva pestaña: el store arranca vacío. Re-bootstrapear el csrf
    // ANTES del refresh para no fallar el double-submit con 403.
    // Toda esta secuencia (csrf + refresh) corre dentro del mismo
    // _refreshPromise → single-flight garantizado.
    if (!useAuthStore.getState().csrfToken) {
      const token = await bootstrapCsrf()
      if (!token) {
        // 401 en /auth/csrf → sin sesión que restaurar.
        useAuthStore.getState().logout()
        return null
      }
      // Si bootstrapCsrf lanzó (403/network/header ausente), el error
      // se propaga hacia el caller (layout muestra error state).
    }

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',      // envía la httpOnly refresh cookie
      headers: {
        'Content-Type': 'application/json',
        // getCsrfHeader() lee estado vivo del store (ya seteado por
        // bootstrapCsrf si fue necesario).
        ...useAuthStore.getState().getCsrfHeader(),
      },
    })

    // 401: refresh token inválido/expirado → sesión terminada.
    if (res.status === 401) {
      useAuthStore.getState().logout()
      return null
    }

    const requestId = res.headers.get('x-request-id') ?? undefined
    if (!res.ok) {
      let body: unknown = null
      try { body = await res.json() } catch { /* body no es JSON */ }
      throw new ApiError(res.status, body, requestId)
    }

    // CSRF rotado por el backend junto con el refresh token.
    const newCsrf = res.headers.get('x-csrf-token')
    if (newCsrf) useAuthStore.getState().setCsrfToken(newCsrf)

    const data = (await res.json()) as { accessToken: string }
    const accessToken = data.accessToken

    // ── Rehidratar el principal (user + membership + org) ──────
    // /auth/refresh sólo devuelve accessToken. Pedimos /auth/me con el
    // token recién obtenido (header explícito — el store todavía NO tiene
    // el token, para no flipear isAuthenticated antes de tiempo).
    // Sigue dentro del mismo _refreshPromise → single-flight: F5 con N
    // requests paralelos hace 1 sola secuencia csrf → refresh → me.
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': crypto.randomUUID(),
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // 401 → la sesión no es válida (token rechazado) → terminar.
    if (meRes.status === 401) {
      useAuthStore.getState().logout()
      return null
    }
    if (!meRes.ok) {
      const meReqId = meRes.headers.get('x-request-id') ?? undefined
      let meBody: unknown = null
      try { meBody = await meRes.json() } catch { /* body no es JSON */ }
      throw new ApiError(meRes.status, meBody, meReqId)
    }

    const principal = (await meRes.json()) as MeResponse

    // Transición ATÓMICA: accessToken + principal + isAuthenticated juntos.
    // El store nunca queda en isAuthenticated=true con user=null.
    useAuthStore
      .getState()
      .hydrateSession(principalToSession(accessToken, principal))

    return accessToken
  } finally {
    // Liberar el mutex pase lo que pase (éxito, null, o throw).
    _refreshPromise = null
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = _executeRefresh()
  }
  return _refreshPromise
}

// ── Core request ──────────────────────────────────────────────

// Endpoints que usan cookies — nunca disparan refresh automático
// ni llevan Authorization header
const AUTH_COOKIE_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/csrf',
]

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
  emptyBodyAsNull = false
): Promise<T> {
  const { getAuthHeader, logout } = useAuthStore.getState()
  const isCookiePath = AUTH_COOKIE_PATHS.some(p => path.startsWith(p))
  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: isCookiePath ? 'include' : 'same-origin',
    headers: {
      ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      'x-request-id': crypto.randomUUID(),
      // Auth endpoints no llevan Bearer (login no tiene token aún;
      // refresh/logout usan cookie)
      ...(isCookiePath ? {} : getAuthHeader()),
      ...(options.headers ?? {}),
    },
  })

  // ── 401 → intentar refresh una sola vez ──────────────────
  if (res.status === 401 && !_isRetry && !isCookiePath) {
    const newToken = await refreshAccessToken()

    if (newToken) {
      // Reintentar el request original con el token renovado
      return request<T>(path, options, true, emptyBodyAsNull)
    }

    // Refresh falló → sesión inválida
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new ApiError(401, null)
  }

  // 401 directo en auth endpoint, o segundo intento fallido
  if (res.status === 401) {
    logout()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new ApiError(401, null)
  }

  const requestId = res.headers.get('x-request-id') ?? undefined

  if (!res.ok) {
    let body: unknown = null
    try { body = await res.json() } catch { /* body no es JSON */ }
    const error = new ApiError(res.status, body, requestId)
    // Telemetría: solo 5xx (fallas reales del servidor). Los 4xx esperables
    // (403/404/409/422) son ruido y el 401 ya lo maneja el refresh handler
    // arriba — no se reportan.
    if (res.status >= 500) {
      Sentry.captureException(error, {
        tags: { endpoint: path, method: options.method ?? 'GET' },
        extra: { requestId, status: res.status },
      })
    }
    throw error
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!text.trim()) return (emptyBodyAsNull ? null : undefined) as T
  return JSON.parse(text) as T
}

// ── API shortcuts ─────────────────────────────────────────────

export const api = {
  get:    <T>(path: string, opts?: RequestInit) =>
    request<T>(path, { method: 'GET', ...opts }),
  getNullable: <T>(path: string, opts?: RequestInit) =>
    request<T | null>(path, { method: 'GET', ...opts }, false, true),
  post:   <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined, ...opts }),
  postForm: <T>(path: string, body: FormData, opts?: RequestInit) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  patch:  <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined, ...opts }),
  put:    <T>(path: string, body?: unknown, opts?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined, ...opts }),
  delete: <T>(path: string, opts?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...opts }),
}

// ── Auth endpoints ────────────────────────────────────────────

export const authApi = {
  /**
   * Login
   * - credentials: 'include' → recibe la httpOnly refresh cookie
   * - Lee x-csrf-token del response header → guarda en store
   */
  login: async (
    email: string,
    password: string,
    organizationSlug?: string
  ): Promise<LoginResponse> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        ...(organizationSlug ? { organizationSlug } : {}),
      }),
    })

    if (!res.ok) {
      let body: unknown = null
      try { body = await res.json() } catch { /* ignore */ }
      throw new ApiError(res.status, body)
    }

    // Guardar CSRF token del header en el store
    const csrfToken = res.headers.get('x-csrf-token')
    if (csrfToken) useAuthStore.getState().setCsrfToken(csrfToken)

    return res.json() as Promise<LoginResponse>
  },

  /**
   * Refresh manual — para bootstrap en F5 / primera carga.
   * El interceptor automático usa refreshAccessToken() internamente.
   */
  refresh: () => refreshAccessToken(),

  /**
   * Logout
   * - credentials: 'include' → backend revoca la cookie
   * - x-csrf-token → valida la solicitud cross-site
   */
  logout: async (): Promise<void> => {
    const { getCsrfHeader, logout } = useAuthStore.getState()
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getCsrfHeader(),
        },
      })
    } finally {
      // Limpiar store pase lo que pase en el backend
      logout()
    }
  },

  me: () => api.get<unknown>('/auth/me'),

  stepUp: (password: string) =>
    api.post<void>('/auth/step-up', { password }),
}
