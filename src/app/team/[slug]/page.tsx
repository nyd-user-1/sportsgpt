import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { TeamShell } from './Shell'

export const dynamic = 'force-dynamic'

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const teamRows = await sql`SELECT * FROM teams WHERE slug = ${slug}`
  const team = teamRows[0]
  if (!team) notFound()

  const [allTeams, seasonRows, divTeams, playerRows] = await Promise.all([
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
    />
  )
}
