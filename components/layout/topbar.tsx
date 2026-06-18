'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Bell,
  Building2,
  Calendar,
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronDown,
  Loader2,
  Moon,
  Search,
  Sun,
  UserPlus,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { PersonAvatar } from '@/components/common/person-avatar'
import { useAuthStore } from '@/stores/auth.store'
import { CurrentUserAvatarDialog } from './current-user-avatar-dialog'
import {
  useBranches,
  useCapabilities,
  useCurrentContext,
  useCurrentMembershipVisibleProfile,
} from '@/lib/hooks'
import { FamilyButton, FamilyButtonItem } from '@/components/ui/family-button'
import { SessionDialog } from '@/components/sessions/session-dialog'
import { ScheduleDialog } from '@/app/(platform)/org/[orgId]/branches/[branchId]/schedules/_components/schedule-dialog'
import type { Branch } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface TopbarProps {
  orgId: string
  branchId?: string
}

function ThemeToggle() {
  const t = useTranslations('navigation.topbar')
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? t('themeLight') : t('themeDark')}
      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {isDark ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
    </button>
  )
}

export function Topbar({ orgId, branchId }: TopbarProps) {
  const t = useTranslations('navigation.topbar')
  const ctx = useCurrentContext()
  const { user, currentOrg, currentBranch } = useAuthStore()
  const profileQuery = useCurrentMembershipVisibleProfile(orgId)

  const activeBranchId = branchId ?? ctx.branchId ?? currentBranch?.id
  const authDisplayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || null
  const profile = profileQuery.data
  const visibleDisplayName = profile?.displayName?.trim() || authDisplayName
  const visibleFirstName = profile?.firstName ?? user?.firstName ?? null
  const visibleLastName = profile?.lastName ?? user?.lastName ?? null
  const visibleAvatarUrl = profile?.avatarUrl ?? null
  const visibleRoleLabel = profile?.roleLabel ?? user?.primaryRole ?? ''

  // Family Button (crear) — gating por capability + contexto de filial.
  const caps = useCapabilities(orgId)
  const canManage = Boolean(
    caps.data?.capabilities?.classes?.canManageSchedules,
  )
  const hasBranch = Boolean(ctx.branchId)
  const [createSessionOpen, setCreateSessionOpen] = useState(false)
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false)
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)

  return (
    <>
    <header className="h-[52px] flex items-center gap-2 px-4 border-b border-border bg-background flex-shrink-0">
      {/* Org / Branch context */}
      <div className="flex items-center gap-1">
        <button className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-md hover:bg-muted transition-colors max-w-[160px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('orgLabel')}
          </span>
          <span className="text-xs font-medium text-foreground truncate">
            {currentOrg?.name ?? t('orgFallback')}
          </span>
          <ChevronDown
            size={11}
            className="text-muted-foreground flex-shrink-0"
            aria-hidden
          />
        </button>

        <span className="text-border text-sm select-none">/</span>

        <BranchSelector orgId={orgId} activeBranchId={activeBranchId} />
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-xs text-muted-foreground hover:border-muted-foreground/30 transition-colors">
          <Search size={12} aria-hidden />
          <span className="flex-1 text-left">{t('search')}</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-background border border-border rounded px-1 text-[10px] py-0.5 leading-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Acciones */}
      <div className="ml-auto flex items-center gap-1">
        <FamilyButton label={t('create')}>
          {canManage && (
            <>
              <FamilyButtonItem
                icon={Calendar}
                label={t('createClass')}
                disabled={!hasBranch}
                onClick={() => setCreateSessionOpen(true)}
              />
              <FamilyButtonItem
                icon={CalendarClock}
                label={t('createSchedule')}
                disabled={!hasBranch}
                onClick={() => setCreateScheduleOpen(true)}
              />
            </>
          )}
          <FamilyButtonItem
            icon={UserPlus}
            label={t('createStudent')}
            disabled
            hint={t('comingSoon')}
          />
          <FamilyButtonItem
            icon={CalendarPlus}
            label={t('createEvent')}
            disabled
            hint={t('comingSoon')}
          />
        </FamilyButton>

        <button
          title={t('notifications')}
          className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Bell size={15} aria-hidden />
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1 bg-destructive text-destructive-foreground">
            3
          </span>
        </button>

        <ThemeToggle />

        <div className="w-px h-5 bg-border mx-0.5" />

        <button
          type="button"
          title={t('manageAvatar')}
          onClick={() => setAvatarDialogOpen(true)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <PersonAvatar
            avatarUrl={visibleAvatarUrl}
            displayName={visibleDisplayName}
            firstName={visibleFirstName}
            lastName={visibleLastName}
            size="sm"
            className="h-7 w-7 flex-shrink-0"
            fallbackClassName="text-[10px]"
          />
          <div className="hidden sm:flex flex-col items-start min-w-0">
            <span className="text-xs font-medium text-foreground leading-tight whitespace-nowrap">
              {visibleDisplayName ?? '—'}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">
              {visibleRoleLabel}
            </span>
          </div>
          <ChevronDown
            size={11}
            className="text-muted-foreground hidden sm:block flex-shrink-0"
            aria-hidden
          />
        </button>
      </div>
    </header>

      {/* Dialogs de creación alojados en el topbar (Family Button). */}
      <SessionDialog
        mode="create"
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
      />
      <ScheduleDialog
        mode="create"
        open={createScheduleOpen}
        onOpenChange={setCreateScheduleOpen}
      />
      <CurrentUserAvatarDialog
        orgId={orgId}
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
      />
    </>
  )
}

// ── Branch selector ──────────────────────────────────────────

/**
 * Páginas org-level que leen la filial activa del store (no del path).
 * Al cambiar de filial en estas rutas NO se navega: el cambio de store
 * dispara el refetch automático y el usuario se queda donde está.
 * Lista por sufijo de path (extensible a medida que crezcan las pantallas
 * branch-aware org-level).
 */
const BRANCH_AWARE_ORG_PAGES = ['/calendar']

/**
 * Decide la navegación al cambiar de filial:
 *  - ruta branch-scoped (/branches/[id]/...) → misma página, nueva filial
 *  - ruta org-level branch-aware (ej. /calendar) → null (no navegar)
 *  - resto (dashboard org-level, etc.) → drill al dashboard de la filial
 */
function nextPathForBranch(
  pathname: string | null,
  orgId: string,
  newBranchId: string
): string | null {
  if (pathname && /\/branches\/[^/]+/.test(pathname)) {
    return pathname.replace(/\/branches\/[^/]+/, `/branches/${newBranchId}`)
  }
  if (pathname && BRANCH_AWARE_ORG_PAGES.some((s) => pathname.endsWith(s))) {
    return null
  }
  return `/org/${orgId}/branches/${newBranchId}`
}

interface BranchSelectorProps {
  orgId: string
  activeBranchId?: string
}

function BranchSelector({ orgId, activeBranchId }: BranchSelectorProps) {
  const t = useTranslations('navigation.topbar')
  const tErrors = useTranslations('errors.topbar')
  const tEmpty = useTranslations('empty-states.topbar')
  const router = useRouter()
  const pathname = usePathname()
  const { setCurrentBranch } = useAuthStore()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const branchesQuery = useBranches(orgId)

  const branches = branchesQuery.data ?? []
  const activeBranch = branches.find((b) => b.id === activeBranchId)

  useEffect(() => {
    if (activeBranch) {
      setCurrentBranch({
        id: activeBranch.id,
        name: activeBranch.name,
        timezone: activeBranch.timezone,
      })
    }
  }, [activeBranch, setCurrentBranch])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSelect = (b: Branch) => {
    setOpen(false)
    // SIEMPRE actualizar el store (dispara refetch en páginas branch-aware).
    setCurrentBranch({ id: b.id, name: b.name, timezone: b.timezone })
    // Navegar solo si corresponde según la ruta actual.
    const next = nextPathForBranch(pathname, orgId, b.id)
    if (next) router.push(next)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-md hover:bg-muted transition-colors max-w-[200px]"
      >
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {t('branchLabel')}
        </span>
        <span className="text-xs font-medium text-foreground truncate">
          {activeBranch?.name ??
            (branchesQuery.isLoading
              ? t('branchLoading')
              : t('branchSelect'))}
        </span>
        <ChevronDown
          size={11}
          className={cn(
            'text-muted-foreground flex-shrink-0 transition-transform',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              {t('changeBranch')}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {branchesQuery.isLoading && (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('branchesLoading')}
              </div>
            )}

            {Boolean(branchesQuery.error) && (
              <div className="px-3 py-4 text-xs text-destructive">
                {tErrors('branchesLoadError')}
              </div>
            )}

            {!branchesQuery.isLoading &&
              !branchesQuery.error &&
              branches.length === 0 && (
                <div className="px-3 py-4 text-xs text-muted-foreground">
                  {tEmpty('noBranches')}
                </div>
              )}

            {branches.map((b) => {
              const isActive = b.id === activeBranchId
              return (
                <button
                  key={b.id}
                  role="menuitem"
                  onClick={() => handleSelect(b)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                    isActive
                      ? 'bg-primary/10 text-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Building2
                    size={13}
                    className={cn(
                      'flex-shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{b.name}</p>
                    {b.city && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {b.city}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <Check
                      size={13}
                      className="text-primary flex-shrink-0"
                      aria-hidden
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
