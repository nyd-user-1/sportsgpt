export type ChartType = 'bar' | 'area' | 'line' | 'scatter'
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
  {
    slug: 'teams-by-division',
    title: 'Teams by Division',
    description: 'Section XI football teams per division',
    color: '#033882', chartType: 'bar', kpiLabel: 'total teams',
  },
  {
    slug: 'win-pct-by-division',
    title: 'Win % by Division',
    description: 'Average win percentage per division · 2024 season',
    color: '#4338ca', chartType: 'bar', kpiLabel: 'avg win %',
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
  {
    slug: 'passing-yards-leaders',
    title: 'Passing Yards Leaders',
    description: 'Top quarterbacks by passing yards · 2024 season',
    color: '#8b5cf6', chartType: 'bar', kpiLabel: 'most pass yds',
  },
  {
    slug: 'rushing-yards-leaders',
    title: 'Rushing Yards Leaders',
    description: 'Top ball carriers by rushing yards · 2024 season',
    color: '#ef4444', chartType: 'bar', kpiLabel: 'most rush yds',
  },
  {
    slug: 'receiving-yards-leaders',
    title: 'Receiving Yards Leaders',
    description: 'Top receivers by receiving yards · 2024 season',
    color: '#14b8a6', chartType: 'bar', kpiLabel: 'most recv yds',
  },
  {
    slug: 'passing-tds-leaders',
    title: 'Passing TD Leaders',
    description: 'Top quarterbacks by touchdown passes · 2024 season',
    color: '#f97316', chartType: 'bar', kpiLabel: 'most pass TDs',
  },
  {
    slug: 'rushing-tds-leaders',
    title: 'Rushing TD Leaders',
    description: 'Top ball carriers by rushing touchdowns · 2024 season',
    color: '#ec4899', chartType: 'bar', kpiLabel: 'most rush TDs',
  },
  {
    slug: 'win-pct-trend',
    title: 'Win % Trend by Division',
    description: 'Average team win % per division across 2022–2024 seasons',
    color: '#22c55e', chartType: 'line', kpiLabel: 'seasons tracked',
    series: [
      { key: 'I',   color: '#033882', label: 'Division I'   },
      { key: 'II',  color: '#4338ca', label: 'Division II'  },
      { key: 'III', color: '#0ea5e9', label: 'Division III' },
      { key: 'IV',  color: '#10b981', label: 'Division IV'  },
    ],
  },
  {
    slug: 'completions-leaders',
    title: 'Completions Leaders',
    description: 'Top quarterbacks by total completions · 2024 season',
    color: '#a855f7', chartType: 'bar', kpiLabel: 'most completions',
  },
]

export function getChartConfig(slug: string): ChartConfig | undefined {
  return CHART_CONFIGS.find(c => c.slug === slug)
}

export function getAdjacentSlugs(slug: string): { prevSlug: string; nextSlug: string } {
  const n = CHART_CONFIGS.length
  if (n === 0) return { prevSlug: '', nextSlug: '' }
  const idx = CHART_CONFIGS.findIndex(c => c.slug === slug)
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
