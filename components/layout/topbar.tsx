'use client'

import { Bell, Plus, Search, ChevronDown, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/stores/auth.store'

interface TopbarProps {
  orgId: string
  branchId?: string
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
    >
      {isDark
        ? <Sun size={15} aria-hidden />
        : <Moon size={15} aria-hidden />
      }
    </button>
  )
}

export function Topbar({ orgId, branchId }: TopbarProps) {
  const { user, currentOrg, currentBranch } = useAuthStore()

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : 'KU'

  return (
    <header className="h-[52px] flex items-center gap-2 px-4 border-b border-border bg-background flex-shrink-0">

      {/* Org / Branch context */}
      <div className="flex items-center gap-1">
        <button className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-md hover:bg-muted transition-colors max-w-[160px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Org</span>
          <span className="text-xs font-medium text-foreground truncate">
            {currentOrg?.name ?? 'Organización'}
          </span>
          <ChevronDown size={11} className="text-muted-foreground flex-shrink-0" aria-hidden />
        </button>

        <span className="text-border text-sm select-none">/</span>

        <button className="flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-md hover:bg-muted transition-colors max-w-[160px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Branch</span>
          <span className="text-xs font-medium text-foreground truncate">
            {currentBranch?.name ?? 'Seleccionar'}
          </span>
          <ChevronDown size={11} className="text-muted-foreground flex-shrink-0" aria-hidden />
        </button>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-xs text-muted-foreground hover:border-muted-foreground/30 transition-colors">
          <Search size={12} aria-hidden />
          <span className="flex-1 text-left">Buscar alumnos, clases...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-background border border-border rounded px-1 text-[10px] py-0.5 leading-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Acciones */}
      <div className="ml-auto flex items-center gap-1">

        {/* Quick Create */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#2d4a20', color: '#F7F7F2' }}>
          <Plus size={13} aria-hidden />
          <span className="hidden sm:inline">Crear</span>
        </button>

        {/* Notificaciones */}
        <button
          title="Notificaciones"
          className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Bell size={15} aria-hidden />
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1"
            style={{ background: '#d45858', color: '#fff' }}
          >
            3
          </span>
        </button>

        <ThemeToggle />

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Usuario */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              color: 'var(--primary)',
              border: '0.5px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            }}
          >
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start min-w-0">
            <span className="text-xs font-medium text-foreground leading-tight whitespace-nowrap">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">
              {user?.primaryRole ?? ''}
            </span>
          </div>
          <ChevronDown size={11} className="text-muted-foreground hidden sm:block flex-shrink-0" aria-hidden />
        </button>
      </div>
    </header>
  )
}