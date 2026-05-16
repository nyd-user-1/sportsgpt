import { list } from '@vercel/blob'
import { unstable_cache } from 'next/cache'
import { sql } from './db'
import { PLAYER_PHOTOS, TEAM_PHOTOS } from './team-images'

export type GalleryPhoto = {
  id: string
  url: string
  pathname: string
  category: 'teams' | 'players' | 'logos' | 'other'
  playerName?: string
  teamName?: string
  schoolSlug?: string
}

// Reverse map: decoded filename → player slug (from PLAYER_PHOTOS static map)
function buildPlayerFilenameToSlug(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [slug, path] of Object.entries(PLAYER_PHOTOS)) {
    const raw = decodeURIComponent(path.split('/').pop() ?? '')
    map[raw.toLowerCase()] = slug
  }
  return map
}

// Reverse map: decoded blob filename → school slug (from TEAM_PHOTOS)
function buildTeamFilenameToSlug(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [schoolSlug, paths] of Object.entries(TEAM_PHOTOS)) {
    for (const path of paths) {
      const raw = decodeURIComponent(path.split('/').pop() ?? '')
      map[raw.toLowerCase()] = schoolSlug
    }
  }
  return map
}

// Normalize a blob filename for fuzzy matching
function normalizeName(s: string): string {
  return s
    .replace(/\.[^.]+$/, '')     // strip extension
    .replace(/[-_]/g, ' ')       // hyphens/underscores → spaces
    .replace(/\s*\d+\s*$/, '')   // strip trailing numbers
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function stableId(pathname: string): string {
  let h = 5381
  for (let i = 0; i < pathname.length; i++) {
    h = ((h << 5) + h) ^ pathname.charCodeAt(i)
    h = h >>> 0
  }
  return h.toString(36)
}

async function fetchPhotos(): Promise<GalleryPhoto[]> {
  // ── 1. Fetch blobs ────────────────────────────────────────────────────
  const rawBlobs: { url: string; pathname: string; category: GalleryPhoto['category'] }[] = []
  let cursor: string | undefined
  do {
    const res = await list({ prefix: 'gallery/', cursor, limit: 1000 })
    res.blobs.forEach(b => {
      const cat: GalleryPhoto['category'] =
        b.pathname.startsWith('gallery/teams/')   ? 'teams'   :
        b.pathname.startsWith('gallery/players/') ? 'players' :
        b.pathname.startsWith('gallery/logos/')   ? 'logos'   : 'other'
      if (cat === 'logos' || b.pathname.startsWith('gallery/divisions/')) return
      rawBlobs.push({ url: b.url, pathname: b.pathname, category: cat })
    })
    cursor = res.cursor
  } while (cursor)

  // ── 2. Build lookup tables from DB ────────────────────────────────────
  let slugToPlayer: Record<string, { playerName: string; teamName: string; schoolSlug: string }> = {}
  let schoolSlugToName: Record<string, string> = {}
  try {
    const [playerRows, teamRows] = await Promise.all([
      sql`SELECT DISTINCT ON (player_slug) player_slug, player_name, school_name, school_slug
          FROM player_season_stats ORDER BY player_slug, season DESC`,
      sql`SELECT DISTINCT school_slug, name FROM teams`,
    ])
    for (const r of playerRows) {
      slugToPlayer[r.player_slug as string] = {
        playerName: r.player_name as string,
        teamName:   r.school_name as string,
        schoolSlug: r.school_slug as string,
      }
    }
    for (const r of teamRows) {
      const name = (r.name as string).replace(/\s+Varsity\s+Football$/i, '')
      schoolSlugToName[r.school_slug as string] = name
    }
  } catch { /* DB unavailable */ }

  // ── 3. Build matching helpers ─────────────────────────────────────────
  const playerFilenameToSlug = buildPlayerFilenameToSlug()
  const teamFilenameToSlug   = buildTeamFilenameToSlug()

  // Normalized player name → slug (for fuzzy matching)
  const normalizedNameToSlug: Record<string, string> = {}
  for (const [slug, info] of Object.entries(slugToPlayer)) {
    normalizedNameToSlug[info.playerName.toLowerCase()] = slug
  }

  // ── 4. Enrich blobs ───────────────────────────────────────────────────
  const allBlobs: GalleryPhoto[] = rawBlobs.map(b => {
    const photo: GalleryPhoto = { id: '', ...b }

    if (b.category === 'players') {
      const rawFilename = decodeURIComponent(b.pathname.replace('gallery/players/', ''))

      // Pass 1: exact match via PLAYER_PHOTOS reverse map
      let slug = playerFilenameToSlug[rawFilename.toLowerCase()]

      // Pass 2: fuzzy — normalized filename must CONTAIN the full player name
      // AND the match must be unique (avoid false positives like "brady" → multiple players)
      if (!slug) {
        const norm = normalizeName(rawFilename)
        const matches = Object.entries(normalizedNameToSlug).filter(([name]) =>
          norm.includes(name)  // filename contains full player name
        )
        if (matches.length === 1) {
          slug = matches[0][1]
        }
      }

      if (slug && slugToPlayer[slug]) {
        photo.playerName = slugToPlayer[slug].playerName
        photo.teamName   = slugToPlayer[slug].teamName
        photo.schoolSlug = slugToPlayer[slug].schoolSlug
      }
    }

    if (b.category === 'teams') {
      const rawFilename = decodeURIComponent(b.pathname.replace('gallery/teams/', ''))
      const schoolSlug  = teamFilenameToSlug[rawFilename.toLowerCase()]
      if (schoolSlug && schoolSlugToName[schoolSlug]) {
        photo.teamName  = schoolSlugToName[schoolSlug]
        photo.schoolSlug = schoolSlug
      }
    }

    return photo
  })

  // ── 5. Sort & assign IDs ──────────────────────────────────────────────
  allBlobs.sort((a, b) => {
    if (a.category !== b.category) return a.category === 'teams' ? -1 : 1
    return a.pathname.localeCompare(b.pathname)
  })

  return allBlobs.map(p => ({ ...p, id: stableId(p.pathname) }))
}

export const getPhotos = unstable_cache(fetchPhotos, ['gallery-photos'], {
  revalidate: 3600,
})
