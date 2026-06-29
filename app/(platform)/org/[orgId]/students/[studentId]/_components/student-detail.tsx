'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useFormatter, useTranslations } from 'next-intl'
import {
  Award,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Hash,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
  UserCircle2,
  Users,
} from 'lucide-react'
import {
  TextureCard,
  TextureCardContent,
} from '@/components/ui/texture-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api/client'
import {
  useCapabilities,
  useCreateStudentTrainingNote,
  usePromotionRankResolver,
  useStudent,
  useStudentTrainingNotes,
} from '@/lib/hooks'
import { BeltBadge, StatusBadge } from '@/components/kuro'
import { PersonAvatar } from '@/components/common/person-avatar'
import { ErrorState } from '@/components/shared'
import type {
  PromotionRankCatalogEntry,
  StudentDetail as StudentDetailType,
  TrainingNote,
  TrainingNoteActor,
  TrainingNoteType,
  TrainingNoteVisibility,
} from '@/lib/api/types'
import { notifyError, notifySuccess } from '@/lib/utils/toast'
import { cn } from '@/lib/utils'
import { StudentMembershipPanel } from './student-membership-panel'
import { StudentRankEditor } from './student-rank-editor'

interface StudentDetailProps {
  orgId: string
  studentId: string
}

export function StudentDetail({ orgId, studentId }: StudentDetailProps) {
  const te = useTranslations('errors')
  const query = useStudent(orgId, studentId)
  const resolveBelt = usePromotionRankResolver()

  if (query.isLoading) {
    return <DetailSkeleton />
  }

  if (query.error instanceof ApiError && query.error.status === 403) {
    return (
      <CenteredState
        icon={Lock}
        title={te('students.detailForbiddenTitle')}
        description={te('students.detailForbiddenDescription')}
        backHref={`/org/${orgId}`}
      />
    )
  }

  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <CenteredState
        icon={User}
        title={te('students.notFoundTitle')}
        description={te('students.notFoundDescription')}
        backHref={`/org/${orgId}`}
      />
    )
  }

  if (query.error) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      </div>
    )
  }

  const student = query.data
  if (!student) return null

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <Header
        student={student}
        orgId={orgId}
        beltEntry={resolveBelt(student.currentBelt)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <BjjJourneyCard student={student} />
          <BeltJourneyCard
            student={student}
            beltEntry={resolveBelt(student.currentBelt)}
          />
          <TechnicalNotesCard orgId={orgId} studentId={student.id} />
          <CertificatesCard
            count={student.promotionCertificates?.length ?? 0}
          />
        </div>
        <div className="space-y-4">
          <IdentityCard student={student} />
          <GuardianCard student={student} />
          <BranchAssignmentCard
            student={student}
            primaryBranchName={primaryBranchName(student)}
            orgId={orgId}
          />
          <StudentMembershipPanel
            orgId={orgId}
            studentId={student.id}
            branchId={student.primaryBranchId}
          />
        </div>
      </div>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────

function Header({
  student,
  orgId,
  beltEntry,
}: {
  student: StudentDetailType
  orgId: string
  beltEntry: PromotionRankCatalogEntry | null
}) {
  const tn = useTranslations('navigation')
  const tb = useTranslations('navigation.breadcrumb')
  const t = useTranslations('students')
  const tTrack = useTranslations('students.track')
  const fullName = `${student.firstName} ${student.lastName}`.trim()
  const branchName = primaryBranchName(student)

  const breadcrumbs = [
    { label: tn('labels.organization'), href: `/org/${orgId}` },
    ...(student.primaryBranchId
      ? [
          {
            label: tn('labels.students'),
            href: `/org/${orgId}/branches/${student.primaryBranchId}/students`,
          },
        ]
      : []),
    { label: fullName },
  ]

  return (
    <div className="space-y-3">
      <nav
        aria-label={tb('aria')}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          return (
            <span key={`${breadcrumb.label}-${index}`} className="flex items-center gap-1.5">
              {breadcrumb.href && !isLast ? (
                <Link
                  href={breadcrumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {breadcrumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-foreground font-medium' : undefined}>
                  {breadcrumb.label}
                </span>
              )}
              {!isLast && <ChevronRight className="h-3 w-3" aria-hidden />}
            </span>
          )
        })}
      </nav>

      <TextureCard>
        <TextureCardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <PersonAvatar
                avatarUrl={student.avatarUrl}
                firstName={student.firstName}
                lastName={student.lastName}
                displayName={fullName}
                size="lg"
              />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                    {fullName}
                  </h1>
                  <StatusBadge status={student.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {branchName && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {branchName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    {humanizeTrack(tTrack, student.promotionTrack)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3 shadow-sm lg:min-w-[300px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t('detail.currentRank')}
                  </p>
                  <div className="flex items-center gap-2">
                    <BeltBadge
                      rank={beltEntry}
                      stripes={student.currentStripes}
                    />
                    {!beltEntry && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('belt.noRank')}
                      </span>
                    )}
                  </div>
                </div>
                <StudentRankEditor
                  key={`${student.id}:${student.membershipId ?? 'none'}:${student.currentBelt ?? 'none'}:${student.currentStripes}`}
                  orgId={orgId}
                  student={student}
                />
              </div>
            </div>
          </div>
        </TextureCardContent>
      </TextureCard>
    </div>
  )
}

// ── Cards ──────────────────────────────────────────────────

function BjjJourneyCard({ student }: { student: StudentDetailType }) {
  const t = useTranslations('students')
  const format = useFormatter()
  const items = [
    { label: t('detail.bjjStart'), value: formatDate(format, student.startedBjjAt) ?? '—' },
    {
      label: t('detail.orgJoined'),
      value: formatDate(format, student.joinedOrganizationAt) ?? '—',
    },
    {
      label: t('detail.lastUpdate'),
      value: formatDate(format, student.updatedAt) ?? '—',
    },
  ]
  return (
    <SectionCard title={t('detail.bjjJourney')} icon={Award}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.label}>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {it.label}
            </p>
            <p className="text-sm font-medium text-foreground mt-1">
              {it.value}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function BeltJourneyCard({
  student,
  beltEntry,
}: {
  student: StudentDetailType
  beltEntry: PromotionRankCatalogEntry | null
}) {
  const t = useTranslations('students')
  const maxStripes = beltEntry?.maxStripes ?? 4
  const currentStripes = Math.max(0, Math.min(maxStripes, student.currentStripes))
  const progress =
    beltEntry && maxStripes > 0 ? Math.min(100, (currentStripes / maxStripes) * 100) : 0

  return (
    <SectionCard title={t('detail.beltJourney')} icon={Award}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('detail.currentRank')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <BeltBadge rank={beltEntry} stripes={student.currentStripes} />
              <span className="text-sm font-semibold text-foreground">
                {beltEntry?.label ?? t('belt.noRank')}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/60 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('detail.stripes')}
            </p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {beltEntry
                ? t('detail.stripeSummary', {
                    count: currentStripes,
                    max: maxStripes,
                  })
                : '—'}
            </p>
          </div>
        </div>

        {beltEntry ? (
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>{t('detail.rankProgress')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            {t('detail.noRankJourney')}
          </p>
        )}
      </div>
    </SectionCard>
  )
}

function TechnicalNotesCard({
  orgId,
  studentId,
}: {
  orgId: string
  studentId: string
}) {
  const t = useTranslations('students')
  const tn = useTranslations('students.trainingNotes')
  const capabilitiesQuery = useCapabilities(orgId)
  const trainingNoteCaps = capabilitiesQuery.data?.capabilities?.trainingNotes
  const hasCapabilities = Boolean(capabilitiesQuery.data)
  const canRead = trainingNoteCaps?.canReadTrainingNote ?? false
  const canCreate = trainingNoteCaps?.canCreateTrainingNote ?? false
  const notesQuery = useStudentTrainingNotes(
    orgId,
    studentId,
    hasCapabilities && canRead,
  )

  if (hasCapabilities && !canRead) {
    return null
  }

  return (
    <SectionCard
      title={t('detail.technicalNotes')}
      icon={ClipboardCheck}
      action={
        canCreate ? (
          <CreateTrainingNoteDialog orgId={orgId} studentId={studentId} />
        ) : null
      }
    >
      {capabilitiesQuery.isLoading || notesQuery.isLoading ? (
        <div className="space-y-2">
          <div className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
        </div>
      ) : notesQuery.error ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
          <p className="text-sm text-muted-foreground">
            {tn('loadError')}
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="mt-1 h-auto px-0"
            onClick={() => notesQuery.refetch()}
          >
            {tn('retry')}
          </Button>
        </div>
      ) : notesQuery.data?.items.length ? (
        <TrainingNotesList notes={notesQuery.data.items} />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground italic">
            {tn('empty')}
          </p>
          {canCreate ? (
            <CreateTrainingNoteDialog
              orgId={orgId}
              studentId={studentId}
              variant="empty"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              {tn('noCreatePermission')}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  )
}

function TrainingNotesList({ notes }: { notes: TrainingNote[] }) {
  const tn = useTranslations('students.trainingNotes')
  const format = useFormatter()

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li
          key={note.id}
          className="rounded-lg border border-border bg-background/50 p-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-1 text-sm font-medium text-foreground">
                {noteTitle(note)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{authorLabel(note.author, tn('unknownAuthor'))}</span>
                <span aria-hidden>·</span>
                <span>{formatDateTime(format, note.createdAt) ?? '—'}</span>
                {note.sourceLabel && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{note.sourceLabel}</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant="outline" className="shrink-0">
              {visibilityLabel(tn, note.visibility)}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {note.bodyPreview ?? note.body}
          </p>
          {note.classSessionId && (
            <AssociatedClassSummary note={note} format={format} />
          )}
        </li>
      ))}
    </ul>
  )
}

function AssociatedClassSummary({
  note,
  format,
}: {
  note: TrainingNote
  format: ReturnType<typeof useFormatter>
}) {
  const tn = useTranslations('students.trainingNotes')
  const className =
    note.classSession?.name ??
    note.classSession?.title ??
    null
  const classDate =
    note.classSession?.date ??
    note.classSession?.scheduledDate ??
    note.classSession?.startAt ??
    null
  const formattedClassDate = classDate
    ? formatDate(format, classDate)
    : null

  return (
    <div className="mt-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {tn('associatedClass')}
      </div>
      <div className="mt-1 text-sm text-foreground">
        {className ? (
          <span className="font-medium">{className}</span>
        ) : (
          <span>{tn('linkedToClass')}</span>
        )}
        {formattedClassDate && (
          <span className="text-muted-foreground"> · {formattedClassDate}</span>
        )}
      </div>
    </div>
  )
}

function CreateTrainingNoteDialog({
  orgId,
  studentId,
  variant = 'default',
}: {
  orgId: string
  studentId: string
  variant?: 'default' | 'empty'
}) {
  const tn = useTranslations('students.trainingNotes')
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [visibility, setVisibility] =
    useState<TrainingNoteVisibility>('STAFF_PRIVATE')
  const [noteType, setNoteType] = useState<TrainingNoteType>('TRAINING_FOCUS')
  const mutation = useCreateStudentTrainingNote(orgId)
  const trimmedBody = body.trim()

  const reset = () => {
    setBody('')
    setVisibility('STAFF_PRIVATE')
    setNoteType('TRAINING_FOCUS')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmedBody) return

    mutation.mutate(
      { studentId, body: trimmedBody, visibility, noteType },
      {
        onSuccess: () => {
          notifySuccess(tn('createSuccess'))
          setOpen(false)
          reset()
        },
        onError: (error) => {
          notifyError(tn('createError'), error)
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen && !mutation.isPending) reset()
      }}
    >
      <Button
        type="button"
        variant={variant === 'empty' ? 'outline' : 'secondary'}
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {variant === 'empty' ? tn('create') : tn('new')}
      </Button>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{tn('new')}</DialogTitle>
          <DialogDescription>{tn('dialogDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="training-note-type">{tn('type')}</Label>
            <Select
              value={noteType}
              onValueChange={(value) => setNoteType(value as TrainingNoteType)}
              disabled={mutation.isPending}
            >
              <SelectTrigger id="training-note-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRAINING_FOCUS">
                  {tn('typeTrainingFocus')}
                </SelectItem>
                <SelectItem value="INSTRUCTOR_FEEDBACK">
                  {tn('typeInstructorFeedback')}
                </SelectItem>
                <SelectItem value="SESSION_NOTE">
                  {tn('typeSessionNote')}
                </SelectItem>
                <SelectItem value="WEEKLY_PLAN">
                  {tn('typeWeeklyPlan')}
                </SelectItem>
                <SelectItem value="MONTHLY_PLAN">
                  {tn('typeMonthlyPlan')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-note-body">{tn('content')}</Label>
            <Textarea
              id="training-note-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              minLength={1}
              rows={6}
              className="min-h-32 resize-y"
              placeholder={tn('contentPlaceholder')}
              disabled={mutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-note-visibility">
              {tn('visibility')}
            </Label>
            <Select
              value={visibility}
              onValueChange={(value) =>
                setVisibility(value as TrainingNoteVisibility)
              }
              disabled={mutation.isPending}
            >
              <SelectTrigger id="training-note-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF_PRIVATE">
                  {tn('visibilityStaff')}
                </SelectItem>
                <SelectItem value="SHARED_WITH_COACHES">
                  {tn('visibilityCoaches')}
                </SelectItem>
                <SelectItem value="VISIBLE_TO_STUDENT">
                  {tn('visibilityStudent')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={mutation.isPending || !trimmedBody}
            >
              {mutation.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {tn('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CertificatesCard({ count }: { count: number }) {
  const t = useTranslations('students')
  const tEmpty = useTranslations('empty-states')
  return (
    <SectionCard title={t('detail.certificates')} icon={Award}>
      {count > 0 ? (
        <p className="text-sm text-foreground">
          {t('detail.certificatesCount', { count })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {tEmpty('studentDetail.noCertificates')}
        </p>
      )}
    </SectionCard>
  )
}

function IdentityCard({ student }: { student: StudentDetailType }) {
  const t = useTranslations('students')
  const format = useFormatter()
  const items: {
    label: string
    value: React.ReactNode
    icon: React.ComponentType<{ className?: string }>
  }[] = [
    {
      label: t('detail.email'),
      icon: Mail,
      value: (
        <a
          href={`mailto:${student.email}`}
          className="text-foreground hover:text-primary break-all"
        >
          {student.email}
        </a>
      ),
    },
    { label: t('detail.phone'), icon: Phone, value: student.phone ?? '—' },
    {
      label: t('detail.birthDate'),
      icon: Calendar,
      value: formatDate(format, student.dateOfBirth) ?? '—',
    },
    {
      label: t('detail.internalId'),
      icon: Hash,
      value: <code className="font-mono text-xs">{student.id}</code>,
    },
  ]
  return (
    <SectionCard title={t('detail.identity')} icon={UserCircle2}>
      <ul className="space-y-3">
        {items.map(({ label, value, icon: Icon }) => (
          <li key={label} className="flex items-start gap-2.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <div className="text-sm mt-0.5">{value}</div>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

function GuardianCard({ student }: { student: StudentDetailType }) {
  const t = useTranslations('students')
  const tEmpty = useTranslations('empty-states')
  const hasGuardian =
    student.parentTutorName ||
    student.parentTutorPhone ||
    student.parentTutorRelation
  return (
    <SectionCard title={t('detail.guardian')} icon={Users}>
      {hasGuardian ? (
        <ul className="space-y-2.5 text-sm">
          {student.parentTutorName && (
            <li>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('detail.guardianName')}
              </p>
              <p className="text-foreground mt-0.5">
                {student.parentTutorName}
              </p>
            </li>
          )}
          {student.parentTutorRelation && (
            <li>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('detail.guardianRelation')}
              </p>
              <p className="text-foreground mt-0.5">
                {student.parentTutorRelation}
              </p>
            </li>
          )}
          {student.parentTutorPhone && (
            <li>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t('detail.guardianPhone')}
              </p>
              <p className="text-foreground mt-0.5 flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {student.parentTutorPhone}
              </p>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {tEmpty('studentDetail.noGuardian')}
        </p>
      )}
    </SectionCard>
  )
}

function BranchAssignmentCard({
  student,
  primaryBranchName,
  orgId,
}: {
  student: StudentDetailType
  primaryBranchName: string | null
  orgId: string
}) {
  const t = useTranslations('students')
  const assignments = student.branchAssignments?.length ?? 0
  const visits = student.branchVisits?.length ?? 0
  return (
    <SectionCard title={t('detail.branchAssignment')} icon={MapPin}>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t('detail.primaryBranch')}
          </p>
          {primaryBranchName ? (
            <Link
              href={`/org/${orgId}/branches/${student.primaryBranchId}`}
              className="text-foreground hover:text-primary font-medium mt-0.5 inline-block"
            >
              {primaryBranchName}
            </Link>
          ) : (
            <p className="text-muted-foreground mt-0.5">—</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('detail.activeAssignments')}
            </p>
            <p className="text-lg font-semibold tabular-nums mt-0.5">
              {assignments}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t('detail.registeredVisits')}
            </p>
            <p className="text-lg font-semibold tabular-nums mt-0.5">
              {visits}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ── Section primitives ─────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <TextureCard>
      <TextureCardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-foreground">{title}</p>
          </div>
          {action}
        </div>
        {children}
      </TextureCardContent>
    </TextureCard>
  )
}

// ── Skeleton / centered state ──────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="space-y-3">
        <div className="h-3 w-40 rounded-md bg-muted/60 animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-64 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-40 rounded-md bg-muted/60 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-40 rounded-[24px] bg-muted/40 animate-pulse',
              i < 3 && 'lg:col-span-2'
            )}
          />
        ))}
      </div>
    </div>
  )
}

function CenteredState({
  icon: Icon,
  title,
  description,
  backHref,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  backHref?: string
  action?: React.ReactNode
}) {
  const tc = useTranslations('common')
  return (
    <div className="p-6">
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center max-w-md mx-auto">
        <Icon className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mt-3">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {action}
          {backHref && (
            <Link
              href={backHref}
              className="text-xs text-primary hover:underline"
            >
              ← {tc('nav.back')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

type Translator = ReturnType<typeof useTranslations>

function humanizeTrack(tTrack: Translator, track: string) {
  // `as never`: key dinámica validada en runtime con `.has()`.
  return tTrack.has(track as never) ? tTrack(track as never) : track
}

function formatDate(
  format: ReturnType<typeof useFormatter>,
  iso?: string | null
) {
  if (!iso) return null
  try {
    return format.dateTime(new Date(iso), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function formatDateTime(
  format: ReturnType<typeof useFormatter>,
  iso?: string | null,
) {
  if (!iso) return null
  try {
    return format.dateTime(new Date(iso), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

function noteTitle(note: TrainingNote) {
  if (note.title) return note.title

  const firstLine = note.body
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  return truncate(firstLine ?? note.body, 72)
}

function authorLabel(author: TrainingNoteActor | null | undefined, fallback: string) {
  if (!author) return fallback
  if (author.name) return author.name
  if (author.displayName) return author.displayName
  const fullName = [author.firstName, author.lastName].filter(Boolean).join(' ')
  return fullName || author.email || author.membershipId || author.id || fallback
}

function visibilityLabel(t: Translator, visibility: TrainingNoteVisibility) {
  if (visibility === 'VISIBLE_TO_STUDENT') {
    return t('visibilityStudent')
  }
  if (visibility === 'SHARED_WITH_COACHES') {
    return t('visibilityCoaches')
  }
  return t('visibilityStaff')
}

function truncate(value: string, maxLength: number) {
  const normalized = value.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function primaryBranchName(student: StudentDetailType): string | null {
  const pb = student.primaryBranch as { name?: string } | null | undefined
  return pb?.name ?? null
}
