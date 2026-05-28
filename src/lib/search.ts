// Site-wide search engine — shared by the ⌘K command palette and the /search
// results page so both rank identically. Pure functions + the buildResults
// aggregator that scores every entity against a query.

import { DIVISION_LOGOS } from '@/lib/team-images'
import { CHART_CONFIGS } from '@/lib/chart-configs'
import { formatSeason } from '@/lib/utils'

export type ResultType = 'player' | 'team' | 'school' | 'chart' | 'game'

export type PlayerRow = { slug: string; name: string; position: string | null; school_slug: string; team_name: string | null }
export type TeamRow   = { slug: string; name: string; division: string; school_slug: string }
export type SchoolRow = { slug: string; name: string }
export type GameRow   = { id: number; home_name: string; away_name: string; home_school: string | null; away_school: string | null; home_score: number | null; away_score: number | null; season: number }
export type SearchData = { players: PlayerRow[]; teams: TeamRow[]; schools: SchoolRow[]; games: GameRow[] }

export type Result = {
  key: string
  type: ResultType
  name: string
  displayName: string
  subtitle?: string
  href: string
  schoolSlug?: string
  logoUrl?: string
  score: number
}

export type GroupedResults = {
  divisions: Result[]
  charts: Result[]
  teams: Result[]
  games: Result[]
  players: Result[]
  schools: Result[]
}

// Damerau-Levenshtein distance, capped: returns early once distance exceeds `max`.
export function editDistance(a: string, b: string, max: number): number {
  const al = a.length, bl = b.length
  if (Math.abs(al - bl) > max) return max + 1
  let prevPrev: number[] = []
  let prev = Array.from({ length: bl + 1 }, (_, j) => j)
  let curr: number[] = []
  for (let i = 1; i <= al; i++) {
    curr = [i]
    let rowMin = i
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let d = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      // transposition (Damerau)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, prevPrev[j - 2] + 1)
      }
      curr[j] = d
      if (d < rowMin) rowMin = d
    }
    if (rowMin > max) return max + 1
    prevPrev = prev
    prev = curr
  }
  return prev[bl]
}

// Does `token` match any whitespace-separated word in `text` within 1 typo?
// Exact match required for short tokens (<4 chars) to avoid junk matches.
export function fuzzyTokenHit(token: string, words: string[]): boolean {
  if (token.length < 4) return false
  for (const w of words) {
    if (Math.abs(w.length - token.length) > 1) continue
    if (editDistance(token, w, 1) <= 1) return true
  }
  return false
}

// Connector words ignored when matching multi-entity queries ("X vs Y").
export const STOPWORDS = new Set(['vs', 'v', 'and', 'the', 'at', 'or'])

// Token-based match with typo tolerance.
//   -1 exact · 0 prefix · whole-query substring (index) · token tiers · Infinity
// Multi-word queries match per token: connector words are dropped, then a row
// scores by how many remaining tokens it covers (substring first, ≤1-typo
// fallback). A row surfaces if it covers at least one meaningful token, so
// "floyd vs ward melville" surfaces both Floyd and Ward Melville separately.
export function matchScore(query: string, text: string): number {
  const q = query.trim().toLowerCase()
  const t = text.toLowerCase()
  if (!q) return Infinity
  if (t === q) return -1
  if (t.startsWith(q)) return 0
  const whole = t.indexOf(q)
  if (whole >= 0) return whole

  const allTokens = q.split(/\s+/).filter(Boolean)
  const tokens = allTokens.filter(tok => !STOPWORDS.has(tok))
  if (tokens.length === 0) return Infinity
  const words = t.split(/\s+/).filter(Boolean)

  let cleanHits = 0
  let fuzzyHits = 0
  for (const tok of tokens) {
    if (t.includes(tok)) { cleanHits++; continue }
    if (fuzzyTokenHit(tok, words)) { fuzzyHits++; continue }
  }
  const covered = cleanHits + fuzzyHits
  if (covered === 0) return Infinity
  // Anchor rule: a fuzzy-only match qualifies only if the query is a single
  // token or at least one token is a clean substring hit. Prevents common
  // words (e.g. "best" → "West") from surfacing unrelated rows.
  if (cleanHits === 0 && tokens.length > 1) return Infinity

  // Reward covering more of the query; penalize uncovered tokens and typos so
  // cleaner / more complete matches rank first. Always > substring tier (which
  // returns small indices), so single-entity exact substrings still win.
  const uncovered = tokens.length - covered
  return 100 + uncovered * 40 + fuzzyHits * 20
}

export const DIVISIONS = [
  { label: 'Division I',   slug: 'division-i',   num: 1 },
  { label: 'Division II',  slug: 'division-ii',  num: 2 },
  { label: 'Division III', slug: 'division-iii', num: 3 },
  { label: 'Division IV',  slug: 'division-iv',  num: 4 },
]

export function stripTeamSuffix(name: string): string {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

export function buildResults(data: SearchData, query: string): GroupedResults {
  const q = query.trim()
  if (!q) return { divisions: [], charts: [], teams: [], games: [], players: [], schools: [] }

  const divisions: Result[] = []
  for (const d of DIVISIONS) {
    const s = matchScore(q, d.label)
    if (s < Infinity) {
      divisions.push({ key: `div-${d.slug}`, type: 'team', name: d.label, displayName: d.label, subtitle: 'Section XI', href: `/division/${d.slug}`, logoUrl: DIVISION_LOGOS[d.num], score: s })
    }
  }

  const charts: Result[] = []
  for (const c of CHART_CONFIGS) {
    const s = matchScore(q, c.title)
    if (s < Infinity) {
      charts.push({ key: `chart-${c.slug}`, type: 'chart', name: c.title, displayName: c.title, subtitle: 'Chart', href: `/charts/${c.slug}`, score: s })
    }
  }
  charts.sort((a, b) => a.score - b.score)

  const teams: Result[] = []
  for (const t of data.teams) {
    const display = stripTeamSuffix(t.name)
    const nameScore = matchScore(q, display)
    const divScore  = matchScore(q, `Division ${t.division}`)
    const s = Math.min(nameScore, divScore === Infinity ? Infinity : divScore + 5)
    if (s < Infinity) {
      teams.push({ key: `team-${t.slug}`, type: 'team', name: t.name, displayName: display, subtitle: `Division ${t.division}`, href: `/team/${t.slug}`, schoolSlug: t.school_slug, score: s })
    }
  }
  teams.sort((a, b) => a.score - b.score)

  const players: Result[] = []
  for (const p of data.players) {
    const nameScore  = matchScore(q, p.name)
    const schoolName = stripTeamSuffix(p.team_name ?? '')
    const teamScore  = matchScore(q, schoolName)
    const s = Math.min(nameScore, teamScore === Infinity ? Infinity : teamScore + 10)
    if (s < Infinity) {
      const parts = [p.position, schoolName].filter(Boolean)
      players.push({ key: `player-${p.slug}`, type: 'player', name: p.name, displayName: p.name, subtitle: parts.join(' · '), href: `/player/${p.slug}`, schoolSlug: p.school_slug, score: s })
    }
  }
  players.sort((a, b) => a.score - b.score)

  const schools: Result[] = []
  for (const s of data.schools) {
    const sc = matchScore(q, s.name)
    if (sc < Infinity) {
      schools.push({ key: `school-${s.slug}`, type: 'school', name: s.name, displayName: s.name, href: `/school/${s.slug}`, score: sc })
    }
  }
  schools.sort((a, b) => a.score - b.score)

  // Games — searchable as "Home vs Away" so a single team token or a full
  // matchup query ("floyd vs sayville") both match. data.games arrives
  // newest-first, so equal scores keep recent games on top.
  const games: Result[] = []
  for (const g of (data.games ?? [])) {
    const matchup = `${g.home_name} vs ${g.away_name}`
    const s = matchScore(q, matchup)
    if (s < Infinity) {
      const score = g.home_score != null && g.away_score != null
        ? `${g.home_name} ${g.home_score}, ${g.away_name} ${g.away_score}`
        : matchup
      games.push({
        key: `game-${g.id}`,
        type: 'game',
        name: matchup,
        displayName: score,
        subtitle: formatSeason(g.season),
        href: `/game/${g.id}`,
        schoolSlug: g.home_school ?? undefined,
        score: s,
      })
    }
  }
  games.sort((a, b) => a.score - b.score)

  return { divisions, charts, teams, players, schools, games }
}
