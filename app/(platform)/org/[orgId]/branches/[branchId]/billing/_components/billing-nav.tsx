'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  BadgeDollarSign,
  CreditCard,
  FileText,
  LayoutDashboard,
  Plug,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BillingNavProps {
  orgId: string
  branchId: string
}

interface BillingNavItem {
  key: string
  labelKey: string
  href: string
  icon: LucideIcon
}

export function BillingNav({ orgId, branchId }: BillingNavProps) {
  const t = useTranslations('billing.nav')
  const pathname = usePathname()
  const base = `/org/${orgId}/branches/${branchId}/billing`

  const items: BillingNavItem[] = [
    {
      key: 'dashboard',
      labelKey: 'dashboard',
      href: `${base}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      key: 'plans',
      labelKey: 'plans',
      href: `${base}/plans`,
      icon: FileText,
    },
    {
      key: 'charges',
      labelKey: 'charges',
      href: `${base}/charges`,
      icon: ReceiptText,
    },
    {
      key: 'payments',
      labelKey: 'payments',
      href: `${base}/payments`,
      icon: BadgeDollarSign,
    },
    {
      key: 'financial-statuses',
      labelKey: 'financialStatuses',
      href: `${base}/financial-statuses`,
      icon: ShieldCheck,
    },
    {
      key: 'policy',
      labelKey: 'policy',
      href: `${base}/policy`,
      icon: CreditCard,
    },
    {
      key: 'integrations',
      labelKey: 'integrations',
      href: `${base}/integrations`,
      icon: Plug,
    },
  ]

  return (
    <nav
      aria-label={t('aria')}
      className="border-b border-border bg-background/95 px-6"
    >
      <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
        {items.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(item.labelKey as Parameters<typeof t>[0])}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
