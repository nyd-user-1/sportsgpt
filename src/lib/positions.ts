export type PositionSlug = 'qb' | 'rb' | 'wr' | 'te' | 'ol' | 'dl' | 'lb' | 'db' | 'k'

export type PositionConfig = {
  slug: PositionSlug
  label: string
  fullName: string
  statType: 'Passing' | 'Rushing' | 'Receiving' | 'Scoring' | null
}

export const POSITIONS: PositionConfig[] = [
  { slug: 'qb', label: 'QB', fullName: 'Quarterbacks',    statType: 'Passing'   },
  { slug: 'rb', label: 'RB', fullName: 'Running Backs',   statType: 'Rushing'   },
  { slug: 'wr', label: 'WR', fullName: 'Wide Receivers',  statType: 'Receiving' },
  { slug: 'te', label: 'TE', fullName: 'Tight Ends',      statType: 'Receiving' },
  { slug: 'ol', label: 'OL', fullName: 'Offensive Line',  statType: null        },
  { slug: 'dl', label: 'DL', fullName: 'Defensive Line',  statType: null        },
  { slug: 'lb', label: 'LB', fullName: 'Linebackers',     statType: null        },
  { slug: 'db', label: 'DB', fullName: 'Defensive Backs', statType: null        },
  { slug: 'k',  label: 'K',  fullName: 'Kickers',         statType: 'Scoring'   },
]

// Maps raw position tokens to canonical position slugs
const TOKEN_MAP: Record<string, PositionSlug> = {
  QB: 'qb',
  RB: 'rb', HB: 'rb', FB: 'rb',
  WR: 'wr',
  TE: 'te',
  OL: 'ol', OG: 'ol', OT: 'ol', C: 'ol',
  DL: 'dl', DE: 'dl', DT: 'dl', NG: 'dl',
  LB: 'lb', MLB: 'lb', OLB: 'lb', ILB: 'lb',
  DB: 'db', CB: 'db', SS: 'db', FS: 'db', S: 'db',
  K: 'k', P: 'k',
}

export function positionToSlugs(raw: string | null | undefined): PositionSlug[] {
  if (!raw) return []
  const seen = new Set<PositionSlug>()
  const tokens = raw.toUpperCase().split(/[/,\-\s]+/).map(t => t.trim()).filter(Boolean)
  for (const token of tokens) {
    const slug = TOKEN_MAP[token]
    if (slug) seen.add(slug)
  }
  return [...seen]
}

export function primaryPositionSlug(raw: string | null | undefined): PositionSlug | null {
  return positionToSlugs(raw)[0] ?? null
}

export function playerMatchesPosition(raw: string | null | undefined, posSlug: PositionSlug): boolean {
  return positionToSlugs(raw).includes(posSlug)
}

export function getPositionConfig(slug: string): PositionConfig | undefined {
  return POSITIONS.find(p => p.slug === slug)
}
