import { sql } from '@/lib/db'
import { AppLayout } from '@/components/AppLayout'
import SuffolkDistrictMap, { type SchoolRecord } from '@/components/SuffolkDistrictMap'

export const dynamic = 'force-dynamic'

export default async function MapsPage() {
  const rows = await sql`
    SELECT
      s.slug    AS school_slug,
      s.name    AS school_name,
      t.slug    AS team_slug,
      t.division,
      COALESCE(SUM(ts.overall_wins),   0)::int AS wins,
      COALESCE(SUM(ts.overall_losses), 0)::int AS losses
    FROM schools s
    JOIN teams t ON t.school_slug = s.slug AND t.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = t.slug
    GROUP BY s.slug, s.name, t.slug, t.division
    ORDER BY s.name
  `

  const schools: SchoolRecord[] = rows.map(r => ({
    school_slug: String(r.school_slug),
    school_name: String(r.school_name),
    team_slug:   String(r.team_slug),
    division:    String(r.division),
    wins:        Number(r.wins),
    losses:      Number(r.losses),
  }))

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden">
        <SuffolkDistrictMap schools={schools} />
      </div>
    </AppLayout>
  )
}
