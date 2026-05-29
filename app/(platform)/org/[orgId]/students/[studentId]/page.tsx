import type { Metadata } from 'next'
import { StudentDetail } from './_components/student-detail'

export const metadata: Metadata = {
  title: 'Ficha de alumno',
}

interface PageProps {
  params: Promise<{ orgId: string; studentId: string }>
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { orgId, studentId } = await params
  return <StudentDetail orgId={orgId} studentId={studentId} />
}
