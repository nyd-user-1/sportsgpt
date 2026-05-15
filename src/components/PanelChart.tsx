'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppPanel } from './AppPanel'
import { CHART_CONFIGS } from '@/lib/chart-configs'
import { SportsBarChart } from './charts/SportsBarChart'
import { SportsBarChartInteractive, type SeasonBars } from './charts/SportsBarChartInteractive'
import { SportsBarChartMulti } from './charts/SportsBarChartMulti'
import { SportsLineMulti } from './charts/SportsLineMulti'
import { SportsPieDonut } from './charts/SportsPieDonut'

type StdRow = { name: string; value: number }
type SubRow = { label: string; value: number; extra?: string }
type SubRowMap = Record<string, SubRow[]>

interface ChartData {
  variant: 'bar' | 'bar-interactive' | 'bar-multi' | 'line-multi' | 'pie'
  tableRows: StdRow[]
  kpiValue: number
  seasonFilters?: string[]
  subRows?: SubRowMap
  seasonBars?: SeasonBars[]
  multiSeriesData?: Record<string, string | number>[]
  multiPoints?: Record<string, string | number>[]
  pieItems?: { name: string; value: number; fill: string }[]
  pieConfig?: Record<string, { label: string; color: string }>
  series?: { key: string; label: string; color: string }[]
  stacked?: boolean
  valueLabel?: string
  valueSuffix?: string
}

function ChartPanelContent({ slug }: { slug: string }) {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const config = CHART_CONFIGS.find(c => c.slug === slug)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/chart/${slug}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  if (!config) return null

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-sm text-[var(--muted)]">Loading…</div>
  )
  if (!data) return (
    <div className="flex items-center justify-center h-48 text-sm text-[var(--muted)]">Failed to load</div>
  )

  let chartNode: React.ReactNode = null
  if (data.variant === 'bar') {
    chartNode = <SportsBarChart data={data.tableRows.slice(0, 20)} color={config.color} valueLabel={data.valueLabel ?? ''} />
  } else if (data.variant === 'bar-interactive' && data.seasonBars) {
    chartNode = <SportsBarChartInteractive seasons={data.seasonBars} color={config.color} valueLabel={data.valueLabel ?? ''} />
  } else if (data.variant === 'bar-multi' && data.multiSeriesData && data.series) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartNode = <SportsBarChartMulti data={data.multiSeriesData as any} series={data.series} stacked={data.stacked} />
  } else if (data.variant === 'line-multi' && data.multiPoints && data.series) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartNode = <SportsLineMulti data={data.multiPoints as any} xKey="name" series={data.series} title={config.title} description={config.description} valueSuffix={data.valueSuffix ?? ''} />
  } else if (data.variant === 'pie' && data.pieItems && data.pieConfig) {
    chartNode = <SportsPieDonut data={data.pieItems} config={data.pieConfig} title={config.title} description={config.description} />
  }

  const sorted = [...data.tableRows].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, r) => s + r.value, 0) || data.kpiValue

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chart */}
      {chartNode && (
        <div className="shrink-0 px-4 pt-4 pb-2">
          {chartNode}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="divide-y divide-[var(--border)]">
          <div className="sticky top-0 grid grid-cols-[1fr_90px_56px] gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] z-10">
            <span>Name</span>
            <span className="text-right">Value</span>
            <span className="text-right">Share</span>
          </div>
          {sorted.map(row => {
            const pct = total > 0 ? (row.value / total) * 100 : 0
            return (
              <div key={row.name} className="grid grid-cols-[1fr_90px_56px] gap-2 px-4 py-2.5 items-center hover:bg-[var(--inp-bg)] transition-colors">
                <span className="text-sm text-[var(--txt)] truncate">{row.name}</span>
                <span className="text-right text-sm tabular-nums font-medium" style={{ color: config.color }}>{row.value.toLocaleString()}</span>
                <span className="text-right text-xs text-[var(--muted)] tabular-nums">{pct.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">{sorted.length} entries</span>
        <Link href={`/chart/${slug}`} className="text-sm font-semibold hover:underline" style={{ color: config.color }}>
          Full view →
        </Link>
      </div>
    </div>
  )
}

export function PanelChart({
  open,
  onClose,
  activeSlug,
}: {
  open: boolean
  onClose: () => void
  activeSlug?: string | null
}) {
  const config = activeSlug ? CHART_CONFIGS.find(c => c.slug === activeSlug) : null

  return (
    <AppPanel open={open} onClose={onClose} title={config?.title ?? 'Chart'}>
      {activeSlug && <ChartPanelContent slug={activeSlug} />}
    </AppPanel>
  )
}
