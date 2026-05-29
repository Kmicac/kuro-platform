import type { Metadata } from 'next'
import { StudentsList } from './_components/students-list'

export const metadata: Metadata = {
  title: 'Alumnos',
}

interface PageProps {
  params: Promise<{ orgId: string; branchId: string }>
}

export default async function StudentsPage({ params }: PageProps) {
  const { orgId, branchId } = await params
  return <StudentsList orgId={orgId} branchId={branchId} />
}
