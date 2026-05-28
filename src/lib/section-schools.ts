import { sql } from '@/lib/db'

export type HexSchool = {
  schoolSlug: string
  teamSlug: string
  name: string
  division: string
  wins: number
  losses: number
  ties: number
}

// Every Section XI varsity football program, grouped by division, with its
// all-time record summed across seasons. Shared by /honeycomb and the
// launchpad Honeycomb slide.
export async function fetchSectionSchools(): Promise<HexSchool[]> {
  const rows = await sql`
    WITH varsity AS (
      SELECT DISTINCT ON (school_slug) school_slug, slug AS team_slug, name, division
      FROM teams
      WHERE name ILIKE '%varsity%' AND division IN ('I', 'II', 'III', 'IV')
      ORDER BY school_slug, name
    ),
    rec AS (
      SELECT team_slug,
             SUM(overall_wins)::int            AS w,
             SUM(overall_losses)::int          AS l,
             COALESCE(SUM(overall_ties), 0)::int AS t
      FROM team_season_stats
      GROUP BY team_slug
    )
    SELECT v.school_slug, v.team_slug, v.name, v.division,
           COALESCE(r.w, 0) AS wins, COALESCE(r.l, 0) AS losses, COALESCE(r.t, 0) AS ties
    FROM varsity v
    LEFT JOIN rec r ON r.team_slug = v.team_slug
    ORDER BY v.division, COALESCE(r.w, 0) DESC, v.name
  `
  return rows.map(r => ({
    schoolSlug: r.school_slug as string,
    teamSlug:   r.team_slug as string,
    name:       (r.name as string).replace(/\s+Varsity\s+Football$/i, ''),
    division:   r.division as string,
    wins:       Number(r.wins),
    losses:     Number(r.losses),
    ties:       Number(r.ties),
  }))
}
