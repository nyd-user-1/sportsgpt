import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const gameId = parseInt(id, 10)

  const [gameRows, qRows, playerRows] = await Promise.all([
    sql`
      SELECT g.id, g.season, g.game_number, g.game_date,
             g.home_team_slug, g.away_team_slug,
             g.home_score, g.away_score,
             ht.name AS home_name, ht.school_slug AS home_school,
             at2.name AS away_name, at2.school_slug AS away_school
      FROM games g
      JOIN teams ht  ON ht.slug  = g.home_team_slug
      JOIN teams at2 ON at2.slug = g.away_team_slug
      WHERE g.id = ${gameId}`,
    sql`
      SELECT gbs.quarter_scores
      FROM game_box_scores gbs
      WHERE gbs.game_id = ${gameId}`,
    sql`
      SELECT player_name, player_slug, school_slug, team_name, stat_type,
             rush_att, rush_yds, rush_tds,
             pass_comp, pass_att, pass_yds, pass_tds, pass_int,
             rec_rec, rec_yds, rec_tds
      FROM player_game_stats
      WHERE game_id = ${gameId}
      ORDER BY stat_type, COALESCE(rush_yds, pass_yds, rec_yds, 0) DESC`,
  ])

  const game = gameRows[0] ?? null
  const quarterScores = qRows[0]?.quarter_scores ?? null

  return NextResponse.json({ game, quarterScores, playerStats: playerRows })
}
