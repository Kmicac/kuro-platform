'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  eyebrow?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  eyebrow,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('space-y-2', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          {breadcrumbs.map((b, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <span key={`${b.label}-${i}`} className="flex items-center gap-1.5">
                {b.href && !isLast ? (
                  <Link
                    href={b.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {b.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="h-3 w-3" aria-hidden />}
              </span>
            )
          })}
        </nav>
      )}

      {eyebrow && (
        <p className="text-[11px] tracking-widest uppercase text-muted-foreground font-medium">
          {eyebrow}
        </p>
      )}

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {(actions || meta) && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {meta}
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
