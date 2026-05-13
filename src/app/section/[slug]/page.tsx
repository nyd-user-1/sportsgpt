import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { SectionShell } from './Shell'

export const dynamic = 'force-dynamic'

export default async function SectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug !== 'section-xi') notFound()

  const [divisionSummaryRows, recentChampsRows, allTeamRows] = await Promise.all([
    sql`
      SELECT t.division,
        COUNT(DISTINCT t.slug)::int AS team_count,
        AVG(
          CASE WHEN s.season = 2024 AND (s.overall_wins + s.overall_losses) > 0
            THEN s.overall_wins::float / (s.overall_wins + s.overall_losses)
          END
        ) AS avg_win_pct
      FROM teams t
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug
      GROUP BY t.division
      ORDER BY t.division
    `,
    sql`
      SELECT tss.season, tss.division, tss.team_slug, t.name AS team_name,
        tss.overall_wins, tss.overall_losses
      FROM team_season_stats tss
      JOIN teams t ON t.slug = tss.team_slug
      JOIN (
        SELECT division, season, MAX(overall_wins) AS max_wins
        FROM team_season_stats
        WHERE season IN (2022, 2023, 2024)
        GROUP BY division, season
      ) m ON m.division = tss.division AND m.season = tss.season AND m.max_wins = tss.overall_wins
      ORDER BY tss.season DESC, tss.division
    `,
    sql`
      SELECT t.slug, t.name, t.division,
        s.overall_wins, s.overall_losses
      FROM teams t
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
      ORDER BY t.division, s.overall_wins DESC NULLS LAST
    `,
  ])

  return (
    <SectionShell
      divisionSummary={divisionSummaryRows.map(r => ({
        division:    r.division as string,
        team_count:  Number(r.team_count),
        avg_win_pct: r.avg_win_pct != null ? Number(r.avg_win_pct) : null,
      }))}
      recentChamps={recentChampsRows.map(r => ({
        season:        Number(r.season),
        division:      r.division as string,
        team_slug:     r.team_slug as string,
        team_name:     r.team_name as string,
        overall_wins:  r.overall_wins != null ? Number(r.overall_wins) : null,
        overall_losses:r.overall_losses != null ? Number(r.overall_losses) : null,
      }))}
      allTeams={allTeamRows.map(r => ({
        slug:          r.slug as string,
        name:          r.name as string,
        division:      r.division as string,
        overall_wins:  r.overall_wins != null ? Number(r.overall_wins) : null,
        overall_losses:r.overall_losses != null ? Number(r.overall_losses) : null,
      }))}
    />
  )
}
