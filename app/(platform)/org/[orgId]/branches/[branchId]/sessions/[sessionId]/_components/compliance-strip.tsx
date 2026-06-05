'use client'

import { useTranslations } from 'next-intl'
import { CreditCard, FileCheck2 } from 'lucide-react'

/**
 * Franja de compliance (waiver + pagos). El backend NO expone hoy un agregado
 * por sesión de waivers ni de estado de pagos (billing es por filial/alumno y
 * depende de Mercado Pago). Se renderiza la estructura del diseño con un estado
 * sobrio "no integrado" — NO se inventan datos.
 */
export function ComplianceStrip() {
  const t = useTranslations('class-detail.compliance')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ComplianceCard icon={FileCheck2} title={t('waiverTitle')} />
      <ComplianceCard icon={CreditCard} title={t('paymentTitle')} />
    </div>
  )
}

function ComplianceCard({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  const t = useTranslations('class-detail.compliance')
  return (
    <section className="flex items-center gap-3 rounded border border-border bg-card p-4">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="label-mono">{title}</p>
        <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
          {t('unavailable')}
          <span className="text-muted-foreground"> · {t('externalDep')}</span>
        </p>
      </div>
    </section>
  )
}
