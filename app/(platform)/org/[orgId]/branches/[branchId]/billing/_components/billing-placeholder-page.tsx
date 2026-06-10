'use client'

import { useTranslations } from 'next-intl'
import {
  BadgeDollarSign,
  CreditCard,
  FileText,
  Plug,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState, PageHeader } from '@/components/shared'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'

type BillingPlaceholderSection =
  | 'plans'
  | 'charges'
  | 'payments'
  | 'financialStatuses'
  | 'policy'
  | 'integrations'

const ICONS: Record<BillingPlaceholderSection, LucideIcon> = {
  plans: FileText,
  charges: ReceiptText,
  payments: BadgeDollarSign,
  financialStatuses: ShieldCheck,
  policy: CreditCard,
  integrations: Plug,
}

interface BillingPlaceholderPageProps {
  section: BillingPlaceholderSection
}

export function BillingPlaceholderPage({
  section,
}: BillingPlaceholderPageProps) {
  const t = useTranslations('billing.sections')
  const Icon = ICONS[section]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t(`${section}.title`)}
        subtitle={t(`${section}.subtitle`)}
      />

      <TextureCard>
        <TextureCardContent className="p-5">
          <EmptyState
            icon={Icon}
            title={t(`${section}.emptyTitle`)}
            description={t(`${section}.emptyDescription`)}
            dense
          />
        </TextureCardContent>
      </TextureCard>
    </div>
  )
}
