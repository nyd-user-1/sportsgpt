'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { AppPanel } from './AppPanel'
import { CHART_CONFIGS, chartsByMetric, METRIC_LABELS, type ChartMetric } from '@/lib/chart-configs'
import { SportsBarChart } from './charts/SportsBarChart'
import { SportsBarChartInteractive, type SeasonBars } from './charts/SportsBarChartInteractive'
import { SportsBarChartMulti } from './charts/SportsBarChartMulti'
import { SportsLineMulti } from './charts/SportsLineMulti'
import { SportsPFPAScatter, type PFPASeason } from './charts/SportsPFPAScatter'
import { SportsWinLossBar, type WinLossSeason } from './charts/SportsWinLossBar'

type StdRow = { name: string; value: number }
type SubRow = { label: string; value: number; extra?: string }
type SubRowMap = Record<string, SubRow[]>

interface ChartData {
  variant: 'bar' | 'bar-interactive' | 'bar-multi' | 'line-multi' | 'pie' | 'pfpa' | 'win-loss-h'
  tableRows: StdRow[]
  kpiValue: number
  seasonFilters?: string[]
  subRows?: SubRowMap
  seasonBars?: SeasonBars[]
  pfpaSeasons?: PFPASeason[]
  winLossSeasons?: WinLossSeason[]
  multiSeriesData?: Record<string, string | number>[]
  multiPoints?: Record<string, string | number>[]
  pieItems?: { name: string; value: number; fill: string }[]
  pieConfig?: Record<string, { label: string; color: string }>
  series?: { key: string; label: string; color: string }[]
  stacked?: boolean
  valueLabel?: string
  valueSuffix?: string
}

// Deterministic descending sparkline for thumbnail previews
function sparkData(slug: string) {
  const h = [...slug].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0)
  return Array.from({ length: 8 }, (_, i) => ({
    x: i,
    y: Math.max(8, 100 - i * 11 + ((h >> i) & 0xf)),
  }))
}

// Metric display order
const METRIC_ORDER: ChartMetric[] = [
  'wins', 'scoring', 'passing', 'rushing', 'receiving', 'composite', 'defense', 'schedule',
]

function ChartPickerGrid({ onSelect }: { onSelect: (slug: string) => void }) {
  const grouped = chartsByMetric()

  return (
    <div className="flex flex-col pb-6">
      {METRIC_ORDER.map(metric => {
        const charts = grouped[metric]
        if (!charts?.length) return null
        return (
          <div key={metric}>
            {/* Section header */}
            <div className="px-5 pt-6 pb-2">
              <span
                className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
                style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}
              >
                {METRIC_LABELS[metric]}
              </span>
            </div>

            {/* Chart rows */}
            <div className="flex flex-col">
              {charts.map((chart, i) => (
                <button
                  key={chart.slug}
                  onClick={() => onSelect(chart.slug)}
                  className={`group flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[var(--paper-quiet)] ${
                    i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''
                  }`}
                >
                  {/* Tiny sparkline */}
                  <div className="shrink-0 w-14 h-8 opacity-40 group-hover:opacity-70 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sparkData(chart.slug)} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
                        <Bar dataKey="y" fill="var(--paper-strong)" radius={[1, 1, 0, 0]} animationDuration={0} />
                        <XAxis dataKey="x" hide />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Title + description */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors leading-snug"
                      style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}
                    >
                      {chart.title}
                    </p>
                    {chart.description && (
                      <p
                        className="mt-0.5 text-[11px] text-[var(--paper-muted)] leading-snug line-clamp-1"
                        style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                      >
                        {chart.description}
                      </p>
                    )}
                  </div>

                  <ArrowUpRight className="shrink-0 h-3 w-3 text-[var(--paper-faint)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
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
    <div className="flex items-center justify-center h-48">
      <p
        className="text-[var(--paper-faint)] text-sm"
        style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
      >
        Loading…
      </p>
    </div>
  )
  if (!data) return (
    <div className="flex items-center justify-center h-48">
      <p
        className="text-[var(--paper-faint)] text-sm"
        style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
      >
        Failed to load.
      </p>
    </div>
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
  } else if (data.variant === 'pfpa' && data.pfpaSeasons) {
    chartNode = <SportsPFPAScatter seasons={data.pfpaSeasons} />
  } else if (data.variant === 'win-loss-h' && data.winLossSeasons) {
    chartNode = <SportsWinLossBar seasons={data.winLossSeasons} />
  }

  const sorted = [...(data.tableRows ?? [])].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, r) => s + r.value, 0) || data.kpiValue

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chart */}
      {chartNode && (
        <div className="shrink-0 px-4 pt-5 pb-3">
          {chartNode}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Column headers */}
        <div
          className="sticky top-0 grid grid-cols-[1fr_72px] gap-2 px-5 py-2.5 border-b border-t border-[var(--paper-rule)] bg-[var(--paper)] z-10"
        >
          <span
            className="text-[10px] uppercase tracking-[0.2em] text-[var(--paper-faint)]"
            style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}
          >
            {config.nameLabel ?? 'Name'}
          </span>
          <span
            className="text-right text-[10px] uppercase tracking-[0.2em] text-[var(--paper-faint)]"
            style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}
          >
            {config.valueLabel ?? 'Value'}
          </span>
        </div>

        <div className="divide-y divide-[var(--paper-rule-soft)]">
          {sorted.map((row, idx) => (
              <div
                key={row.name}
                className="grid grid-cols-[1fr_72px] gap-2 px-5 py-3 items-center hover:bg-[var(--paper-quiet)] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="shrink-0 text-[11px] tabular-nums text-[var(--paper-faint)]"
                    style={{ fontFamily: 'var(--font-mono, ui-monospace), monospace' }}
                  >
                    {String(idx + 1).padStart(2, ' ')}.
                  </span>
                  <span
                    className="text-[13.5px] text-[var(--paper-text)] truncate"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 500, letterSpacing: '-0.005em' }}
                  >
                    {row.name}
                  </span>
                </div>
                <span
                  className="text-right text-[13px] tabular-nums font-medium text-[var(--paper-strong)]"
                  style={{ fontFamily: 'var(--font-mono, ui-monospace), monospace' }}
                >
                  {row.value.toLocaleString()}
                </span>
              </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--paper-rule)] px-5 py-3.5 flex items-center justify-between">
        <span
          className="text-[11px] text-[var(--paper-faint)] tabular-nums"
          style={{ fontFamily: 'var(--font-mono, ui-monospace), monospace' }}
        >
          {sorted.length} entries
        </span>
        <Link
          href={`/charts/${slug}`}
          className="inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.16em] text-[var(--paper-strong)] hover:underline underline-offset-4 transition-colors"
          style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}
        >
          Full view <ArrowUpRight className="h-3 w-3" />
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
  const [selectedSlug, setSelectedSlug] = useState<string | null>(activeSlug ?? null)

  useEffect(() => { setSelectedSlug(activeSlug ?? null) }, [activeSlug])
  useEffect(() => { if (!open && !activeSlug) setSelectedSlug(null) }, [open, activeSlug])

  const config = selectedSlug ? CHART_CONFIGS.find(c => c.slug === selectedSlug) : null

  const panelTitle = selectedSlug && config ? (
    <div className="flex items-center gap-1 min-w-0">
      <button
        onClick={() => setSelectedSlug(null)}
        className="shrink-0 -ml-1 p-1 rounded-md text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
        aria-label="Back to charts"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="truncate">{config.title}</span>
    </div>
  ) : 'Charts'

  return (
    <AppPanel open={open} onClose={onClose} title={panelTitle}>
      {selectedSlug
        ? <ChartPanelContent slug={selectedSlug} />
        : <ChartPickerGrid onSelect={setSelectedSlug} />
      }
    </AppPanel>
  )
}
