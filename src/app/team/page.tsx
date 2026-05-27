import { sql } from '@/lib/db'
import { TeamMagazineShell } from './Shell'
import { AVAILABLE_SEASONS, CURRENT_SEASON } from '@/lib/season'

export const dynamic = 'force-dynamic'

export type TeamMagazineRow = {
  slug: string
  name: string
  school_slug: string | null
  division: string
  season: number
  overall_wins: number | null
  overall_losses: number | null
  overall_ties: number | null
  conference_wins: number | null
  conference_losses: number | null
  games_played: number | null
  points_for: number | null
  points_against: number | null
  pass_yds: number | null
  rush_yds: number | null
  pass_tds: number | null
  rush_tds: number | null
}

export default async function TeamMagazinePage() {
  const rows = await sql`
    WITH game_agg AS (
      SELECT
        team_slug,
        season,
        COUNT(*) FILTER (WHERE home_score IS NOT NULL) AS games_played,
        SUM(CASE WHEN home_team_slug = team_slug THEN home_score ELSE away_score END)
          FILTER (WHERE home_score IS NOT NULL) AS points_for,
        SUM(CASE WHEN home_team_slug = team_slug THEN away_score ELSE home_score END)
          FILTER (WHERE home_score IS NOT NULL) AS points_against
      FROM (
        SELECT home_team_slug AS team_slug, home_team_slug, away_team_slug, home_score, away_score, season
        FROM games WHERE season = ANY(${AVAILABLE_SEASONS})
        UNION ALL
        SELECT away_team_slug AS team_slug, home_team_slug, away_team_slug, home_score, away_score, season
        FROM games WHERE season = ANY(${AVAILABLE_SEASONS})
      ) combined
      GROUP BY team_slug, season
    ),
    off_agg AS (
      SELECT
        school_slug,
        season,
        COALESCE(SUM(pass_yards), 0) AS pass_yds,
        COALESCE(SUM(rush_yards), 0) AS rush_yds,
        COALESCE(SUM(pass_tds),   0) AS pass_tds,
        COALESCE(SUM(rush_tds),   0) AS rush_tds
      FROM player_season_stats
      WHERE season = ANY(${AVAILABLE_SEASONS})
      GROUP BY school_slug, season
    )
    SELECT
      t.slug, t.name, t.school_slug, t.division,
      s.season,
      s.overall_wins, s.overall_losses, s.overall_ties,
      s.conference_wins, s.conference_losses,
      g.games_played, g.points_for, g.points_against,
      o.pass_yds, o.rush_yds, o.pass_tds, o.rush_tds
    FROM teams t
    JOIN team_season_stats s ON s.team_slug = t.slug
    LEFT JOIN game_agg g ON g.team_slug = t.slug AND g.season = s.season
    LEFT JOIN off_agg  o ON o.school_slug = t.school_slug AND o.season = s.season
    WHERE s.season = ANY(${AVAILABLE_SEASONS})
    ORDER BY s.season DESC, t.division, s.overall_wins DESC NULLS LAST, t.name
  `

  const teams: TeamMagazineRow[] = rows.map(r => ({
    slug:             r.slug as string,
    name:             r.name as string,
    school_slug:      (r.school_slug as string | null) ?? null,
    division:         r.division as string,
    season:           Number(r.season),
    overall_wins:     r.overall_wins     != null ? Number(r.overall_wins)     : null,
    overall_losses:   r.overall_losses   != null ? Number(r.overall_losses)   : null,
    overall_ties:     r.overall_ties     != null ? Number(r.overall_ties)     : null,
    conference_wins:  r.conference_wins  != null ? Number(r.conference_wins)  : null,
    conference_losses:r.conference_losses!= null ? Number(r.conference_losses): null,
    games_played:     r.games_played     != null ? Number(r.games_played)     : null,
    points_for:       r.points_for       != null ? Number(r.points_for)       : null,
    points_against:   r.points_against   != null ? Number(r.points_against)   : null,
    pass_yds:         r.pass_yds         != null ? Number(r.pass_yds)         : null,
    rush_yds:         r.rush_yds         != null ? Number(r.rush_yds)         : null,
    pass_tds:         r.pass_tds         != null ? Number(r.pass_tds)         : null,
    rush_tds:         r.rush_tds         != null ? Number(r.rush_tds)         : null,
  }))

  return (
    <TeamMagazineShell
      teams={teams}
      defaultSeason={CURRENT_SEASON}
      availableSeasons={AVAILABLE_SEASONS}
    />
  )
}
