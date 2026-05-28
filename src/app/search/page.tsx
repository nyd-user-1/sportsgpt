import type { Metadata } from 'next'
import { sql } from '@/lib/db'
import { APP_NAME } from '@/lib/app-config'
import type { SearchData } from '@/lib/search'
import { SearchShell } from './Shell'

export const dynamic = 'force-dynamic'

// Search results pages are intentionally not indexed (standard SEO practice),
// but still crawlable for link discovery.
export const metadata: Metadata = {
  title: 'Search',
  description: `Search ${APP_NAME} — players, teams, schools, games, divisions, and charts across Section XI football.`,
  robots: { index: false, follow: true },
}

// De-slug a team slug into a readable name (fallback when the join misses).
function nameFromSlug(slug: string): string {
  return slug
    .replace(/-varsity-football$/i, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const data = await getSearchData()

  // Lightweight browse rows for the empty state — a few teams + recent games,
  // so the page is useful before the user types.
  const browseTeams = data.teams.slice(0, 8)
  const browseGames = data.games.slice(0, 6)

  return (
    <SearchShell
      data={data}
      initialQuery={q ?? ''}
      browseTeams={browseTeams}
      browseGames={browseGames}
    />
  )
}
