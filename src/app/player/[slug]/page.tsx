import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { PlayerShell } from './Shell'

export const dynamic = 'force-dynamic'

export default async function PlayerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const pRows = await sql`SELECT * FROM players WHERE slug = ${slug}`
  const player = pRows[0]
  if (!player) notFound()

  const [stats, schoolRows, allPlayerRows] = await Promise.all([
    sql`
      SELECT * FROM player_season_stats
      WHERE player_slug = ${slug}
      ORDER BY season DESC, stat_type
    `,
    player.school_slug
      ? sql`SELECT name, division FROM schools WHERE slug = ${player.school_slug}`
      : Promise.resolve([]),
    sql`
      SELECT DISTINCT player_slug, player_name
      FROM player_season_stats
      ORDER BY player_name
    `,
  ])

  const school = schoolRows[0] ? { name: schoolRows[0].name as string, division: schoolRows[0].division as string } : null

  // Prev/next by alpha from stats table (players with data only)
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
      }))}
      school={school}
      prevSlug={prev?.player_slug ?? slug}
      nextSlug={next?.player_slug ?? slug}
    />
  )
}
