'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, ScatterChart, Scatter, XAxis, YAxis,
  Tooltip as RechartsTip, CartesianGrid, Cell,
} from 'recharts'
import { ChevronRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ChartsDrawer } from '@/components/ChartsDrawer'
import { cn, formatSeason } from '@/lib/utils'
import {
  type ChartConfig, type Period,
  applyPeriod, fmtPeriodLabel,
} from '@/lib/chart-configs'
import { CHART_NAV_EVENT, SEASON_CHANGE_EVENT } from '@/lib/app-config'

/* ── Formatting ──────────────────────────────────────────────────── */
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function fmtVal(v: number, config: ChartConfig, period?: Period): string {
  const slug = config.slug
  const isUsd = slug.includes('cost') || slug.includes('income')
  if (isUsd) {
    const label = period ? fmtPeriodLabel(period) : ''
    return `$${fmtNum(v)}${label}`
  }
  if (slug === 'lfpr-by-county') return `${v.toFixed(1)}%`
  return fmtNum(v)
}

/* ── Props ───────────────────────────────────────────────────────── */
export type StdRow = { name: string; value: number; logoUrl?: string; winPct?: number; subtitle?: string; record?: string }
export type MultiRow = Record<string, string | number>
export type ScatterRow = { name: string; x: number; y: number }
export type SubRow = { label: string; value: number; extra?: string }
export type SubRowMap = Record<string, SubRow[]>

interface Props {
  config: ChartConfig
  prevSlug: string
  nextSlug: string
  kpiValue: number
  tableRows?: StdRow[]
  chartPoints?: StdRow[]
  multiPoints?: MultiRow[]
  scatterPoints?: ScatterRow[]
  subRows?: SubRowMap
  children?: React.ReactNode
  seasonFilters?: string[]
  rowLinks?: Record<string, string>
  seasonRows?: Record<string, StdRow[]>
  valueLabel?: string
  showRank?: boolean
  panelMode?: boolean
}

/* ── Component ───────────────────────────────────────────────────── */
export function ChartDetailPage({
  config, prevSlug, nextSlug, kpiValue,
  tableRows = [], chartPoints = [], multiPoints = [], scatterPoints = [],
  subRows,
  children,
  seasonFilters,
  rowLinks,
  seasonRows,
  valueLabel,
  showRank,
  panelMode,
}: Props) {
  const [period, setPeriod]   = useState<Period>('weekly')
  const [filter, setFilter]   = useState(config.filters?.[0]?.key ?? '')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [activeSeason, setActiveSeason] = useState(seasonFilters?.[seasonFilters.length - 1] ?? '')

  const emitSeason = (yr: string) => {
    setActiveSeason(yr)
    window.dispatchEvent(new CustomEvent(SEASON_CHANGE_EVENT, { detail: yr }))
  }

  const toggleRow = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const base = config.periodBase ?? 'weekly'

  const scaledKpi = config.periodToggle ? applyPeriod(kpiValue, base, period) : kpiValue

  /* Broadcast nav to AppLayout header */
  useEffect(() => {
    const detail = {
      prevHref: `/chart/${prevSlug}`,
      nextHref: `/chart/${nextSlug}`,
      color: config.color,
      pageTitle: config.title,
    }
    window.dispatchEvent(new CustomEvent(CHART_NAV_EVENT, { detail }))
    return () => {
      window.dispatchEvent(new CustomEvent(CHART_NAV_EVENT, { detail: null }))
    }
  }, [prevSlug, nextSlug, config])

  const scaledChart: StdRow[] = useMemo(() => {
    if (!config.periodToggle) return chartPoints
    return chartPoints.map(r => ({ ...r, value: applyPeriod(r.value, base, period) }))
  }, [chartPoints, config.periodToggle, base, period])

  const scaledMulti: MultiRow[] = useMemo(() => {
    if (!config.periodToggle || !config.series) return multiPoints
    return multiPoints.map(row => {
      const out: MultiRow = { name: row.name as string }
      config.series!.forEach(s => {
        out[s.key] = typeof row[s.key] === 'number'
          ? applyPeriod(row[s.key] as number, base, period)
          : row[s.key] as number
      })
      return out
    })
  }, [multiPoints, config.periodToggle, config.series, base, period])

  const activeRows: StdRow[] = seasonRows?.[activeSeason] ?? tableRows

  const scaledTable: StdRow[] = useMemo(() => {
    if (!config.periodToggle) return activeRows
    return activeRows.map(r => ({ ...r, value: applyPeriod(r.value, base, period) }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRows, config.periodToggle, base, period])

  const rankChanges = useMemo(() => {
    if (!seasonRows || activeSeason === 'all') return {} as Record<string, number>
    const seasons = Object.keys(seasonRows).filter(s => s !== 'all').sort()
    const activeIdx = seasons.indexOf(activeSeason)
    if (activeIdx <= 0) return {} as Record<string, number>
    const prevSeason = seasons[activeIdx - 1]
    const prevRanks = new Map((seasonRows[prevSeason] ?? []).map((r, i) => [r.name, i + 1]))
    const result: Record<string, number> = {}
    ;(seasonRows[activeSeason] ?? []).forEach((r, i) => {
      const prev = prevRanks.get(r.name)
      if (prev !== undefined) result[r.name] = prev - (i + 1)
    })
    return result
  }, [seasonRows, activeSeason])

  const scaledScatter: ScatterRow[] = useMemo(() => {
    if (config.slug !== 'income-vs-cost') return scatterPoints
    return scatterPoints
  }, [scatterPoints, config.slug])

  const total = scaledTable.reduce((s, r) => s + r.value, 0) || scaledKpi
  const sorted = [...scaledTable].sort((a, b) => b.value - a.value)

  const hasSubRows = !!subRows && Object.keys(subRows).length > 0

  const tipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '12px',
  }

  const inner = (
      <div className={panelMode ? 'flex flex-col' : 'flex-1 flex flex-col overflow-hidden'}>

        {/* ── Header band — only renders when inline chart or filters are present ── */}
        {(!children || config.filters?.length || config.periodToggle) && (
        <div className="shrink-0 bg-[var(--surface)] px-5 pt-3 pb-0">

          {/* Inline recharts preview — hidden when shadcn chart children are provided */}
          {children ? null : (
          <div className="h-40 md:h-52 -mx-1 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              {config.chartType === 'area' ? (
                <AreaChart data={scaledChart} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id={`g-${config.slug}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={config.color} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={1.5}
                    fill={`url(#g-${config.slug})`} dot={false} animationDuration={400} />
                  <XAxis dataKey="name" hide />
                  <RechartsTip contentStyle={tipStyle}
                    formatter={(v) => [fmtVal(Number(v), config, config.periodToggle ? period : undefined), config.title]}
                    labelFormatter={(l) => String(l)} />
                </AreaChart>
              ) : config.chartType === 'line' ? (
                <LineChart data={scaledMulti} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  {config.series?.map(s => (
                    <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color}
                      strokeWidth={1.5} dot={false} animationDuration={400} name={s.label} />
                  ))}
                  <RechartsTip contentStyle={tipStyle}
                    formatter={(v, name) => [fmtVal(Number(v), config, config.periodToggle ? period : undefined), name]} />
                </LineChart>
              ) : config.chartType === 'scatter' ? (
                <ScatterChart margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
                  <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="x" type="number" name="Annual Income" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${Math.round(v/1000)}K`} />
                  <YAxis dataKey="y" type="number" name="Annual Care Cost" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `$${Math.round(v/1000)}K`} width={48} />
                  <Scatter data={scaledScatter} fill={config.color} fillOpacity={0.7} />
                  <RechartsTip contentStyle={tipStyle}
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(v, name) => [`$${Math.round(Number(v)).toLocaleString()}`, name]} />
                </ScatterChart>
              ) : (
                <BarChart data={scaledChart} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  {scaledChart.map((_, i) => (
                    <Cell key={i} fill={config.color} opacity={Math.max(0.3, 1 - i * 0.015)} />
                  ))}
                  <Bar dataKey="value" radius={[2, 2, 0, 0]} animationDuration={400}>
                    {scaledChart.map((_, i) => (
                      <Cell key={i} fill={config.color} opacity={Math.max(0.3, 1 - i * 0.015)} />
                    ))}
                  </Bar>
                  <XAxis dataKey="name" hide />
                  <RechartsTip contentStyle={tipStyle}
                    formatter={(v) => [fmtVal(Number(v), config, config.periodToggle ? period : undefined), config.title]}
                    labelFormatter={(l) => String(l)} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          )}

          {/* Filter tabs + period toggle (only when present) */}
          {(config.filters?.length || config.periodToggle) ? (
            <div className="flex items-center gap-1.5 pb-3 flex-wrap">
              {config.filters?.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filter === f.key
                      ? 'text-[var(--txt)] border border-[var(--border)] bg-[var(--surface)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--txt)]',
                  )}>{f.label}</button>
              ))}
              {config.periodToggle && config.filters && (
                <div className="h-4 w-px bg-[var(--border)] mx-0.5" />
              )}
              {config.periodToggle && (['weekly', 'monthly', 'annual'] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                    period === p
                      ? 'text-[var(--txt)] border border-sky-500/50 bg-[var(--surface)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--txt)]',
                  )}>{p}</button>
              ))}
            </div>
          ) : null}
        </div>
        )}

        {/* ── Shadcn chart (when children provided) ── */}
        {children && (
          <div className="shrink-0 px-5 pt-2 pb-2">
            {children}
          </div>
        )}

        {/* ── Charts button + season buttons ── */}
        <div className="shrink-0 flex items-center gap-1.5 px-5 py-3 border-b border-[var(--border)]">
          <ChartsDrawer />
          {seasonFilters && seasonFilters.length > 0 && (
            <>
              <div className="h-4 w-px bg-[var(--border)] mx-0.5" />
              {[...seasonFilters].reverse().map(yr => (
                <button key={yr} onClick={() => emitSeason(yr)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeSeason === yr
                      ? 'text-[var(--txt)] border border-[var(--border)] bg-[var(--surface)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--txt)]',
                  )}>
                  {formatSeason(yr)}
                </button>
              ))}
            </>
          )}
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {config.chartType === 'scatter' ? (
            /* Scatter table: name | income | cost | ratio */
            <div className="divide-y divide-[var(--border)]">
              <div className="sticky top-0 grid grid-cols-[1fr_110px_110px_80px] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] z-10">
                <span>County</span>
                <span className="text-right">Ann. Income</span>
                <span className="text-right">Ann. Care Cost</span>
                <span className="text-right">% of Income</span>
              </div>
              {[...scaledScatter].sort((a, b) => (b.y / b.x) - (a.y / a.x)).map(row => (
                <div key={row.name}
                  className="group/row grid grid-cols-[1fr_110px_110px_80px] gap-3 px-5 py-3.5 items-center hover:bg-[var(--inp-bg)] transition-colors cursor-default">
                  <span className="text-sm font-medium text-[var(--txt)] group-hover/row:text-sky-500 transition-colors truncate">{row.name}</span>
                  <span className="text-right text-sm text-[var(--muted)] group-hover/row:text-sky-500 tabular-nums transition-colors">${Math.round(row.x).toLocaleString()}</span>
                  <span className="text-right text-sm text-[var(--muted)] group-hover/row:text-sky-500 tabular-nums transition-colors">${Math.round(row.y).toLocaleString()}</span>
                  <span className="text-right text-sm text-[var(--muted)] group-hover/row:text-sky-500 tabular-nums transition-colors">{((row.y / row.x) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : config.series ? (
            /* Multi-series table: name | series[0] | series[1] */
            <div className="divide-y divide-[var(--border)]">
              <div className="sticky top-0 grid gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] z-10"
                style={{ gridTemplateColumns: `1fr repeat(${config.series.length}, 110px)` }}>
                <span>Year</span>
                {config.series.map(s => <span key={s.key} className="text-right">{s.label}</span>)}
              </div>
              {scaledMulti.map((row, i) => (
                <div key={i}
                  className="group/row grid gap-3 px-5 py-3.5 items-center hover:bg-[var(--inp-bg)] transition-colors"
                  style={{ gridTemplateColumns: `1fr repeat(${config.series!.length}, 110px)` }}>
                  <span className="text-sm font-medium text-[var(--txt)] group-hover/row:text-sky-500 transition-colors">{row.name}</span>
                  {config.series!.map(s => (
                    <span key={s.key} className="text-right text-sm text-[var(--muted)] group-hover/row:text-sky-500 tabular-nums transition-colors">
                      {fmtVal(Number(row[s.key] ?? 0), config, config.periodToggle ? period : undefined)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            /* Standard table: [rank] | [expand] | name | [winPct] | value | share */
            (() => {
              const hasWinPct = sorted.some(r => r.winPct !== undefined)
              const colParts: string[] = []
              if (hasSubRows) colParts.push('20px')
              if (showRank) colParts.push('32px')
              colParts.push('1fr')
              if (hasWinPct) colParts.push('80px')
              colParts.push('100px')
              colParts.push('80px')
              const colTemplate = colParts.join(' ')
              return (
              <div className="divide-y divide-[var(--border)]">
                <div
                  className="sticky top-0 grid gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] z-10"
                  style={{ gridTemplateColumns: colTemplate }}
                >
                  {hasSubRows && <span />}
                  {showRank && <span>#</span>}
                  <span>Name</span>
                  {hasWinPct && <span className="text-right">3yr Win %</span>}
                  <span className="text-right">{valueLabel ?? 'Value'}</span>
                  <span className="text-right">Share</span>
                </div>
                {sorted.map((row, idx) => {
                  const pct = total > 0 ? (row.value / total) * 100 : 0
                  const isOpen = expanded.has(row.name)
                  const rowSubRows = subRows?.[row.name]
                  const hasRowSubRows = !!rowSubRows && rowSubRows.length > 0
                  const delta = rankChanges[row.name]
                  return (
                    <React.Fragment key={`${row.name}-${idx}`}>
                      <div
                        className={cn(
                          'group/row grid gap-3 px-5 py-3.5 items-center hover:bg-[var(--inp-bg)] transition-colors',
                          hasRowSubRows ? 'cursor-pointer' : rowLinks?.[row.name] ? 'cursor-pointer' : 'cursor-default',
                        )}
                        style={{ gridTemplateColumns: colTemplate }}
                        onClick={hasRowSubRows ? () => toggleRow(row.name) : undefined}
                      >
                        {hasSubRows && (
                          <span className="flex items-center justify-center">
                            {hasRowSubRows && (
                              <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform duration-150', isOpen && 'rotate-90')} />
                            )}
                          </span>
                        )}
                        {showRank && (
                          <span className="text-xs text-[var(--muted)] tabular-nums">{idx + 1}</span>
                        )}
                        {rowLinks?.[row.name] ? (
                          <span className="flex items-center gap-2 min-w-0">
                            {row.logoUrl && <img src={row.logoUrl} alt="" width={22} height={22} className="rounded-full object-cover shrink-0" />}
                            <span className="flex flex-col min-w-0">
                              <Link href={rowLinks[row.name]} className="text-sm font-medium truncate transition-colors text-[var(--txt)] group-hover/row:text-sky-500 hover:underline">{row.name}</Link>
                              {row.subtitle && <span className="text-[11px] text-[var(--muted)] truncate">{row.subtitle}</span>}
                            </span>
                            {delta > 0 && <span className="text-[11px] font-semibold text-emerald-500 shrink-0">↑{delta}</span>}
                            {delta < 0 && <span className="text-[11px] font-semibold text-red-500 shrink-0">↓{Math.abs(delta)}</span>}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 min-w-0">
                            {row.logoUrl && <img src={row.logoUrl} alt="" width={22} height={22} className="rounded-full object-cover shrink-0" />}
                            <span className="flex flex-col min-w-0">
                              <span className={cn('text-sm font-medium truncate transition-colors', isOpen ? 'text-sky-500' : 'text-[var(--txt)] group-hover/row:text-sky-500')}>{row.name}</span>
                              {row.subtitle && <span className="text-[11px] text-[var(--muted)] truncate">{row.subtitle}</span>}
                            </span>
                            {delta > 0 && <span className="text-[11px] font-semibold text-emerald-500 shrink-0">↑{delta}</span>}
                            {delta < 0 && <span className="text-[11px] font-semibold text-red-500 shrink-0">↓{Math.abs(delta)}</span>}
                          </span>
                        )}
                        {hasWinPct && (
                          <span className="text-right text-sm tabular-nums text-[var(--muted)] group-hover/row:text-sky-500 transition-colors">
                            {row.winPct !== undefined ? `${row.winPct.toFixed(1)}%` : '—'}
                          </span>
                        )}
                        <span className={cn('text-right text-sm tabular-nums transition-colors', isOpen ? 'tabular-nums' : 'text-[var(--muted)] group-hover/row:text-sky-500')}
                          style={isOpen ? { color: config.color } : undefined}>
                          {fmtVal(row.value, config, config.periodToggle ? period : undefined)}
                        </span>
                        <div className="flex items-center gap-1.5 justify-end">
                          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: config.color }} />
                          </div>
                          <span className="text-xs text-[var(--muted)] group-hover/row:text-sky-500 tabular-nums w-7 text-right transition-colors">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      {isOpen && rowSubRows?.map(sr => (
                        <div key={sr.label}
                          className="grid gap-3 px-5 py-2 items-center border-b border-[var(--border)] bg-[var(--inp-bg)]"
                          style={{ gridTemplateColumns: colTemplate }}>
                          <span />
                          {showRank && <span />}
                          <span className="text-xs text-[var(--muted)] pl-3">{sr.label}</span>
                          {hasWinPct && <span />}
                          <span className="text-right text-xs tabular-nums text-[var(--txt)]">{sr.extra ?? sr.value.toLocaleString()}</span>
                          <span />
                        </div>
                      ))}
                    </React.Fragment>
                  )
                })}
                <div
                  className="grid gap-3 px-5 py-4 bg-[var(--surface)] font-semibold text-[var(--txt)]"
                  style={{ gridTemplateColumns: colTemplate }}
                >
                  {hasSubRows && <span />}
                  {showRank && <span />}
                  <span>Total</span>
                  {hasWinPct && <span />}
                  <span className="text-right tabular-nums">{fmtVal(total, config, config.periodToggle ? period : undefined)}</span>
                  <span className="text-right text-[var(--muted)]">100%</span>
                </div>
              </div>
              )
            })()
          )}
        </div>
      </div>
  )
  return panelMode ? inner : <AppLayout>{inner}</AppLayout>
}
