/**
 * src/lib/chart-data/composite.ts
 *
 * Canonical SQL for composite (multi-stat) charts that derive from combining
 * passing + rushing + receiving data.
 *
 * Charts covered:
 *   total-tds-leaders     (metric: composite, entity: player)
 *   total-yards-leaders   (metric: composite, entity: player)
 *   total-points-leaders  (metric: composite, entity: player)
 */

import { sql } from '@/lib/db'

export interface CompositeTdRow {
  player_slug:    string | null
  name:           string
  school_slug:    string
  season:         number
  value:          number   // rush_tds + recv_tds
  overall_wins:   number | null
  overall_losses: number | null
}

export interface CompositeYardRow {
  player_slug:    string | null
  name:           string
  school_slug:    string
  season:         number
  value:          number   // pass_yards + rush_yards + recv_yards
  overall_wins:   number | null
  overall_losses: number | null
}

export interface CompositePointRow {
  player_slug: string | null
  name:        string
  school_slug: string
  season:      number
  value:       number   // (rush_tds + recv_tds + pass_tds) * 6 + pat
}

/**
 * Combined rushing + receiving TDs per player-season.
 * Uses FULL OUTER JOIN so players who only rushed or only received are included.
 */
export async function fetchTotalTdsLeaders(seasons: number[]): Promise<CompositeTdRow[]> {
  const rows = await sql`
    WITH rushing AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(rush_tds, 0) AS rush_tds
      FROM player_season_stats
      WHERE stat_type = 'Rushing' AND season = ANY(${seasons})
    ),
    receiving AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(recv_tds, 0) AS recv_tds
      FROM player_season_stats
      WHERE stat_type = 'Receiving' AND season = ANY(${seasons})
    )
    SELECT
      COALESCE(r.player_slug, v.player_slug)             AS player_slug,
      COALESCE(r.player_name, v.player_name)             AS name,
      COALESCE(r.school_slug, v.school_slug)             AS school_slug,
      COALESCE(r.season, v.season)                       AS season,
      COALESCE(r.rush_tds, 0) + COALESCE(v.recv_tds, 0) AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM rushing r
    FULL OUTER JOIN receiving v ON v.player_slug = r.player_slug AND v.season = r.season
    LEFT JOIN teams tm ON tm.school_slug = COALESCE(r.school_slug, v.school_slug) AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = COALESCE(r.season, v.season)
    WHERE COALESCE(r.rush_tds, 0) + COALESCE(v.recv_tds, 0) > 0
    ORDER BY season, value DESC`
  return rows as CompositeTdRow[]
}

/**
 * Combined pass + rush + recv yards per player-season.
 */
export async function fetchTotalYardsLeaders(seasons: number[]): Promise<CompositeYardRow[]> {
  const rows = await sql`
    WITH passing AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(pass_yards, 0) AS pass_yards
      FROM player_season_stats
      WHERE stat_type = 'Passing' AND season = ANY(${seasons})
    ),
    rushing AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(rush_yards, 0) AS rush_yards
      FROM player_season_stats
      WHERE stat_type = 'Rushing' AND season = ANY(${seasons})
    ),
    receiving AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(recv_yards, 0) AS recv_yards
      FROM player_season_stats
      WHERE stat_type = 'Receiving' AND season = ANY(${seasons})
    )
    SELECT
      COALESCE(pa.player_slug, ru.player_slug, re.player_slug)     AS player_slug,
      COALESCE(pa.player_name, ru.player_name, re.player_name)     AS name,
      COALESCE(pa.school_slug, ru.school_slug, re.school_slug)     AS school_slug,
      COALESCE(pa.season, ru.season, re.season)                    AS season,
      COALESCE(pa.pass_yards, 0) + COALESCE(ru.rush_yards, 0)
        + COALESCE(re.recv_yards, 0)                               AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM passing pa
    FULL OUTER JOIN rushing ru ON ru.player_slug = pa.player_slug AND ru.season = pa.season
    FULL OUTER JOIN receiving re
      ON re.player_slug = COALESCE(pa.player_slug, ru.player_slug)
      AND re.season = COALESCE(pa.season, ru.season)
    LEFT JOIN teams tm
      ON tm.school_slug = COALESCE(pa.school_slug, ru.school_slug, re.school_slug)
      AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts
      ON ts.team_slug = tm.slug
      AND ts.season = COALESCE(pa.season, ru.season, re.season)
    WHERE COALESCE(pa.pass_yards, 0) + COALESCE(ru.rush_yards, 0)
        + COALESCE(re.recv_yards, 0) > 0
    ORDER BY season, value DESC`
  return rows as CompositeYardRow[]
}

/**
 * Total points scored per player-season.
 * Formula: (rush_tds + recv_tds + pass_tds) × 6 + PAT kicks.
 */
export async function fetchTotalPointsLeaders(seasons: number[]): Promise<CompositePointRow[]> {
  const rows = await sql`
    WITH tds AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(rush_tds, 0) AS rush_tds
      FROM player_season_stats
      WHERE stat_type = 'Rushing' AND season = ANY(${seasons})
    ),
    recv AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(recv_tds, 0) AS recv_tds,
        COALESCE(pat, 0)      AS pat
      FROM player_season_stats
      WHERE stat_type = 'Receiving' AND season = ANY(${seasons})
    ),
    passing AS (
      SELECT player_slug, school_slug, player_name, season,
        COALESCE(pass_tds, 0) AS pass_tds
      FROM player_season_stats
      WHERE stat_type = 'Passing' AND season = ANY(${seasons})
    )
    SELECT
      COALESCE(t.player_slug, r.player_slug, p.player_slug)   AS player_slug,
      COALESCE(t.player_name, r.player_name, p.player_name)   AS name,
      COALESCE(t.school_slug, r.school_slug, p.school_slug)   AS school_slug,
      COALESCE(t.season, r.season, p.season)                  AS season,
      (COALESCE(t.rush_tds, 0) + COALESCE(r.recv_tds, 0) + COALESCE(p.pass_tds, 0)) * 6
        + COALESCE(r.pat, 0)                                   AS value
    FROM tds t
    FULL OUTER JOIN recv r ON r.player_slug = t.player_slug AND r.season = t.season
    FULL OUTER JOIN passing p
      ON p.player_slug = COALESCE(t.player_slug, r.player_slug)
      AND p.season = COALESCE(t.season, r.season)
    WHERE (COALESCE(t.rush_tds, 0) + COALESCE(r.recv_tds, 0) + COALESCE(p.pass_tds, 0)) * 6
      + COALESCE(r.pat, 0) > 0
    ORDER BY season, value DESC`
  return rows as CompositePointRow[]
}
