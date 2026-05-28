import 'server-only'
import { sql } from '@/lib/db'
import { CURRENT_SEASON, AVAILABLE_SEASONS } from '@/lib/season'
import { fetchChartLeaders } from '@/lib/chart-leaders'
import { CHART_CONFIGS, CHART_SLUGS_AZ } from '@/lib/chart-configs'
import { TEAM_PHOTOS } from '@/lib/team-images'

// ── Types ───────────────────────────────────────────────────────────────────

export type MiniStat = {
  label: string
  name:  string
  value: string
  unit:  string
  href:  string
}

export type LeadPlate = {
  kicker:           string
  dropCap:          string
  deck:             string
  href:             string
  hrefLabel:        string
  heroSchoolSlug:   string
  heroPhotos:       string[]
  miniStats:        MiniStat[]
  updatedAt:        string
}

export type StandingsTeam = {
  slug:           string
  name:           string
  school_slug:    string | null
  overall_wins:   number | null
  overall_losses: number | null
}

export type LeaderRow = {
  slug:        string
  name:        string
  school_slug: string | null
  school:      string
  /** e.g. "2,400 YDS" — pre-formatted for PlayerRankedList.primary */
  primary:     string
  /** e.g. "8 TD" — pre-formatted for PlayerRankedList.secondary */
  secondary:   string
}

export type FeaturedChart = {
  slug:        string
  title:       string
  schoolSlug:  string
  photo:       string | null
}

export type RecentGame = {
  id:                number
  game_date:         string | null
  season:            number
  week:              number | null
  home_team_slug:    string
  away_team_slug:    string
  home_name:         string
  away_name:         string
  home_school_slug:  string | null
  away_school_slug:  string | null
  home_score:        number | null
  away_score:        number | null
}

export type ChatPrompt = { q: string; logoSchoolSlug?: string }

export type HomeData = {
  counts: {
    teams:    number
    games:    number
    players:  number
    seasons:  number
    charts:   number
  }
  lead:           LeadPlate
  divisions:      { division: 'I' | 'II' | 'III' | 'IV'; top: StandingsTeam[] }[]
  leaders: {
    passing:    LeaderRow[]
    rushing:    LeaderRow[]
    receiving:  LeaderRow[]
  }
  charts:         FeaturedChart[]
  recentGames:    RecentGame[]
  chatPrompts:    ChatPrompt[]
  currentSeason:  number
  updatedAt:      string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const stripVF = (n: string) => n.replace(/\s+Varsity\s+Football$/i, '')
const fmt0    = (v: number | null | undefined) => v != null ? Number(v).toLocaleString() : '—'

/**
 * Deterministic week-of-year for stable weekly rotation. Charts re-pick each
 * Monday. No snapshot table needed.
 */
function weekOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.floor((d.getTime() - start.getTime()) / (7 * 86_400_000))
}

/**
 * Pick six featured charts using a weekly rotation: two from each editorial
 * chapter (team / player / game), advanced one slot per week. Stable for a
 * given week, fully covers the almanac over time.
 */
function pickFeaturedCharts(week: number): string[] {
  const team   = CHART_CONFIGS.filter(c => c.entity === 'team' ).map(c => c.slug)
  const player = CHART_CONFIGS.filter(c => c.entity === 'player').map(c => c.slug)
  const game   = CHART_CONFIGS.filter(c => c.entity === 'game' ).map(c => c.slug)
  const take2  = (arr: string[], w: number) =>
    arr.length === 0 ? [] : [
      arr[(w     ) % arr.length],
      arr[(w + 1) % arr.length],
    ]
  return [
    ...take2(team,   week),
    ...take2(player, week),
    ...take2(game,   week),
  ].filter(Boolean)
}

// ── Loader ──────────────────────────────────────────────────────────────────

export async function loadHomeData(): Promise<HomeData> {
  const [
    countsRow,
    leadRows,
    currentStandings,
    passingRows,
    rushingRows,
    receivingRows,
    recentGames,
    chartLeaders,
  ] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*)::int FROM teams       WHERE level = 'Varsity')         AS teams,
        (SELECT COUNT(*)::int FROM games
           WHERE home_score IS NOT NULL AND away_score IS NOT NULL)             AS games,
        (SELECT COUNT(*)::int FROM players)                                     AS players,
        ${AVAILABLE_SEASONS.length}                                             AS seasons,
        ${CHART_SLUGS_AZ.length}                                                AS charts
    `,
    sql`SELECT kicker, drop_cap, deck, href, href_label, hero_school_slug, mini_stats, updated_at
        FROM home_lead_plate WHERE id = 1`,
    sql`
      SELECT t.slug, t.name, t.division, t.school_slug,
             s.overall_wins, s.overall_losses
      FROM teams t
      JOIN team_season_stats s ON s.team_slug = t.slug
      WHERE t.level = 'Varsity' AND s.season = ${CURRENT_SEASON}
      ORDER BY t.division,
        (COALESCE(s.overall_wins,0)::float
          / NULLIF(COALESCE(s.overall_wins,0) + COALESCE(s.overall_losses,0), 0)) DESC NULLS LAST,
        s.overall_wins DESC NULLS LAST
    `,
    sql`
      SELECT player_slug, player_name, school_name, school_slug, pass_yards, pass_tds
      FROM player_season_stats
      WHERE stat_type = 'Passing' AND season = ${CURRENT_SEASON} AND pass_yards IS NOT NULL
      ORDER BY pass_yards DESC
      LIMIT 5
    `,
    sql`
      SELECT player_slug, player_name, school_name, school_slug, rush_yards, rush_tds
      FROM player_season_stats
      WHERE stat_type = 'Rushing' AND season = ${CURRENT_SEASON} AND rush_yards IS NOT NULL
      ORDER BY rush_yards DESC
      LIMIT 5
    `,
    sql`
      SELECT player_slug, player_name, school_name, school_slug, recv_yards, recv_tds
      FROM player_season_stats
      WHERE stat_type = 'Receiving' AND season = ${CURRENT_SEASON} AND recv_yards IS NOT NULL
      ORDER BY recv_yards DESC
      LIMIT 5
    `,
    sql`
      SELECT g.id, g.game_date, g.season, g.game_number AS week,
             g.home_team_slug, g.away_team_slug,
             g.home_score, g.away_score,
             ht.name AS home_name,  ht.school_slug AS home_school_slug,
             at2.name AS away_name, at2.school_slug AS away_school_slug
      FROM games g
      JOIN teams ht  ON ht.slug  = g.home_team_slug
      JOIN teams at2 ON at2.slug = g.away_team_slug
      WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
      ORDER BY g.game_date DESC NULLS LAST, g.id DESC
      LIMIT 6
    `,
    fetchChartLeaders(),
  ])

  // ── Lead plate ─────────────────────────────────────────────────────────
  const lr = leadRows[0]
  const heroPhotos = TEAM_PHOTOS[lr.hero_school_slug as string] ?? []
  const lead: LeadPlate = {
    kicker:         (lr.kicker     as string) ?? 'The Lead Plate',
    dropCap:        (lr.drop_cap   as string) ?? 'F',
    deck:           (lr.deck       as string) ?? '',
    href:           (lr.href       as string) ?? '/section/section-xi',
    hrefLabel:      (lr.href_label as string) ?? 'Read the full season recap',
    heroSchoolSlug: (lr.hero_school_slug as string) ?? '',
    heroPhotos,
    miniStats:      (lr.mini_stats as MiniStat[]) ?? [],
    updatedAt:      (lr.updated_at instanceof Date ? lr.updated_at : new Date(lr.updated_at as string)).toISOString(),
  }

  // ── Divisions: top-3 by win-pct this season ────────────────────────────
  const byDiv: Record<string, StandingsTeam[]> = { I: [], II: [], III: [], IV: [] }
  for (const r of currentStandings as Array<Record<string, unknown>>) {
    const div = r.division as string
    if (!byDiv[div]) continue
    byDiv[div].push({
      slug:           r.slug as string,
      name:           r.name as string,
      school_slug:    (r.school_slug as string | null) ?? null,
      overall_wins:   r.overall_wins   != null ? Number(r.overall_wins)   : null,
      overall_losses: r.overall_losses != null ? Number(r.overall_losses) : null,
    })
  }
  const divisions = (['I','II','III','IV'] as const).map(d => ({
    division: d,
    top:      byDiv[d].slice(0, 3),
  }))

  // ── Leaders ────────────────────────────────────────────────────────────
  const toLeader = (
    rows: Array<Record<string, unknown>>,
    valueKey: string,
    tdKey:    string,
  ): LeaderRow[] =>
    rows.map(r => ({
      slug:        r.player_slug as string,
      name:        r.player_name as string,
      school_slug: (r.school_slug as string | null) ?? null,
      school:      stripVF((r.school_name as string) ?? ''),
      primary:     `${fmt0(r[valueKey] as number | null)} YDS`,
      secondary:   `${Number(r[tdKey] ?? 0)} TD`,
    }))

  // ── Featured charts (weekly rotation) ──────────────────────────────────
  const week = weekOfYear()
  const featured = pickFeaturedCharts(week)
  const charts: FeaturedChart[] = featured.map((slug, idx) => {
    const cfg        = CHART_CONFIGS.find(c => c.slug === slug)
    const candidates = chartLeaders[slug] ?? []
    const withPhotos = candidates.filter(s => (TEAM_PHOTOS[s]?.length ?? 0) > 0)
    const pool       = withPhotos.length > 0 ? withPhotos : candidates
    const schoolSlug = pool[idx % Math.max(1, pool.length)] ?? 'floyd'
    const photos     = TEAM_PHOTOS[schoolSlug] ?? []
    const photo      = photos[idx % Math.max(1, photos.length)] ?? null
    return {
      slug,
      title:      cfg?.title ?? slug,
      schoolSlug,
      photo,
    }
  })

  // ── Recent games ───────────────────────────────────────────────────────
  const games: RecentGame[] = (recentGames as Array<Record<string, unknown>>).map(g => ({
    id:               Number(g.id),
    game_date:        (g.game_date as string | null) ?? null,
    season:           Number(g.season),
    week:             g.week != null ? Number(g.week) : null,
    home_team_slug:   g.home_team_slug as string,
    away_team_slug:   g.away_team_slug as string,
    home_name:        stripVF(g.home_name as string),
    away_name:        stripVF(g.away_name as string),
    home_school_slug: (g.home_school_slug as string | null) ?? null,
    away_school_slug: (g.away_school_slug as string | null) ?? null,
    home_score:       g.home_score != null ? Number(g.home_score) : null,
    away_score:       g.away_score != null ? Number(g.away_score) : null,
  }))

  // ── Chat prompts (seeded from current leaders) ─────────────────────────
  const topPasser = (passingRows as Array<Record<string, unknown>>)[0]
  const topRusher = (rushingRows as Array<Record<string, unknown>>)[0]
  const chatPrompts: ChatPrompt[] = [
    {
      q: 'Who leads Section XI in passing yards this season?',
      logoSchoolSlug: (topPasser?.school_slug as string) ?? 'floyd',
    },
    {
      q: `How has ${stripVF((topRusher?.school_name as string) ?? 'Floyd')} performed across the last five seasons?`,
      logoSchoolSlug: (topRusher?.school_slug as string) ?? 'floyd',
    },
    {
      q: 'What is the biggest blowout in Suffolk County history?',
      logoSchoolSlug: charts[0]?.schoolSlug,
    },
  ]

  const c = countsRow[0] as Record<string, number>

  return {
    counts: {
      teams:    Number(c.teams),
      games:    Number(c.games),
      players:  Number(c.players),
      seasons:  Number(c.seasons),
      charts:   Number(c.charts),
    },
    lead,
    divisions,
    leaders: {
      passing:   toLeader(passingRows  as Array<Record<string, unknown>>, 'pass_yards', 'pass_tds'),
      rushing:   toLeader(rushingRows  as Array<Record<string, unknown>>, 'rush_yards', 'rush_tds'),
      receiving: toLeader(receivingRows as Array<Record<string, unknown>>, 'recv_yards', 'recv_tds'),
    },
    charts,
    recentGames:   games,
    chatPrompts,
    currentSeason: CURRENT_SEASON,
    updatedAt:     new Date().toISOString(),
  }
}
