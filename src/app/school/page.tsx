import { sql } from '@/lib/db'
import SchoolTable from './SchoolTable'

export const dynamic = 'force-dynamic'

export type SchoolIndexRow = {
  slug: string
  name: string
  division: string
  enrollment: number | null
  wins_2024: number
  losses_2024: number
}

export default async function SchoolPage() {
  const rows = await sql`
    SELECT sch.slug, sch.name, sch.division, sch.enrollment,
      COALESCE(SUM(CASE WHEN tss.season = 2024 THEN tss.overall_wins ELSE 0 END), 0)::int AS wins_2024,
      COALESCE(SUM(CASE WHEN tss.season = 2024 THEN tss.overall_losses ELSE 0 END), 0)::int AS losses_2024
    FROM schools sch
    LEFT JOIN teams t ON t.school_slug = sch.slug
    LEFT JOIN team_season_stats tss ON tss.team_slug = t.slug
    GROUP BY sch.slug, sch.name, sch.division, sch.enrollment
    ORDER BY sch.division, sch.name`

  const schools: SchoolIndexRow[] = rows.map(r => ({
    slug: r.slug as string,
    name: r.name as string,
    division: r.division as string,
    enrollment: r.enrollment != null ? Number(r.enrollment) : null,
    wins_2024: Number(r.wins_2024),
    losses_2024: Number(r.losses_2024),
  }))

  return <SchoolTable schools={schools} />
}
