'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import {
  AlertTriangle,
  CheckCircle2,
  Plug,
  Settings,
  TestTube2,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  PageHeader,
} from '@/components/shared'
import { ApiError } from '@/lib/api/client'
import type {
  CreatePaymentIntegrationRequest,
  IntegrationSyncJobResponse,
  PaymentIntegrationEnvironment,
  PaymentIntegrationResponse,
  PaymentIntegrationStatus,
  UpdatePaymentIntegrationRequest,
} from '@/lib/api/billing.types'
import { paymentProviders } from '@/lib/billing/providers'
import {
  useBranch,
  useCapabilities,
  useCreateIntegration,
  useOrganizationIntegrations,
  useTestIntegration,
  useUpdateIntegration,
} from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import { cn } from '@/lib/utils'

interface BillingIntegrationsPageProps {
  orgId: string
  branchId: string
}

const INTEGRATION_STATUS_LABEL_KEYS = {
  ACTIVE: 'integrationStatus.ACTIVE',
  INACTIVE: 'integrationStatus.INACTIVE',
  ERROR: 'integrationStatus.ERROR',
  DISCONNECTED: 'integrationStatus.DISCONNECTED',
} as const satisfies Record<PaymentIntegrationStatus, string>

const SYNC_STATUS_LABEL_KEYS = {
  PENDING: 'integrationSyncStatus.PENDING',
  RUNNING: 'integrationSyncStatus.RUNNING',
  SUCCEEDED: 'integrationSyncStatus.SUCCEEDED',
  FAILED: 'integrationSyncStatus.FAILED',
  PARTIALLY_SUCCEEDED: 'integrationSyncStatus.PARTIALLY_SUCCEEDED',
} as const satisfies Record<IntegrationSyncJobResponse['status'], string>

const READINESS_LABEL_KEYS = {
  READY: 'integrations.readiness.READY',
  NEEDS_CONFIGURATION: 'integrations.readiness.NEEDS_CONFIGURATION',
  ATTENTION_REQUIRED: 'integrations.readiness.ATTENTION_REQUIRED',
  PLACEHOLDER: 'integrations.readiness.PLACEHOLDER',
} as const

function billingKey(key: string) {
  return key.replace(/^billing\./, '')
}

export function BillingIntegrationsPage({
  orgId,
  branchId,
}: BillingIntegrationsPageProps) {
  const t = useTranslations('billing')
  const tn = useTranslations('navigation')
  const format = useFormatter()
  const [configOpen, setConfigOpen] = useState(false)

  const branchQuery = useBranch(orgId, branchId)
  const capabilitiesQuery = useCapabilities(orgId)
  const integrationsCapabilities =
    capabilitiesQuery.data?.capabilities.integrations
  const billingCapabilities = capabilitiesQuery.data?.capabilities.billing
  const canReadIntegrations = Boolean(
    integrationsCapabilities?.canReadIntegrations ||
      billingCapabilities?.canManagePaymentIntegrations
  )
  const canManageIntegrations = Boolean(
    integrationsCapabilities?.canManageIntegrations ||
      billingCapabilities?.canManagePaymentIntegrations
  )
  const canTestIntegrations = Boolean(
    integrationsCapabilities?.canTestIntegrations
  )
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const integrationsEnabled = hasCapabilities && canReadIntegrations

  const integrationsQuery = useOrganizationIntegrations(
    orgId,
    { provider: 'MERCADO_PAGO', branchId, limit: 20 },
    { enabled: integrationsEnabled }
  )

  const integrations = useMemo(
    () =>
      (integrationsQuery.data?.items ?? []).filter(
        (integration) =>
          integration.provider === 'MERCADO_PAGO' &&
          integration.scopeType === 'BRANCH' &&
          integration.branchId === branchId
      ),
    [branchId, integrationsQuery.data?.items]
  )
  const primaryIntegration = integrations[0] ?? null

  const forbiddenByCapabilities = hasCapabilities && !canReadIntegrations
  const forbiddenByBackend =
    integrationsQuery.error instanceof ApiError &&
    integrationsQuery.error.status === 403
  const error =
    capabilitiesQuery.error ??
    (!forbiddenByBackend ? integrationsQuery.error : null)
  const isLoading =
    capabilitiesQuery.isLoading ||
    (integrationsEnabled && integrationsQuery.isLoading)

  const header = (
    <PageHeader
      breadcrumbs={[
        { label: tn('labels.organization'), href: `/org/${orgId}` },
        { label: branchQuery.data?.name ?? tn('labels.branch') },
        { label: t('sections.integrations.title') },
      ]}
      title={t('sections.integrations.title')}
      subtitle={t('sections.integrations.subtitle')}
    />
  )

  const retry = () => {
    void capabilitiesQuery.refetch()
    void integrationsQuery.refetch()
  }

  if (forbiddenByCapabilities || forbiddenByBackend) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <ForbiddenState
          title={t('integrations.states.forbiddenTitle')}
          description={t('integrations.states.forbiddenDescription')}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        {header}
        <ErrorState error={error} onRetry={retry} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {header}

      <TextureCard>
        <TextureCardContent className="p-5 space-y-5">
          {isLoading ? (
            <IntegrationSkeleton />
          ) : (
            <MercadoPagoProviderCard
              orgId={orgId}
              integration={primaryIntegration}
              integrationsCount={integrations.length}
              canManageIntegrations={canManageIntegrations}
              canTestIntegrations={canTestIntegrations}
              onConfigure={() => setConfigOpen(true)}
              formatDate={(value) =>
                format.dateTime(new Date(value), {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              }
            />
          )}

          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {t('integrations.states.webhooksPlaceholder')}
          </p>
        </TextureCardContent>
      </TextureCard>

      {!isLoading && integrations.length === 0 ? (
        <TextureCard>
          <TextureCardContent className="p-5">
            <EmptyState
              dense
              icon={Plug}
              title={t('integrations.states.emptyTitle')}
              description={t('integrations.states.emptyDescription')}
            />
          </TextureCardContent>
        </TextureCard>
      ) : null}

      {configOpen ? (
        <MercadoPagoIntegrationForm
          orgId={orgId}
          branchId={branchId}
          open={configOpen}
          onOpenChange={setConfigOpen}
          integration={primaryIntegration}
        />
      ) : null}
    </div>
  )
}

function MercadoPagoProviderCard({
  orgId,
  integration,
  integrationsCount,
  canManageIntegrations,
  canTestIntegrations,
  onConfigure,
  formatDate,
}: {
  orgId: string
  integration: PaymentIntegrationResponse | null
  integrationsCount: number
  canManageIntegrations: boolean
  canTestIntegrations: boolean
  onConfigure: () => void
  formatDate: (value: string) => string
}) {
  const t = useTranslations('billing')
  const provider = paymentProviders.MERCADO_PAGO
  const testIntegration = useTestIntegration(orgId, integration?.id ?? '')
  const [testJob, setTestJob] = useState<IntegrationSyncJobResponse | null>(null)
  const configured = Boolean(integration)
  const supportsTest = Boolean(integration?.capabilities.supportsConnectionTest)

  const handleTest = () => {
    if (!integration) return
    setTestJob(null)
    testIntegration.mutate(undefined, {
      onSuccess: (job) => {
        setTestJob(job)
        notifySuccess(t('integrations.success.tested'))
      },
      onError: (error) => notifyError(t('integrations.errors.testFailed'), error),
    })
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Plug className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                {t(billingKey(provider.labelKey) as Parameters<typeof t>[0])}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  billingKey(provider.descriptionKey) as Parameters<typeof t>[0]
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={configured ? 'default' : 'outline'}>
              {configured
                ? t('integrations.states.configured')
                : t('integrations.states.notConfigured')}
            </Badge>
            {integration ? (
              <>
                <IntegrationStatusBadge status={integration.status} />
                <ReadinessBadge
                  readiness={integration.operational.readinessStatus}
                />
              </>
            ) : null}
            {integrationsCount > 1 ? (
              <Badge variant="outline">
                {t('integrations.total', { count: integrationsCount })}
              </Badge>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <InfoRow
              label={t('integrations.fields.displayName')}
              value={integration?.displayName ?? '-'}
            />
            <InfoRow
              label={t('integrations.fields.scopeType')}
              value={
                integration
                  ? t(`integrationScopeType.${integration.scopeType}`)
                  : '-'
              }
            />
            <InfoRow
              label={t('integrations.fields.environment')}
              value={
                integration?.configuration.environment
                  ? t(
                      `integrationEnvironment.${integration.configuration.environment}`
                    )
                  : t('integrations.states.environmentUnknown')
              }
            />
            <InfoRow
              label={t('integrations.fields.updatedAt')}
              value={integration ? formatDate(integration.updatedAt) : '-'}
            />
            <InfoRow
              label={t('integrations.fields.lastSyncStatus')}
              value={
                integration?.lastSyncStatus
                  ? t(`integrationSyncStatus.${integration.lastSyncStatus}`)
                  : '-'
              }
            />
            <InfoRow
              label={t('integrations.fields.lastSyncError')}
              value={integration?.lastSyncError ?? '-'}
            />
          </dl>

          {integration ? (
            <>
              <ConfigurationFlags integration={integration} />
              <WebhookSummary integration={integration} formatDate={formatDate} />
              {testJob ? <TestJobSummary job={testJob} /> : null}
            </>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canManageIntegrations ? (
            <Button type="button" variant="outline" onClick={onConfigure}>
              <Settings className="h-4 w-4" />
              {configured
                ? t('integrations.actions.edit')
                : t('integrations.actions.configure')}
            </Button>
          ) : null}
          {integration && canTestIntegrations && supportsTest ? (
            <Button
              type="button"
              variant="outline"
              disabled={testIntegration.isPending}
              onClick={handleTest}
            >
              <TestTube2 className="h-4 w-4" />
              {testIntegration.isPending
                ? t('integrations.actions.testing')
                : t('integrations.actions.test')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ConfigurationFlags({
  integration,
}: {
  integration: PaymentIntegrationResponse
}) {
  const t = useTranslations('billing')
  const flags = [
    {
      key: 'credentialsConfigured',
      label: t('integrations.flags.credentialsConfigured'),
      value: integration.configuration.credentialsConfigured,
    },
    {
      key: 'publicKeyConfigured',
      label: t('integrations.flags.publicKeyConfigured'),
      value: integration.configuration.publicKeyConfigured,
    },
    {
      key: 'applicationIdConfigured',
      label: t('integrations.flags.applicationIdConfigured'),
      value: integration.configuration.applicationIdConfigured,
    },
    {
      key: 'webhookSecretConfigured',
      label: t('integrations.flags.webhookSecretConfigured'),
      value: integration.configuration.webhookSecretConfigured,
    },
    {
      key: 'notificationUrlConfigured',
      label: t('integrations.flags.notificationUrlConfigured'),
      value: integration.configuration.notificationUrlConfigured,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag) => (
        <Badge
          key={flag.key}
          variant="outline"
          className={cn(
            'gap-1',
            flag.value
              ? 'border-emerald-500/40 text-emerald-700'
              : 'border-muted-foreground/30 text-muted-foreground'
          )}
        >
          {flag.value ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {flag.label}
        </Badge>
      ))}
    </div>
  )
}

function WebhookSummary({
  integration,
  formatDate,
}: {
  integration: PaymentIntegrationResponse
  formatDate: (value: string) => string
}) {
  const t = useTranslations('billing')
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <InfoRow
          label={t('webhookEvents.fields.supported')}
          value={
            integration.webhook.supported
              ? t('integrations.boolean.yes')
              : t('integrations.boolean.no')
          }
        />
        <InfoRow
          label={t('webhookEvents.fields.eventsTotal')}
          value={String(integration.webhook.eventsTotal)}
        />
        <InfoRow
          label={t('webhookEvents.fields.failedEventsTotal')}
          value={String(integration.webhook.failedEventsTotal)}
        />
        <InfoRow
          label={t('webhookEvents.fields.lastReceivedAt')}
          value={
            integration.webhook.lastReceivedAt
              ? formatDate(integration.webhook.lastReceivedAt)
              : '-'
          }
        />
      </div>
    </div>
  )
}

function TestJobSummary({ job }: { job: IntegrationSyncJobResponse }) {
  const t = useTranslations('billing')
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2 text-xs',
        job.status === 'FAILED'
          ? 'border-destructive/30 bg-destructive/5 text-destructive'
          : 'border-border bg-muted/20 text-muted-foreground'
      )}
    >
      <p className="font-medium text-foreground">
        {t('integrations.testResult', {
          status: t(SYNC_STATUS_LABEL_KEYS[job.status] as Parameters<typeof t>[0]),
        })}
      </p>
      {job.status === 'FAILED' && job.errorMessage ? (
        <p className="mt-1">{job.errorMessage}</p>
      ) : null}
    </div>
  )
}

function IntegrationStatusBadge({
  status,
}: {
  status: PaymentIntegrationStatus
}) {
  const t = useTranslations('billing')
  const iconClassName = 'h-3.5 w-3.5'
  const Icon =
    status === 'ACTIVE'
      ? CheckCircle2
      : status === 'ERROR'
        ? AlertTriangle
        : XCircle

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1',
        status === 'ACTIVE' && 'border-emerald-500/40 text-emerald-700',
        status === 'ERROR' && 'border-destructive/40 text-destructive',
        (status === 'INACTIVE' || status === 'DISCONNECTED') &&
          'border-muted-foreground/30 text-muted-foreground'
      )}
    >
      <Icon className={iconClassName} />
      {t(INTEGRATION_STATUS_LABEL_KEYS[status] as Parameters<typeof t>[0])}
    </Badge>
  )
}

function ReadinessBadge({
  readiness,
}: {
  readiness: PaymentIntegrationResponse['operational']['readinessStatus']
}) {
  const t = useTranslations('billing')
  return (
    <Badge
      variant="outline"
      className={cn(
        readiness === 'READY' && 'border-emerald-500/40 text-emerald-700',
        readiness === 'ATTENTION_REQUIRED' &&
          'border-destructive/40 text-destructive',
        readiness === 'NEEDS_CONFIGURATION' &&
          'border-amber-500/40 text-amber-700',
        readiness === 'PLACEHOLDER' &&
          'border-muted-foreground/30 text-muted-foreground'
      )}
    >
      {t(READINESS_LABEL_KEYS[readiness] as Parameters<typeof t>[0])}
    </Badge>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-foreground">{value}</dd>
    </div>
  )
}

function MercadoPagoIntegrationForm({
  orgId,
  branchId,
  open,
  onOpenChange,
  integration,
}: {
  orgId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: PaymentIntegrationResponse | null
}) {
  const t = useTranslations('billing')
  const provider = paymentProviders.MERCADO_PAGO
  const createIntegration = useCreateIntegration(orgId)
  const updateIntegration = useUpdateIntegration(orgId, integration?.id ?? '')
  const isEdit = Boolean(integration)
  const [displayName, setDisplayName] = useState(
    integration?.displayName ?? t('providers.mercadoPago.name')
  )
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(
    integration?.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
  )
  const [environment, setEnvironment] =
    useState<PaymentIntegrationEnvironment>(
      integration?.configuration.environment ?? 'test'
    )
  const [updateCredentials, setUpdateCredentials] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const credentialsComplete =
    Boolean(accessToken.trim()) &&
    Boolean(applicationId.trim()) &&
    Boolean(webhookSecret.trim())
  const canActivateWithStoredConfig = Boolean(
    integration?.configuration.activationReady
  )
  const isPending = createIntegration.isPending || updateIntegration.isPending

  const close = () => onOpenChange(false)

  const buildConfigJson = () => ({
    accessToken: accessToken.trim(),
    ...(publicKey.trim() ? { publicKey: publicKey.trim() } : {}),
    applicationId: applicationId.trim(),
    webhookSecret: webhookSecret.trim(),
    environment,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanDisplayName = displayName.trim()
    setFormError(null)

    if (!cleanDisplayName) {
      setFormError(t('integrations.errors.displayNameRequired'))
      return
    }

    if (updateCredentials && !credentialsComplete) {
      setFormError(t('integrations.errors.credentialsRequired'))
      return
    }

    if (
      status === 'ACTIVE' &&
      !canActivateWithStoredConfig &&
      !credentialsComplete
    ) {
      setFormError(t('integrations.errors.activationBlocked'))
      return
    }

    if (integration) {
      const body: UpdatePaymentIntegrationRequest = {
        displayName: cleanDisplayName,
        status,
      }
      if (updateCredentials) body.configJson = buildConfigJson()
      updateIntegration.mutate(body, {
        onSuccess: () => {
          notifySuccess(t('integrations.success.updated'))
          close()
        },
        onError: (error) =>
          notifyError(t('integrations.errors.saveFailed'), error),
      })
      return
    }

    const body: CreatePaymentIntegrationRequest = {
      provider: 'MERCADO_PAGO',
      scopeType: 'BRANCH',
      branchId,
      displayName: cleanDisplayName,
      status,
    }
    if (updateCredentials) body.configJson = buildConfigJson()
    createIntegration.mutate(body, {
      onSuccess: () => {
        notifySuccess(t('integrations.success.created'))
        close()
      },
      onError: (error) =>
        notifyError(t('integrations.errors.saveFailed'), error),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(billingKey(provider.labelKey) as Parameters<typeof t>[0])}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('integrations.dialog.editDescription')
              : t('integrations.dialog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mp-display-name">
                {t('integrations.fields.displayName')}
              </Label>
              <Input
                id="mp-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={120}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('integrations.fields.status')}</Label>
              <Select
                value={status}
                onValueChange={(value: 'ACTIVE' | 'INACTIVE') =>
                  setStatus(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INACTIVE">
                    {t('integrationStatus.INACTIVE')}
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    {t('integrationStatus.ACTIVE')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('integrations.fields.environment')}</Label>
              <Select
                value={environment}
                onValueChange={(value: PaymentIntegrationEnvironment) =>
                  setEnvironment(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">
                    {t('integrationEnvironment.test')}
                  </SelectItem>
                  <SelectItem value="production">
                    {t('integrationEnvironment.production')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {integration ? <ConfigurationFlags integration={integration} /> : null}

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="mp-update-credentials"
                checked={updateCredentials}
                onCheckedChange={(checked) =>
                  setUpdateCredentials(checked === true)
                }
              />
              <div className="space-y-1">
                <Label htmlFor="mp-update-credentials">
                  {t('integrations.credentials.update')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isEdit
                    ? t('integrations.credentials.updateDescription')
                    : t('integrations.credentials.createDescription')}
                </p>
              </div>
            </div>

            {updateCredentials ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SecretField
                  id="mp-access-token"
                  label={t('integrations.credentials.accessToken')}
                  value={accessToken}
                  onChange={setAccessToken}
                  required
                />
                <SecretField
                  id="mp-public-key"
                  label={t('integrations.credentials.publicKey')}
                  value={publicKey}
                  onChange={setPublicKey}
                  required={false}
                />
                <div className="space-y-2">
                  <Label htmlFor="mp-application-id">
                    {t('integrations.credentials.applicationId')}
                  </Label>
                  <Input
                    id="mp-application-id"
                    value={applicationId}
                    onChange={(event) => setApplicationId(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                <SecretField
                  id="mp-webhook-secret"
                  label={t('integrations.credentials.webhookSecret')}
                  value={webhookSecret}
                  onChange={setWebhookSecret}
                  required
                />
              </div>
            ) : null}
          </div>

          {status === 'ACTIVE' &&
          !canActivateWithStoredConfig &&
          !credentialsComplete ? (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-800">
              {t('integrations.errors.activationBlocked')}
            </p>
          ) : null}

          {formError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              {t('integrations.actions.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t('integrations.actions.saving')
                : t('integrations.actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SecretField({
  id,
  label,
  value,
  required,
  onChange,
}: {
  id: string
  label: string
  value: string
  required: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="new-password"
      />
    </div>
  )
}

function IntegrationSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-3 w-72 max-w-full animate-pulse rounded-md bg-muted/70" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-1">
            <div className="h-3 w-24 animate-pulse rounded-md bg-muted/70" />
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
