import { sql } from '@/lib/db'
import PlayerIndexTable from './PlayerIndexTable'

export const dynamic = 'force-dynamic'

export default async function PlayerPage() {
  let players: {
    slug: string; name: string; school_slug: string | null; team_slug: string | null
    team_name: string | null; position: string | null
    total_yards: number | null; pass_yards: number | null; rush_yards: number | null
    recv_yards: number | null; total_tds: number | null; interceptions: number | null
  }[] = []

  try {
    const rows = await sql`
      SELECT
        p.slug, p.name, p.position, p.school_slug,
        t.team_slug, t.team_name,
        NULLIF(SUM(CASE WHEN ps.stat_type = 'Total Yards'  THEN COALESCE(ps.total_yards, 0)    ELSE 0 END), 0) AS total_yards,
        NULLIF(SUM(CASE WHEN ps.stat_type = 'Passing'      THEN COALESCE(ps.pass_yards, 0)     ELSE 0 END), 0) AS pass_yards,
        NULLIF(SUM(CASE WHEN ps.stat_type = 'Rushing'      THEN COALESCE(ps.rush_yards, 0)     ELSE 0 END), 0) AS rush_yards,
        NULLIF(SUM(CASE WHEN ps.stat_type = 'Receiving'    THEN COALESCE(ps.recv_yards, 0)     ELSE 0 END), 0) AS recv_yards,
        NULLIF(SUM(CASE WHEN ps.stat_type = 'Touchdowns'   THEN COALESCE(ps.total_tds, 0)      ELSE 0 END), 0) AS total_tds,
        NULLIF(SUM(CASE WHEN ps.stat_type = 'Passing'      THEN COALESCE(ps.interceptions, 0)  ELSE 0 END), 0) AS interceptions
      FROM players p
      LEFT JOIN (
        SELECT DISTINCT ON (school_slug) slug AS team_slug, name AS team_name, school_slug
        FROM teams
        WHERE name ILIKE '%varsity%'
        ORDER BY school_slug, name
      ) t ON t.school_slug = p.school_slug
      LEFT JOIN player_season_stats ps ON ps.player_slug = p.slug
      GROUP BY p.slug, p.name, p.position, p.school_slug, t.team_slug, t.team_name
      ORDER BY p.name
    `
    players = rows.map(r => ({
      slug:         r.slug as string,
      name:         r.name as string,
      position:     r.position as string | null,
      school_slug:  r.school_slug as string | null,
      team_slug:    r.team_slug as string | null,
      team_name:    r.team_name ? (r.team_name as string).replace(/\s+Varsity\s+Football$/i, '') : null,
      total_yards:  r.total_yards != null ? Number(r.total_yards) : null,
      pass_yards:   r.pass_yards  != null ? Number(r.pass_yards)  : null,
      rush_yards:   r.rush_yards  != null ? Number(r.rush_yards)  : null,
      recv_yards:   r.recv_yards  != null ? Number(r.recv_yards)  : null,
      total_tds:    r.total_tds   != null ? Number(r.total_tds)   : null,
      interceptions:r.interceptions != null ? Number(r.interceptions) : null,
    }))
  } catch { /* DB not connected */ }

  return <PlayerIndexTable players={players} />
}
