import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { SectionShell } from './Shell'
import { CURRENT_SEASON, AVAILABLE_SEASONS } from '@/lib/season'

export const dynamic = 'force-dynamic'

export default async function SectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug !== 'section-xi') notFound()

  const [divisionSummaryRows, recentChampsRows, allTeamRows, gameRows, leaderRows] = await Promise.all([
    sql`
      WITH game_counts AS (
        SELECT t.division, COUNT(DISTINCT g.id)::int AS cnt
        FROM teams t
        JOIN games g ON g.home_team_slug = t.slug OR g.away_team_slug = t.slug
        GROUP BY t.division
      ),
      player_counts AS (
        SELECT t.division, COUNT(DISTINCT p.slug)::int AS cnt
        FROM players p
        JOIN teams t ON t.school_slug = p.school_slug
        GROUP BY t.division
      )
      SELECT t.division,
        COUNT(DISTINCT t.slug)::int AS team_count,
        AVG(
          CASE WHEN s.season = ${CURRENT_SEASON} AND (s.overall_wins + s.overall_losses) > 0
            THEN s.overall_wins::float / (s.overall_wins + s.overall_losses)
          END
        ) AS avg_win_pct,
        gc.cnt AS game_count,
        pc.cnt AS player_count
      FROM teams t
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug
      LEFT JOIN game_counts gc ON gc.division = t.division
      LEFT JOIN player_counts pc ON pc.division = t.division
      GROUP BY t.division, gc.cnt, pc.cnt
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
        WHERE season IN (2022, 2023, 2024, 2025)
        GROUP BY division, season
      ) m ON m.division = tss.division AND m.season = tss.season AND m.max_wins = tss.overall_wins
      ORDER BY tss.season DESC, tss.division
    `,
    sql`
      SELECT t.slug, t.name, t.division, t.school_slug,
        s.overall_wins, s.overall_losses, s.conference_wins, s.conference_losses, s.season
      FROM teams t
      JOIN team_season_stats s ON s.team_slug = t.slug
      WHERE s.season = ANY(${AVAILABLE_SEASONS})
      ORDER BY s.season DESC, t.division, s.overall_wins DESC NULLS LAST
    `,
    sql`
      SELECT g.id, g.game_date, g.season,
        g.home_team_slug, g.away_team_slug, g.home_score, g.away_score,
        ht.name AS home_name, ht.school_slug AS home_school_slug,
        at2.name AS away_name, at2.school_slug AS away_school_slug
      FROM games g
      JOIN teams ht  ON ht.slug  = g.home_team_slug
      JOIN teams at2 ON at2.slug = g.away_team_slug
      WHERE g.season = ANY(${AVAILABLE_SEASONS})
      ORDER BY g.season DESC, g.game_date DESC
    `,
    sql`
      SELECT ps.player_slug, ps.player_name, ps.school_name, ps.school_slug,
        ps.pass_yards, ps.pass_tds, ps.season
      FROM player_season_stats ps
      WHERE ps.stat_type = 'Passing'
        AND ps.season = ANY(${AVAILABLE_SEASONS})
        AND ps.pass_yards IS NOT NULL
      ORDER BY ps.pass_yards DESC
    `,
  ])

  return (
    <SectionShell
      divisionSummary={divisionSummaryRows.map(r => ({
        division:     r.division as string,
        team_count:   Number(r.team_count),
        avg_win_pct:  r.avg_win_pct != null ? Number(r.avg_win_pct) : null,
        player_count: Number(r.player_count ?? 0),
        game_count:   Number(r.game_count   ?? 0),
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
        slug:              r.slug as string,
        name:              r.name as string,
        division:          r.division as string,
        school_slug:       r.school_slug as string | null,
        overall_wins:      r.overall_wins != null ? Number(r.overall_wins) : null,
        overall_losses:    r.overall_losses != null ? Number(r.overall_losses) : null,
        conference_wins:   r.conference_wins != null ? Number(r.conference_wins) : null,
        conference_losses: r.conference_losses != null ? Number(r.conference_losses) : null,
        season:            Number(r.season),
      }))}
      games={gameRows.map(r => ({
        id:               Number(r.id),
        game_date:        r.game_date ? new Date(r.game_date as unknown as string).toISOString().slice(0, 10) : null,
        season:           Number(r.season),
        home_team_slug:   r.home_team_slug as string,
        away_team_slug:   r.away_team_slug as string,
        home_score:       r.home_score != null ? Number(r.home_score) : null,
        away_score:       r.away_score != null ? Number(r.away_score) : null,
        home_name:        (r.home_name as string).replace(/\s+Varsity\s+Football$/i, ''),
        away_name:        (r.away_name as string).replace(/\s+Varsity\s+Football$/i, ''),
        home_school_slug: r.home_school_slug as string | null,
        away_school_slug: r.away_school_slug as string | null,
      }))}
      leaders={leaderRows.map(r => ({
        player_slug: r.player_slug as string,
        player_name: r.player_name as string,
        school_name: r.school_name as string,
        school_slug: r.school_slug as string | null,
        pass_yards:  r.pass_yards != null ? Number(r.pass_yards) : null,
        pass_tds:    r.pass_tds != null ? Number(r.pass_tds) : null,
        season:      Number(r.season),
      }))}
    />
  )
}
