'use client'

import { useMemo, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Copy, ExternalLink, LinkIcon, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'
import type {
  BillingChargeListItem,
  MercadoPagoPreferenceResponse,
} from '@/lib/api/billing.types'
import {
  useCreateMercadoPagoPreference,
  useInvalidateBillingPaymentState,
} from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

interface MercadoPagoCheckoutProAssistedLinkProps {
  orgId: string
  branchId: string
  charge: BillingChargeListItem
  onVerifyStatus: () => void
}

const COLLECTIBLE_STATUSES = new Set([
  'PENDING',
  'PARTIALLY_PAID',
  'OVERDUE',
])

const TERMINAL_STATUSES = new Set(['PAID', 'CANCELED', 'VOID'])

export function MercadoPagoCheckoutProAssistedLink({
  orgId,
  branchId,
  charge,
  onVerifyStatus,
}: MercadoPagoCheckoutProAssistedLinkProps) {
  const t = useTranslations('billing.charges.checkoutPro')
  const format = useFormatter()
  const [preference, setPreference] =
    useState<MercadoPagoPreferenceResponse | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = useCreateMercadoPagoPreference(
    orgId,
    branchId,
    charge.studentId,
    charge.id
  )
  const invalidateBillingPaymentState = useInvalidateBillingPaymentState(
    orgId,
    branchId,
    charge.studentId
  )

  const checkoutUrl = useMemo(() => {
    if (!preference) return null
    const environment = preference.environment.toLowerCase()
    if (
      (environment === 'sandbox' || environment === 'test') &&
      preference.sandboxInitPoint
    ) {
      return preference.sandboxInitPoint
    }
    return preference.initPoint || preference.sandboxInitPoint || null
  }, [preference])

  const isCollectible =
    Number.parseFloat(charge.outstandingAmount) > 0 &&
    COLLECTIBLE_STATUSES.has(charge.effectiveStatus) &&
    !TERMINAL_STATUSES.has(charge.effectiveStatus)

  if (!isCollectible) return null

  const amountFormatted = preference
    ? format.number(preference.amount, {
        style: 'currency',
        currency: preference.currency,
      })
    : null

  const generatePreference = () => {
    setLocalError(null)
    mutation.mutate(undefined, {
      onSuccess: (created) => {
        setPreference(created)
        notifySuccess(t('success.generated'))
        if (!created.initPoint && !created.sandboxInitPoint) {
          setLocalError(t('errors.missingUrl'))
        }
      },
      onError: (error) => {
        notifyMercadoPagoPreferenceError(error, t)
      },
    })
  }

  const copyLink = async () => {
    if (!checkoutUrl) {
      setLocalError(t('errors.missingUrl'))
      return
    }

    try {
      await navigator.clipboard.writeText(checkoutUrl)
      notifySuccess(t('success.copied'))
    } catch (error) {
      notifyError(t('errors.copyFailed'), error)
    }
  }

  const openCheckout = () => {
    if (!checkoutUrl) {
      setLocalError(t('errors.missingUrl'))
      return
    }

    window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }

  const verifyStatus = () => {
    invalidateBillingPaymentState()
    onVerifyStatus()
    notifySuccess(t('success.verifying'))
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <LinkIcon className="h-4 w-4" />
          {preference ? t('generatedTitle') : t('title')}
        </div>
        <p className="text-xs text-muted-foreground">
          {preference ? t('generatedDescription') : t('description')}
        </p>
      </div>

      {preference ? (
        <div className="space-y-2 rounded-md border border-border bg-background p-3 text-xs">
          {amountFormatted ? (
            <DetailLine label={t('fields.amount')} value={amountFormatted} />
          ) : null}
          <DetailLine label={t('fields.currency')} value={preference.currency} />
          <DetailLine
            label={t('fields.reference')}
            value={preference.externalReference}
          />
          <DetailLine
            label={t('fields.preferenceId')}
            value={preference.preferenceId}
          />
          {preference.reused ? (
            <p className="text-muted-foreground">{t('states.reused')}</p>
          ) : null}
        </div>
      ) : null}

      {localError ? (
        <p className="text-xs text-destructive">{localError}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">{t('securityNote')}</p>

      <div className="flex flex-wrap gap-2">
        {!preference ? (
          <Button
            type="button"
            size="sm"
            onClick={generatePreference}
            disabled={mutation.isPending}
          >
            <LinkIcon className="h-4 w-4" />
            {mutation.isPending ? t('actions.generating') : t('actions.generate')}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={copyLink}
              disabled={!checkoutUrl}
            >
              <Copy className="h-4 w-4" />
              {t('actions.copy')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={openCheckout}
              disabled={!checkoutUrl}
            >
              <ExternalLink className="h-4 w-4" />
              {t('actions.open')}
            </Button>
          </>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={verifyStatus}>
          <RefreshCw className="h-4 w-4" />
          {t('actions.verify')}
        </Button>
      </div>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[220px] break-words text-right text-foreground">
        {value}
      </span>
    </div>
  )
}

function notifyMercadoPagoPreferenceError(
  error: unknown,
  t: ReturnType<typeof useTranslations<'billing.charges.checkoutPro'>>
) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      notifyError(t('errors.forbidden'), error)
      return
    }
    if (error.status === 404) {
      notifyError(t('errors.notFound'), error)
      return
    }
    if (error.status === 409) {
      notifyError(t('errors.conflict'), error)
      return
    }
    if (error.status === 503) {
      notifyError(t('errors.notConfigured'), error)
      return
    }
  }

  notifyError(t('errors.generic'), error)
}
