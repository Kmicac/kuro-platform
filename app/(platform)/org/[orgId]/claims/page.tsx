import type { Metadata } from 'next'
import { ClaimsManager } from './_components/claims-manager'

export const metadata: Metadata = {
  title: 'Invitaciones de cuenta',
}

interface PageProps {
  params: Promise<{ orgId: string }>
}

export default async function ClaimsPage({ params }: PageProps) {
  const { orgId } = await params
  return <ClaimsManager orgId={orgId} />
}
