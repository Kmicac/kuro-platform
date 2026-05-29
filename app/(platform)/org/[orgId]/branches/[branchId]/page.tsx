import type { Metadata } from 'next'
import { BranchDashboard } from './_components/branch-dashboard'

export const metadata: Metadata = {
  title: 'Filial · Dashboard',
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function BranchDashboardPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <BranchDashboard orgId={orgId} branchId={branchId} />
}
