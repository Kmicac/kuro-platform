'use client'

import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { timeZone as DEFAULT_TIMEZONE } from '@/i18n/config'

/**
 * Contexto compartido por toda la plataforma:
 *  - orgId / branchId / studentId derivados de la URL
 *  - principal autenticado leído del auth store
 *
 * Cualquier pantalla puede consumirlo en lugar de re-derivar de useParams()
 * o de pasarse props por todos lados.
 */
export interface CurrentContext {
  orgId: string | null
  branchId: string | null
  studentId: string | null
  userId: string | null
  membershipId: string | null
  primaryRole: string | null
  isAuthenticated: boolean
  /**
   * IANA timezone de la filial activa. Cae al default de i18n/config cuando
   * el branch del store todavía no tiene timezone (ej. antes de cargar la
   * lista de filiales). El backend opera con timezones por filial.
   */
  branchTimezone: string
}

export function useCurrentContext(): CurrentContext {
  const params = useParams()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const membershipId = useAuthStore((s) => s.membershipId)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentBranchId = useAuthStore((s) => s.currentBranchId)
  const currentBranchTz = useAuthStore((s) => s.currentBranch?.timezone)

  return useMemo(() => {
    const fromParams = {
      orgId: pickParam(params.orgId),
      branchId: pickParam(params.branchId),
      studentId: pickParam(params.studentId),
    }

    // Resolución de branchId, en orden:
    //  1. URL param /branches/[branchId]/...
    //  2. Pathname regex (rutas anidadas raras)
    //  3. Topbar selection (store.currentBranch) — para páginas
    //     org-level que igual necesitan branch context (ej. calendar)
    const branchId =
      fromParams.branchId ??
      pathname?.match(/\/branches\/([^/]+)/)?.[1] ??
      currentBranchId ??
      null

    return {
      orgId: fromParams.orgId,
      branchId,
      studentId: fromParams.studentId,
      userId: user?.id ?? null,
      membershipId,
      primaryRole: user?.primaryRole ?? null,
      isAuthenticated,
      branchTimezone: currentBranchTz ?? DEFAULT_TIMEZONE,
    }
  }, [
    params,
    pathname,
    user,
    membershipId,
    isAuthenticated,
    currentBranchId,
    currentBranchTz,
  ])
}

function pickParam(value: string | string[] | undefined): string | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}
