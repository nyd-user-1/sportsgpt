import type { Metadata } from 'next'
import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import { GameShell } from './GameShell'
import { cleanTeamName, pageMetadata } from '@/lib/seo'
import { jsonLdScriptProps, sportsEventLd } from '@/lib/jsonld'
import { formatSeason } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const gameId = parseInt(id, 10)
  if (isNaN(gameId)) return {}
  const rows = await sql`
    SELECT ht.name AS home_name, at2.name AS away_name,
           g.home_score, g.away_score, g.season
    FROM games g
    LEFT JOIN teams ht  ON ht.slug  = g.home_team_slug
    LEFT JOIN teams at2 ON at2.slug = g.away_team_slug
    WHERE g.id = ${gameId}
    LIMIT 1`
  const game = rows[0]
  if (!game) return {}
  const home = cleanTeamName((game.home_name as string) ?? 'Home')
  const away = cleanTeamName((game.away_name as string) ?? 'Away')
  const season = game.season != null ? formatSeason(game.season as number) : ''
  const score = game.home_score != null && game.away_score != null
    ? ` Final: ${home} ${game.home_score}, ${away} ${game.away_score}.`
    : ''
  return pageMetadata({
    title: `${away} at ${home}${season ? ` (${season})` : ''}`,
    description: `${away} vs ${home} Section XI football${season ? `, ${season} season` : ''}.${score} Box score, player stats, and game highlights.`,
    path: `/game/${gameId}`,
  })
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { id } = await params
  const { ref } = await searchParams
  const gameId = parseInt(id, 10)
  if (isNaN(gameId)) notFound()

  const [gameRows, boxRows, playerGameStatRows, teamCountRows, playerCountRows] = await Promise.all([
    sql`
      SELECT g.*,
             ht.name  AS home_team_name,  ht.school_slug AS home_school_slug,  ht.division,
             at2.name AS away_team_name,  at2.school_slug AS away_school_slug, at2.division AS away_division
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
    sql`
      SELECT player_slug, player_name, school_slug, team_name, stat_type,
             rush_att, rush_yds, rush_tds,
             pass_comp, pass_att, pass_yds, pass_tds, pass_int,
             rec_rec, rec_yds, rec_tds,
             kick_pat, kick_fg, kick_points,
             def_int, def_sacks, def_fumbles
      FROM player_game_stats
      WHERE game_id = ${gameId}
      ORDER BY stat_type, team_name, player_name
    `,
    sql`SELECT COUNT(DISTINCT slug)::int AS total FROM teams`,
    sql`SELECT COUNT(DISTINCT slug)::int AS total FROM players`,
  ])

  if (!gameRows[0]) notFound()

  const game = gameRows[0]
  const homeSlug  = game.home_team_slug as string
  const awaySlug  = game.away_team_slug as string
  const season    = game.season as number
  // ref param keeps navigation anchored to the team the user came from
  const refSlug   = ref && (ref === homeSlug || ref === awaySlug) ? ref : homeSlug

  const seasonGames = await sql`
    SELECT id FROM games
    WHERE season = ${season}
      AND (home_team_slug = ${refSlug} OR away_team_slug = ${refSlug})
    ORDER BY game_date ASC, id ASC
  `
  const ids = seasonGames.map(r => r.id as number)
  const cur = ids.indexOf(gameId)
  const prevGameId = ids[(cur - 1 + ids.length) % ids.length] ?? null
  const nextGameId = ids[(cur + 1) % ids.length] ?? null

  // Player slug lookup for both teams
  const playerRows = await sql`
    SELECT name, slug FROM players
    WHERE school_slug = ${homeSlug.replace(/-varsity-football$/, '')}
       OR school_slug = ${awaySlug.replace(/-varsity-football$/, '')}
  `
  const playerSlugs: Record<string, string> = {}
  for (const p of playerRows) {
    playerSlugs[(p.name as string).toLowerCase()] = p.slug as string
  }

  const totalTeams   = Number((teamCountRows   as { total: number }[])[0]?.total ?? 0)
  const totalPlayers = Number((playerCountRows as { total: number }[])[0]?.total ?? 0)

  return (
    <>
      <script {...jsonLdScriptProps(sportsEventLd({
        id: gameId,
        homeName: cleanTeamName((game.home_team_name as string | null) ?? homeSlug),
        awayName: cleanTeamName((game.away_team_name as string | null) ?? awaySlug),
        homeScore: game.home_score != null ? Number(game.home_score) : null,
        awayScore: game.away_score != null ? Number(game.away_score) : null,
        date: game.game_date ? new Date(game.game_date as unknown as string).toISOString().slice(0, 10) : null,
      }))} />
    <GameShell
      game={game as Record<string, unknown>}
      box={(boxRows[0] ?? null) as Record<string, unknown> | null}
      playerGameStats={playerGameStatRows as Record<string, unknown>[]}
      prevGameId={prevGameId ?? null}
      nextGameId={nextGameId ?? null}
      refSlug={refSlug}
      playerSlugs={playerSlugs}
      totalTeams={totalTeams}
      totalPlayers={totalPlayers}
    />
    </>
  )
}
