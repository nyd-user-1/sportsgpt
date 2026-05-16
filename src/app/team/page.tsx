import { sql } from '@/lib/db'
import TeamTable from './TeamTable'

export const dynamic = 'force-dynamic'

export type TeamIndexRow = {
  slug: string
  name: string
  division: string
  overall_wins: number | null
  overall_losses: number | null
  overall_ties: number | null
  conference_wins: number | null
  conference_losses: number | null
  games_played: number | null
  points_for: number | null
  points_against: number | null
}

export default async function TeamPage() {
  const rows = await sql`
    SELECT
      t.slug, t.name, t.division,
      s.overall_wins, s.overall_losses, s.overall_ties,
      s.conference_wins, s.conference_losses,
      g.games_played, g.points_for, g.points_against
    FROM teams t
    LEFT JOIN team_season_stats s
      ON s.team_slug = t.slug AND s.season = 2025
    LEFT JOIN (
      SELECT
        team_slug,
        COUNT(*) FILTER (WHERE home_score IS NOT NULL)        AS games_played,
        SUM(CASE WHEN home_team_slug = team_slug THEN home_score ELSE away_score END)
          FILTER (WHERE home_score IS NOT NULL)               AS points_for,
        SUM(CASE WHEN home_team_slug = team_slug THEN away_score ELSE home_score END)
          FILTER (WHERE home_score IS NOT NULL)               AS points_against
      FROM (
        SELECT home_team_slug AS team_slug, home_team_slug, away_team_slug, home_score, away_score
        FROM games WHERE season = 2025
        UNION ALL
        SELECT away_team_slug AS team_slug, home_team_slug, away_team_slug, home_score, away_score
        FROM games WHERE season = 2025
      ) combined
      GROUP BY team_slug
    ) g ON g.team_slug = t.slug
    ORDER BY t.division, s.overall_wins DESC NULLS LAST, t.name
  `

  const teams: TeamIndexRow[] = rows.map(r => ({
    slug:             r.slug as string,
    name:             r.name as string,
    division:         r.division as string,
    overall_wins:     r.overall_wins     != null ? Number(r.overall_wins)     : null,
    overall_losses:   r.overall_losses   != null ? Number(r.overall_losses)   : null,
    overall_ties:     r.overall_ties     != null ? Number(r.overall_ties)     : null,
    conference_wins:  r.conference_wins  != null ? Number(r.conference_wins)  : null,
    conference_losses:r.conference_losses!= null ? Number(r.conference_losses): null,
    games_played:     r.games_played     != null ? Number(r.games_played)     : null,
    points_for:       r.points_for       != null ? Number(r.points_for)       : null,
    points_against:   r.points_against   != null ? Number(r.points_against)   : null,
  }))

  return <TeamTable teams={teams} />
}
