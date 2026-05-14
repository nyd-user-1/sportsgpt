import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { TeamShell } from './Shell'

export const dynamic = 'force-dynamic'

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const teamRows = await sql`SELECT * FROM teams WHERE slug = ${slug}`
  const team = teamRows[0]
  if (!team) notFound()

  const [allTeams, seasonRows, divTeams, playerRows, gameRows] = await Promise.all([
    sql`SELECT slug, name FROM teams ORDER BY name`,
    sql`
      SELECT * FROM team_season_stats
      WHERE team_slug = ${slug}
      ORDER BY season DESC`,
    sql`
      SELECT t.slug, t.name, s.overall_wins, s.overall_losses
      FROM teams t
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
      WHERE t.division = ${team.division} AND t.slug != ${slug}
      ORDER BY s.overall_wins DESC NULLS LAST, t.name`,
    sql`
      SELECT DISTINCT ON (ps.player_slug, ps.stat_type)
        ps.player_slug, ps.player_name, ps.stat_type, ps.season,
        ps.pass_yards, ps.pass_tds, ps.rush_yards, ps.rush_tds, ps.recv_yards, ps.recv_tds
      FROM player_season_stats ps
      WHERE ps.school_slug = ${team.school_slug}
      ORDER BY ps.player_slug, ps.stat_type, ps.season DESC`,
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
  ])

  // Prev/next by name order
  const namesSorted = (allTeams as { slug: string; name: string }[])
  const idx = namesSorted.findIndex(t => t.slug === slug)
  const n   = namesSorted.length
  const prevSlug = namesSorted[(idx - 1 + n) % n]?.slug ?? slug
  const nextSlug = namesSorted[(idx + 1) % n]?.slug ?? slug

  return (
    <TeamShell
      team={team as Record<string, unknown>}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      seasonRows={seasonRows as Record<string, unknown>[]}
      divTeams={divTeams as Record<string, unknown>[]}
      playerRows={playerRows as Record<string, unknown>[]}
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
  )
}
