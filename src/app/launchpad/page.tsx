import { sql } from '@/lib/db'
import { CURRENT_SEASON } from '@/lib/season'
import { LaunchpadStandings, type StandingsRow } from './LaunchpadStandings'

export const dynamic = 'force-dynamic'

export default async function LaunchpadPage() {
  const rows = await sql`
    SELECT t.slug, t.name, t.division,
      s.overall_wins, s.overall_losses, s.overall_ties,
      s.conference_wins, s.conference_losses,
      s.points_for, s.points_against
    FROM teams t
    LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = ${CURRENT_SEASON}
    ORDER BY (s.overall_wins::float / NULLIF(s.overall_wins + s.overall_losses, 0)) DESC NULLS LAST, s.overall_wins DESC NULLS LAST, t.name`

  const standings: StandingsRow[] = rows.map(r => ({
    slug:               r.slug as string,
    name:               r.name as string,
    division:           r.division as string,
    overall_wins:       r.overall_wins != null ? Number(r.overall_wins) : null,
    overall_losses:     r.overall_losses != null ? Number(r.overall_losses) : null,
    overall_ties:       r.overall_ties != null ? Number(r.overall_ties) : null,
    conference_wins:    r.conference_wins != null ? Number(r.conference_wins) : null,
    conference_losses:  r.conference_losses != null ? Number(r.conference_losses) : null,
    points_for:         r.points_for != null ? Number(r.points_for) : null,
    points_against:     r.points_against != null ? Number(r.points_against) : null,
  }))

  return <LaunchpadStandings rows={standings} />
}
