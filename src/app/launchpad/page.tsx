import { sql } from '@/lib/db'
import { CURRENT_SEASON } from '@/lib/season'
import { LaunchpadStandings, type StandingsRow } from './LaunchpadStandings'

export const dynamic = 'force-dynamic'

export default async function LaunchpadPage() {
  const rows = await sql`
    SELECT t.slug, t.name, t.division,
      s.overall_wins, s.overall_losses, s.overall_ties,
      s.conference_wins, s.conference_losses
    FROM teams t
    LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = ${CURRENT_SEASON}
    ORDER BY t.division, s.overall_wins DESC NULLS LAST, t.name`

  const standings: StandingsRow[] = rows.map(r => ({
    slug:               r.slug as string,
    name:               r.name as string,
    division:           r.division as string,
    overall_wins:       r.overall_wins != null ? Number(r.overall_wins) : null,
    overall_losses:     r.overall_losses != null ? Number(r.overall_losses) : null,
    overall_ties:       r.overall_ties != null ? Number(r.overall_ties) : null,
    conference_wins:    r.conference_wins != null ? Number(r.conference_wins) : null,
    conference_losses:  r.conference_losses != null ? Number(r.conference_losses) : null,
  }))

  return <LaunchpadStandings rows={standings} />
}
