import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { BranchDashboard } from './_components/branch-dashboard'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard')
  return {
    title: t('branch.metaTitle'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function BranchDashboardPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <BranchDashboard orgId={orgId} branchId={branchId} />
}
