'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Network, Users, UserPlus, ClipboardList, Calendar,
  CalendarClock, ChevronLeft, ChevronRight, CreditCard, LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { KuroLogo } from '@/components/kuro/logo'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api/client'
import { cn } from '@/lib/utils'

// ── Colores por tema ──────────────────────────────────────────

// KURO Design System 2.5 — paleta sobria. DARK = dark mode (default);
// MILITAR = sidebar para light mode (se mantiene verde militar oscuro).
const DARK = {
  bg: '#0A0E0C', surface: '#13181A', border: '#2A3530',
  text: '#6B6B5E', textHover: '#A8A496', textActive: '#E8E4D9',
  accent: '#5A7850', accentBg: 'rgba(63,92,69,0.18)',
  label: '#4A4A42', footer: '#070A08',
  badge: { bg: '#5A7850', text: '#0A0E0C' },
}

const MILITAR = {
  bg: '#1A2520', surface: '#20302A', border: '#2A3530',
  text: '#7A8576', textHover: '#A8B89F', textActive: '#E8E4D9',
  accent: '#5A7850', accentBg: 'rgba(90,120,80,0.14)',
  label: '#4A5548', footer: '#141C18',
  badge: { bg: '#8AB080', text: '#1A2520' },
}

// ── Navegación ───────────────────────────────────────────────

// scope:
//  - 'org'    → href = /org/[orgId]{path}
//  - 'branch' → href = /org/[orgId]/branches/[currentBranchId]{path}
//               (deshabilitado si no hay filial seleccionada)
//
// Solo se listan items con pantalla REAL construida. Los módulos del
// roadmap (clases, asistencia, instructores, eventos, notas, comms,
// promociones, certificados, facturación, competencias, analytics,
// auditoría, perfil público, settings) se agregarán a su grupo cuando
// existan — NO se renderizan como "próximamente".
type NavItem = {
  id: string
  labelKey: string
  icon: LucideIcon
  scope: 'org' | 'branch'
  path: string
}

type NavSection = {
  labelKey?: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    items: [
      { id: 'overview', labelKey: 'dashboard',   icon: LayoutDashboard, scope: 'org', path: '' },
      { id: 'calendar', labelKey: 'calendar',    icon: Calendar,        scope: 'org', path: '/calendar' },
      { id: 'claims',   labelKey: 'invitations', icon: UserPlus,        scope: 'org', path: '/claims' },
    ],
  },
  {
    labelKey: 'branchSection',
    items: [
      { id: 'branch',    labelKey: 'branchPanel', icon: Network,       scope: 'branch', path: '' },
      { id: 'students',  labelKey: 'students',    icon: Users,         scope: 'branch', path: '/students' },
      { id: 'schedules', labelKey: 'schedules',   icon: CalendarClock, scope: 'branch', path: '/schedules' },
      { id: 'intake',    labelKey: 'intake',      icon: ClipboardList, scope: 'branch', path: '/intake' },
      { id: 'billing',   labelKey: 'billing',     icon: CreditCard,    scope: 'branch', path: '/billing/dashboard' },
    ],
  },
]

// ── Componente ───────────────────────────────────────────────

interface SidebarProps {
  orgId: string
}

export function Sidebar({ orgId }: SidebarProps) {
  const t = useTranslations('navigation.sidebar')
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const user = useAuthStore((s) => s.user)
  const currentBranchId = useAuthStore((s) => s.currentBranchId)

  const handleLogout = async () => {
    await authApi.logout()
    router.replace('/login')
  }

  const isDark = resolvedTheme !== 'light'
  const c = isDark ? DARK : MILITAR

  const orgBase = `/org/${orgId}`
  const branchBase = currentBranchId
    ? `${orgBase}/branches/${currentBranchId}`
    : null

  // href absoluto del item según su scope (null si branch-scoped sin filial).
  const hrefFor = (item: NavItem): string | null => {
    if (item.scope === 'org') return `${orgBase}${item.path}`
    return branchBase ? `${branchBase}${item.path}` : null
  }

  const isActive = (item: NavItem): boolean => {
    if (item.scope === 'org') {
      if (item.path === '')
        return pathname === orgBase || pathname === `${orgBase}/`
      return pathname.startsWith(`${orgBase}${item.path}`)
    }
    // branch-scoped: comparar contra cualquier filial en la URL, no solo
    // la seleccionada (así "Alumnos" queda activo aunque navegues a otra).
    const branchPrefix = `${orgBase}/branches/`
    if (!pathname.startsWith(branchPrefix)) return false
    const afterBranch = pathname.slice(branchPrefix.length) // "[id]" o "[id]/students"
    const slashIdx = afterBranch.indexOf('/')
    const subPath = slashIdx === -1 ? '' : afterBranch.slice(slashIdx)
    if (item.path === '') return subPath === '' || subPath === '/'
    return subPath.startsWith(item.path)
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : 'KU'

  return (
    <aside
      style={{ background: c.bg, borderRight: `0.5px solid ${c.border}` }}
      className={cn(
        'flex flex-col h-screen flex-shrink-0 overflow-hidden',
        'transition-[width] duration-200 ease-in-out',
        sidebarCollapsed ? 'w-14' : 'w-[220px]'
      )}
    >
      {/* ── Logo ── */}
      <div
        style={{ background: c.surface, borderBottom: `0.5px solid ${c.border}` }}
        className={cn(
          'h-[52px] flex items-center flex-shrink-0',
          sidebarCollapsed ? 'justify-center' : 'px-4'
        )}
      >
        <KuroLogo
          collapsed={sidebarCollapsed}
          forceDark
          size={sidebarCollapsed ? 'sm' : 'md'}
        />
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 overflow-y-auto py-1 scrollbar-none">
        {NAV.map((section, si) => (
          <div key={si} className="mb-0.5">
            {section.labelKey &&
              (sidebarCollapsed ? (
                <div
                  className="mx-3 my-1 h-px"
                  style={{ background: c.border }}
                />
              ) : (
                <div
                  className="px-4 pt-2 pb-0.5 text-[9px] font-semibold uppercase tracking-[.12em]"
                  style={{ color: c.label }}
                >
                  {t(section.labelKey as Parameters<typeof t>[0])}
                </div>
              ))}

            {section.items.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              const href = hrefFor(item)
              const label = t(item.labelKey as Parameters<typeof t>[0])
              // branch-scoped sin filial seleccionada → deshabilitado.
              const disabled = href === null
              const disabledTitle = t('selectBranchHint')

              if (disabled) {
                return (
                  <div
                    key={item.id}
                    aria-disabled
                    title={
                      sidebarCollapsed
                        ? t('disabledItem', { label, hint: disabledTitle })
                        : disabledTitle
                    }
                    className={cn(
                      'flex items-center text-[11.5px] cursor-not-allowed opacity-40 select-none',
                      sidebarCollapsed
                        ? 'justify-center h-9 mx-2 rounded-md'
                        : 'border-l-2 px-4 py-[6px]'
                    )}
                    style={{ borderLeftColor: 'transparent', color: c.text }}
                  >
                    <Icon
                      size={14}
                      aria-hidden
                      style={{ color: c.label, flexShrink: 0 }}
                    />
                    {!sidebarCollapsed && (
                      <span className="ml-2.5 flex-1 truncate">
                        {label}
                      </span>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={href}
                  title={sidebarCollapsed ? label : undefined}
                  className={cn(
                    'flex items-center text-[11.5px] transition-colors duration-100',
                    sidebarCollapsed
                      ? 'justify-center h-9 mx-2 rounded-md'
                      : 'border-l-2 px-4 py-[6px]'
                  )}
                  style={{
                    borderLeftColor:
                      !sidebarCollapsed && active ? c.accent : 'transparent',
                    background: active ? c.accentBg : 'transparent',
                    color: active ? c.textActive : c.text,
                    fontWeight: active ? 500 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.color = c.textHover
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.color = c.text
                  }}
                >
                  <Icon
                    size={14}
                    aria-hidden
                    style={{ color: active ? c.accent : c.label, flexShrink: 0 }}
                  />

                  {!sidebarCollapsed && (
                    <span className="ml-2.5 flex-1 truncate">{label}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0"
        style={{ borderTop: `0.5px solid ${c.border}`, background: c.footer }}
      >
        {/* User info */}
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
              style={{
                background: c.accentBg,
                color: c.accent,
                border: `0.5px solid ${c.accent}`,
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-medium truncate leading-tight"
                style={{ color: c.textActive }}
              >
                {user ? `${user.firstName} ${user.lastName}` : '—'}
              </div>
              <div
                className="text-[9px] uppercase tracking-[.08em] leading-tight mt-0.5"
                style={{ color: c.label }}
              >
                {user?.primaryRole ?? ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t('logout')}
              className="flex-shrink-0 transition-colors duration-100"
              style={{ color: c.label, background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = '#d45858')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = c.label)
              }
            >
              <LogOut size={13} aria-hidden />
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-1.5 gap-1 text-[10px] transition-colors duration-100"
          style={{
            borderTop: `0.5px solid ${c.border}`,
            color: c.label,
            background: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = c.textHover)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = c.label)
          }
        >
          {sidebarCollapsed ? (
            <ChevronRight size={13} aria-hidden />
          ) : (
            <>
              <ChevronLeft size={13} aria-hidden />
              <span>{t('collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
