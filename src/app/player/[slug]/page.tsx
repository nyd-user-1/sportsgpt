import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { PlayerShell } from './Shell'

export const dynamic = 'force-dynamic'

export default async function PlayerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const pRows = await sql`SELECT * FROM players WHERE slug = ${slug}`
  const player = pRows[0]
  if (!player) notFound()

  const schoolRows = player.school_slug
    ? await sql`SELECT name, division FROM schools WHERE slug = ${player.school_slug}`
    : []

  const school = schoolRows[0]
    ? { name: schoolRows[0].name as string, division: schoolRows[0].division as string }
    : null

  const [stats, allPlayerRows, divTeams, divPlayers, gameLogSeasonStats, gameLog, teamSeasonStats, allTeamRows] = await Promise.all([
    sql`
      SELECT * FROM player_season_stats
      WHERE player_slug = ${slug}
      ORDER BY season DESC, stat_type
    `,
    sql`
      SELECT DISTINCT player_slug, player_name
      FROM player_season_stats
      ORDER BY player_name
    `,
    school
      ? sql`
          SELECT t.slug, t.name, s.overall_wins, s.overall_losses
          FROM teams t
          LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
          WHERE t.division = ${school.division}
            AND t.level = 'Varsity'
          ORDER BY s.overall_wins DESC NULLS LAST, t.name
        `
      : Promise.resolve([]),
    school
      ? sql`
          SELECT ps.player_slug, ps.player_name, ps.school_name, ps.school_slug,
            ps.stat_type, ps.pass_yards, ps.rush_yards, ps.recv_yards, ps.season,
            p.position
          FROM player_season_stats ps
          JOIN schools sch ON sch.slug = ps.school_slug AND sch.division = ${school.division}
          LEFT JOIN players p ON p.slug = ps.player_slug
          WHERE ps.stat_type IN ('Passing', 'Rushing', 'Receiving')
            AND ps.season = 2024
            AND ps.player_slug != ${slug}
            AND GREATEST(COALESCE(ps.pass_yards, 0), COALESCE(ps.rush_yards, 0), COALESCE(ps.recv_yards, 0)) > 0
          ORDER BY GREATEST(COALESCE(ps.pass_yards, 0), COALESCE(ps.rush_yards, 0), COALESCE(ps.recv_yards, 0)) DESC
          LIMIT 20
        `
      : Promise.resolve([]),
    sql`
      SELECT entry->>'stat_type' as stat_type, g.season,
        SUM((entry->>'yds')::int)     as yds,
        SUM((entry->>'att')::int)     as att,
        SUM((entry->>'tds')::int)     as tds,
        SUM((entry->>'comp')::int)    as comp,
        SUM((entry->>'int')::int)     as pass_int,
        SUM((entry->>'rec')::int)     as rec,
        SUM((entry->>'pat')::int)     as pat,
        SUM((entry->>'fg')::int)      as fg,
        SUM((entry->>'points')::int)  as points
      FROM games g
      JOIN game_box_scores gbs ON gbs.game_id = g.id,
      LATERAL jsonb_array_elements(gbs.player_stats) as entry
      WHERE entry->>'player' = ${player.name as string}
      GROUP BY entry->>'stat_type', g.season
      ORDER BY g.season DESC
    `,
    sql`
      SELECT
        g.id as game_id, g.game_date, g.season, g.game_number,
        g.home_team_slug, g.away_team_slug, g.home_score, g.away_score,
        ht.name as home_team_name, at2.name as away_team_name,
        entry->>'stat_type' as stat_type,
        (entry->>'yds')::int    as yds,
        (entry->>'att')::int    as att,
        (entry->>'tds')::int    as tds,
        (entry->>'comp')::int   as comp,
        (entry->>'int')::int    as pass_int,
        (entry->>'rec')::int    as rec,
        (entry->>'pat')::int    as pat,
        (entry->>'fg')::int     as fg,
        (entry->>'points')::int as points,
        (entry->>'sacks')::numeric as sacks,
        (entry->>'fumbles')::int   as fumbles
      FROM games g
      JOIN game_box_scores gbs ON gbs.game_id = g.id
      LEFT JOIN teams ht  ON ht.slug  = g.home_team_slug
      LEFT JOIN teams at2 ON at2.slug = g.away_team_slug,
      LATERAL jsonb_array_elements(gbs.player_stats) as entry
      WHERE entry->>'player' = ${player.name as string}
      ORDER BY g.game_date ASC
    `,
    player.school_slug
      ? sql`SELECT season, overall_wins, overall_losses FROM team_season_stats WHERE team_slug = ${`${player.school_slug}-varsity-football`} ORDER BY season DESC`
      : Promise.resolve([]),
    sql`SELECT slug, name FROM teams ORDER BY name`,
  ])

  const allTeams = (allTeamRows as { slug: string; name: string }[])

  const teamRecords: Record<number, string> = Object.fromEntries(
    (teamSeasonStats as { season: number; overall_wins: number; overall_losses: number }[])
      .map(r => [r.season, `${r.overall_wins ?? 0}–${r.overall_losses ?? 0}`])
  )

  const allPlayers = allPlayerRows as { player_slug: string; player_name: string }[]
  const idx = allPlayers.findIndex(p => p.player_slug === slug)
  const n   = allPlayers.length
  const prev = n > 0 ? allPlayers[(idx - 1 + n) % n] : null
  const next = n > 0 ? allPlayers[(idx + 1) % n] : null

  return (
    <PlayerShell
      player={{
        id:          Number(player.id),
        slug:        player.slug as string,
        name:        player.name as string,
        school_slug: player.school_slug as string | null,
        team_slug:   player.team_slug as string | null,
        position:    player.position as string | null,
      }}
      teamRecords={teamRecords}
      stats={stats.map(r => ({
        id:           Number(r.id),
        player_slug:  r.player_slug as string,
        player_name:  r.player_name as string,
        school_slug:  r.school_slug as string | null,
        school_name:  r.school_name as string | null,
        team_name:    r.team_name as string | null,
        season:       Number(r.season),
        stat_type:    r.stat_type as string,
        completions:  r.completions != null ? Number(r.completions) : null,
        attempts:     r.attempts != null ? Number(r.attempts) : null,
        pass_yards:   r.pass_yards != null ? Number(r.pass_yards) : null,
        pass_tds:     r.pass_tds != null ? Number(r.pass_tds) : null,
        interceptions:r.interceptions != null ? Number(r.interceptions) : null,
        rush_attempts:       r.rush_attempts != null ? Number(r.rush_attempts) : null,
        rush_yards:          r.rush_yards != null ? Number(r.rush_yards) : null,
        rush_tds:            r.rush_tds != null ? Number(r.rush_tds) : null,
        receptions:          r.receptions != null ? Number(r.receptions) : null,
        recv_yards:          r.recv_yards != null ? Number(r.recv_yards) : null,
        recv_tds:            r.recv_tds != null ? Number(r.recv_tds) : null,
        pat:                 r.pat != null ? Number(r.pat) : null,
        season_rank:         r.season_rank != null ? Number(r.season_rank) : null,
        games_played:        r.games_played != null ? Number(r.games_played) : null,
        total_yards:         r.total_yards != null ? Number(r.total_yards) : null,
        yards_per_game:      r.yards_per_game != null ? Number(r.yards_per_game) : null,
        total_tds:           r.total_tds != null ? Number(r.total_tds) : null,
        tds_per_game:        r.tds_per_game != null ? Number(r.tds_per_game) : null,
        fumble_return_tds:   r.fumble_return_tds != null ? Number(r.fumble_return_tds) : null,
        int_return_tds:      r.int_return_tds != null ? Number(r.int_return_tds) : null,
        punt_return_tds:     r.punt_return_tds != null ? Number(r.punt_return_tds) : null,
        kickoff_return_tds:  r.kickoff_return_tds != null ? Number(r.kickoff_return_tds) : null,
        points:              r.points != null ? Number(r.points) : null,
        points_per_game:     r.points_per_game != null ? Number(r.points_per_game) : null,
        fg:                  r.fg != null ? Number(r.fg) : null,
        safeties:            r.safeties != null ? Number(r.safeties) : null,
        ai_summary:          r.ai_summary as string | null,
      }))}
      school={school}
      prevSlug={prev?.player_slug ?? slug}
      nextSlug={next?.player_slug ?? slug}
      allPlayers={allPlayers}
      allTeams={allTeams}
      divTeams={divTeams.map(r => ({
        slug:           r.slug as string,
        name:           r.name as string,
        overall_wins:   r.overall_wins != null ? Number(r.overall_wins) : null,
        overall_losses: r.overall_losses != null ? Number(r.overall_losses) : null,
      }))}
      gameLogSeasonStats={gameLogSeasonStats.map(r => ({
        stat_type: r.stat_type as string,
        season:    Number(r.season),
        yds:       r.yds != null ? Number(r.yds) : null,
        att:       r.att != null ? Number(r.att) : null,
        tds:       r.tds != null ? Number(r.tds) : null,
        comp:      r.comp != null ? Number(r.comp) : null,
        pass_int:  r.pass_int != null ? Number(r.pass_int) : null,
        rec:       r.rec != null ? Number(r.rec) : null,
        pat:       r.pat != null ? Number(r.pat) : null,
        fg:        r.fg != null ? Number(r.fg) : null,
        points:    r.points != null ? Number(r.points) : null,
      }))}
      gameLog={gameLog.map(r => ({
        game_id:        Number(r.game_id),
        game_date:      r.game_date ? new Date(r.game_date as unknown as string).toISOString().slice(0, 10) : null,
        season:         Number(r.season),
        game_number:    r.game_number != null ? Number(r.game_number) : null,
        home_team_slug: r.home_team_slug as string,
        away_team_slug: r.away_team_slug as string,
        home_score:     r.home_score != null ? Number(r.home_score) : null,
        away_score:     r.away_score != null ? Number(r.away_score) : null,
        home_team_name: r.home_team_name as string | null,
        away_team_name: r.away_team_name as string | null,
        stat_type:      r.stat_type as string,
        yds:            r.yds != null ? Number(r.yds) : null,
        att:            r.att != null ? Number(r.att) : null,
        tds:            r.tds != null ? Number(r.tds) : null,
        comp:           r.comp != null ? Number(r.comp) : null,
        pass_int:       r.pass_int != null ? Number(r.pass_int) : null,
        rec:            r.rec != null ? Number(r.rec) : null,
        pat:            r.pat != null ? Number(r.pat) : null,
        fg:             r.fg != null ? Number(r.fg) : null,
        points:         r.points != null ? Number(r.points) : null,
        sacks:          r.sacks != null ? Number(r.sacks) : null,
        fumbles:        r.fumbles != null ? Number(r.fumbles) : null,
      }))}
      divPlayers={divPlayers.map(r => ({
        player_slug: r.player_slug as string,
        player_name: r.player_name as string,
        school_name: r.school_name as string,
        school_slug: r.school_slug as string | null,
        stat_type:   r.stat_type as string,
        pass_yards:  r.pass_yards != null ? Number(r.pass_yards) : null,
        rush_yards:  r.rush_yards != null ? Number(r.rush_yards) : null,
        recv_yards:  r.recv_yards != null ? Number(r.recv_yards) : null,
        position:    r.position as string | null,
      }))}
    />
  )
}
