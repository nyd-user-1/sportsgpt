import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { PlayerGameLogContent } from './PlayerGameLogContent'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
function fmtDate(raw: unknown) {
  if (!raw) return null
  const d = new Date(String(raw).includes('T') ? String(raw) : `${raw}T12:00:00`)
  if (isNaN(d.getTime())) return null
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export default async function GamePlayerLogPanel({
  params,
}: {
  params: Promise<{ id: string; slug: string }>
}) {
  const { id, slug } = await params
  const gameId = parseInt(id, 10)
  if (isNaN(gameId)) notFound()

  const [playerRows, gameRows, statRows] = await Promise.all([
    sql`
      SELECT p.slug, p.name, p.position, p.school_slug,
             t.name AS team_name, t.division
      FROM players p
      LEFT JOIN teams t ON t.school_slug = p.school_slug AND t.level = 'Varsity'
      WHERE p.slug = ${slug}
      LIMIT 1
    `,
    sql`
      SELECT season, game_number, game_date,
             home_team_slug, away_team_slug,
             home_score, away_score
      FROM games WHERE id = ${gameId} LIMIT 1
    `,
    sql`
      SELECT stat_type,
             rush_att, rush_yds, rush_tds,
             pass_comp, pass_att, pass_yds, pass_tds, pass_int,
             rec_rec, rec_yds, rec_tds,
             kick_pat, kick_fg, kick_points,
             def_int, def_sacks, def_fumbles
      FROM player_game_stats
      WHERE game_id = ${gameId} AND player_slug = ${slug}
    `,
  ])

  if (!playerRows[0] || !gameRows[0]) notFound()

  const player = playerRows[0]
  const game   = gameRows[0]

  // Aggregate any duplicate rows by stat_type — game-stats are flat per type.
  const merged = {
    rush_att: 0, rush_yds: 0, rush_tds: 0,
    pass_comp: 0, pass_att: 0, pass_yds: 0, pass_tds: 0, pass_int: 0,
    rec_rec: 0, rec_yds: 0, rec_tds: 0,
    kick_pat: 0, kick_fg: 0, kick_points: 0,
    def_int: 0, def_sacks: 0, def_fumbles: 0,
  }
  const seenTypes = new Set<string>()
  for (const r of statRows) {
    if (r.stat_type) seenTypes.add(r.stat_type as string)
    for (const k of Object.keys(merged) as (keyof typeof merged)[]) {
      const v = r[k as keyof typeof r]
      if (v != null) merged[k] = (merged[k] ?? 0) + Number(v)
    }
  }

  return (
    <PlayerGameLogContent
      player={{
        slug:        player.slug as string,
        name:        player.name as string,
        position:    (player.position as string | null) ?? null,
        school_slug: player.school_slug as string,
        team_name:   (player.team_name as string | null)?.replace(/\s+Varsity\s+Football$/i, '') ?? '',
        division:    (player.division as string | null) ?? null,
      }}
      game={{
        id:         gameId,
        season:     Number(game.season),
        gameNumber: game.game_number != null ? Number(game.game_number) : null,
        gameDate:   fmtDate(game.game_date),
      }}
      stats={merged}
      statTypes={[...seenTypes]}
    />
  )
}
