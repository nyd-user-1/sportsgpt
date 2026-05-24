/**
 * src/lib/chart-data/defense.ts
 *
 * Canonical SQL for defense-metric charts.
 *
 * Charts covered:
 *   turnovers (metric: defense, entity: team)
 */

import { sql } from '@/lib/db'

export interface TurnoverRow {
  name:        string
  school_slug: string
  season:      string
  value:       number
}

/**
 * Team takeaways (interceptions + fumbles recovered) per season,
 * sourced from player_game_stats defensive columns.
 */
export async function fetchTurnovers(seasons: number[]): Promise<TurnoverRow[]> {
  const rows = await sql`
    SELECT t.name, pgs.school_slug, pgs.season::text AS season,
      SUM(COALESCE(pgs.def_int, 0) + COALESCE(pgs.def_fumbles, 0)) AS value
    FROM player_game_stats pgs
    JOIN teams t ON t.school_slug = pgs.school_slug AND t.level = 'Varsity'
    WHERE pgs.season = ANY(${seasons})
    GROUP BY t.name, pgs.school_slug, pgs.season
    ORDER BY pgs.season, value DESC`
  return rows as TurnoverRow[]
}
