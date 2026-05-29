import type { Metadata } from 'next'
import { IntakeList } from './_components/intake-list'

export const metadata: Metadata = {
  title: 'Academy Intake',
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function IntakePage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <IntakeList orgId={orgId} branchId={branchId} />
}
