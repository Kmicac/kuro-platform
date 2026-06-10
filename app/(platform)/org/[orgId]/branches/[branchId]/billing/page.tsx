import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function BillingPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  redirect(`/org/${orgId}/branches/${branchId}/billing/dashboard`)
}
