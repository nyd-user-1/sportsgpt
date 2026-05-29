import type { Metadata } from 'next'
import { sql } from '@/lib/db'
import { APP_NAME } from '@/lib/app-config'
import type { SearchData, ClickBoostMap } from '@/lib/search'
import { Chat3Shell } from './Shell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Chat',
  description: `Ask ${APP_NAME} about Section XI football — pick a team, player, school, or game to start the conversation.`,
  robots: { index: false, follow: true },
}

function nameFromSlug(slug: string): string {
  return slug
    .replace(/-varsity-football$/i, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function getClickBoost(): Promise<ClickBoostMap> {
  const rows = await sql`SELECT query_stem, result_key, count FROM search_clicks`
  const boost: ClickBoostMap = {}
  for (const r of rows) {
    const stem = r.query_stem as string
    ;(boost[stem] ??= {})[r.result_key as string] = Number(r.count)
  }
  return boost
}

async function getSearchData(): Promise<SearchData> {
  const [playerRows, teamRows, schoolRows, gameRows] = await Promise.all([
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
    sql`SELECT slug, name FROM schools ORDER BY name`,
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
  ])

  const games = gameRows.map(g => {
    const homeName = (g.home_name as string | null)?.replace(/\s+Varsity\s+Football$/i, '') ?? nameFromSlug(g.home_team_slug as string)
    const awayName = (g.away_name as string | null)?.replace(/\s+Varsity\s+Football$/i, '') ?? nameFromSlug(g.away_team_slug as string)
    return {
      id:          Number(g.id),
      home_name:   homeName,
      away_name:   awayName,
      home_school: (g.home_school as string | null) ?? null,
      away_school: (g.away_school as string | null) ?? null,
      home_score:  g.home_score != null ? Number(g.home_score) : null,
      away_score:  g.away_score != null ? Number(g.away_score) : null,
      season:      Number(g.season),
    }
  })

  return {
    players: playerRows as SearchData['players'],
    teams:   teamRows as SearchData['teams'],
    schools: schoolRows as SearchData['schools'],
    games,
  }
}

export default async function Chat3Page() {
  const [data, boost] = await Promise.all([getSearchData(), getClickBoost()])
  const browseTeams = data.teams.slice(0, 8)
  return <Chat3Shell data={data} boost={boost} browseTeams={browseTeams} />
}
