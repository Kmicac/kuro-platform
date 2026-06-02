/**
 * KURO Auth Store — v3
 *
 * Tokens en memoria ÚNICAMENTE:
 * - accessToken  : JWT de corta vida — memory-only, NUNCA persistido
 * - csrfToken    : CSRF double-submit (header x-csrf-token) — memory-only
 *
 * PERSISTENCIA (localStorage 'kuro-ui-prefs'):
 * - SOLO `currentBranchId` — preferencia de UI no-sensible (aparece en
 *   URLs y en el membership). El backend valida acceso vía token +
 *   capabilities igual; persistir esto NO debilita seguridad.
 * - El refresh token es una httpOnly cookie — JS no la toca.
 *
 * El partialize garantiza que NADA de auth (token/csrf/user/membership)
 * llega a localStorage.
 */
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface KuroUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  primaryRole: string
}

export interface KuroOrg {
  id: string
  name: string
  slug: string
}

export interface KuroBranch {
  id: string
  name: string
  /** IANA timezone de la filial (para formateo/conversión del calendario). */
  timezone?: string
}

export interface HydrateSessionPayload {
  accessToken: string
  user: KuroUser
  organizationId: string | null
  membershipId: string | null
  currentOrg: KuroOrg | null
  /** Filiales accesibles según el membership — para validar acceso. */
  branchIds: string[]
  /** Filial primaria — fallback cuando no hay selección persistida válida. */
  primaryBranchId: string | null
}

interface AuthState {
  // ── Tokens en memoria ──────────────────────────────────────
  accessToken: string | null
  csrfToken: string | null   // leído de x-csrf-token header, NO de cookie

  // ── Principal ──────────────────────────────────────────────
  user: KuroUser | null
  membershipId: string | null
  organizationId: string | null
  currentOrg: KuroOrg | null
  /** Objeto de display {id, name} — MEMORY-ONLY (lo repuebla el topbar). */
  currentBranch: KuroBranch | null
  /** Selección canónica de filial — PERSISTIDA en localStorage. */
  currentBranchId: string | null
  /** Filiales accesibles del membership — memory-only, para validar. */
  branchIds: string[]
  /** Filial primaria del membership — memory-only, fallback. */
  primaryBranchId: string | null

  // ── Estado UI ──────────────────────────────────────────────
  isAuthenticated: boolean
  isLoading: boolean

  // ── Acciones ───────────────────────────────────────────────
  setToken: (token: string) => void
  setCsrfToken: (token: string | null) => void
  setUser: (user: KuroUser) => void
  setMembershipId: (id: string) => void
  setOrganizationId: (id: string) => void
  setCurrentOrg: (org: KuroOrg) => void
  setCurrentBranch: (branch: KuroBranch | null) => void
  setIsLoading: (v: boolean) => void
  /**
   * Transición ATÓMICA de sesión: setea accessToken + principal completo
   * + isAuthenticated en un solo `set`. Garantiza que el store nunca
   * quede en un estado intermedio con isAuthenticated=true pero user=null.
   * La usan tanto el login como el bootstrap post-F5 → estado idéntico.
   */
  hydrateSession: (payload: HydrateSessionPayload) => void
  logout: () => void

  // ── Helpers ────────────────────────────────────────────────
  getAuthHeader: () => Record<string, string>
  getCsrfHeader: () => Record<string, string>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      accessToken: null,
      csrfToken: null,
      user: null,
      membershipId: null,
      organizationId: null,
      currentOrg: null,
      currentBranch: null,
      currentBranchId: null,
      branchIds: [],
      primaryBranchId: null,
      isAuthenticated: false,
      isLoading: true,

      // Setters
      setToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
      setCsrfToken: (csrfToken) => set({ csrfToken }),
      setUser: (user) => set({ user }),
      setMembershipId: (membershipId) => set({ membershipId }),
      setOrganizationId: (organizationId) => set({ organizationId }),
      setCurrentOrg: (currentOrg) => set({ currentOrg }),

      // Selección de filial (manual o por navegación). SIEMPRE valida
      // contra branchIds: nunca permite una filial fuera del acceso del
      // membership. Si no hay lista cargada todavía, no bloquea (el
      // backend sigue siendo el guardián real).
      setCurrentBranch: (branch) =>
        set((state) => {
          if (!branch) return { currentBranch: null, currentBranchId: null }
          if (
            state.branchIds.length > 0 &&
            !state.branchIds.includes(branch.id)
          ) {
            return {} // fuera de acceso → no-op
          }
          return { currentBranch: branch, currentBranchId: branch.id }
        }),

      setIsLoading: (isLoading) => set({ isLoading }),

      // Transición atómica — token + principal + isAuthenticated juntos.
      // Además resuelve la filial activa:
      //   1. currentBranchId persistido SI está en branchIds (acceso válido)
      //   2. fallback a primaryBranchId
      //   3. null (la UI pedirá "seleccioná filial")
      hydrateSession: (payload) =>
        set((state) => {
          const { branchIds, primaryBranchId } = payload
          const persisted = state.currentBranchId
          const resolvedBranchId =
            persisted && branchIds.includes(persisted)
              ? persisted
              : primaryBranchId ?? null

          return {
            accessToken: payload.accessToken,
            user: payload.user,
            organizationId: payload.organizationId,
            membershipId: payload.membershipId,
            currentOrg: payload.currentOrg,
            branchIds,
            primaryBranchId,
            currentBranchId: resolvedBranchId,
            // El objeto de display lo repuebla el topbar al cargar branches.
            currentBranch: null,
            isAuthenticated: true,
          }
        }),

      // Limpia la sesión. NO borra currentBranchId: es una preferencia de
      // UI persistida que debe sobrevivir al logout para restaurar la
      // última filial en el próximo login (si sigue siendo válida).
      logout: () =>
        set({
          accessToken: null,
          csrfToken: null,
          user: null,
          membershipId: null,
          organizationId: null,
          currentOrg: null,
          currentBranch: null,
          branchIds: [],
          primaryBranchId: null,
          isAuthenticated: false,
        }),

      // Authorization: Bearer <token>
      getAuthHeader: (): Record<string, string> => {
        const { accessToken } = get()
        if (!accessToken) return {}
        return { Authorization: `Bearer ${accessToken}` }
      },

      // x-csrf-token: <token> — solo si tenemos el token en memoria
      getCsrfHeader: (): Record<string, string> => {
        const { csrfToken } = get()
        if (!csrfToken) return {}
        return { 'x-csrf-token': csrfToken }
      },
    }),
    {
      name: 'kuro-ui-prefs',
      // CRÍTICO: SOLO currentBranchId llega a localStorage.
      // accessToken / csrfToken / user / membership → memory-only.
      partialize: (state) => ({ currentBranchId: state.currentBranchId }),
    }
  )
)