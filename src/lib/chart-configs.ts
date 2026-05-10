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
    slug: 'providers-by-county',
    title: 'Providers by County',
    description: 'Licensed childcare providers per NY county',
    color: '#0ea5e9',
    chartType: 'bar',
    kpiLabel: 'total providers',
    filters: [{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }],
  },
  {
    slug: 'capacity-by-county',
    title: 'Capacity by County',
    description: 'Total licensed seats per NY county',
    color: '#6366f1',
    chartType: 'bar',
    kpiLabel: 'total licensed seats',
    filters: [{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }],
  },
  {
    slug: 'program-types',
    title: 'Program Types',
    description: 'Providers and seats by OCFS program type',
    color: '#a855f7',
    chartType: 'bar',
    kpiLabel: 'total facilities',
    filters: [{ key: 'count', label: 'By Count' }, { key: 'seats', label: 'By Seats' }],
  },
  {
    slug: 'facilities-by-year',
    title: 'Facilities Opened by Year',
    description: 'New OCFS facility openings 1983 – 2026',
    color: '#14b8a6',
    chartType: 'area',
    kpiLabel: 'facilities on record',
    filters: [{ key: 'all', label: 'All Types' }, { key: 'dcc', label: 'DCC Only' }],
  },
  {
    slug: 'age-group-capacity',
    title: 'Age Group Capacity',
    description: 'Total licensed seats by age group statewide',
    color: '#8b5cf6',
    chartType: 'bar',
    kpiLabel: 'total age-allocated seats',
    filters: [{ key: 'all', label: 'All Types' }, { key: 'center', label: 'Center Only' }],
  },
  {
    slug: 'facility-status',
    title: 'Facility Status',
    description: 'OCFS license status breakdown across all facilities',
    color: '#10b981',
    chartType: 'bar',
    kpiLabel: 'total facilities',
    filters: [{ key: 'all', label: 'All' }, { key: 'active', label: 'Licensed' }],
  },
  {
    slug: 'license-expiration',
    title: 'License Expiration Pipeline',
    description: 'Facilities by upcoming license expiration year',
    color: '#f97316',
    chartType: 'bar',
    kpiLabel: 'licenses expiring 2025 – 2032',
    filters: [{ key: 'all', label: 'All' }, { key: 'licensed', label: 'Licensed' }],
  },
  {
    slug: 'infant-care-cost',
    title: 'Infant Care Cost',
    description: 'Median infant care cost by county (2022 DOL)',
    color: '#f59e0b',
    chartType: 'bar',
    kpiLabel: 'statewide median',
    periodToggle: true,
    periodBase: 'weekly',
    filters: [{ key: 'center', label: 'Center Care' }, { key: 'family', label: 'Family Care' }],
  },
  {
    slug: 'toddler-care-cost',
    title: 'Toddler Care Cost',
    description: 'Median toddler care cost by county (2022 DOL)',
    color: '#fb923c',
    chartType: 'bar',
    kpiLabel: 'statewide median',
    periodToggle: true,
    periodBase: 'weekly',
    filters: [{ key: 'center', label: 'Center Care' }, { key: 'family', label: 'Family Care' }],
  },
  {
    slug: 'preschool-care-cost',
    title: 'Preschool Care Cost',
    description: 'Median preschool care cost by county (2022 DOL)',
    color: '#eab308',
    chartType: 'bar',
    kpiLabel: 'statewide median',
    periodToggle: true,
    periodBase: 'weekly',
    filters: [{ key: 'center', label: 'Center Care' }, { key: 'family', label: 'Family Care' }],
  },
  {
    slug: 'household-income',
    title: 'Household Income',
    description: 'Median household income by county (2022 DOL)',
    color: '#38bdf8',
    chartType: 'bar',
    kpiLabel: 'statewide median',
    periodToggle: true,
    periodBase: 'annual',
    filters: [{ key: 'income', label: 'Income' }, { key: 'poverty', label: 'Poverty Rate' }],
  },
  {
    slug: 'cost-trend',
    title: 'Infant Care Cost Trend',
    description: 'Statewide median infant care cost 2008 – 2022',
    color: '#22c55e',
    chartType: 'area',
    kpiLabel: '2022 statewide avg',
    periodToggle: true,
    periodBase: 'weekly',
    filters: [{ key: 'infant', label: 'Infant' }, { key: 'toddler', label: 'Toddler' }],
  },
  {
    slug: 'center-vs-family',
    title: 'Center vs Family Care',
    description: 'Center-based vs family care infant cost trend 2008 – 2022',
    color: '#3b82f6',
    chartType: 'line',
    kpiLabel: '2022 cost gap',
    periodToggle: true,
    periodBase: 'weekly',
    series: [
      { key: 'center', color: '#3b82f6', label: 'Center Care' },
      { key: 'family', color: '#f97316', label: 'Family Care' },
    ],
    filters: [{ key: 'all', label: '2008 – 2022' }, { key: 'recent', label: 'Last 5 Yrs' }],
  },
  {
    slug: 'income-vs-cost',
    title: 'Income vs Childcare Cost',
    description: 'Annual household income vs annual infant care cost per county',
    color: '#a855f7',
    chartType: 'scatter',
    kpiLabel: 'counties plotted',
    filters: [{ key: 'all', label: 'All Counties' }, { key: 'top20', label: 'Top 20' }],
  },
  {
    slug: 'lfpr-by-county',
    title: "Women's LFPR",
    description: "Female labor force participation (children under 6) by county",
    color: '#ec4899',
    chartType: 'bar',
    kpiLabel: 'statewide avg',
    filters: [{ key: 'all', label: 'All Counties' }, { key: 'top20', label: 'Highest 20' }],
  },
]

export function getChartConfig(slug: string): ChartConfig | undefined {
  return CHART_CONFIGS.find(c => c.slug === slug)
}

export function getAdjacentSlugs(slug: string): { prevSlug: string; nextSlug: string } {
  const idx = CHART_CONFIGS.findIndex(c => c.slug === slug)
  const n = CHART_CONFIGS.length
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
