import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/app-config'
import { sql } from '@/lib/db'

// Cached for an hour, not rendered per request: nothing here reads searchParams,
// cookies or headers, and every crawler hit used to be a Neon query. Rosters and
// scores change between games, not between seconds. (Was force-dynamic.)
export const revalidate = 86400

type Entry = MetadataRoute.Sitemap[number]
type ChangeFreq = Entry['changeFrequency']

// Static, indexable routes.
const STATIC_PATHS: { path: string; changeFrequency: ChangeFreq; priority: number }[] = [
  { path: '/',            changeFrequency: 'daily',   priority: 1.0 },
  { path: '/team',        changeFrequency: 'weekly',  priority: 0.9 },
  { path: '/player',      changeFrequency: 'weekly',  priority: 0.9 },
  { path: '/school',      changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/leaderboard', changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/charts',      changeFrequency: 'weekly',  priority: 0.7 },
  { path: '/gallery',     changeFrequency: 'weekly',  priority: 0.6 },
  { path: '/maps',        changeFrequency: 'monthly', priority: 0.6 },
  { path: '/glossary',    changeFrequency: 'monthly', priority: 0.5 },
  { path: '/launchpad',   changeFrequency: 'weekly',  priority: 0.6 },
  { path: '/chat',        changeFrequency: 'monthly', priority: 0.6 },
  { path: '/section/section-xi',  changeFrequency: 'weekly', priority: 0.7 },
  { path: '/division/division-i',   changeFrequency: 'weekly', priority: 0.6 },
  { path: '/division/division-ii',  changeFrequency: 'weekly', priority: 0.6 },
  { path: '/division/division-iii', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/division/division-iv',  changeFrequency: 'weekly', priority: 0.6 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const staticEntries: Entry[] = STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))

  const [teams, players, schools, games] = await Promise.all([
    sql`SELECT slug FROM teams WHERE name ILIKE '%football%' ORDER BY slug`,
    sql`SELECT slug FROM players ORDER BY slug`,
    sql`SELECT slug FROM schools ORDER BY slug`,
    sql`SELECT id FROM games ORDER BY id`,
  ])

  const detail = (path: string, changeFrequency: ChangeFreq, priority: number): Entry => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  })

  const teamEntries   = teams.map(t   => detail(`/team/${t.slug}`,     'weekly',  0.7))
  const playerEntries = players.map(p => detail(`/player/${p.slug}`,   'weekly',  0.6))
  const schoolEntries = schools.map(s => detail(`/school/${s.slug}`,   'monthly', 0.6))
  const gameEntries   = games.map(g   => detail(`/game/${g.id}`,       'monthly', 0.5))

  return [...staticEntries, ...teamEntries, ...playerEntries, ...schoolEntries, ...gameEntries]
}
