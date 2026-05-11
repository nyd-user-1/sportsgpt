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
    color: '#033882',
    chartType: 'bar',
    kpiLabel: 'total teams',
  },
  {
    slug: 'win-pct-by-division',
    title: 'Win % by Division',
    description: 'Average win percentage per division · 2024',
    color: '#4338ca',
    chartType: 'bar',
    kpiLabel: 'avg win %',
  },
  {
    slug: 'points-scored-leaders',
    title: 'Points Scored Leaders',
    description: 'Top teams by total points scored · 2024 season',
    color: '#a855f7',
    chartType: 'bar',
    kpiLabel: 'total points for',
  },
  {
    slug: 'point-differential',
    title: 'Point Differential',
    description: 'Points for minus points against per team',
    color: '#0ea5e9',
    chartType: 'bar',
    kpiLabel: 'avg differential',
  },
  {
    slug: 'schools-by-enrollment',
    title: 'Schools by Enrollment',
    description: 'Section XI schools ranked by student enrollment',
    color: '#10b981',
    chartType: 'bar',
    kpiLabel: 'largest school',
  },
  {
    slug: 'wins-by-school',
    title: 'Wins by School',
    description: 'Total football wins per school · all-time',
    color: '#f59e0b',
    chartType: 'bar',
    kpiLabel: 'most wins',
  },
  {
    slug: 'season-records',
    title: 'Season Records',
    description: 'Win–loss distribution across all Section XI teams',
    color: '#14b8a6',
    chartType: 'bar',
    kpiLabel: 'teams tracked',
  },
  {
    slug: 'scoring-trend',
    title: 'Scoring Trend',
    description: 'Average points per game across Section XI · by season',
    color: '#22c55e',
    chartType: 'area',
    kpiLabel: 'pts/game avg',
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
