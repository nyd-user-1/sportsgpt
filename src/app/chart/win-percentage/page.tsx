import { sql } from '@/lib/db'
import { WinPctShell, type WinPctRow } from './Shell'

export const dynamic = 'force-dynamic'

export default async function WinPercentagePage() {
  const rows = await sql`
    SELECT t.name, t.school_slug, t.slug AS team_slug,
      ROUND(
        SUM(s.overall_wins)::numeric /
        NULLIF(SUM(s.overall_wins + s.overall_losses), 0) * 100,
        1
      )::float AS value
    FROM team_season_stats s
    JOIN teams t ON t.slug = s.team_slug
    WHERE t.level = 'Varsity'
    GROUP BY t.name, t.school_slug, t.slug
    HAVING SUM(s.overall_wins + s.overall_losses) >= 10
    ORDER BY value DESC
  `

  const data: WinPctRow[] = (rows as { name: string; school_slug: string; team_slug: string; value: number }[]).map(r => ({
    name:       r.name,
    school_slug: r.school_slug,
    team_slug:   r.team_slug,
    value:       Number(r.value),
  }))

  return <WinPctShell rows={data} />
}
