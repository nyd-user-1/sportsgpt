/**
 * src/lib/chart-data/passing.ts
 *
 * Canonical SQL for all passing-metric charts. Every consumer — /chart/[slug],
 * /charts/@panel/[slug], and /api/chart/[slug] — must import from here.
 * Do not duplicate these queries in the consumer files.
 *
 * Charts covered:
 *   passing-yards-leaders  (metric: passing, entity: player)
 *   passing-tds-leaders    (metric: passing, entity: player)
 *   single-game-passing    (metric: passing, entity: player)
 *   passing-yards-team     (metric: passing, entity: team)
 */

import { sql } from '@/lib/db'

// ── Row types ────────────────────────────────────────────────────────────────

/** One player-season row for season-aggregated passing stats. */
export interface PassingStatRow {
  player_slug: string | null
  name: string           // player_name
  school_slug: string
  school_name: string
  season: number
  value: number          // pass_yards or pass_tds depending on the fetch
  overall_wins:   number | null
  overall_losses: number | null
}

/** One game row for single-game passing performances. */
export interface PassingGameRow {
  player:    string
  yds:       number
  team_name: string
  season:    string
}

/** One team-season row for team passing yardage. */
export interface TeamPassingRow {
  name:       string   // school short name
  school_slug: string
  season:     string
  value:      number   // total pass yards for the team-season
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

/**
 * Season-aggregated passing yards per player.
 * Returns ALL rows for the given seasons ordered (season, pass_yards DESC).
 * Consumers apply their own top-N slicing.
 */
export async function fetchPassingYardsLeaders(seasons: number[]): Promise<PassingStatRow[]> {
  const rows = await sql`
    SELECT
      ps.player_slug,
      ps.player_name  AS name,
      ps.school_slug,
      ps.school_name,
      ps.season,
      ps.pass_yards   AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM player_season_stats ps
    LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
    WHERE ps.stat_type = 'Passing'
      AND ps.pass_yards IS NOT NULL
      AND ps.season = ANY(${seasons})
    ORDER BY ps.season, ps.pass_yards DESC`
  return rows as PassingStatRow[]
}

/**
 * Season-aggregated passing TDs per player.
 * Same shape as fetchPassingYardsLeaders; value = pass_tds.
 */
export async function fetchPassingTdsLeaders(seasons: number[]): Promise<PassingStatRow[]> {
  const rows = await sql`
    SELECT
      ps.player_slug,
      ps.player_name  AS name,
      ps.school_slug,
      ps.school_name,
      ps.season,
      ps.pass_tds     AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM player_season_stats ps
    LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
    WHERE ps.stat_type = 'Passing'
      AND ps.pass_tds IS NOT NULL
      AND ps.season = ANY(${seasons})
    ORDER BY ps.season, ps.pass_tds DESC`
  return rows as PassingStatRow[]
}

/**
 * Top single-game passing performances (from game_box_scores JSONB).
 * Returns all rows for the given seasons ordered (season, yds DESC).
 * NOTE: Uses game_box_scores.player_stats JSONB — the only legitimate use of
 * that blob. player_game_stats does not store per-game passing as a single row.
 */
export async function fetchSingleGamePassing(seasons: number[]): Promise<PassingGameRow[]> {
  const rows = await sql`
    SELECT
      s->>'player'               AS player,
      (s->>'yds')::int           AS yds,
      s->>'team_name'            AS team_name,
      g.season::text             AS season
    FROM game_box_scores bs
    JOIN games g ON g.id = bs.game_id,
    LATERAL jsonb_array_elements(bs.player_stats) s
    WHERE s->>'stat_type' = 'Passing'
      AND (s->>'yds') IS NOT NULL
      AND (s->>'yds')::int > 0
      AND g.season = ANY(${seasons})
    ORDER BY g.season, (s->>'yds')::int DESC`
  return rows as PassingGameRow[]
}

/**
 * Total passing yards aggregated by team-season.
 * value = SUM(pass_yards) across all players on that team that season.
 */
export async function fetchPassingYardsByTeam(seasons: number[]): Promise<TeamPassingRow[]> {
  const rows = await sql`
    SELECT
      ps.school_name        AS name,
      ps.school_slug,
      ps.season::text       AS season,
      SUM(ps.pass_yards)    AS value
    FROM player_season_stats ps
    JOIN teams t ON t.school_slug = ps.school_slug AND t.level = 'Varsity'
    WHERE ps.stat_type = 'Passing'
      AND ps.pass_yards IS NOT NULL
      AND ps.season = ANY(${seasons})
    GROUP BY ps.school_name, ps.school_slug, ps.season
    ORDER BY ps.season, value DESC`
  return rows as TeamPassingRow[]
}
