import { sql } from '@/lib/db'
import { AppLayout } from '@/components/AppLayout'
import LIZipChoropleth, { type SchoolZipEntry } from '@/components/LIZipChoropleth'
import { CURRENT_SEASON } from '@/lib/season'
import { formatSeason } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function MapsPage() {
  const rows = await sql`
    SELECT
      s.name    AS school_name,
      s.address,
      t.slug    AS team_slug,
      t.division,
      COALESCE(ts.overall_wins,   0)::int AS wins,
      COALESCE(ts.overall_losses, 0)::int AS losses
    FROM schools s
    JOIN teams t ON t.school_slug = s.slug AND t.level = 'Varsity'
    LEFT JOIN team_season_stats ts
      ON ts.team_slug = t.slug AND ts.season = ${CURRENT_SEASON}
    WHERE s.address IS NOT NULL
    ORDER BY s.name
  `

  const schools: SchoolZipEntry[] = rows
    .flatMap(r => {
      const zip = String(r.address ?? '').match(/\b(\d{5})\b/)?.[1]
      if (!zip) return []
      const wins   = Number(r.wins)
      const losses = Number(r.losses)
      const games  = wins + losses
      return [{
        zip,
        school_name: String(r.school_name),
        team_slug:   String(r.team_slug),
        division:    String(r.division),
        wins,
        losses,
        win_pct: games > 0 ? wins / games : null,
      }]
    })

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden">
        <LIZipChoropleth schools={schools} season={formatSeason(String(CURRENT_SEASON))} />
      </div>
    </AppLayout>
  )
}
