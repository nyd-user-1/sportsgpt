import { sql } from '@/lib/db'
import TeamTable from './TeamTable'

export const dynamic = 'force-dynamic'

export type TeamIndexRow = {
  slug: string
  name: string
  division: string
  overall_wins: number | null
  overall_losses: number | null
  conference_wins: number | null
  conference_losses: number | null
}

export default async function TeamPage() {
  const rows = await sql`
    SELECT t.slug, t.name, t.division,
      s.overall_wins, s.overall_losses, s.conference_wins, s.conference_losses
    FROM teams t
    LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
    ORDER BY t.division, s.overall_wins DESC NULLS LAST, t.name`

  const teams: TeamIndexRow[] = rows.map(r => ({
    slug: r.slug as string,
    name: r.name as string,
    division: r.division as string,
    overall_wins: r.overall_wins != null ? Number(r.overall_wins) : null,
    overall_losses: r.overall_losses != null ? Number(r.overall_losses) : null,
    conference_wins: r.conference_wins != null ? Number(r.conference_wins) : null,
    conference_losses: r.conference_losses != null ? Number(r.conference_losses) : null,
  }))

  return <TeamTable teams={teams} />
}
