import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { QRPage } from './_components/qr-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('qr-checkin')
  return {
    title: t('meta.title'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string; sessionId: string }>
}

export default async function Page({ params }: PageProps) {
  const { orgId, branchId, sessionId } = await params
  return <QRPage orgId={orgId} branchId={branchId} sessionId={sessionId} />
}
