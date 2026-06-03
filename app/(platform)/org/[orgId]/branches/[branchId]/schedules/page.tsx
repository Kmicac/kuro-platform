import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SchedulesList } from './_components/schedules-list'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('schedules')
  return {
    title: t('meta.title'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function SchedulesPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <SchedulesList orgId={orgId} branchId={branchId} />
}
