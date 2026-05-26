import { AppShell } from '@/components/layout/app-shell'

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ orgId: string }>
}

export default async function OrgLayout({
  children,
  params,
}: OrgLayoutProps) {
  const { orgId } = await params

  return (
    <AppShell orgId={orgId}>
      {children}
    </AppShell>
  )
}