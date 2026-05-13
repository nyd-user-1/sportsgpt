import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { DivisionShell } from './Shell'

export const dynamic = 'force-dynamic'

const divMap: Record<string, string> = {
  'division-i':   'I',
  'division-ii':  'II',
  'division-iii': 'III',
  'division-iv':  'IV',
}

export default async function DivisionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const division = divMap[slug]
  if (!division) notFound()

  const [standings, topPassers, topRushers] = await Promise.all([
    sql`
      SELECT t.slug, t.name, t.school_slug,
        s.overall_wins, s.overall_losses, s.overall_ties,
        s.conference_wins, s.conference_losses, s.season
      FROM teams t
      LEFT JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
      WHERE t.division = ${division}
      ORDER BY s.overall_wins DESC NULLS LAST, t.name
    `,
    sql`
      SELECT DISTINCT ON (ps.player_slug)
        ps.player_slug, ps.player_name, ps.school_name,
        ps.pass_yards, ps.pass_tds, ps.completions, ps.attempts, ps.season
      FROM player_season_stats ps
      JOIN schools sch ON sch.slug = ps.school_slug AND sch.division = ${division}
      WHERE ps.stat_type = 'Passing' AND ps.season = 2024
      ORDER BY ps.player_slug, ps.pass_yards DESC NULLS LAST
      LIMIT 10
    `,
    sql`
      SELECT DISTINCT ON (ps.player_slug)
        ps.player_slug, ps.player_name, ps.school_name,
        ps.rush_yards, ps.rush_tds, ps.season
      FROM player_season_stats ps
      JOIN schools sch ON sch.slug = ps.school_slug AND sch.division = ${division}
      WHERE ps.stat_type = 'Rushing' AND ps.season = 2024
      ORDER BY ps.player_slug, ps.rush_yards DESC NULLS LAST
      LIMIT 10
    `,
  ])

  return (
    <DivisionShell
      divSlug={slug}
      division={division}
      standings={standings.map(r => ({
        slug:               r.slug as string,
        name:               r.name as string,
        school_slug:        r.school_slug as string | null,
        overall_wins:       r.overall_wins != null ? Number(r.overall_wins) : null,
        overall_losses:     r.overall_losses != null ? Number(r.overall_losses) : null,
        overall_ties:       r.overall_ties != null ? Number(r.overall_ties) : null,
        conference_wins:    r.conference_wins != null ? Number(r.conference_wins) : null,
        conference_losses:  r.conference_losses != null ? Number(r.conference_losses) : null,
        season:             r.season != null ? Number(r.season) : null,
      }))}
      topPassers={topPassers.map(r => ({
        player_slug: r.player_slug as string,
        player_name: r.player_name as string,
        school_name: r.school_name as string,
        pass_yards:  r.pass_yards != null ? Number(r.pass_yards) : null,
        pass_tds:    r.pass_tds != null ? Number(r.pass_tds) : null,
        completions: r.completions != null ? Number(r.completions) : null,
        attempts:    r.attempts != null ? Number(r.attempts) : null,
        season:      Number(r.season),
      }))}
      topRushers={topRushers.map(r => ({
        player_slug: r.player_slug as string,
        player_name: r.player_name as string,
        school_name: r.school_name as string,
        rush_yards:  r.rush_yards != null ? Number(r.rush_yards) : null,
        rush_tds:    r.rush_tds != null ? Number(r.rush_tds) : null,
        season:      Number(r.season),
      }))}
    />
  )
}
