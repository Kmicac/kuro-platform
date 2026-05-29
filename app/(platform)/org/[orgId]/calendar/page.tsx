import type { Metadata } from 'next'
import { TrainingCalendar } from './_components/training-calendar'

export const metadata: Metadata = {
  title: 'Calendario',
}

interface PageProps {
  params: Promise<{ orgId: string }>
}

export default async function CalendarPage({ params }: PageProps) {
  const { orgId } = await params
  return <TrainingCalendar orgId={orgId} />
}
