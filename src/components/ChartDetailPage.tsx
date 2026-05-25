'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, ScatterChart, Scatter, XAxis, YAxis,
  Tooltip as RechartsTip, CartesianGrid, Cell,
} from 'recharts'
import { ChevronRight, ChartSpline, AlignLeft, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { InfoTable } from '@/components/InfoTable'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  EditorialButtonGroup,
  SectionHead,
  StickyControlBar,
  ContentsNav,
  PlayerRankedList,
  SearchInput,
  useSearchHotkey,
  PAPER_BRIDGE,
  MONO,
  TABLET_RADIUS,
} from '@/components/editorial'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { cn, formatSeason } from '@/lib/utils'
import {
  type ChartConfig, type Period,
  applyPeriod, fmtPeriodLabel,
} from '@/lib/chart-configs'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }

/** Section XI division lookup — keyed by school slug */
const SCHOOL_DIVISIONS: Record<string, string> = {
  'bay-shore': 'I', 'brentwood': 'I', 'central-islip': 'I', 'commack': 'I',
  'connetquot': 'I', 'floyd': 'I', 'lindenhurst': 'I', 'longwood': 'I',
  'patchogue-medford': 'I', 'riverhead': 'I', 'sachem-east': 'I', 'sachem-north': 'I',
  'ward-melville': 'I', 'whitman': 'I',
  'bellport': 'II', 'centereach': 'II', 'copiague': 'II', 'deer-park': 'II',
  'east-islip': 'II', 'half-hollow-hills-east': 'II', 'huntington': 'II', 'newfield': 'II',
  'north-babylon': 'II', 'northport': 'II', 'smithtown-east': 'II', 'smithtown-west': 'II',
  'west-babylon': 'II', 'west-islip': 'II',
  'amityville': 'III', 'comsewogue': 'III', 'east-hampton-bridgehampton-pierson': 'III',
  'eastport-south-manor': 'III', 'half-hollow-hills-west': 'III', 'harborfields': 'III',
  'hauppauge': 'III', 'islip': 'III', 'kings-park': 'III', 'rocky-point': 'III',
  'sayville': 'III', 'westhampton': 'III',
  'babylon': 'IV', 'bayport-blue-point': 'IV', 'center-moriches': 'IV', 'glenn': 'IV',
  'greenport-southold-mattituck': 'IV', 'hampton-bays': 'IV', 'miller-place': 'IV',
  'mt-sinai': 'IV', 'port-jefferson': 'IV', 'shoreham-wading-river': 'IV',
  'southampton': 'IV', 'wyandanch': 'IV',
}
const DIVISION_ROMAN = ['I', 'II', 'III', 'IV']

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
export type StdRow = { name: string; value: number; logoUrl?: string; logoUrl2?: string; winPct?: number; subtitle?: string; record?: string }
export type MultiRow = Record<string, string | number>
export type ScatterRow = { name: string; x: number; y: number }
export type SubRow = { label: string; value: number; extra?: string }
export type SubRowMap = Record<string, SubRow[]>

interface Props {
  config: ChartConfig
  prevHref: string
  nextHref: string
  kpiValue: number
  tableRows?: StdRow[]
  chartPoints?: StdRow[]
  multiPoints?: MultiRow[]
  scatterPoints?: ScatterRow[]
  subRows?: SubRowMap
  children?: React.ReactNode
  seasonFilters?: string[]
  rowLinks?: Record<string, string>
  rowPlayerSlugs?: Record<string, string>
  seasonRows?: Record<string, StdRow[]>
  nameLabel?: string
  valueLabel?: string
  showRank?: boolean
}

const PREVIEW_ROWS = 3

/* ── Component ───────────────────────────────────────────────────── */
export function ChartDetailPage({
  config, prevHref, nextHref, kpiValue,
  tableRows = [], chartPoints = [], multiPoints = [], scatterPoints = [],
  subRows,
  children,
  seasonFilters,
  rowLinks,
  rowPlayerSlugs,
  seasonRows,
  nameLabel,
  valueLabel,
  showRank,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [period, setPeriod]       = useState<Period>('weekly')
  const [filter, setFilter]       = useState(config.filters?.[0]?.key ?? '')
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())
  const [activeSeason, setActiveSeason] = useState(seasonFilters?.[seasonFilters.length - 1] ?? '')
  const [tableExpanded, setTableExpanded] = useState(false)
  const [divisionFilter, setDivisionFilter] = useState<string | null>(null)
  const [chartsOpen, setChartsOpen] = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [query,      setQuery]      = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  const isPanel = pathname.startsWith('/charts/')

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

  const scaledScatter: ScatterRow[] = useMemo(() => scatterPoints, [scatterPoints])

  const total  = scaledTable.reduce((s, r) => s + r.value, 0) || scaledKpi
  const sorted = [...scaledTable].sort((a, b) => config.ascending ? a.value - b.value : b.value - a.value)

  const q = query.trim().toLowerCase()
  const searchedRows = q ? sorted.filter(r => r.name.toLowerCase().includes(q)) : sorted

  // Division filter — team charts only
  const rowsWithDivision = config.entity === 'team'
    ? searchedRows.map(row => {
        const slug = deriveSchoolSlug(row, rowLinks)
        const div  = slug ? SCHOOL_DIVISIONS[slug] : undefined
        return { row, slug, div }
      })
    : []

  const divisionFilteredRows = config.entity === 'team' && divisionFilter
    ? rowsWithDivision.filter(({ div }) => div === divisionFilter).map(({ row }) => row)
    : searchedRows

  // Derive school slug from team link (/team/floyd-varsity-football → floyd)
  // or from logo URL (.../logos/floyd.png → floyd)
  function deriveSchoolSlug(row: StdRow, links?: Record<string, string>): string | undefined {
    const link = links?.[row.name]
    if (link?.startsWith('/team/')) return link.replace('/team/', '').replace(/-varsity-football$/, '') || undefined
    if (row.logoUrl) { const m = row.logoUrl.match(/\/logos\/([^./]+)/); if (m) return m[1] }
    return undefined
  }

  useEffect(() => {
    if (!rowPlayerSlugs) return
    const chartSlug = pathname.split('/').filter(Boolean)[1]
    if (!chartSlug) return
    const slugs = sorted.map(r => rowPlayerSlugs[r.name]).filter(Boolean)
    sessionStorage.setItem(`chart-players-${chartSlug}`, JSON.stringify(slugs))
  }, [sorted, rowPlayerSlugs, pathname])

  useEffect(() => {
    if (!rowLinks) return
    const chartSlug = pathname.split('/').filter(Boolean)[1]
    if (!chartSlug) return
    const slugs = sorted.map(r => rowLinks[r.name]).filter(Boolean).map(l => l.replace('/team/', ''))
    sessionStorage.setItem(`chart-teams-${chartSlug}`, JSON.stringify(slugs))
  }, [sorted, rowLinks, pathname])

  const hasSubRows = !!subRows && Object.keys(subRows).length > 0

  const tipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '12px',
  }

  /* ── Shared table body (panel + detail share the same JSX) ───────── */
  const tableBody = (() => {
    const isDetail      = true
    const showHeader    = false  // SectionHead handles labelling
    const displayScatter = [...scaledScatter].sort((a, b) => (b.y / b.x) - (a.y / a.x))
    // In detail mode, always show all rows (no expand/collapse)
    const visibleScatter = (!isDetail && !tableExpanded) ? displayScatter.slice(0, PREVIEW_ROWS) : displayScatter
    const visibleMulti   = (!isDetail && !tableExpanded) ? scaledMulti.slice(0, PREVIEW_ROWS)   : scaledMulti
    const visibleRows    = !tableExpanded ? searchedRows.slice(0, PREVIEW_ROWS) : searchedRows

    if (config.chartType === 'scatter') {
      return (
        <div className="divide-y divide-[var(--border)]">
          {showHeader && (
            <div className="sticky top-0 grid grid-cols-[1fr_110px_110px_80px] gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] z-10">
              <span>County</span>
              <span className="text-right">Ann. Income</span>
              <span className="text-right">Ann. Care Cost</span>
              <span className="text-right">% of Income</span>
            </div>
          )}
          {visibleScatter.map(row => (
            <div key={row.name}
              className="group/row grid grid-cols-[1fr_110px_110px_80px] gap-3 px-5 py-3.5 items-center hover:bg-[var(--inp-bg)] transition-colors cursor-default">
              <span className="text-sm text-[var(--txt)] group-hover/row:text-[var(--paper-strong)] transition-colors truncate" style={SERIF}>{row.name}</span>
              <span className="text-right text-sm text-[var(--muted)] group-hover/row:text-[var(--paper-strong)] tabular-nums transition-colors" style={MONO}>${Math.round(row.x).toLocaleString()}</span>
              <span className="text-right text-sm text-[var(--muted)] group-hover/row:text-[var(--paper-strong)] tabular-nums transition-colors" style={MONO}>${Math.round(row.y).toLocaleString()}</span>
              <span className="text-right text-sm text-[var(--muted)] group-hover/row:text-[var(--paper-strong)] tabular-nums transition-colors" style={MONO}>{((row.y / row.x) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )
    }

    if (config.series) {
      return (
        <div className="divide-y divide-[var(--border)]">
          {showHeader && (
            <div className="sticky top-0 grid gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] z-10"
              style={{ gridTemplateColumns: `1fr repeat(${config.series.length}, 110px)` }}>
              <span>Year</span>
              {config.series.map(s => <span key={s.key} className="text-right">{s.label}</span>)}
            </div>
          )}
          {visibleMulti.map((row, i) => (
            <div key={i}
              className="group/row grid gap-3 px-5 py-3.5 items-center hover:bg-[var(--inp-bg)] transition-colors"
              style={{ gridTemplateColumns: `1fr repeat(${config.series!.length}, 110px)` }}>
              <span className="text-sm text-[var(--txt)] group-hover/row:text-[var(--paper-strong)] transition-colors" style={SERIF}>{row.name}</span>
              {config.series!.map(s => (
                <span key={s.key} className="text-right text-sm text-[var(--muted)] group-hover/row:text-[var(--paper-strong)] tabular-nums transition-colors" style={MONO}>
                  {fmtVal(Number(row[s.key] ?? 0), config, config.periodToggle ? period : undefined)}
                </span>
              ))}
            </div>
          ))}
        </div>
      )
    }

    // Standard table
    const hasWinPct  = sorted.some(r => r.winPct !== undefined)
    const colParts: string[] = []
    if (hasSubRows) colParts.push('20px')
    if (showRank)   colParts.push('32px')
    colParts.push('1fr')
    if (hasWinPct)  colParts.push('80px')
    colParts.push('100px')
    const colTemplate = colParts.join(' ')

    return (
      <div className="divide-y divide-[var(--border)]">
        {showHeader && (
          <div className="sticky top-0 grid gap-3 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)] border-b border-[var(--border)] z-10"
            style={{ gridTemplateColumns: colTemplate }}>
            {hasSubRows && <span />}
            {showRank && <span>#</span>}
            <span>{nameLabel ?? config.nameLabel ?? 'Name'}</span>
            {hasWinPct && <span className="text-right">3yr Win %</span>}
            <span className="text-right">{valueLabel ?? config.valueLabel ?? 'Value'}</span>
          </div>
        )}
        {visibleRows.map((row, idx) => {
          const isOpen       = expanded.has(row.name)
          const rowSubRows   = subRows?.[row.name]
          const hasRowSubRows = !!rowSubRows && rowSubRows.length > 0
          const delta        = rankChanges[row.name]
          const handleClick  = hasRowSubRows
            ? () => toggleRow(row.name)
            : pathname.startsWith('/charts/')
              ? (() => {
                  const chartSlug = pathname.split('/').filter(Boolean)[1]
                  if (!chartSlug) return undefined
                  if (rowPlayerSlugs?.[row.name]) return () => router.push(`/charts/${chartSlug}/${rowPlayerSlugs[row.name]}`, { scroll: false })
                  const teamLink = rowLinks?.[row.name]
                  if (teamLink?.startsWith('/team/')) return () => router.push(`/charts/${chartSlug}/team/${teamLink.replace('/team/', '')}`, { scroll: false })
                  return undefined
                })()
              : undefined

          return (
            <React.Fragment key={`${row.name}-${idx}`}>
              <div
                className={cn(
                  'group/row grid gap-3 px-5 py-3.5 items-center hover:bg-[var(--inp-bg)] transition-colors',
                  (hasRowSubRows || (pathname.startsWith('/charts/') && (rowPlayerSlugs?.[row.name] || rowLinks?.[row.name]))) ? 'cursor-pointer' : 'cursor-default',
                )}
                style={{ gridTemplateColumns: colTemplate }}
                onClick={handleClick ?? undefined}
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
                    {row.logoUrl2 ? (
                      <span className="flex -space-x-2 shrink-0">
                        {row.logoUrl  && <img src={row.logoUrl}  alt="" width={22} height={22} className="rounded-full object-cover ring-2 ring-[var(--surface)] bg-[var(--surface)]" />}
                        <img src={row.logoUrl2} alt="" width={22} height={22} className="rounded-full object-cover ring-2 ring-[var(--surface)] bg-[var(--surface)]" />
                      </span>
                    ) : (
                      row.logoUrl && <img src={row.logoUrl} alt="" width={22} height={22} className="rounded-full object-cover shrink-0" />
                    )}
                    <span className="flex flex-col min-w-0">
                      <Link href={rowLinks[row.name]} onClick={e => e.stopPropagation()} className="text-sm truncate transition-colors text-[var(--txt)] group-hover/row:text-[var(--paper-strong)] hover:underline" style={SERIF}>{row.name}</Link>
                      {row.subtitle && <span className="text-[11px] text-[var(--muted)] truncate">{row.subtitle}</span>}
                    </span>
                    {delta > 0 && <span className="text-[11px] font-semibold text-emerald-500 shrink-0">↑{delta}</span>}
                    {delta < 0 && <span className="text-[11px] font-semibold text-red-500 shrink-0">↓{Math.abs(delta)}</span>}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 min-w-0">
                    {row.logoUrl2 ? (
                      <span className="flex -space-x-2 shrink-0">
                        {row.logoUrl  && <img src={row.logoUrl}  alt="" width={22} height={22} className="rounded-full object-cover ring-2 ring-[var(--surface)] bg-[var(--surface)]" />}
                        <img src={row.logoUrl2} alt="" width={22} height={22} className="rounded-full object-cover ring-2 ring-[var(--surface)] bg-[var(--surface)]" />
                      </span>
                    ) : (
                      row.logoUrl && <img src={row.logoUrl} alt="" width={22} height={22} className="rounded-full object-cover shrink-0" />
                    )}
                    <span className="flex flex-col min-w-0">
                      <span className={cn('text-sm truncate transition-colors', isOpen ? 'text-[var(--paper-strong)]' : 'text-[var(--txt)] group-hover/row:text-[var(--paper-strong)]')} style={SERIF}>{row.name}</span>
                      {row.subtitle && <span className="text-[11px] text-[var(--muted)] truncate">{row.subtitle}</span>}
                    </span>
                    {delta > 0 && <span className="text-[11px] font-semibold text-emerald-500 shrink-0">↑{delta}</span>}
                    {delta < 0 && <span className="text-[11px] font-semibold text-red-500 shrink-0">↓{Math.abs(delta)}</span>}
                  </span>
                )}
                {hasWinPct && (
                  <span className="text-right text-sm tabular-nums text-[var(--muted)] group-hover/row:text-[var(--paper-strong)] transition-colors">
                    {row.winPct !== undefined ? `${row.winPct.toFixed(1)}%` : '—'}
                  </span>
                )}
                <span className={cn('text-right text-sm tabular-nums transition-colors', isOpen ? 'tabular-nums' : 'text-[var(--muted)] group-hover/row:text-[var(--paper-strong)]')}
                  style={isOpen ? { ...MONO, color: config.color } : MONO}>
                  {fmtVal(row.value, config, config.periodToggle ? period : undefined)}
                </span>
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
        {tableExpanded && (
          <div className="grid gap-3 px-5 py-4 bg-[var(--surface)] font-semibold text-[var(--txt)]"
            style={{ gridTemplateColumns: colTemplate }}>
            {hasSubRows && <span />}
            {showRank && <span />}
            <span>Total</span>
            {hasWinPct && <span />}
            <span className="text-right tabular-nums">{fmtVal(total, config, config.periodToggle ? period : undefined)}</span>
            <span className="text-right text-[var(--muted)]">100%</span>
          </div>
        )}
      </div>
    )
  })()

  /* ── Shared filter tabs + period toggle ────────────────────────── */
  const filterBar = (config.filters?.length || config.periodToggle) ? (
    <div className="flex items-center gap-1.5 flex-wrap">
      {config.filters?.map(f => (
        <button key={f.key} onClick={() => setFilter(f.key)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            filter === f.key
              ? 'text-[var(--txt)] border border-[var(--border)] bg-[var(--surface)] shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--txt)]',
          )}>{f.label}</button>
      ))}
      {config.periodToggle && config.filters && <div className="h-4 w-px bg-[var(--border)] mx-0.5" />}
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
  ) : null

  /* ── Shared season toggle ──────────────────────────────────────── */
  const seasonToggle = seasonFilters && seasonFilters.length > 0 ? (() => {
    const cycle = [...seasonFilters].reverse()
    const idx   = cycle.indexOf(activeSeason)
    const next  = cycle[(idx + 1) % cycle.length]
    return (
      <button onClick={() => emitSeason(next)}
        className="w-[88px] px-3 py-1.5 rounded-lg text-sm font-semibold border border-[var(--border)] bg-[var(--inp-bg)] text-[var(--txt)] hover:bg-[var(--row-hover)] transition-colors text-center">
        {activeSeason === 'all' ? 'All' : formatSeason(activeSeason)}
      </button>
    )
  })() : null

  /* ── Detail-page season tabs (replaces title + toggle on detail) ── */
  const seasonTabs = seasonFilters && seasonFilters.length > 0 ? (() => {
    const ordered = [...seasonFilters].filter(s => s !== 'all').sort().reverse()
    const tabs = seasonFilters.includes('all') ? ['all', ...ordered] : ordered
    return (
      <div className="flex items-center gap-0 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => emitSeason(t)}
            className={cn(
              'px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeSeason === t
                ? 'border-[#033882] text-[var(--txt)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]',
            )}>
            {t === 'all' ? 'All' : formatSeason(t)}
          </button>
        ))}
      </div>
    )
  })() : null

  /* ── Season cycle (mirrors Division Shell) ──────── */
  const seasonCycleOptions: string[] = seasonFilters
    ? [
        ...(seasonFilters.includes('all') ? ['all'] : []),
        ...[...seasonFilters].filter(s => s !== 'all').sort((a, b) => Number(b) - Number(a)),
      ]
    : []
  const cycleIdx         = seasonCycleOptions.indexOf(activeSeason)
  const hasSeasonControl = seasonCycleOptions.length > 1
  const seasonLabel      = !activeSeason || activeSeason === 'all' ? 'All-Time' : formatSeason(activeSeason)
  const totalCount  = config.chartType === 'scatter'
    ? scaledScatter.length
    : config.series
      ? scaledMulti.length
      : sorted.length
  const entryCount  = config.chartType === 'scatter'
    ? scaledScatter.length
    : config.series
      ? scaledMulti.length
      : divisionFilteredRows.length
  const entityNoun = config.entity === 'player' ? 'player' : 'team'

  // ContentsNav — division filter for team charts; single section for player charts
  const chartSections = config.entity === 'team'
    ? DIVISION_ROMAN.map(d => ({
        id: d,
        label: `Division ${d}`,
        count: rowsWithDivision.filter(({ div }) => div === d).length,
      }))
    : [{ id: 'rankings', label: config.valueLabel ?? 'Rankings', count: entryCount }]

  function handleDivisionSelect(id: string) {
    setDivisionFilter(prev => prev === id ? null : id)
  }

  function shiftSeasonCycle(delta: 1 | -1) {
    const len  = seasonCycleOptions.length
    const next = (cycleIdx + delta + len) % len
    emitSeason(seasonCycleOptions[next])
  }

  /* ── DETAIL PAGE layout (editorial) ─────────────────────────── */
  return (
    <>
      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}
      >

          {/* ── Masthead ────────────────────────────────────────── */}
          {!isPanel && (
            <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
              <EditorialHead
                size="xl"
                eyebrow="Section XI · Charts"
                subhead={config.description}
                meta={[
                  `${entryCount} ${entryCount === 1 ? entityNoun : `${entityNoun}s`}`,
                  ...(seasonFilters ? [`${seasonFilters.filter(s => s !== 'all').length} seasons of record`] : []),
                  seasonLabel,
                ]}
                rightSlot={
                  <EditorialButtonGroup
                    prevHref={prevHref}
                    nextHref={nextHref}
                    buttons={[
                      { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen, onClick: () => setChartsOpen(v => !v) },
                      { icon: AlignLeft,     tooltip: 'Players',       active: playersOpen, onClick: () => setPlayersOpen(v => !v) },
                      { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,   onClick: () => setChatOpen(v => !v) },
                    ]}
                  />
                }
              >
                {config.title}
              </EditorialHead>
            </div>
          )}

          {/* ── Chart — matted hero frame ────────────────────────── */}
          <div className={isPanel ? 'px-5 mt-8 mb-8' : 'mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-12'}>
            <RevealFx delay={0.1} translateY={8}>
              <div
                className="border border-[var(--paper-rule)] bg-[var(--paper-quiet)]"
                style={{ borderRadius: TABLET_RADIUS, padding: 8 }}
              >
                {children}
              </div>
            </RevealFx>
            {filterBar && <div className="mt-4 px-1">{filterBar}</div>}
          </div>

          {/* ── Sticky control bar ──────────────────────────────── */}
          <StickyControlBar>
            {hasSeasonControl && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">Season</span>
                <button onClick={() => shiftSeasonCycle(-1)} aria-label="Previous season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}>
                  {seasonLabel}
                </span>
                <button onClick={() => shiftSeasonCycle(1)} aria-label="Next season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <SearchInput
              value={query}
              onChange={setQuery}
              inputRef={searchRef}
              placeholder={`Search ${entityNoun}s…`}
            />

            <div className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums hidden md:block">
              {totalCount > 0
                ? q
                  ? `${entryCount} / ${totalCount} ranked`
                  : `${totalCount} ranked entries`
                : ''}
            </div>
          </StickyControlBar>

          {/* ── Body: sidebar + rankings ─────────────────────────── */}
          <div className={isPanel
            ? 'px-5 pt-8 pb-24'
            : 'mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20'
          }>

            {!isPanel && (
              <ContentsNav
                items={chartSections}
                activeId={config.entity === 'team' ? (divisionFilter ?? undefined) : 'rankings'}
                onSelect={config.entity === 'team' ? handleDivisionSelect : undefined}
              />
            )}

            <main className="min-w-0">
              <RevealFx delay={0.3} translateY={8}>
                <section id="rankings">
                  {!isPanel && (
                    <SectionHead
                      title={
                        divisionFilter
                          ? `Division ${divisionFilter}`
                          : config.valueLabel ?? 'Rankings'
                      }
                      blurb={config.description}
                    />
                  )}

                  {/* Standard bar/area charts → editorial PlayerRankedList */}
                  {config.chartType !== 'scatter' && !config.series ? (
                    <PlayerRankedList
                      query={q}
                      rows={divisionFilteredRows.map((row, idx) => {
                        const schoolSlug = deriveSchoolSlug(row, rowLinks)
                        const playerSlug = rowPlayerSlugs?.[row.name]
                        return {
                          slug:      playerSlug ?? schoolSlug ?? row.name,
                          name:      row.name.replace(/\s+Varsity\s+Football$/i, ''),
                          schoolSlug,
                          // Pass the blob URL directly — avoids regex-based slug extraction from blob URLs
                          logoUrl:   row.logoUrl || undefined,
                          school:    row.subtitle,
                          rank:      idx + 1,
                          primary:   fmtVal(row.value, config, config.periodToggle ? period : undefined),
                          secondary: row.winPct !== undefined
                            ? `${row.winPct.toFixed(1)}% WIN`
                            : undefined,
                          href:      rowLinks?.[row.name]
                            ?? (playerSlug ? `/player/${playerSlug}` : undefined),
                        }
                      })}
                      emptyLabel={q ? `No results for "${query}".` : 'No data recorded.'}
                    />
                  ) : (
                    /* Scatter / series → generic table */
                    <div className="border border-[var(--paper-rule)]" style={{ borderRadius: TABLET_RADIUS }}>
                      {tableBody}
                    </div>
                  )}
                </section>
              </RevealFx>
            </main>

          </div>

      </div>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={playersOpen} onClose={() => setPlayersOpen(false)} />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={config.title} />
    </>
  )
}
