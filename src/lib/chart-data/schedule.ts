/**
 * src/lib/chart-data/schedule.ts
 *
 * Canonical SQL for schedule-metric charts.
 *
 * Charts covered:
 *   strength-of-schedule (metric: schedule, entity: team)
 */

import { sql } from '@/lib/db'

export interface SoSRow {
  name:        string
  school_slug: string
  season:      string
  value:       number
}

/**
 * Opponent win % averaged across all games (strength of schedule).
 * Higher = harder schedule.
 */
export async function fetchStrengthOfSchedule(seasons: number[]): Promise<SoSRow[]> {
  const rows = await sql`
    WITH pairs AS (
      SELECT home_team_slug AS team_slug, away_team_slug AS opp_slug, season
      FROM games WHERE home_score IS NOT NULL AND season = ANY(${seasons})
      UNION ALL
      SELECT away_team_slug, home_team_slug, season
      FROM games WHERE home_score IS NOT NULL AND season = ANY(${seasons})
    )
    SELECT t.name, t.school_slug, gp.season::text AS season,
      ROUND(AVG(ts.overall_wins::float / NULLIF(ts.overall_wins + ts.overall_losses, 0)) * 100)::int AS value
    FROM pairs gp JOIN teams t ON t.slug = gp.team_slug
    JOIN teams opp ON opp.slug = gp.opp_slug
    JOIN team_season_stats ts ON ts.team_slug = gp.opp_slug AND ts.season = gp.season
    WHERE t.level = 'Varsity'
    GROUP BY t.name, t.school_slug, gp.season
    ORDER BY gp.season, value DESC`
  return rows as SoSRow[]
}
