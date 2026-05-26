'use client'

import { create } from 'zustand'

export interface KuroUser {
  id: string
  firstName: string
  lastName: string
  email: string
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
}

interface AuthState {
  // JWT en memoria — NUNCA localStorage
  token: string | null
  user: KuroUser | null
  membershipId: string | null
  organizationId: string | null
  currentOrg: KuroOrg | null
  currentBranch: KuroBranch | null
  isAuthenticated: boolean
  isLoading: boolean

  setToken: (token: string) => void
  setUser: (user: KuroUser) => void
  setMembershipId: (id: string) => void
  setOrganizationId: (id: string) => void
  setCurrentOrg: (org: KuroOrg) => void
  setCurrentBranch: (branch: KuroBranch | null) => void
  setIsLoading: (v: boolean) => void
  logout: () => void
  getAuthHeader: () => Record<string, string>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  user: null,
  membershipId: null,
  organizationId: null,
  currentOrg: null,
  currentBranch: null,
  isAuthenticated: false,
  isLoading: false,

  setToken: (token) => set({ token, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  setMembershipId: (membershipId) => set({ membershipId }),
  setOrganizationId: (organizationId) => set({ organizationId }),
  setCurrentOrg: (currentOrg) => set({ currentOrg }),
  setCurrentBranch: (currentBranch) => set({ currentBranch }),
  setIsLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      token: null,
      user: null,
      membershipId: null,
      organizationId: null,
      currentOrg: null,
      currentBranch: null,
      isAuthenticated: false,
    }),

  getAuthHeader: (): Record<string, string> => {
    const { token } = get()
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  },
}))