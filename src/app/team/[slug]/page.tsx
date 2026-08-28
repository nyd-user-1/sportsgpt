import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { TeamShell } from './Shell'
import { cleanTeamName, pageMetadata } from '@/lib/seo'
import { jsonLdScriptProps, sportsTeamLd } from '@/lib/jsonld'

// Cached for an hour, not rendered per request: nothing here reads searchParams,
// cookies or headers, and every crawler hit used to be a Neon query. Rosters and
// scores change between games, not between seconds. (Was force-dynamic.)
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const rows = await sql`SELECT name, division FROM teams WHERE slug = ${slug} LIMIT 1`
  const team = rows[0]
  if (!team) return {}
  const name = cleanTeamName(team.name as string)
  const div = team.division ? ` Division ${team.division}` : ''
  return pageMetadata({
    title: `${name} Football`,
    description: `${name} varsity football —${div} Section XI records, season standings, schedule, results, and roster.`,
    path: `/team/${slug}`,
  })
}

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const teamRows = await sql`SELECT * FROM teams WHERE slug = ${slug}`
  const team = teamRows[0]
  if (!team) notFound()

  const [allTeams, seasonRows, divTeams, playerRows, gameRows, rosterRows, allSeasonStats, playerGameLogs, recordsCount, playerCountRows] = await Promise.all([
    sql`SELECT slug, name FROM teams ORDER BY name`,
    sql`
      SELECT s.*,
        COALESCE(s.points_for,  g.pf) AS points_for,
        COALESCE(s.points_against, g.pa) AS points_against,
        sos.sos_value
      FROM team_season_stats s
      LEFT JOIN (
        SELECT season,
          SUM(CASE WHEN home_team_slug = ${slug} THEN home_score ELSE away_score END) AS pf,
          SUM(CASE WHEN home_team_slug = ${slug} THEN away_score ELSE home_score END) AS pa
        FROM games
        WHERE home_team_slug = ${slug} OR away_team_slug = ${slug}
        GROUP BY season
      ) g ON g.season = s.season
      LEFT JOIN (
        SELECT gm.season,
          AVG(
            CAST(opp.overall_wins AS float) /
            NULLIF(opp.overall_wins + opp.overall_losses, 0)
          ) AS sos_value
        FROM games gm
        JOIN team_season_stats opp
          ON opp.team_slug = CASE
               WHEN gm.home_team_slug = ${slug} THEN gm.away_team_slug
               ELSE gm.home_team_slug
             END
          AND opp.season = gm.season
        WHERE gm.home_team_slug = ${slug} OR gm.away_team_slug = ${slug}
        GROUP BY gm.season
      ) sos ON sos.season = s.season
      WHERE s.team_slug = ${slug}
      ORDER BY s.season DESC`,
    sql`
      SELECT t.slug, t.name, s.overall_wins, s.overall_losses
      FROM teams t
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
      WHERE t.division = ${team.division}
      ORDER BY s.overall_wins DESC NULLS LAST, t.name`,
    sql`
      WITH latest AS (
        SELECT DISTINCT ON (pss.player_slug, pss.stat_type)
          pss.player_slug, pss.player_name, pss.stat_type, pss.season,
          COALESCE(p.slug, (
            SELECT p2.slug FROM players p2
            WHERE p2.school_slug = pss.school_slug
              AND lower(trim(regexp_replace(p2.name, ' +', ' ', 'g'))) = lower(trim(regexp_replace(pss.player_name, ' +', ' ', 'g')))
            LIMIT 1
          )) AS link_slug,
          pss.pass_yards, pss.pass_tds, pss.rush_yards, pss.rush_tds, pss.recv_yards, pss.recv_tds,
          p.position
        FROM player_season_stats pss
        LEFT JOIN players p ON p.slug = pss.player_slug
        WHERE pss.school_slug = ${team.school_slug}
          AND pss.stat_type IN ('Passing', 'Rushing', 'Receiving')
        ORDER BY pss.player_slug, pss.stat_type, pss.season DESC
      )
      SELECT * FROM latest
      ORDER BY
        CASE stat_type
          WHEN 'Passing'   THEN COALESCE(pass_yards, 0)
          WHEN 'Rushing'   THEN COALESCE(rush_yards, 0)
          WHEN 'Receiving' THEN COALESCE(recv_yards, 0)
          ELSE 0
        END DESC`,
    sql`
      SELECT g.id, g.game_date, g.season,
        g.home_team_slug, g.away_team_slug,
        g.home_score, g.away_score, g.is_division_game, g.game_number,
        ht.name AS home_team_name, at2.name AS away_team_name
      FROM games g
      LEFT JOIN teams ht  ON ht.slug  = g.home_team_slug
      LEFT JOIN teams at2 ON at2.slug = g.away_team_slug
      WHERE g.home_team_slug = ${slug} OR g.away_team_slug = ${slug}
      ORDER BY g.season DESC, g.game_date ASC`,
    sql`
      SELECT player_name, player_slug, jersey_number, class, season, position
      FROM player_rosters
      WHERE school_slug = ${team.school_slug}
        AND jersey_number IS NOT NULL
      ORDER BY season DESC, player_name ASC`,
    sql`
      SELECT team_slug, season, overall_wins, overall_losses
      FROM team_season_stats
      ORDER BY season, overall_wins DESC`,
    sql`
      SELECT
        pgs.game_id,
        COALESCE(pgs.player_slug, (
          SELECT p2.slug FROM players p2
          WHERE p2.school_slug = pgs.school_slug
            AND lower(trim(regexp_replace(p2.name, ' +', ' ', 'g'))) = lower(trim(regexp_replace(pgs.player_name, ' +', ' ', 'g')))
          LIMIT 1
        )) AS player_slug,
        pgs.player_name, pgs.school_slug,
        pgs.team_name, pgs.stat_type, pgs.season,
        pgs.rush_att, pgs.rush_yds, pgs.rush_tds,
        pgs.pass_comp, pgs.pass_att, pgs.pass_yds, pgs.pass_tds, pgs.pass_int,
        pgs.rec_rec, pgs.rec_yds, pgs.rec_tds,
        pgs.kick_pat, pgs.kick_fg, pgs.kick_points,
        pgs.def_int, pgs.def_sacks, pgs.def_fumbles,
        g.home_team_slug, g.away_team_slug,
        g.home_score, g.away_score, g.game_date,
        ht.name AS home_team_name,
        at2.name AS away_team_name
      FROM player_game_stats pgs
      JOIN games g ON g.id = pgs.game_id
      LEFT JOIN teams ht  ON ht.slug  = g.home_team_slug
      LEFT JOIN teams at2 ON at2.slug = g.away_team_slug
      WHERE pgs.school_slug = ${team.school_slug}
      ORDER BY g.season DESC, g.game_date ASC, pgs.player_name ASC`,
    sql`
      SELECT
        (SELECT COUNT(*) FROM games
          WHERE home_team_slug = ${slug} OR away_team_slug = ${slug}) +
        (SELECT COUNT(*) FROM player_season_stats WHERE school_slug = ${team.school_slug}) +
        (SELECT COUNT(*) FROM player_game_stats WHERE school_slug = ${team.school_slug})
        AS total`,
    sql`SELECT COUNT(DISTINCT slug)::int AS total FROM players`,
  ])

  // Prev/next by name order
  const namesSorted = (allTeams as { slug: string; name: string }[])
  const idx = namesSorted.findIndex(t => t.slug === slug)
  const n   = namesSorted.length
  const prevSlug = namesSorted[(idx - 1 + n) % n]?.slug ?? slug
  const nextSlug = namesSorted[(idx + 1) % n]?.slug ?? slug

  const totalRecords  = Number((recordsCount    as { total: number }[])[0]?.total ?? 0)
  const totalPlayers  = Number((playerCountRows as { total: number }[])[0]?.total ?? 0)
  const totalTeams    = namesSorted.length

  return (
    <>
      <script {...jsonLdScriptProps(sportsTeamLd({
        name: cleanTeamName(team.name as string),
        slug: slug,
        division: team.division as string | null,
      }))} />
    <TeamShell
      team={team as Record<string, unknown>}
      totalRecords={totalRecords}
      playerGameLogs={(playerGameLogs as Record<string, unknown>[]).map(r => ({
        ...r,
        game_id:   r.game_id  != null ? Number(r.game_id)  : null,
        season:    r.season   != null ? Number(r.season)   : null,
        game_date: r.game_date ? new Date(r.game_date as unknown as string).toISOString().slice(0, 10) : null,
      }))}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      seasonRows={seasonRows as Record<string, unknown>[]}
      divTeams={divTeams as Record<string, unknown>[]}
      playerRows={playerRows as Record<string, unknown>[]}
      rosterRows={rosterRows as Record<string, unknown>[]}
      totalTeams={totalTeams}
      totalPlayers={totalPlayers}
      allSeasonStats={allSeasonStats as { team_slug: string; season: number; overall_wins: number; overall_losses: number }[]}
      gameRows={gameRows.map(r => ({
        id:             Number(r.id),
        game_date:      r.game_date ? new Date(r.game_date as unknown as string).toISOString().slice(0, 10) : null,
        season:         Number(r.season),
        home_team_slug: r.home_team_slug as string,
        away_team_slug: r.away_team_slug as string,
        home_score:     r.home_score != null ? Number(r.home_score) : null,
        away_score:     r.away_score != null ? Number(r.away_score) : null,
        is_division_game: r.is_division_game as boolean | null,
        game_number:    r.game_number != null ? Number(r.game_number) : null,
        home_team_name: r.home_team_name as string | null,
        away_team_name: r.away_team_name as string | null,
      }))}
    />
    </>
  )
}
