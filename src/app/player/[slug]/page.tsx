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

  const [stats, allPlayerRows, divTeams, divPlayers] = await Promise.all([
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
  ])

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
      divTeams={divTeams.map(r => ({
        slug:           r.slug as string,
        name:           r.name as string,
        overall_wins:   r.overall_wins != null ? Number(r.overall_wins) : null,
        overall_losses: r.overall_losses != null ? Number(r.overall_losses) : null,
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
