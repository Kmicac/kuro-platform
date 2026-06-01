import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { StudentsList } from './_components/students-list'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('students')
  return {
    title: t('meta.listTitle'),
  }
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function StudentsPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <StudentsList orgId={orgId} branchId={branchId} />
}
