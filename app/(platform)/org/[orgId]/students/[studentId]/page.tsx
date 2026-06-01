import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { StudentDetail } from './_components/student-detail'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('students')
  return {
    title: t('meta.detailTitle'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; studentId: string }>
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { orgId, studentId } = await params
  return <StudentDetail orgId={orgId} studentId={studentId} />
}
