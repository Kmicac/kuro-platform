import type { Metadata } from 'next'
import { OrgDashboard } from './_components/org-dashboard'

export const metadata: Metadata = {
  title: 'Dashboard',
}

interface PageProps {
  params: Promise<{ orgId: string }>
}

export default async function OrgDashboardPage({ params }: PageProps) {
  const { orgId } = await params
  return <OrgDashboard orgId={orgId} />
}
