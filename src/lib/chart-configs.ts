export type ChartType = 'bar' | 'area' | 'line' | 'scatter' | 'multi-bar' | 'line-multi' | 'pie-donut'
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
}

export const CHART_CONFIGS: ChartConfig[] = [
  // ── Team / Season ────────────────────────────────────────────────────────────
  {
    slug: 'win-pct-trend',
    title: 'Win % Trend by Division',
    description: 'Average team win % per division across 2021–2024 seasons',
    color: '#22c55e', chartType: 'line-multi', kpiLabel: 'seasons tracked',
    series: [
      { key: 'I',   color: '#033882', label: 'Division I'   },
      { key: 'II',  color: '#4338ca', label: 'Division II'  },
      { key: 'III', color: '#0ea5e9', label: 'Division III' },
      { key: 'IV',  color: '#10b981', label: 'Division IV'  },
    ],
  },
  {
    slug: 'win-pct-by-division',
    title: '2024 Wins by Division',
    description: 'Share of total 2024 Section XI wins per division',
    color: '#033882', chartType: 'pie-donut', kpiLabel: 'divisions',
  },
  {
    slug: 'season-records',
    title: '2024 Season Records',
    description: 'All Section XI team records — 2024 season ranked by wins',
    color: '#0ea5e9', chartType: 'bar', kpiLabel: 'teams tracked',
  },
  {
    slug: 'wins-by-school',
    title: 'Total Wins (3-Year)',
    description: 'Cumulative wins per school across 2022–2024 seasons',
    color: '#f59e0b', chartType: 'bar', kpiLabel: 'most wins',
  },
  {
    slug: 'schools-by-enrollment',
    title: 'Schools by Enrollment',
    description: 'Section XI schools ranked by student enrollment',
    color: '#10b981', chartType: 'bar', kpiLabel: 'largest school',
  },

  // ── Passing ──────────────────────────────────────────────────────────────────
  {
    slug: 'passing-yards-leaders',
    title: 'Passing Yards Leaders',
    description: 'Top quarterbacks by passing yards · 2024 season',
    color: '#8b5cf6', chartType: 'bar', kpiLabel: 'most pass yds',
  },
  {
    slug: 'passing-tds-leaders',
    title: 'Passing TD Leaders',
    description: 'Top quarterbacks by touchdown passes · 2024 season',
    color: '#f97316', chartType: 'bar', kpiLabel: 'most pass TDs',
  },

  // ── Rushing ──────────────────────────────────────────────────────────────────
  {
    slug: 'rushing-yards-leaders',
    title: 'Rushing Yards Leaders',
    description: 'Top ball carriers by rushing yards · 2024 season',
    color: '#ef4444', chartType: 'bar', kpiLabel: 'most rush yds',
  },
  {
    slug: 'rushing-tds-leaders',
    title: 'Rushing TD Leaders',
    description: 'Top ball carriers by rushing touchdowns · 2024 season',
    color: '#ec4899', chartType: 'bar', kpiLabel: 'most rush TDs',
  },

  // ── Receiving ────────────────────────────────────────────────────────────────
  {
    slug: 'receiving-yards-leaders',
    title: 'Receiving Yards Leaders',
    description: 'Top receivers by receiving yards · 2024 season',
    color: '#14b8a6', chartType: 'bar', kpiLabel: 'most recv yds',
  },
  {
    slug: 'receiving-tds-leaders',
    title: 'Receiving TD Leaders',
    description: 'Top receivers by touchdown catches · 2024 season',
    color: '#06b6d4', chartType: 'bar', kpiLabel: 'most recv TDs',
  },

  // ── Multi-stat ───────────────────────────────────────────────────────────────
  {
    slug: 'total-tds-leaders',
    title: 'Total TD Leaders',
    description: 'Top scorers by combined rushing + receiving touchdowns · 2024',
    color: '#6366f1', chartType: 'multi-bar', kpiLabel: 'most total TDs',
    series: [
      { key: 'rush', color: '#ef4444', label: 'Rush TDs' },
      { key: 'recv', color: '#14b8a6', label: 'Recv TDs' },
    ],
  },
  {
    slug: 'total-yards-leaders',
    title: 'Total Yards Leaders',
    description: 'Top offensive players by combined pass + rush + receiving yards · 2024',
    color: '#a855f7', chartType: 'multi-bar', kpiLabel: 'most total yds',
    series: [
      { key: 'pass', color: '#8b5cf6', label: 'Pass Yds' },
      { key: 'rush', color: '#ef4444', label: 'Rush Yds' },
      { key: 'recv', color: '#14b8a6', label: 'Recv Yds' },
    ],
  },

  // ── Scoring ──────────────────────────────────────────────────────────────────
  {
    slug: 'total-points-leaders',
    title: 'Total Points Leaders',
    description: 'Top scorers by total points including TDs, FGs, and PATs · 2024',
    color: '#f59e0b', chartType: 'bar', kpiLabel: 'most points',
  },

  // ── Games ────────────────────────────────────────────────────────────────────
  {
    slug: 'highest-scoring-games',
    title: 'Highest Scoring Games',
    description: 'Top 2024 games ranked by combined score',
    color: '#f97316', chartType: 'bar', kpiLabel: 'combined pts',
  },
  {
    slug: 'team-scoring-avg',
    title: 'Team Scoring Average',
    description: 'Average points scored per game by team · 2024 season',
    color: '#0ea5e9', chartType: 'bar', kpiLabel: 'highest avg',
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
