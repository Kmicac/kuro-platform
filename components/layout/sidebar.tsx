'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Network, Users, UserPlus, ClipboardList, Globe,
  CalendarDays, Calendar, ClipboardCheck, GraduationCap, CalendarCheck,
  BookOpen, MessageSquare, Bell, Award, FileCheck, CreditCard, Trophy,
  BarChart2, ShieldCheck, Settings, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { KuroLogo } from '@/components/kuro/logo'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

// ── Colores por tema ──────────────────────────────────────────

const DARK = {
  bg: '#0f1210', surface: '#141918', border: '#252c25',
  text: '#6a7868', textHover: '#a8b8a0', textActive: '#e8ece0',
  accent: '#899878', accentBg: 'rgba(137,152,120,0.08)',
  label: '#384036', footer: '#0c0f0c',
  badge: { bg: '#899878', text: '#0f1210' },
}

const MILITAR = {
  bg: '#1a2c1a', surface: '#1e3020', border: '#2d4230',
  text: '#5a7850', textHover: '#8ab080', textActive: '#dff0d4',
  accent: '#c8d8a8', accentBg: 'rgba(200,216,168,0.10)',
  label: '#3a5035', footer: '#172518',
  badge: { bg: '#c8d8a8', text: '#1a2c1a' },
}

// ── Navegación ───────────────────────────────────────────────

type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  path: string
  badge?: boolean
  cautious?: boolean
}

type NavSection = {
  label?: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '' },
    ],
  },
  {
    label: 'Academia',
    items: [
      { id: 'branches',    label: 'Org / Filiales',  icon: Network,       path: '/branches' },
      { id: 'students',    label: 'Alumnos',          icon: Users,         path: '/students' },
      { id: 'claims',      label: 'Invitaciones',     icon: UserPlus,      path: '/claims' },
      { id: 'intake',      label: 'Academy Intake',   icon: ClipboardList, path: '/intake' },
      { id: 'profile',     label: 'Perfil público',   icon: Globe,         path: '/public-profile' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { id: 'classes',     label: 'Clases',           icon: CalendarDays,   path: '/classes' },
      { id: 'calendar',    label: 'Calendario',       icon: Calendar,       path: '/calendar' },
      { id: 'attendance',  label: 'Asistencia',       icon: ClipboardCheck, path: '/attendance' },
      { id: 'instructors', label: 'Instructores',     icon: GraduationCap,  path: '/instructors' },
      { id: 'events',      label: 'Eventos',          icon: CalendarCheck,  path: '/events' },
      { id: 'notes',       label: 'Notas técnicas',   icon: BookOpen,       path: '/notes' },
    ],
  },
  {
    label: 'Gobernanza',
    items: [
      { id: 'comms',       label: 'Comunicaciones',   icon: MessageSquare,  path: '/communications', badge: true },
      { id: 'notifs',      label: 'Notificaciones',   icon: Bell,           path: '/notifications' },
      { id: 'promotions',  label: 'Promociones',      icon: Award,          path: '/promotions' },
      { id: 'certs',       label: 'Certificados',     icon: FileCheck,      path: '/certificates' },
      { id: 'billing',     label: 'Facturación',      icon: CreditCard,     path: '/billing',      cautious: true },
      { id: 'comps',       label: 'Competencias',     icon: Trophy,         path: '/competitions', cautious: true },
      { id: 'analytics',   label: 'Analytics',        icon: BarChart2,      path: '/analytics' },
      { id: 'audit',       label: 'Auditoría',        icon: ShieldCheck,    path: '/audit' },
    ],
  },
]

// ── Componente ───────────────────────────────────────────────

interface SidebarProps {
  orgId: string
}

export function Sidebar({ orgId }: SidebarProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, logout } = useAuthStore()

  const isDark = resolvedTheme !== 'light'
  const c = isDark ? DARK : MILITAR

  const isActive = (path: string) => {
    const base = `/org/${orgId}`
    if (path === '') return pathname === base || pathname === `${base}/`
    return pathname.startsWith(`${base}${path}`)
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
            {section.label &&
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
                  {section.label}
                </div>
              ))}

            {section.items.map((item) => {
              const active = isActive(item.path)
              const Icon = item.icon

              return (
                <Link
                  key={item.id}
                  href={`/org/${orgId}${item.path}`}
                  title={sidebarCollapsed ? item.label : undefined}
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
                    <>
                      <span className="ml-2.5 flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex-shrink-0"
                          style={{ background: c.badge.bg, color: c.badge.text }}
                        >
                          3
                        </span>
                      )}
                      {item.cautious && !item.badge && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-40"
                          style={{ background: c.accent }}
                        />
                      )}
                    </>
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
        {/* Settings */}
        <Link
          href={`/org/${orgId}/settings`}
          title={sidebarCollapsed ? 'Configuración' : undefined}
          className={cn(
            'flex items-center text-[11.5px] transition-colors duration-100',
            sidebarCollapsed
              ? 'justify-center h-9 mx-2 my-0.5 rounded-md'
              : 'border-l-2 px-4 py-[6px]'
          )}
          style={{
            borderLeftColor:
              !sidebarCollapsed && isActive('/settings')
                ? c.accent
                : 'transparent',
            background: isActive('/settings') ? c.accentBg : 'transparent',
            color: isActive('/settings') ? c.textActive : c.text,
          }}
        >
          <Settings
            size={14}
            aria-hidden
            style={{
              color: isActive('/settings') ? c.accent : c.label,
              flexShrink: 0,
            }}
          />
          {!sidebarCollapsed && <span className="ml-2.5">Configuración</span>}
        </Link>

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
              onClick={() => logout()}
              title="Cerrar sesión"
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
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}