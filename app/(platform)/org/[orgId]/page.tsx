import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { OrgDashboard } from './_components/org-dashboard'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard')
  return {
    title: t('org.title'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string }>
}

export default async function OrgDashboardPage({ params }: PageProps) {
  const { orgId } = await params
  return <OrgDashboard orgId={orgId} />
}
