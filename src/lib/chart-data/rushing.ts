/**
 * src/lib/chart-data/rushing.ts
 *
 * Canonical SQL for all rushing-metric charts.
 *
 * Charts covered:
 *   rushing-yards-leaders  (metric: rushing, entity: player)
 *   rushing-tds-leaders    (metric: rushing, entity: player)
 *   single-game-rushing    (metric: rushing, entity: player)
 *   rushing-yards-team     (metric: rushing, entity: team)
 */

import { sql } from '@/lib/db'

// ── Row types ────────────────────────────────────────────────────────────────

export interface RushingStatRow {
  player_slug:    string | null
  name:           string
  school_slug:    string
  school_name:    string
  season:         number
  value:          number   // rush_yards or rush_tds
  overall_wins:   number | null
  overall_losses: number | null
}

export interface RushingGameRow {
  player:    string
  yds:       number
  team_name: string
  season:    string
}

export interface TeamRushingRow {
  name:        string
  school_slug: string
  season:      string
  value:       number
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchRushingYardsLeaders(seasons: number[]): Promise<RushingStatRow[]> {
  const rows = await sql`
    SELECT
      ps.player_slug,
      ps.player_name  AS name,
      ps.school_slug,
      ps.school_name,
      ps.season,
      ps.rush_yards   AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM player_season_stats ps
    LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
    WHERE ps.stat_type = 'Rushing'
      AND ps.rush_yards IS NOT NULL
      AND ps.season = ANY(${seasons})
    ORDER BY ps.season, ps.rush_yards DESC`
  return rows as RushingStatRow[]
}

export async function fetchRushingTdsLeaders(seasons: number[]): Promise<RushingStatRow[]> {
  const rows = await sql`
    SELECT
      ps.player_slug,
      ps.player_name  AS name,
      ps.school_slug,
      ps.school_name,
      ps.season,
      ps.rush_tds     AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM player_season_stats ps
    LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
    WHERE ps.stat_type = 'Rushing'
      AND ps.rush_tds IS NOT NULL
      AND ps.season = ANY(${seasons})
    ORDER BY ps.season, ps.rush_tds DESC`
  return rows as RushingStatRow[]
}

export async function fetchSingleGameRushing(seasons: number[]): Promise<RushingGameRow[]> {
  const rows = await sql`
    SELECT
      s->>'player'               AS player,
      (s->>'yds')::int           AS yds,
      s->>'team_name'            AS team_name,
      g.season::text             AS season
    FROM game_box_scores bs
    JOIN games g ON g.id = bs.game_id,
    LATERAL jsonb_array_elements(bs.player_stats) s
    WHERE s->>'stat_type' = 'Rushing'
      AND (s->>'yds') IS NOT NULL
      AND (s->>'yds')::int > 0
      AND g.season = ANY(${seasons})
    ORDER BY g.season, (s->>'yds')::int DESC`
  return rows as RushingGameRow[]
}

export async function fetchRushingYardsByTeam(seasons: number[]): Promise<TeamRushingRow[]> {
  const rows = await sql`
    SELECT
      ps.school_name        AS name,
      ps.school_slug,
      ps.season::text       AS season,
      SUM(ps.rush_yards)    AS value
    FROM player_season_stats ps
    JOIN teams t ON t.school_slug = ps.school_slug AND t.level = 'Varsity'
    WHERE ps.stat_type = 'Rushing'
      AND ps.rush_yards IS NOT NULL
      AND ps.season = ANY(${seasons})
    GROUP BY ps.school_name, ps.school_slug, ps.season
    ORDER BY ps.season, value DESC`
  return rows as TeamRushingRow[]
}
