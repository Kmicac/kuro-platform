import { BillingNav } from './_components/billing-nav'

interface BillingLayoutProps {
  children: React.ReactNode
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function BillingLayout({
  children,
  params,
}: BillingLayoutProps) {
  const { orgId, branchId } = await params

  return (
    <>
      <BillingNav orgId={orgId} branchId={branchId} />
      {children}
    </>
  )
}
