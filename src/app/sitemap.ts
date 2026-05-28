import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/app-config'

// Static, indexable routes. Dynamic detail URLs (teams, players, schools,
// games, divisions) are added in a follow-up pass.
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
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
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
