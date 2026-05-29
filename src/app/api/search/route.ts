import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// De-slug a team slug into a readable name (fallback when the join misses —
// e.g. Nassau opponents not in the teams table). 'east-islip-varsity-football'
// → 'East Islip'.
function nameFromSlug(slug: string): string {
  return slug
    .replace(/-varsity-football$/i, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function GET() {
  const [playerRows, teamRows, schoolRows, gameRows, clickRows] = await Promise.all([
    sql`
      SELECT p.slug, p.name, p.position, p.school_slug,
             t.name AS team_name
      FROM players p
      LEFT JOIN teams t ON t.school_slug = p.school_slug
        AND t.name ILIKE '%football%'
      ORDER BY p.name
    `,
    sql`
      SELECT slug, name, division, school_slug
      FROM teams
      WHERE name ILIKE '%football%'
      ORDER BY name
    `,
    sql`
      SELECT slug, name FROM schools ORDER BY name
    `,
    sql`
      SELECT g.id,
             g.home_team_slug, g.away_team_slug,
             ht.name AS home_name, at.name AS away_name,
             ht.school_slug AS home_school, at.school_slug AS away_school,
             g.home_score, g.away_score, g.season, g.game_date
      FROM games g
      LEFT JOIN teams ht ON ht.slug = g.home_team_slug
      LEFT JOIN teams at ON at.slug = g.away_team_slug
      ORDER BY g.game_date DESC NULLS LAST, g.id DESC
    `,
    sql`
      SELECT query_stem, result_key, count FROM search_clicks
    `,
  ])

  const games = gameRows.map(g => {
    const homeName = (g.home_name as string | null)?.replace(/\s+Varsity\s+Football$/i, '') ?? nameFromSlug(g.home_team_slug as string)
    const awayName = (g.away_name as string | null)?.replace(/\s+Varsity\s+Football$/i, '') ?? nameFromSlug(g.away_team_slug as string)
    return {
      id:          g.id,
      home_name:   homeName,
      away_name:   awayName,
      home_school: g.home_school ?? null,
      away_school: g.away_school ?? null,
      home_score:  g.home_score,
      away_score:  g.away_score,
      season:      g.season,
    }
  })

  // query_stem → (result_key → count) for click-learning re-ranking. The table
  // is hard-capped at 50 rows, so this is tiny.
  const boost: Record<string, Record<string, number>> = {}
  for (const r of clickRows) {
    const stem = r.query_stem as string
    ;(boost[stem] ??= {})[r.result_key as string] = r.count as number
  }

  return NextResponse.json({
    players: playerRows,
    teams:   teamRows,
    schools: schoolRows,
    games,
    boost,
  })
}
