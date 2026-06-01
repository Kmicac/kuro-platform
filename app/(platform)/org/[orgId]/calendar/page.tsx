import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { TrainingCalendar } from './_components/training-calendar'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('calendar')
  return {
    title: t('meta.title'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string }>
}

export default async function CalendarPage({ params }: PageProps) {
  const { orgId } = await params
  return <TrainingCalendar orgId={orgId} />
}
