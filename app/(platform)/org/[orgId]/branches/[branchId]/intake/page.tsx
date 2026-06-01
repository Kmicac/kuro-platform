import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { IntakeList } from './_components/intake-list'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('intake')
  return {
    title: t('meta.title'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function IntakePage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <IntakeList orgId={orgId} branchId={branchId} />
}
