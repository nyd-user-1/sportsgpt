import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import { GameShell } from './GameShell'

export const dynamic = 'force-dynamic'

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gameId = parseInt(id, 10)
  if (isNaN(gameId)) notFound()

  const [gameRows, boxRows] = await Promise.all([
    sql`
      SELECT g.*,
             ht.name  AS home_team_name,  ht.school_slug AS home_school_slug,  ht.division,
             at2.name AS away_team_name,  at2.school_slug AS away_school_slug
      FROM games g
      LEFT JOIN teams ht  ON ht.slug  = g.home_team_slug
      LEFT JOIN teams at2 ON at2.slug = g.away_team_slug
      WHERE g.id = ${gameId}
      LIMIT 1
    `,
    sql`
      SELECT newsday_id, top_performers, highlights, quarter_scores, player_stats
      FROM game_box_scores
      WHERE game_id = ${gameId}
      LIMIT 1
    `,
  ])

  if (!gameRows[0]) notFound()

  return <GameShell game={gameRows[0] as Record<string, unknown>} box={(boxRows[0] ?? null) as Record<string, unknown> | null} />
}
