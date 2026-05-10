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

// ── REPLACE FOR NEW DOMAIN ────────────────────────────────────────────────
// Add one entry per chart. Each slug must have a matching case in
// src/app/chart/[slug]/page.tsx that queries your DB and returns data.
// The /charts index page renders empty when this array is empty — that's fine.
export const CHART_CONFIGS: ChartConfig[] = []

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
