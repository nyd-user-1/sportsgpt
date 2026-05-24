/**
 * src/lib/chart-data/receiving.ts
 *
 * Canonical SQL for all receiving-metric charts.
 *
 * Charts covered:
 *   receiving-yards-leaders  (metric: receiving, entity: player)
 *   receiving-tds-leaders    (metric: receiving, entity: player)
 */

import { sql } from '@/lib/db'

export interface ReceivingStatRow {
  player_slug:    string | null
  name:           string
  school_slug:    string
  school_name:    string
  season:         number
  value:          number   // recv_yards or recv_tds
  overall_wins:   number | null
  overall_losses: number | null
}

export async function fetchReceivingYardsLeaders(seasons: number[]): Promise<ReceivingStatRow[]> {
  const rows = await sql`
    SELECT
      ps.player_slug,
      ps.player_name  AS name,
      ps.school_slug,
      ps.school_name,
      ps.season,
      ps.recv_yards   AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM player_season_stats ps
    LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
    WHERE ps.stat_type = 'Receiving'
      AND ps.recv_yards IS NOT NULL
      AND ps.season = ANY(${seasons})
    ORDER BY ps.season, ps.recv_yards DESC`
  return rows as ReceivingStatRow[]
}

export async function fetchReceivingTdsLeaders(seasons: number[]): Promise<ReceivingStatRow[]> {
  const rows = await sql`
    SELECT
      ps.player_slug,
      ps.player_name  AS name,
      ps.school_slug,
      ps.school_name,
      ps.season,
      ps.recv_tds     AS value,
      ts.overall_wins,
      ts.overall_losses
    FROM player_season_stats ps
    LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
    LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
    WHERE ps.stat_type = 'Receiving'
      AND ps.recv_tds IS NOT NULL
      AND ps.season = ANY(${seasons})
    ORDER BY ps.season, ps.recv_tds DESC`
  return rows as ReceivingStatRow[]
}
