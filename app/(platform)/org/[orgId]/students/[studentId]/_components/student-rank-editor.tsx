'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
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
import { ApiError, authApi } from '@/lib/api/client'
import type { PromotionRank, StudentDetail } from '@/lib/api/types'
import {
  useCapabilities,
  usePromotionRankCatalog,
  useUpdateMembershipTechnicalProfile,
} from '@/lib/hooks'
import { notifyError, notifySuccess } from '@/lib/utils/toast'

const STRIPE_OPTIONS = [0, 1, 2, 3, 4] as const

export function StudentRankEditor({
  orgId,
  student,
}: {
  orgId: string
  student: StudentDetail
}) {
  const t = useTranslations('students.rankEditor')
  const catalogQuery = usePromotionRankCatalog()
  const capabilitiesQuery = useCapabilities(orgId)
  const mutation = useUpdateMembershipTechnicalProfile(orgId)
  const [open, setOpen] = useState(false)
  const [selectedBelt, setSelectedBelt] = useState<PromotionRank | ''>(
    student.currentBelt ?? '',
  )
  const [selectedStripes, setSelectedStripes] = useState(
    String(clampStripes(student.currentStripes)),
  )
  const [stepUpOpen, setStepUpOpen] = useState(false)
  const [stepUpPassword, setStepUpPassword] = useState('')
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [isStepUpPending, setIsStepUpPending] = useState(false)

  const rankOptions =
    catalogQuery.data?.filter((rank) => rank.track === student.promotionTrack) ?? []
  const membershipId = student.membershipId
  const canEditTechnicalProfile =
    capabilitiesQuery.data?.capabilities?.usersMemberships
      ?.canManageRolesAndScopes ?? false
  const canSubmit = Boolean(
    membershipId &&
      canEditTechnicalProfile &&
      selectedBelt &&
      STRIPE_OPTIONS.includes(Number(selectedStripes) as 0 | 1 | 2 | 3 | 4),
  )

  const resetForm = () => {
    setSelectedBelt(student.currentBelt ?? rankOptions[0]?.rank ?? '')
    setSelectedStripes(String(clampStripes(student.currentStripes)))
  }

  const triggerSave = () => {
    if (!membershipId || !selectedBelt) return

    const currentStripes = Number(selectedStripes)
    if (!STRIPE_OPTIONS.includes(currentStripes as 0 | 1 | 2 | 3 | 4)) {
      notifyError(t('errors.invalidStripes'))
      return
    }

    mutation.mutate(
      {
        membershipId,
        studentId: student.id,
        branchId: student.primaryBranchId,
        currentBelt: selectedBelt,
        currentStripes,
      },
      {
        onSuccess: () => {
          notifySuccess(t('success'))
          setOpen(false)
        },
        onError: (error) => {
          if (readApiErrorCode(error) === 'RECENT_AUTH_REQUIRED') {
            setStepUpError(null)
            setStepUpOpen(true)
            return
          }

          notifyError(resolveUpdateError(error, t), error)
        },
      },
    )
  }

  const confirmStepUp = async () => {
    const password = stepUpPassword.trim()
    if (!password) {
      setStepUpError(t('stepUp.errors.required'))
      return
    }

    setIsStepUpPending(true)
    setStepUpError(null)

    try {
      await authApi.stepUp(password)
      setStepUpOpen(false)
      setStepUpPassword('')
      triggerSave()
    } catch (error) {
      const message =
        error instanceof ApiError && (error.status === 401 || error.status === 403)
          ? t('stepUp.errors.invalid')
          : t('stepUp.errors.generic')
      setStepUpError(message)
      notifyError(message, error)
    } finally {
      setIsStepUpPending(false)
    }
  }

  if (!membershipId) {
    return (
      <div className="max-w-[340px] rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{t('noMembership')}</span>
        </div>
      </div>
    )
  }

  if (capabilitiesQuery.isLoading || !canEditTechnicalProfile) {
    return null
  }

  return (
    <>
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={() => {
          resetForm()
          setOpen(true)
        }}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        {t('action')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="student-rank-belt">{t('belt')}</Label>
              <Select
                value={selectedBelt}
                onValueChange={(value) => setSelectedBelt(value as PromotionRank)}
                disabled={catalogQuery.isLoading || mutation.isPending}
              >
                <SelectTrigger id="student-rank-belt">
                  <SelectValue placeholder={t('beltPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {rankOptions.map((rank) => (
                    <SelectItem key={rank.rank} value={rank.rank}>
                      {rank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="student-rank-stripes">{t('stripes')}</Label>
              <Select
                value={selectedStripes}
                onValueChange={setSelectedStripes}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="student-rank-stripes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRIPE_OPTIONS.map((stripe) => (
                    <SelectItem key={stripe} value={String(stripe)}>
                      {t('stripeOption', { count: stripe })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="button" onClick={triggerSave} disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mutation.isPending ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={stepUpOpen}
        onOpenChange={(nextOpen) => {
          if (isStepUpPending) return
          setStepUpOpen(nextOpen)
          if (!nextOpen) {
            setStepUpPassword('')
            setStepUpError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('stepUp.title')}</DialogTitle>
            <DialogDescription>{t('stepUp.description')}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              void confirmStepUp()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="student-rank-step-up-password">
                {t('stepUp.passwordLabel')}
              </Label>
              <Input
                id="student-rank-step-up-password"
                type="password"
                value={stepUpPassword}
                onChange={(event) => setStepUpPassword(event.target.value)}
                placeholder={t('stepUp.passwordPlaceholder')}
                disabled={isStepUpPending}
                autoComplete="current-password"
              />
              {stepUpError && (
                <p className="text-xs text-destructive">{stepUpError}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStepUpOpen(false)}
                disabled={isStepUpPending}
              >
                {t('stepUp.cancel')}
              </Button>
              <Button type="submit" disabled={isStepUpPending}>
                {isStepUpPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isStepUpPending ? t('stepUp.confirming') : t('stepUp.submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function resolveUpdateError(
  error: unknown,
  t: ReturnType<typeof useTranslations<'students.rankEditor'>>,
) {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 422) return t('errors.validation')
    if (error.status === 403) return t('errors.forbidden')
    if (error.status === 404) return t('errors.notFound')
  }

  return t('errors.generic')
}

function readApiErrorCode(error: unknown) {
  if (!(error instanceof ApiError)) return null
  const body = error.body
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  const code = record.code ?? record.errorCode
  return typeof code === 'string' ? code : null
}

function clampStripes(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(4, value))
}
