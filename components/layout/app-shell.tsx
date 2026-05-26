'use client'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppShellProps {
  orgId: string
  branchId?: string
  children: React.ReactNode
}

/**
 * AppShell — contenedor principal del layout de la plataforma.
 *
 * ┌──────────┬─────────────────────────────────┐
 * │          │ Topbar  h-[52px]                │
 * │ Sidebar  ├─────────────────────────────────┤
 * │ 220/56px │ Main content (scrollable)       │
 * └──────────┴─────────────────────────────────┘
 */
export function AppShell({ orgId, branchId, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgId={orgId} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar orgId={orgId} branchId={branchId} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-background"
        >
          {children}
        </main>
      </div>
    </div>
  )
}