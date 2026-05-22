import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; season: string }> }
) {
  const { slug, season } = await params
  const teamSlug = `${slug}-varsity-football`
  const s = parseInt(season, 10)
  const rows = await sql`
    SELECT g.id,
           g.game_number AS week,
           g.game_date,
           CASE WHEN g.home_team_slug = ${teamSlug} THEN 'home' ELSE 'away' END AS side,
           CASE WHEN g.home_team_slug = ${teamSlug} THEN g.home_score ELSE g.away_score END AS team_score,
           CASE WHEN g.home_team_slug = ${teamSlug} THEN g.away_score ELSE g.home_score END AS opp_score,
           CASE WHEN g.home_team_slug = ${teamSlug} THEN at2.name ELSE ht.name END AS opponent_name,
           CASE WHEN g.home_team_slug = ${teamSlug} THEN at2.school_slug ELSE ht.school_slug END AS opp_slug
    FROM games g
    JOIN teams ht  ON ht.slug  = g.home_team_slug
    JOIN teams at2 ON at2.slug = g.away_team_slug
    WHERE (g.home_team_slug = ${teamSlug} OR g.away_team_slug = ${teamSlug})
      AND g.season = ${s}
    ORDER BY g.game_number ASC NULLS LAST`
  return NextResponse.json(rows)
}
