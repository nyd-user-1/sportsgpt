import { CURRENT_SEASON } from '@/lib/season'

export type ChartType = 'bar' | 'area' | 'line' | 'scatter' | 'multi-bar' | 'line-multi' | 'pie-donut' | 'scatter-pfpa' | 'win-loss-h'
export type Period = 'weekly' | 'monthly' | 'annual'

export interface SeriesDef {
  key: string
  color: string
  label: string
}

export interface FilterDef {
  key: string
  label: string
}

export interface ChartConfig {
  slug: string
  title: string
  description: string
  color: string
  chartType: ChartType
  kpiLabel: string
  periodToggle?: boolean
  periodBase?: 'weekly' | 'annual'
  series?: SeriesDef[]
  filters?: FilterDef[]
  stacked?: boolean
}

export const CHART_CONFIGS: ChartConfig[] = [
  // ── Team / Season ────────────────────────────────────────────────────────────
  {
    slug: 'home-away-record',
    title: 'Home vs. Away Record',
    description: `Home wins vs. away wins per team · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'home wins',
  },
  {
    slug: 'pf-pa',
    title: 'PF vs. PA',
    description: `Points for vs. points against by team · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'scatter-pfpa', kpiLabel: 'most points scored',
  },
  {
    slug: 'win-loss-division',
    title: 'Win/Loss by Division',
    description: `Team wins and losses by division · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'win-loss-h', kpiLabel: 'teams tracked',
  },
  {
    slug: 'strength-of-schedule',
    title: 'Strength of Schedule',
    description: `Average opponent win rate by team · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'toughest schedule',
  },
  {
    slug: 'season-records',
    title: 'Season Records',
    description: 'Section XI team records by season — wins and losses',
    color: '#033882', chartType: 'bar', kpiLabel: 'teams tracked',
  },
  {
    slug: 'wins-by-school',
    title: 'Current Dynasty',
    description: `Combined wins per school across the last 3 seasons (${CURRENT_SEASON - 2}–${CURRENT_SEASON})`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most wins',
  },
  {
    slug: 'point-differential-leaders',
    title: 'Point Differential Leaders',
    description: 'Teams ranked by scoring margin (PF minus PA) · per season',
    color: '#033882', chartType: 'bar', kpiLabel: 'best differential',
  },

  // ── Passing ──────────────────────────────────────────────────────────────────
  {
    slug: 'passing-yards-leaders',
    title: 'Passing Yards Leaders',
    description: `Top quarterbacks by passing yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most pass yds',
  },
  {
    slug: 'passing-tds-leaders',
    title: 'Passing TD Leaders',
    description: `Top quarterbacks by touchdown passes · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most pass TDs',
  },

  // ── Rushing ──────────────────────────────────────────────────────────────────
  {
    slug: 'rushing-yards-leaders',
    title: 'Rushing Yards Leaders',
    description: `Top ball carriers by rushing yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most rush yds',
  },
  {
    slug: 'rushing-tds-leaders',
    title: 'Rushing TD Leaders',
    description: `Top ball carriers by rushing touchdowns · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most rush TDs',
  },

  // ── Receiving ────────────────────────────────────────────────────────────────
  {
    slug: 'receiving-yards-leaders',
    title: 'Receiving Yards Leaders',
    description: `Top receivers by receiving yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most recv yds',
  },
  {
    slug: 'receiving-tds-leaders',
    title: 'Receiving TD Leaders',
    description: `Top receivers by touchdown catches · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)} season`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most recv TDs',
  },

  // ── Multi-stat ───────────────────────────────────────────────────────────────
  {
    slug: 'total-tds-leaders',
    title: 'Total TD Leaders',
    description: `Top scorers by combined rushing + receiving touchdowns · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)}`,
    color: '#033882', chartType: 'multi-bar', kpiLabel: 'most total TDs',
  },
  {
    slug: 'total-yards-leaders',
    title: 'Total Yards Leaders',
    description: `Top offensive players by combined pass + rush + receiving yards · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)}`,
    color: '#033882', chartType: 'multi-bar', kpiLabel: 'most total yds',
    stacked: true,
  },

  // ── Scoring ──────────────────────────────────────────────────────────────────
  {
    slug: 'total-points-leaders',
    title: 'Total Points Leaders',
    description: `Top scorers by total points including TDs, FGs, and PATs · ${CURRENT_SEASON}-${String(CURRENT_SEASON + 1).slice(2)}`,
    color: '#033882', chartType: 'bar', kpiLabel: 'most points',
  },

  // ── Game Records & Scoring ────────────────────────────────────────────────
  {
    slug: 'scoring-offense',
    title: 'Scoring Offense',
    description: 'Average points scored per game by team — season by season',
    color: '#033882', chartType: 'bar', kpiLabel: 'avg pts/game',
  },
  {
    slug: 'scoring-defense',
    title: 'Scoring Defense',
    description: 'Average points allowed per game — fewest is best',
    color: '#10b981', chartType: 'bar', kpiLabel: 'fewest pts allowed',
  },
  {
    slug: 'top-scoring-games',
    title: 'Highest Scoring Games',
    description: 'Games with the most combined points scored — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'pts combined',
  },
  {
    slug: 'biggest-blowouts',
    title: 'Biggest Blowouts',
    description: 'Largest margins of victory — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'point margin',
  },
  {
    slug: 'single-game-rushing',
    title: 'Single-Game Rushing',
    description: 'Top single-game rushing performances — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'rush yds in one game',
  },
  {
    slug: 'single-game-passing',
    title: 'Single-Game Passing',
    description: 'Top single-game passing performances — seasons with box scores',
    color: '#033882', chartType: 'bar', kpiLabel: 'pass yds in one game',
  },

]

export function getChartConfig(slug: string): ChartConfig | undefined {
  return CHART_CONFIGS.find((c) => c.slug === slug)
}

export function getAdjacentSlugs(slug: string): { prevSlug: string; nextSlug: string } {
  const n = CHART_CONFIGS.length
  if (n === 0) return { prevSlug: '', nextSlug: '' }
  const idx = CHART_CONFIGS.findIndex((c) => c.slug === slug)
  return {
    prevSlug: CHART_CONFIGS[(idx - 1 + n) % n].slug,
    nextSlug: CHART_CONFIGS[(idx + 1) % n].slug,
  }
}

export function applyPeriod(value: number, base: 'weekly' | 'annual', period: Period): number {
  if (base === 'weekly') {
    if (period === 'monthly') return value * (52 / 12)
    if (period === 'annual') return value * 52
    return value
  } else {
    if (period === 'monthly') return value / 12
    if (period === 'weekly') return value / 52
    return value
  }
}

export function fmtPeriodLabel(period: Period): string {
  if (period === 'weekly') return '/wk'
  if (period === 'monthly') return '/mo'
  return '/yr'
}
