import { notFound } from 'next/navigation'
import { SchoolShell } from './Shell'
import { PLACEHOLDER_SCHOOLS, toSlug } from '@/lib/placeholder-data'

export const dynamic = 'force-dynamic'

export default async function SchoolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let school = PLACEHOLDER_SCHOOLS.find(s => toSlug(s.name) === slug)
  const allSchools = PLACEHOLDER_SCHOOLS

  // TODO: when DB is connected, replace with DB query

  if (!school) notFound()

  const sorted = [...allSchools].sort((a, b) => a.name.localeCompare(b.name))
  const idx    = sorted.findIndex(s => s.id === school!.id)
  const n      = sorted.length
  const prev   = sorted[(idx - 1 + n) % n]
  const next   = sorted[(idx + 1) % n]

  const divisionSchools = allSchools.filter(s => s.division === school!.division)

  return (
    <SchoolShell
      school={school}
      prevSlug={toSlug(prev.name)}
      nextSlug={toSlug(next.name)}
      divisionSchools={divisionSchools}
    />
  )
}
