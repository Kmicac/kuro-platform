import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ClaimsManager } from './_components/claims-manager'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('claims')
  return {
    title: t('meta.title'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string }>
}

export default async function ClaimsPage({ params }: PageProps) {
  const { orgId } = await params
  return <ClaimsManager orgId={orgId} />
}
