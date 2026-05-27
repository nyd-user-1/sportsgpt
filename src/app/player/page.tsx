import { sql } from '@/lib/db'
import { PlayerMagazineShell } from './Shell'
import { AVAILABLE_SEASONS, CURRENT_SEASON } from '@/lib/season'

export const dynamic = 'force-dynamic'

export type PlayerMagazineRow = {
  slug: string
  name: string
  position: string | null
  school_slug: string | null
  team_slug: string | null
  team_name: string | null
  season: number
  games_played: number | null
  pass_yards: number | null
  rush_yards: number | null
  recv_yards: number | null
  total_yards: number | null
  pass_tds: number | null
  rush_tds: number | null
  recv_tds: number | null
  total_tds: number | null
  interceptions: number | null
}

export default async function PlayerMagazinePage() {
  let rows: PlayerMagazineRow[] = []

  try {
    const raw = await sql`
      WITH varsity AS (
        SELECT DISTINCT ON (school_slug) slug AS team_slug, name AS team_name, school_slug
        FROM teams
        WHERE name ILIKE '%varsity%'
        ORDER BY school_slug, name
      ),
      season_roll AS (
        SELECT
          ps.player_slug,
          ps.season,
          MAX(NULLIF(ps.games_played,  0))                                                                   AS games_played,
          SUM(CASE WHEN ps.stat_type = 'Passing'    THEN COALESCE(ps.pass_yards,    0) ELSE 0 END)            AS pass_yards,
          SUM(CASE WHEN ps.stat_type = 'Rushing'    THEN COALESCE(ps.rush_yards,    0) ELSE 0 END)            AS rush_yards,
          SUM(CASE WHEN ps.stat_type = 'Receiving'  THEN COALESCE(ps.recv_yards,    0) ELSE 0 END)            AS recv_yards,
          SUM(CASE WHEN ps.stat_type = 'Total Yards'THEN COALESCE(ps.total_yards,   0) ELSE 0 END)            AS total_yards_raw,
          SUM(CASE WHEN ps.stat_type = 'Passing'    THEN COALESCE(ps.pass_tds,      0) ELSE 0 END)            AS pass_tds,
          SUM(CASE WHEN ps.stat_type = 'Rushing'    THEN COALESCE(ps.rush_tds,      0) ELSE 0 END)            AS rush_tds,
          SUM(CASE WHEN ps.stat_type = 'Receiving'  THEN COALESCE(ps.recv_tds,      0) ELSE 0 END)            AS recv_tds,
          SUM(CASE WHEN ps.stat_type = 'Touchdowns' THEN COALESCE(ps.total_tds,     0) ELSE 0 END)            AS total_tds_raw,
          SUM(CASE WHEN ps.stat_type = 'Passing'    THEN COALESCE(ps.interceptions, 0) ELSE 0 END)            AS interceptions
        FROM player_season_stats ps
        WHERE ps.season = ANY(${AVAILABLE_SEASONS})
        GROUP BY ps.player_slug, ps.season
      )
      SELECT
        p.slug, p.name, p.position, p.school_slug,
        v.team_slug, v.team_name,
        sr.season, sr.games_played,
        sr.pass_yards, sr.rush_yards, sr.recv_yards,
        sr.pass_tds, sr.rush_tds, sr.recv_tds,
        sr.interceptions,
        CASE WHEN sr.player_slug IS NULL THEN NULL
             ELSE GREATEST(sr.total_yards_raw, sr.pass_yards + sr.rush_yards + sr.recv_yards) END AS total_yards,
        CASE WHEN sr.player_slug IS NULL THEN NULL
             ELSE GREATEST(sr.total_tds_raw,   sr.pass_tds   + sr.rush_tds   + sr.recv_tds)   END AS total_tds
      FROM players p
      LEFT JOIN varsity v ON v.school_slug = p.school_slug
      LEFT JOIN season_roll sr ON sr.player_slug = p.slug
      ORDER BY p.name, sr.season DESC NULLS LAST
    `

    rows = raw.map(r => ({
      slug:          r.slug as string,
      name:          r.name as string,
      position:      (r.position as string | null) ?? null,
      school_slug:   (r.school_slug as string | null) ?? null,
      team_slug:     (r.team_slug as string | null) ?? null,
      team_name:     r.team_name ? (r.team_name as string).replace(/\s+Varsity\s+Football$/i, '') : null,
      season:        Number(r.season),
      games_played:  r.games_played  != null ? Number(r.games_played)  : null,
      pass_yards:    r.pass_yards    != null ? Number(r.pass_yards)    : null,
      rush_yards:    r.rush_yards    != null ? Number(r.rush_yards)    : null,
      recv_yards:    r.recv_yards    != null ? Number(r.recv_yards)    : null,
      total_yards:   r.total_yards   != null ? Number(r.total_yards)   : null,
      pass_tds:      r.pass_tds      != null ? Number(r.pass_tds)      : null,
      rush_tds:      r.rush_tds      != null ? Number(r.rush_tds)      : null,
      recv_tds:      r.recv_tds      != null ? Number(r.recv_tds)      : null,
      total_tds:     r.total_tds     != null ? Number(r.total_tds)     : null,
      interceptions: r.interceptions != null ? Number(r.interceptions) : null,
    }))
  } catch { /* DB not connected */ }

  return (
    <PlayerMagazineShell
      players={rows}
      defaultSeason={CURRENT_SEASON}
      availableSeasons={AVAILABLE_SEASONS}
    />
  )
}
