import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { SchoolShell } from './Shell'

export const dynamic = 'force-dynamic'

export default async function SchoolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const schoolRows = await sql`SELECT * FROM schools WHERE slug = ${slug}`
  const school = schoolRows[0]
  if (!school) notFound()

  const [allSchools, teamsRows, divSchools] = await Promise.all([
    sql`SELECT slug, name FROM schools ORDER BY name`,
    sql`
      SELECT t.slug, t.name, s.overall_wins, s.overall_losses, s.season
      FROM teams t
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
      WHERE t.school_slug = ${slug}`,
    sql`
      SELECT sch.slug, sch.name, sch.enrollment,
        s.overall_wins, s.overall_losses
      FROM schools sch
      LEFT JOIN teams t ON t.school_slug = sch.slug
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
      WHERE sch.division = ${school.division} AND sch.slug != ${slug}
      ORDER BY sch.name`,
  ])

  // Prev/next by name order
  const namesSorted = allSchools as { slug: string; name: string }[]
  const idx = namesSorted.findIndex(s => s.slug === slug)
  const n   = namesSorted.length
  const prevSlug = namesSorted[(idx - 1 + n) % n]?.slug ?? slug
  const nextSlug = namesSorted[(idx + 1) % n]?.slug ?? slug

  return (
    <SchoolShell
      school={school as Record<string, unknown>}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      teamsRows={teamsRows as Record<string, unknown>[]}
      divSchools={divSchools as Record<string, unknown>[]}
    />
  )
}
