import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { TeamPanelContent } from '@/components/PanelTeam'

export const dynamic = 'force-dynamic'

export default async function ChartTeamPanel({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug: slug } = await params

  const teamRows = await sql`SELECT * FROM teams WHERE slug = ${slug}`
  const team = teamRows[0]
  if (!team) notFound()

  const [seasonRows, playerRows] = await Promise.all([
    sql`
      SELECT s.season, s.overall_wins, s.overall_losses, s.overall_ties,
        s.conference_wins, s.conference_losses,
        COALESCE(s.points_for,  g.pf) AS points_for,
        COALESCE(s.points_against, g.pa) AS points_against
      FROM team_season_stats s
      LEFT JOIN (
        SELECT season,
          SUM(CASE WHEN home_team_slug = ${slug} THEN home_score ELSE away_score END) AS pf,
          SUM(CASE WHEN home_team_slug = ${slug} THEN away_score ELSE home_score END) AS pa
        FROM games
        WHERE home_team_slug = ${slug} OR away_team_slug = ${slug}
        GROUP BY season
      ) g ON g.season = s.season
      WHERE s.team_slug = ${slug}
      ORDER BY s.season DESC`,

    sql`
      WITH latest AS (
        SELECT DISTINCT ON (pss.player_slug, pss.stat_type)
          pss.player_slug, pss.player_name, pss.stat_type, pss.season,
          pss.pass_yards, pss.pass_tds,
          pss.rush_yards, pss.rush_tds,
          pss.recv_yards, pss.recv_tds,
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
          ELSE                  COALESCE(recv_yards, 0)
        END DESC
      LIMIT 8`,
  ])

  return (
    <TeamPanelContent
      team={{
        slug:       team.slug as string,
        name:       team.name as string,
        school_slug: team.school_slug as string,
        division:   team.division as string,
      }}
      seasonRows={(seasonRows as Record<string, unknown>[]).map(s => ({
        season:            Number(s.season),
        overall_wins:      Number(s.overall_wins),
        overall_losses:    Number(s.overall_losses),
        overall_ties:      s.overall_ties != null ? Number(s.overall_ties) : undefined,
        conference_wins:   s.conference_wins != null ? Number(s.conference_wins) : null,
        conference_losses: s.conference_losses != null ? Number(s.conference_losses) : null,
        points_for:        s.points_for != null ? Number(s.points_for) : null,
        points_against:    s.points_against != null ? Number(s.points_against) : null,
      }))}
      playerRows={(playerRows as Record<string, unknown>[]).map(p => ({
        player_slug:  p.player_slug as string,
        player_name:  p.player_name as string,
        stat_type:    p.stat_type as string,
        pass_yards:   p.pass_yards != null ? Number(p.pass_yards) : null,
        pass_tds:     p.pass_tds != null ? Number(p.pass_tds) : null,
        rush_yards:   p.rush_yards != null ? Number(p.rush_yards) : null,
        rush_tds:     p.rush_tds != null ? Number(p.rush_tds) : null,
        recv_yards:   p.recv_yards != null ? Number(p.recv_yards) : null,
        recv_tds:     p.recv_tds != null ? Number(p.recv_tds) : null,
        position:     p.position as string | null,
      }))}
    />
  )
}
