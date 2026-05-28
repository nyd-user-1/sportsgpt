import { sql } from '@/lib/db'

export type GameRow = {
  id: number
  game_date: string | null
  season: number
  home_team_slug: string
  away_team_slug: string
  home_score: number | null
  away_score: number | null
  game_number: number | null
  home_name: string
  away_name: string
  home_div: string
  away_div: string
}

export async function fetchLaunchpadGames(seasons: number[]): Promise<GameRow[]> {
  const rows = await sql`
    SELECT
      g.id, g.game_date, g.season,
      g.home_team_slug, g.away_team_slug,
      g.home_score, g.away_score, g.game_number,
      ht.name  AS home_name,  ht.division  AS home_div,
      at2.name AS away_name, at2.division AS away_div
    FROM games g
    JOIN teams ht  ON ht.slug  = g.home_team_slug
    JOIN teams at2 ON at2.slug = g.away_team_slug
    WHERE g.season = ANY(${seasons})
    ORDER BY g.season DESC, g.game_date ASC NULLS LAST
  `

  return rows.map(r => ({
    id:             Number(r.id),
    game_date:      r.game_date ? new Date(r.game_date as unknown as string).toISOString().slice(0, 10) : null,
    season:         Number(r.season),
    home_team_slug: r.home_team_slug as string,
    away_team_slug: r.away_team_slug as string,
    home_score:     r.home_score != null ? Number(r.home_score) : null,
    away_score:     r.away_score != null ? Number(r.away_score) : null,
    game_number:    r.game_number != null ? Number(r.game_number) : null,
    home_name:      (r.home_name as string).replace(/\s+Varsity\s+Football$/i, ''),
    away_name:      (r.away_name as string).replace(/\s+Varsity\s+Football$/i, ''),
    home_div:       r.home_div as string,
    away_div:       r.away_div as string,
  }))
}
