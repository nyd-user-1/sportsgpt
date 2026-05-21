import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { GamePanelContent, type GamePanelData } from '@/components/PanelGame'

export const dynamic = 'force-dynamic'

export default async function InterceptedGamePanel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gameId = Number(id)
  if (!gameId) notFound()

  const [gameRows, boxRows, statRows] = await Promise.all([
    sql`
      SELECT g.id, g.season, g.game_number, g.game_date,
        g.home_team_slug, g.away_team_slug,
        g.home_score, g.away_score,
        ht.name  AS home_name,  ht.school_slug AS home_school,
        at2.name AS away_name, at2.school_slug AS away_school
      FROM games g
      JOIN teams ht  ON ht.slug  = g.home_team_slug
      JOIN teams at2 ON at2.slug = g.away_team_slug
      WHERE g.id = ${gameId}`,

    sql`SELECT quarter_scores, highlights FROM game_box_scores WHERE game_id = ${gameId}`,

    sql`
      SELECT player_name, player_slug, school_slug, team_name, stat_type,
        rush_att, rush_yds, rush_tds,
        pass_comp, pass_att, pass_yds, pass_tds, pass_int,
        rec_rec, rec_yds, rec_tds
      FROM player_game_stats
      WHERE game_id = ${gameId}
        AND stat_type IN ('Passing', 'Rushing', 'Receiving')
      ORDER BY
        CASE stat_type WHEN 'Passing' THEN pass_yds WHEN 'Rushing' THEN rush_yds ELSE rec_yds END DESC NULLS LAST`,
  ])

  const g = gameRows[0]
  if (!g) notFound()

  const box = boxRows[0]
  const quarterRows = ((box?.quarter_scores as {team_slug:string;q1:number;q2:number;q3:number;q4:number;ot1:number;final:number}[] | null) ?? [])

  const game: GamePanelData['game'] = {
    id:             Number(g.id),
    season:         Number(g.season),
    game_number:    g.game_number != null ? Number(g.game_number) : null,
    game_date:      g.game_date ? new Date(g.game_date as unknown as string).toISOString().slice(0, 10) : null,
    home_team_slug: g.home_team_slug as string,
    away_team_slug: g.away_team_slug as string,
    home_school:    g.home_school as string,
    away_school:    g.away_school as string,
    home_name:      (g.home_name as string).replace(/\s+Varsity\s+Football$/i, ''),
    away_name:      (g.away_name as string).replace(/\s+Varsity\s+Football$/i, ''),
    home_score:     g.home_score != null ? Number(g.home_score) : null,
    away_score:     g.away_score != null ? Number(g.away_score) : null,
  }

  return (
    <GamePanelContent
      game={game}
      quarterRows={quarterRows}
      playerStats={(statRows as Record<string, unknown>[]).map(r => ({
        player_name: r.player_name as string,
        player_slug: r.player_slug as string | null,
        school_slug: r.school_slug as string,
        team_name:   r.team_name as string,
        stat_type:   r.stat_type as string,
        rush_att:  r.rush_att  != null ? Number(r.rush_att)  : null,
        rush_yds:  r.rush_yds  != null ? Number(r.rush_yds)  : null,
        rush_tds:  r.rush_tds  != null ? Number(r.rush_tds)  : null,
        pass_yds:  r.pass_yds  != null ? Number(r.pass_yds)  : null,
        pass_comp: r.pass_comp != null ? Number(r.pass_comp) : null,
        pass_att:  r.pass_att  != null ? Number(r.pass_att)  : null,
        pass_tds:  r.pass_tds  != null ? Number(r.pass_tds)  : null,
        pass_int:  r.pass_int  != null ? Number(r.pass_int)  : null,
        rec_yds:   r.rec_yds   != null ? Number(r.rec_yds)   : null,
        rec_rec:   r.rec_rec   != null ? Number(r.rec_rec)   : null,
        rec_tds:   r.rec_tds   != null ? Number(r.rec_tds)   : null,
      }))}
      narrative={box?.highlights as string | null ?? null}
    />
  )
}
