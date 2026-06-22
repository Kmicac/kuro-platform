'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ArrowRight,
  Award,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { KuroLogo } from '@/components/kuro/logo'
import { BackgroundPaths } from '@/components/ui/background-paths'
import { BgAnimateButton } from '@/components/ui/bg-animate-button'
import { authApi, ApiError, principalToSession } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

type FormState =
  | 'idle' | 'loading' | 'error:credentials'
  | 'error:orgRequired' | 'error:forbidden'
  | 'error:network' | 'success'

const ERROR_KEY: Record<
  string,
  'invalidCredentials' | 'organizationRequired' | 'forbidden' | 'network'
> = {
  'error:credentials':  'invalidCredentials',
  'error:orgRequired':  'organizationRequired',
  'error:forbidden':    'forbidden',
  'error:network':      'network',
}

const FEATURES = [
  { Icon: BarChart3,   key: 'clarity' },
  { Icon: ShieldCheck, key: 'governance' },
  { Icon: Award,       key: 'legacy' },
] as const

// Estilos compartidos de inputs (tokens KURO). h-11 = 44px; bg-popover
// (#13181A) un escalón más oscuro que la card; placeholder en --text-tertiary;
// focus solo cambia el borde a --primary (sin ring/glow).
const INPUT_CLASS =
  'h-11 w-full rounded-md border border-input bg-popover px-3 text-sm text-foreground outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)]'
const LABEL_CLASS = 'mb-2 block text-sm font-medium text-foreground'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const hydrateSession = useAuthStore((s) => s.hydrateSession)

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [orgSlug,   setOrgSlug]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [formState, setFormState] = useState<FormState>('idle')

  const isLoading = formState === 'loading'
  const canSubmit = Boolean(email && password && !isLoading)
  const errorMsg  = formState.startsWith('error:') ? t(`errors.${ERROR_KEY[formState]}`) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setFormState('loading')
    try {
      const res = await authApi.login(email, password, orgSlug || undefined)
      hydrateSession(principalToSession(res.accessToken, res.principal))

      const membership = res.principal.membership
      const orgId = membership?.organizationId
      if (!membership || !orgId) {
        router.replace('/login')
        return
      }

      setFormState('success')

      const roles = membership.assignedRoles ?? []
      const isOrgWide =
        membership.scopeType === 'ORGANIZATION_WIDE' ||
        roles.includes('MESTRE') ||
        roles.includes('ORG_ADMIN')

      if (isOrgWide) {
        router.push(`/org/${orgId}`)
      } else if (membership.primaryBranchId) {
        router.push(`/org/${orgId}/branches/${membership.primaryBranchId}`)
      } else {
        router.push(`/org/${orgId}`)
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          const msg = ((err.body as { message?: string } | null)?.message ?? '').toLowerCase()
          setFormState(msg.includes('organization') || msg.includes('slug') ? 'error:orgRequired' : 'error:credentials')
        } else if (err.status === 403) {
          setFormState('error:forbidden')
        } else {
          setFormState('error:network')
        }
      } else {
        setFormState('error:network')
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Columna izquierda — marketing ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-background p-12 lg:flex lg:w-1/2 xl:p-20">
        {/* KURO custom: Background Paths verde sutil, draw-in al mount. */}
        <BackgroundPaths />

        {/* Contenido superior */}
        <div className="relative z-10">
          <KuroLogo forceDark size="lg" />
          <p className="label-mono mt-3 text-[10px] tracking-[0.2em]">
            {t('showcase.tagline')}
          </p>
          <div className="mt-7 mb-7 h-px w-9 bg-primary/60" />
          <h1 className="font-display max-w-xl text-4xl font-medium leading-[1.12] text-foreground xl:text-5xl">
            {t('showcase.headlineLine1')}
            <br />
            {t('showcase.headlineLine2')}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t('showcase.subheadLine1')} {t('showcase.subheadLine2')}
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 flex flex-col gap-3">
          {FEATURES.map(({ Icon, key }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-lg border border-primary/15 bg-primary/[0.04] p-4 backdrop-blur-sm"
            >
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                strokeWidth={1.5}
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(`features.${key}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="label-mono relative z-10 text-[10px] text-[var(--text-tertiary)]">
          {t('showcase.roots')}
        </p>
      </div>

      {/* ── Columna derecha — formulario ── */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-[400px]">
          {/* Header — FUERA de la card */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t('form.welcome')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('form.subtitle')}
            </p>
          </div>

          {/* Card — superficie plana --surface-card */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="k-email" className={LABEL_CLASS}>
                    {t('form.emailLabel')}
                  </label>
                  <input
                    id="k-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('form.emailPlaceholder')}
                    className={cn(INPUT_CLASS, 'font-mono')}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="k-pwd"
                      className="text-sm font-medium text-foreground"
                    >
                      {t('form.passwordLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(t('errors.forgotPasswordUnavailable'))
                      }
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t('form.forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="k-pwd"
                      type={showPwd ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(INPUT_CLASS, 'pr-10')}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPwd ? t('form.passwordHide') : t('form.passwordShow')
                      }
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPwd ? (
                        <EyeOff size={18} strokeWidth={1.5} aria-hidden />
                      ) : (
                        <Eye size={18} strokeWidth={1.5} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>

                {/* Organización */}
                <div>
                  <label htmlFor="k-org" className={LABEL_CLASS}>
                    {t('form.orgLabel')}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {t('form.orgOptional')}
                    </span>
                  </label>
                  <input
                    id="k-org"
                    type="text"
                    value={orgSlug}
                    onChange={(e) =>
                      setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                    }
                    placeholder={t('form.orgPlaceholder')}
                    className={cn(
                      INPUT_CLASS,
                      'font-mono',
                      formState === 'error:orgRequired' &&
                        'border-[var(--kuro-warning)]',
                    )}
                  />
                  <p className="mt-2 font-mono text-[11px] uppercase leading-relaxed tracking-wide text-[var(--text-tertiary)]">
                    {t('form.orgHint')}
                  </p>
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="surface-danger rounded-md border px-3 py-2.5 text-xs leading-relaxed"
                  >
                    {errorMsg}
                  </div>
                )}
              </div>

              {/* Botón — Bg Animate Button vendorizado (solo cambia el copy) */}
              <BgAnimateButton
                type="submit"
                disabled={!canSubmit}
                className="mt-6 h-11 w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    {t('form.submitting')}
                  </>
                ) : formState === 'success' ? (
                  t('form.redirecting')
                ) : (
                  <>
                    {t('form.submit')}
                    <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
                  </>
                )}
              </BgAnimateButton>
            </form>
          </div>

          {/* Badges — FUERA de la card */}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
              <Lock size={14} strokeWidth={1.5} aria-hidden />
              {t('badge.secureAccess')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles size={14} strokeWidth={1.5} aria-hidden />
              {t('badge.platform')}
            </span>
          </div>

          {/* Nota — FUERA de la card, alineada a la izquierda */}
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              {t('footer.noteLabel')}
            </span>{' '}
            {t('footer.note')}
          </p>
        </div>
      </div>
    </div>
  )
}
