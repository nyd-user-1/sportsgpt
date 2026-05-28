// Site-wide search engine — shared by the ⌘K command palette and the /search
// results page so both rank identically. Pure functions + the buildResults
// aggregator that scores every entity against a query.

import { DIVISION_LOGOS } from '@/lib/team-images'
import { CHART_CONFIGS } from '@/lib/chart-configs'
import { AVAILABLE_SEASONS } from '@/lib/season'
import { formatSeason } from '@/lib/utils'

export type ResultType = 'player' | 'team' | 'school' | 'chart' | 'game' | 'season'

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
  seasons: Result[]
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

// Connector words that signal an explicit "X vs Y" matchup query. When one of
// these appears, matching switches from AND to OR so both entities surface.
// (Filler words like "the"/"and" are stripped but do NOT trigger OR mode.)
const MATCHUP_CONNECTORS = new Set(['vs', 'v', 'versus', 'at', '@', '&'])
const FILLER = new Set(['the', 'and', 'or', 'a', 'of'])

// Back-compat export (some callers/tests referenced STOPWORDS).
export const STOPWORDS = new Set([...MATCHUP_CONNECTORS, ...FILLER])

// Split a query into meaningful tokens and report whether a matchup connector
// was present (→ OR mode). Filler + connectors are dropped from the tokens.
export function tokenizeQuery(query: string): { tokens: string[]; matchup: boolean } {
  const raw = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matchup = raw.some(t => MATCHUP_CONNECTORS.has(t))
  const tokens = raw.filter(t => !MATCHUP_CONNECTORS.has(t) && !FILLER.has(t))
  return { tokens, matchup }
}

// Score a single token against text: substring (returns its index) or ≤1-typo
// fuzzy hit (returns a constant just above the substring band). Infinity = miss.
function tokenScore(tok: string, text: string, words: string[]): number {
  const idx = text.indexOf(tok)
  if (idx >= 0) return idx
  if (fuzzyTokenHit(tok, words)) return 50
  return Infinity
}

// Token-based match with typo tolerance.
//   -1 exact · 0 prefix · whole-query substring (index) · token tiers · Infinity
//
// mode='and' (default): every token must hit — "joseph fi" matches only rows
//   containing BOTH "joseph" and "fi" (→ Joseph Filardi, not every Joseph or
//   every "...fi..." word).
// mode='or': a row qualifies if it covers ≥1 token — used only for explicit
//   matchup queries ("floyd vs ward melville") so both teams surface.
export function matchScore(query: string, text: string, mode: 'and' | 'or' = 'and'): number {
  const q = query.trim().toLowerCase()
  const t = text.toLowerCase()
  if (!q) return Infinity
  if (t === q) return -1
  if (t.startsWith(q)) return 0
  const whole = t.indexOf(q)
  if (whole >= 0) return whole

  const { tokens } = tokenizeQuery(q)
  if (tokens.length === 0) return Infinity
  const words = t.split(/\s+/).filter(Boolean)

  let covered = 0
  let fuzzy = 0
  let cleanHits = 0
  for (const tok of tokens) {
    const ts = tokenScore(tok, t, words)
    if (ts === Infinity) continue
    covered++
    if (ts === 50) fuzzy++; else cleanHits++
  }

  if (mode === 'and') {
    // Every token must hit.
    if (covered < tokens.length) return Infinity
    // Anchor rule: a purely-fuzzy multi-token match is too loose; require at
    // least one clean substring hit when more than one token.
    if (cleanHits === 0 && tokens.length > 1) return Infinity
    return 100 + fuzzy * 20
  }

  // OR mode (matchup): qualify on ≥1 token, rank by coverage + typos.
  if (covered === 0) return Infinity
  if (cleanHits === 0 && tokens.length > 1) return Infinity
  const uncovered = tokens.length - covered
  return 100 + uncovered * 40 + fuzzy * 20
}

// ── Position search ──────────────────────────────────────────────────────────
// Map position abbreviations to the english words a user might type, so "quart"
// / "quarterback" / "qb" all surface QBs. Compound positions (OL/DL, WR-DB,
// "WR, FS") are split on /, -, comma, and whitespace and each part expanded.
const POSITION_WORDS: Record<string, string> = {
  qb: 'quarterback', rb: 'running back', hb: 'halfback', fb: 'fullback',
  wr: 'wide receiver', te: 'tight end', ol: 'offensive line', og: 'offensive guard',
  ot: 'offensive tackle', c: 'center', dl: 'defensive line', de: 'defensive end',
  dt: 'defensive tackle', lb: 'linebacker', ilb: 'inside linebacker',
  olb: 'outside linebacker', mlb: 'middle linebacker', db: 'defensive back',
  cb: 'cornerback', s: 'safety', fs: 'free safety', ss: 'strong safety',
  k: 'kicker', p: 'punter', ls: 'long snapper', ath: 'athlete', h: 'h-back',
}

export function expandPositions(pos: string | null | undefined): string {
  if (!pos) return ''
  const parts = pos.toLowerCase().split(/[/\-,\s]+/).filter(Boolean)
  const words = new Set<string>()
  for (const part of parts) {
    words.add(part)
    const full = POSITION_WORDS[part]
    if (full) words.add(full)
  }
  return [...words].join(' ')
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
  const empty: GroupedResults = { divisions: [], charts: [], teams: [], games: [], players: [], schools: [], seasons: [] }
  if (!q) return empty

  // Matchup queries ("floyd vs sayville") use OR so both sides surface;
  // everything else uses AND so every token must hit.
  const { matchup } = tokenizeQuery(q)
  const mode: 'and' | 'or' = matchup ? 'or' : 'and'
  const score = (text: string) => matchScore(q, text, mode)

  // slug → school display name, for team aliases.
  const schoolBySlug = new Map(data.schools.map(s => [s.slug, s.name]))

  const divisions: Result[] = []
  for (const d of DIVISIONS) {
    const s = score(d.label)
    if (s < Infinity) {
      divisions.push({ key: `div-${d.slug}`, type: 'team', name: d.label, displayName: d.label, subtitle: 'Section XI', href: `/division/${d.slug}`, logoUrl: DIVISION_LOGOS[d.num], score: s })
    }
  }

  const charts: Result[] = []
  for (const c of CHART_CONFIGS) {
    const s = score(c.title)
    if (s < Infinity) {
      charts.push({ key: `chart-${c.slug}`, type: 'chart', name: c.title, displayName: c.title, subtitle: 'Chart', href: `/charts/${c.slug}`, score: s })
    }
  }
  charts.sort((a, b) => a.score - b.score)

  // Teams match against name + school name (e.g. "half" → Half Hollow Hills
  // East, whose team name is just "Hills East") + division.
  const teams: Result[] = []
  for (const t of data.teams) {
    const display = stripTeamSuffix(t.name)
    const schoolName = schoolBySlug.get(t.school_slug) ?? ''
    const alias = [display, schoolName, `Division ${t.division}`].filter(Boolean).join(' ')
    const s = score(alias)
    if (s < Infinity) {
      teams.push({ key: `team-${t.slug}`, type: 'team', name: t.name, displayName: display, subtitle: `Division ${t.division}`, href: `/team/${t.slug}`, schoolSlug: t.school_slug, score: s })
    }
  }
  teams.sort((a, b) => a.score - b.score)

  // Players match against name + school + expanded position ("qb"/"quarterback"
  // / "quart" all hit QBs). Name hits rank ahead of school/position hits.
  const players: Result[] = []
  for (const p of data.players) {
    const schoolName = stripTeamSuffix(p.team_name ?? '')
    const positions = expandPositions(p.position)
    const nameScore = score(p.name)
    const aliasScore = score([p.name, schoolName, positions].filter(Boolean).join(' '))
    const s = nameScore < Infinity ? nameScore : (aliasScore === Infinity ? Infinity : aliasScore + 10)
    if (s < Infinity) {
      const parts = [p.position, schoolName].filter(Boolean)
      players.push({ key: `player-${p.slug}`, type: 'player', name: p.name, displayName: p.name, subtitle: parts.join(' · '), href: `/player/${p.slug}`, schoolSlug: p.school_slug, score: s })
    }
  }
  players.sort((a, b) => a.score - b.score)

  const schools: Result[] = []
  for (const s of data.schools) {
    const sc = score(s.name)
    if (sc < Infinity) {
      schools.push({ key: `school-${s.slug}`, type: 'school', name: s.name, displayName: s.name, href: `/school/${s.slug}`, score: sc })
    }
  }
  schools.sort((a, b) => a.score - b.score)

  // Seasons — a season is a team-first stat, so a "2023-24 Season" result links
  // to the /team Season Index filtered to that year.
  const seasons: Result[] = []
  for (const y of [...AVAILABLE_SEASONS].sort((a, b) => b - a)) {
    const label = formatSeason(y) // "2023-24"
    // Match the school-year label, the raw fall year ("2023"), and the spring
    // year ("2024") so any of them surfaces the season.
    const s = score(`${label} ${y} ${y + 1} season`)
    if (s < Infinity) {
      seasons.push({ key: `season-${y}`, type: 'season', name: `${label} Season`, displayName: `${label} Season`, subtitle: 'Section XI · Team Index', href: `/team?season=${y}`, score: s })
    }
  }
  seasons.sort((a, b) => a.score - b.score)

  // Games — match "Home vs Away" + the formatted season so "2023" surfaces that
  // year's games. data.games arrives newest-first; equal scores keep recent on top.
  const games: Result[] = []
  for (const g of (data.games ?? [])) {
    const matchupText = `${g.home_name} vs ${g.away_name}`
    const seasonLabel = formatSeason(g.season)
    const s = score(`${matchupText} ${seasonLabel} ${g.season} ${g.season + 1}`)
    if (s < Infinity) {
      const scoreText = g.home_score != null && g.away_score != null
        ? `${g.home_name} ${g.home_score}, ${g.away_name} ${g.away_score}`
        : matchupText
      games.push({
        key: `game-${g.id}`,
        type: 'game',
        name: matchupText,
        displayName: scoreText,
        subtitle: seasonLabel,
        href: `/game/${g.id}`,
        schoolSlug: g.home_school ?? undefined,
        score: s,
      })
    }
  }
  games.sort((a, b) => a.score - b.score)

  return { divisions, charts, teams, players, schools, games, seasons }
}

// Extract the player slug back out of a player Result's key (`player-<slug>`).
export function playerSlugFromKey(key: string): string | null {
  return key.startsWith('player-') ? key.slice('player-'.length) : null
}

// Decide whether a query resolves to ONE dominant player — strong enough to
// warrant a hub card. Gate: top player is in the clean-name band (score < 10)
// AND is distinctly better than the rest of the field (so "j" — hundreds of
// players all at score 0 — does NOT trigger; "filardi" — one clear winner —
// does). Returns the dominant player Result, or null.
export function dominantPlayer(players: Result[]): Result | null {
  if (players.length === 0) return null
  const top = players[0]
  // Must be a clean name hit (exact/prefix/early-substring), not an alias hit.
  if (top.score >= 10) return null
  // Field not flooded: either it's the only result, or it's strictly better
  // than the second (a tie at the top = ambiguous, no hub).
  if (players.length > 1 && players[1].score <= top.score) return null
  return top
}
