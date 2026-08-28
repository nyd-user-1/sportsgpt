import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getPositionConfig, playerMatchesPosition, type PositionSlug } from '@/lib/positions'
import { PositionShell } from './Shell'

// Cached for an hour, not rendered per request: nothing here reads searchParams,
// cookies or headers, and every crawler hit used to be a Neon query. Rosters and
// scores change between games, not between seconds. (Was force-dynamic.)
export const revalidate = 3600

export default async function PositionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = getPositionConfig(slug)
  if (!config) notFound()

  // Fetch all players — dataset is small enough (~307 rows) to filter in TS
  const allPlayers = await sql`
    SELECT p.slug, p.name, p.position, p.school_slug, s.name as school_name, s.division
    FROM players p
    LEFT JOIN schools s ON s.slug = p.school_slug
    ORDER BY p.name
  `

  const players = (allPlayers as Record<string, unknown>[]).filter(p =>
    playerMatchesPosition(p.position as string | null, config.slug as PositionSlug)
  )

  let stats: Record<string, unknown>[] = []
  if (config.statType && players.length > 0) {
    const slugs = players.map(p => p.slug as string)

    if (config.statType === 'Defense') {
      // Defense stats live in player_game_stats; aggregate per player per season.
      // Convention (matching player Shell): sacks → rush_yards, fumbles → rush_attempts, INTs → interceptions
      stats = await sql`
        SELECT player_slug, season,
               SUM(def_sacks)::int   AS rush_yards,
               SUM(def_fumbles)::int AS rush_attempts,
               SUM(def_int)::int     AS interceptions
        FROM player_game_stats
        WHERE player_slug = ANY(${slugs})
          AND stat_type = 'Defense'
        GROUP BY player_slug, season
        ORDER BY player_slug, season DESC
      ` as Record<string, unknown>[]
    } else {
      stats = await sql`
        SELECT player_slug, season,
               pass_yards, pass_tds, attempts, completions, interceptions,
               rush_yards, rush_tds, rush_attempts,
               recv_yards, recv_tds, receptions,
               points, total_tds, fg, pat, games_played
        FROM player_season_stats
        WHERE player_slug = ANY(${slugs})
          AND stat_type = ${config.statType}
        ORDER BY player_slug, season DESC
      ` as Record<string, unknown>[]
    }
  }

  return (
    <PositionShell
      config={config}
      players={players.map(p => ({
        slug:        p.slug as string,
        name:        p.name as string,
        position:    p.position as string | null,
        school_slug: p.school_slug as string | null,
        school_name: p.school_name as string | null,
        division:    p.division as string | null,
      }))}
      stats={stats.map(r => ({
        player_slug:   r.player_slug as string,
        season:        Number(r.season),
        pass_yards:    r.pass_yards != null ? Number(r.pass_yards) : null,
        pass_tds:      r.pass_tds != null ? Number(r.pass_tds) : null,
        attempts:      r.attempts != null ? Number(r.attempts) : null,
        completions:   r.completions != null ? Number(r.completions) : null,
        interceptions: r.interceptions != null ? Number(r.interceptions) : null,
        rush_yards:    r.rush_yards != null ? Number(r.rush_yards) : null,
        rush_tds:      r.rush_tds != null ? Number(r.rush_tds) : null,
        rush_attempts: r.rush_attempts != null ? Number(r.rush_attempts) : null,
        recv_yards:    r.recv_yards != null ? Number(r.recv_yards) : null,
        recv_tds:      r.recv_tds != null ? Number(r.recv_tds) : null,
        receptions:    r.receptions != null ? Number(r.receptions) : null,
        points:        r.points != null ? Number(r.points) : null,
        total_tds:     r.total_tds != null ? Number(r.total_tds) : null,
        fg:            r.fg != null ? Number(r.fg) : null,
        pat:           r.pat != null ? Number(r.pat) : null,
        games_played:  r.games_played != null ? Number(r.games_played) : null,
      }))}
    />
  )
}
