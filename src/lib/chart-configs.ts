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
  stacked?: boolean
}

export const CHART_CONFIGS: ChartConfig[] = [
  // ── Team / Season ────────────────────────────────────────────────────────────
  {
    slug: 'win-pct-trend',
    title: 'Win % Trend by Division',
    description: 'Average team win % per division across 2021–2024 seasons',
    color: '#033882', chartType: 'line-multi', kpiLabel: 'seasons tracked',
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
    color: '#033882', chartType: 'bar', kpiLabel: 'teams tracked',
  },
  {
    slug: 'wins-by-school',
    title: 'Total Wins (3-Year)',
    description: 'Cumulative wins per school across 2022–2024 seasons',
    color: '#033882', chartType: 'bar', kpiLabel: 'most wins',
  },
  {
    slug: 'schools-by-enrollment',
    title: 'Schools by Enrollment',
    description: 'Section XI schools ranked by student enrollment',
    color: '#033882', chartType: 'bar', kpiLabel: 'largest school',
  },

  // ── Passing ──────────────────────────────────────────────────────────────────
  {
    slug: 'passing-yards-leaders',
    title: 'Passing Yards Leaders',
    description: 'Top quarterbacks by passing yards · 2024 season',
    color: '#033882', chartType: 'bar', kpiLabel: 'most pass yds',
  },
  {
    slug: 'passing-tds-leaders',
    title: 'Passing TD Leaders',
    description: 'Top quarterbacks by touchdown passes · 2024 season',
    color: '#033882', chartType: 'bar', kpiLabel: 'most pass TDs',
  },

  // ── Rushing ──────────────────────────────────────────────────────────────────
  {
    slug: 'rushing-yards-leaders',
    title: 'Rushing Yards Leaders',
    description: 'Top ball carriers by rushing yards · 2024 season',
    color: '#033882', chartType: 'bar', kpiLabel: 'most rush yds',
  },
  {
    slug: 'rushing-tds-leaders',
    title: 'Rushing TD Leaders',
    description: 'Top ball carriers by rushing touchdowns · 2024 season',
    color: '#033882', chartType: 'bar', kpiLabel: 'most rush TDs',
  },

  // ── Receiving ────────────────────────────────────────────────────────────────
  {
    slug: 'receiving-yards-leaders',
    title: 'Receiving Yards Leaders',
    description: 'Top receivers by receiving yards · 2024 season',
    color: '#033882', chartType: 'bar', kpiLabel: 'most recv yds',
  },
  {
    slug: 'receiving-tds-leaders',
    title: 'Receiving TD Leaders',
    description: 'Top receivers by touchdown catches · 2024 season',
    color: '#033882', chartType: 'bar', kpiLabel: 'most recv TDs',
  },

  // ── Multi-stat ───────────────────────────────────────────────────────────────
  {
    slug: 'total-tds-leaders',
    title: 'Total TD Leaders',
    description: 'Top scorers by combined rushing + receiving touchdowns · 2024',
    color: '#033882', chartType: 'multi-bar', kpiLabel: 'most total TDs',
  },
  {
    slug: 'total-yards-leaders',
    title: 'Total Yards Leaders',
    description: 'Top offensive players by combined pass + rush + receiving yards · 2024',
    color: '#033882', chartType: 'multi-bar', kpiLabel: 'most total yds',
    stacked: true,
  },

  // ── Scoring ──────────────────────────────────────────────────────────────────
  {
    slug: 'total-points-leaders',
    title: 'Total Points Leaders',
    description: 'Top scorers by total points including TDs, FGs, and PATs · 2024',
    color: '#033882', chartType: 'bar', kpiLabel: 'most points',
  },

  // ── Games ────────────────────────────────────────────────────────────────────
  {
    slug: 'team-scoring-avg',
    title: 'Avg. Points Per Game',
    description: '',
    color: '#033882', chartType: 'bar', kpiLabel: 'highest avg',
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
