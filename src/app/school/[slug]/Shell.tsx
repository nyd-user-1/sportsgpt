'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, ChartSpline, FileUser, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { cn } from '@/lib/utils'
import {
  EditorialHead,
  EditorialButtonGroup,
  SectionHead,
  SubSectionHead,
  StickyControlBar,
  ContentsNav,
  SiteContentsTop,
  SearchInput,
  useSearchHotkey,
  SearchButtonGroup,
  Tablet,
  EmptyTablet,
  MONO,
  tabletTd,
  SortTh,
  PAPER_BRIDGE,
} from '@/components/editorial'
import type {
  SchoolDetail, SchoolYearStat, RegentsRow, TeamSeasonRow, DivisionPeer,
} from './page'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }

const NRC_SHORT: Record<string, string> = {
  '3': 'High Need', '5': 'Average', '6': 'Low Need',
}

function fmtSeason(y: number) { return `${y}-${String(y + 1).slice(2)}` }
function fmtNysedYear(y: number) { return `${y - 1}-${String(y).slice(-2)}` }
function pctOf(n: number | null, d: number | null) {
  if (n == null || d == null || d === 0) return null
  return (n / d) * 100
}
function fmtRecord(w: number | null, l: number | null, t?: number | null) {
  if (w == null && l == null) return '--'
  const ties = t ?? 0
  return ties > 0 ? `${w ?? 0}-${l ?? 0}-${ties}` : `${w ?? 0}-${l ?? 0}`
}
function fmtPctWin(w: number | null, l: number | null) {
  const ww = w ?? 0, ll = l ?? 0, g = ww + ll
  return g === 0 ? '--' : (ww / g).toFixed(3).replace(/^0/, '')
}

// ── Report Card sub-table helpers ─────────────────────────────────────────────
const thBase = 'py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]'
const fmtPct = (v: number) => `${v}%`
const fmtUSD = (v: number) => `$${v.toLocaleString()}`

type RcCol = {
  label: string
  get: (yr: SchoolYearStat) => number | null
  fmt?: (v: number) => string
  strong?: boolean   // primary value (paper-text) vs secondary (paper-muted)
}

// Year-row sub-table: chronological rows, click selects the year (shared selector).
function RcYearTable({
  rows, cols, selectedYear, onSelectYear,
}: {
  rows: SchoolYearStat[]
  cols: RcCol[]
  selectedYear: number
  onSelectYear: (y: number) => void
}) {
  if (!rows.length) return <EmptyTablet label="No data on file." />
  return (
    <Tablet>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className={cn('px-5 text-left', thBase)}>Year</th>
              {cols.map((c, ci) => (
                <th key={c.label} className={cn(ci === cols.length - 1 ? 'px-5' : 'px-3', 'text-right', thBase)}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((yr, i) => {
              const isActive = yr.year === selectedYear
              return (
                <tr key={yr.year}
                  onClick={() => onSelectYear(yr.year)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    i > 0 && 'border-t border-[var(--paper-rule-soft)]',
                    isActive
                      ? 'bg-[color:color-mix(in_srgb,var(--paper-strong)_8%,transparent)]'
                      : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
                  )}>
                  <td className={cn(tabletTd, 'pl-5 whitespace-nowrap')} style={SERIF}>
                    <span className={cn(isActive ? 'text-[var(--paper-strong)] font-medium' : 'text-[var(--paper-text)]')}>
                      {fmtNysedYear(yr.year)}
                    </span>
                  </td>
                  {cols.map((c, ci) => {
                    const v = c.get(yr)
                    return (
                      <td key={c.label} className={cn(
                        tabletTd, 'text-right tabular-nums',
                        ci === cols.length - 1 ? 'px-5' : 'px-3',
                        c.strong ? 'text-[var(--paper-text)] font-medium' : 'text-[var(--paper-muted)]',
                      )} style={MONO}>
                        {v != null ? (c.fmt ? c.fmt(v) : String(v)) : '--'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Tablet>
  )
}

// Regents sub-table: subject rows for one selected year, with the level-1..5
// distribution and a proficiency rate. Reflects (does not set) the year.
function RegentsTable({ rows }: { rows: RegentsRow[] }) {
  if (!rows.length) return <EmptyTablet label="No Regents results for this school year." />
  const lvlTh = cn('px-2 text-right', thBase)
  return (
    <Tablet>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              <th className={cn('px-5 text-left', thBase)}>Subject</th>
              <th className={cn('px-3 text-right', thBase)}>Tested</th>
              <th className={lvlTh}>L1</th>
              <th className={lvlTh}>L2</th>
              <th className={lvlTh}>L3</th>
              <th className={lvlTh}>L4</th>
              <th className={lvlTh}>L5</th>
              <th className={cn('px-5 text-right', thBase)}>Prof %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const lvl = [r.pct_l1, r.pct_l2, r.pct_l3, r.pct_l4, r.pct_l5]
              return (
                <tr key={r.subject} className={cn(i > 0 && 'border-t border-[var(--paper-rule-soft)]')}>
                  <td className={cn(tabletTd, 'pl-5 text-[var(--paper-text)] whitespace-nowrap')} style={SERIF}>{r.subject}</td>
                  <td className={cn(tabletTd, 'px-3 text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{r.tested != null ? r.tested : '--'}</td>
                  {lvl.map((v, li) => (
                    <td key={li} className={cn(tabletTd, 'px-2 text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{v != null ? `${v}%` : '--'}</td>
                  ))}
                  <td className={cn(tabletTd, 'px-5 text-right text-[var(--paper-text)] font-medium tabular-nums')} style={MONO}>{r.pct_prof != null ? `${r.pct_prof}%` : '--'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Tablet>
  )
}

type SectionId = 'enrollment' | 'gradrate' | 'reportcard' | 'academic' | 'demographic' | 'need' | 'trend' | 'football' | 'division'

export function SchoolDetailShell({
  school, prevSlug, nextSlug, yearStats, regentsResults, teamSeasons, divPeers,
}: {
  school: SchoolDetail
  prevSlug: string
  nextSlug: string
  yearStats: SchoolYearStat[]
  regentsResults: RegentsRow[]
  teamSeasons: TeamSeasonRow[]
  divPeers: DivisionPeer[]
}) {
  const [chartsOpen, setChartsOpen] = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [query,      setQuery]      = useState('')
  const [activeSection, setActiveSection] = useState<string>('enrollment')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    enrollment: null, gradrate: null, reportcard: null, academic: null, demographic: null, need: null, trend: null, football: null, division: null,
  })

  // Year selector
  const availableYears = useMemo(
    () => yearStats.map(s => s.year).sort((a, b) => b - a),
    [yearStats],
  )
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? 2025)
  function shiftYear(delta: 1 | -1) {
    const idx = availableYears.indexOf(selectedYear)
    const next = (idx + delta + availableYears.length) % availableYears.length
    setSelectedYear(availableYears[next])
  }

  const ys = useMemo(
    () => yearStats.find(s => s.year === selectedYear) ?? null,
    [yearStats, selectedYear],
  )

  // Football totals
  const totalWins   = teamSeasons.reduce((s, r) => s + (r.overall_wins ?? 0), 0)
  const totalLosses = teamSeasons.reduce((s, r) => s + (r.overall_losses ?? 0), 0)
  const teamSlug    = teamSeasons[0]?.slug ?? null

  const divRef = useRef<HTMLDivElement>(null)
  const td = tabletTd

  // Build sections list dynamically
  const SECTIONS: { id: SectionId; label: string }[] = [
    { id: 'enrollment',  label: 'Enrollment' },
    { id: 'gradrate',    label: 'Grad Rate' },
    { id: 'reportcard',  label: 'Report Card' },
    { id: 'academic',    label: 'Academic' },
    { id: 'demographic', label: 'Demographic' },
    { id: 'need',        label: 'Need' },
    { id: 'trend',       label: 'Trend' },
    ...(teamSeasons.length > 0 ? [{ id: 'football' as SectionId, label: 'Football' }] : []),
    ...(divPeers.length > 0    ? [{ id: 'division' as SectionId, label: 'Division' }] : []),
  ]

  const sectionCounts: Record<SectionId, number> = {
    enrollment:   yearStats.length,
    gradrate:     yearStats.filter(y => y.grad_pct != null).length,
    reportcard:   yearStats.filter(y => y.exp_per_pupil != null || y.chronic_abs_rate != null).length,
    academic:     9,
    demographic:  5,
    need:         5,
    trend:        yearStats.length,
    football:     teamSeasons.length,
    division:     divPeers.length,
  }

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.4] },
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Years sorted descending (newest → oldest), no sortable columns —
  // the table is a chronological enrollment ledger with the latest year up top.
  const yearsAsc = useMemo(
    () => [...yearStats].sort((a, b) => b.year - a.year),
    [yearStats],
  )

  // Regents rows for the currently-selected year, in canonical subject order.
  const regentsForYear = useMemo(
    () => regentsResults
      .filter(r => r.year === selectedYear)
      .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)),
    [regentsResults, selectedYear],
  )

  // Derived stats for selected year
  const enrollment = ys?.g9_12 ?? school.enrollment
  const gradPct    = ys?.grad_pct ?? school.grad_pct
  const apPct      = ys?.ap_pct ?? school.ap_pct
  const k12        = ys?.k12 ?? null
  const whitePct   = pctOf(ys?.num_white ?? null, k12)
  const blackPct   = pctOf(ys?.num_black ?? null, k12)
  const hispPct    = pctOf(ys?.num_hisp ?? null, k12)
  const asianPct   = pctOf(ys?.num_asian ?? null, k12)
  const multiPct   = pctOf(ys?.num_multi ?? null, k12)
  const ecdisPct   = pctOf(ys?.num_ecdis ?? null, k12)
  const ellPct     = pctOf(ys?.num_ell ?? null, k12)
  const swdPct     = pctOf(ys?.num_swd ?? null, k12)
  const homelessPct= pctOf(ys?.num_homeless ?? null, k12)

  return (
    <>
      <AppLayout paperMode>
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

          {/* ── Masthead ─────────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
            <RevealFx delay={0} translateY={4}>
              <EditorialHead
                size="xl"
                eyebrow={
                  <span className="inline-flex items-center gap-2">
                    <Link href="/section/section-xi" className="hover:text-[var(--paper-text)] transition-colors">Section XI</Link>
                    <span className="opacity-40">·</span>
                    <Link href={`/division/division-${school.division.toLowerCase()}`} className="hover:text-[var(--paper-text)] transition-colors">Division {school.division}</Link>
                  </span>
                }
                subhead={school.short_description ?? (
                  `${school.name} — enrollment, academic profile, demographics, and football record for Division ${school.division}.`
                )}
                meta={[
                  <a key="years" href="#years" className="hover:text-[var(--paper-text)] transition-colors">{yearStats.length} Year{yearStats.length !== 1 ? 's' : ''}</a>,
                  <a key="dem" href="#demographics" className="hover:text-[var(--paper-text)] transition-colors">{school.address ?? `Division ${school.division}`}</a>,
                  ...(teamSeasons.length > 0
                    ? [<a key="fb" href="#football" className="hover:text-[var(--paper-text)] transition-colors">{teamSeasons.length} Season{teamSeasons.length !== 1 ? 's' : ''}</a>]
                    : []),
                ]}
                rightSlot={
                  <EditorialButtonGroup
                    prevHref={`/school/${prevSlug}`}
                    nextHref={`/school/${nextSlug}`}
                    buttons={[
                      { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen,  onClick: () => setChartsOpen(v => !v) },
                      ...(teamSlug ? [{ icon: FileUser, tooltip: 'Team Page', active: false, onClick: () => { window.location.href = `/team/${teamSlug}` } }] : []),
                      { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,    onClick: () => setChatOpen(v => !v) },
                    ]}
                  />
                }
              >
                {school.name}
              </EditorialHead>
            </RevealFx>
          </div>

          {/* ── Sticky control bar ───────────────────────────────────── */}
          <StickyControlBar>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>Year</span>
              {availableYears.length > 1 && (
                <button onClick={() => shiftYear(-1)} aria-label="Previous year"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <span className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
                style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}>
                {fmtNysedYear(selectedYear)}
              </span>
              {availableYears.length > 1 && (
                <button onClick={() => shiftYear(1)} aria-label="Next year"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
            <SearchInput value={query} onChange={setQuery} inputRef={searchRef} placeholder="Search..." />
            <SearchButtonGroup />
          </StickyControlBar>

          {/* ── Body: sidebar + main ──────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

            <ContentsNav
              items={SECTIONS.map(s => ({ id: s.id, label: s.label, count: sectionCounts[s.id] }))}
              activeId={activeSection}
              topChildren={<SiteContentsTop />}
            />

            <main className="min-w-0">

              {/* ── Enrollment (= Seasons-style menu) ───────────────── */}
              <section id="enrollment" ref={(el: HTMLElement | null) => { sectionRefs.current.enrollment = el }} className="mb-20 scroll-mt-24">
                <RevealFx delay={0.15} translateY={8}>
                  <SectionHead
                    title="Enrollment"
                    blurb="Click any row to jump to that year's academic snapshot."
                    meta={<span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>{yearStats.length} years</span>}
                  />
                  <Tablet>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Year</th>
                            {(['K','1','2','3','4','5','6','7','8','9','10','11','12','9-12','K-12'] as const).map(lbl => (
                              <th key={lbl} className="px-2 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">{lbl}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {yearsAsc.map((yr, i) => {
                            const isActive = yr.year === selectedYear
                            const kTotal  = (yr.k_half ?? 0) + (yr.k_full ?? 0)
                            const grades = [kTotal, yr.g1, yr.g2, yr.g3, yr.g4, yr.g5, yr.g6, yr.g7, yr.g8, yr.g9, yr.g10, yr.g11, yr.g12]
                            return (
                              <tr key={yr.year}
                                onClick={() => {
                                  setSelectedYear(yr.year)
                                  document.getElementById('academic')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }}
                                className={cn(
                                  'cursor-pointer transition-colors',
                                  i > 0 && 'border-t border-[var(--paper-rule-soft)]',
                                  isActive
                                    ? 'bg-[color:color-mix(in_srgb,var(--paper-strong)_8%,transparent)]'
                                    : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
                                )}>
                                <td className={cn(td, 'pl-5 whitespace-nowrap')} style={SERIF}>
                                  <span className={cn(isActive ? 'text-[var(--paper-strong)] font-medium' : 'text-[var(--paper-text)]')}>
                                    {fmtNysedYear(yr.year)}
                                  </span>
                                </td>
                                {grades.map((g, gi) => (
                                  <td key={gi} className={cn(td, 'px-2 text-right tabular-nums', g ? 'text-[var(--paper-muted)]' : 'text-[var(--paper-faint)]')} style={MONO}>
                                    {g ? g.toLocaleString() : '--'}
                                  </td>
                                ))}
                                <td className={cn(td, 'px-2 text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                                  {yr.g9_12 != null ? yr.g9_12.toLocaleString() : '--'}
                                </td>
                                <td className={cn(td, 'px-2 pr-5 text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                                  {yr.k12 != null ? yr.k12.toLocaleString() : '--'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Tablet>
                </RevealFx>
              </section>

              {/* ── Grad Rate ─────────────────────────────────────────── */}
              <section id="gradrate" ref={(el: HTMLElement | null) => { sectionRefs.current.gradrate = el }} className="mb-20 scroll-mt-24">
                <RevealFx delay={0.2} translateY={8}>
                  <SectionHead
                    title="Grad Rate"
                    blurb="Four-year diploma outcomes (August final) up top; 4-, 5-, and 6-year cohort completion rates from the state report card below."
                    meta={<span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>{yearStats.filter(y => y.grad_pct != null).length} years</span>}
                  />
                  <Tablet>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Year</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Cohort</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Grads</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Grad %</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Reg Adv %</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Reg %</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Local %</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Non-Dip %</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Still Enr %</th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Dropout %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearsAsc.filter(yr => yr.grad_pct != null).map((yr, i) => {
                            const isActive = yr.year === selectedYear
                            const cells: (number | null)[] = [yr.grad_pct, yr.reg_adv_pct, yr.reg_pct, yr.local_pct, yr.non_diploma_credential_pct, yr.still_enr_pct, yr.dropout_pct]
                            return (
                              <tr key={yr.year}
                                onClick={() => setSelectedYear(yr.year)}
                                className={cn(
                                  'cursor-pointer transition-colors',
                                  i > 0 && 'border-t border-[var(--paper-rule-soft)]',
                                  isActive
                                    ? 'bg-[color:color-mix(in_srgb,var(--paper-strong)_8%,transparent)]'
                                    : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
                                )}>
                                <td className={cn(td, 'pl-5 whitespace-nowrap')} style={SERIF}>
                                  <span className={cn(isActive ? 'text-[var(--paper-strong)] font-medium' : 'text-[var(--paper-text)]')}>
                                    {fmtNysedYear(yr.year)}
                                  </span>
                                </td>
                                <td className={cn(td, 'px-3 text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{yr.enroll_cnt != null ? yr.enroll_cnt : '--'}</td>
                                <td className={cn(td, 'px-3 text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{yr.grad_cnt != null ? yr.grad_cnt : '--'}</td>
                                {cells.map((v, ci) => (
                                  <td key={ci} className={cn(
                                    td, 'px-3 text-right tabular-nums',
                                    ci === 0 ? 'text-[var(--paper-text)] font-medium' : 'text-[var(--paper-muted)]',
                                    ci === cells.length - 1 ? 'pr-5' : '',
                                  )} style={MONO}>
                                    {v != null ? `${v}%` : '--'}
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Tablet>

                  <div className="mt-10">
                    <SubSectionHead>Cohort Completion · 4 / 5 / 6-Year</SubSectionHead>
                    <RcYearTable
                      selectedYear={selectedYear}
                      onSelectYear={setSelectedYear}
                      rows={yearsAsc.filter(yr => yr.grad_4yr_rate != null)}
                      cols={[
                        { label: '4-Yr %', strong: true, get: yr => yr.grad_4yr_rate, fmt: fmtPct },
                        { label: '5-Yr %', get: yr => yr.grad_5yr_rate, fmt: fmtPct },
                        { label: '6-Yr %', get: yr => yr.grad_6yr_rate, fmt: fmtPct },
                      ]}
                    />
                  </div>
                </RevealFx>
              </section>

              {/* ── Report Card ───────────────────────────────────────── */}
              <section id="reportcard" ref={(el: HTMLElement | null) => { sectionRefs.current.reportcard = el }} className="mb-20 scroll-mt-24">
                <RevealFx delay={0.26} translateY={8}>
                  <SectionHead
                    title="Report Card"
                    blurb="NYSED accountability metrics, broken out by category — subject performance, Regents results, attendance, and the dollars and staffing behind them."
                    meta={<span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>{yearStats.filter(y => y.exp_per_pupil != null || y.chronic_abs_rate != null).length} years</span>}
                  />

                  {/* Academic Performance — core index by subject + readiness */}
                  <div className="mb-10">
                    <SubSectionHead>Academic Performance</SubSectionHead>
                    <RcYearTable
                      selectedYear={selectedYear}
                      onSelectYear={setSelectedYear}
                      rows={yearsAsc.filter(yr => yr.perf_ela_idx != null || yr.cccr_index != null)}
                      cols={[
                        { label: 'ELA',        get: yr => yr.perf_ela_idx,  fmt: v => v.toFixed(0) },
                        { label: 'Math',       get: yr => yr.perf_math_idx, fmt: v => v.toFixed(0) },
                        { label: 'Sci',        get: yr => yr.perf_sci_idx,  fmt: v => v.toFixed(0) },
                        { label: 'Perf Avg',   strong: true, fmt: v => v.toFixed(0), get: yr => {
                            const v = [yr.perf_ela_idx, yr.perf_math_idx, yr.perf_sci_idx].filter((n): n is number => n != null)
                            return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
                          } },
                        { label: 'CCCR Index', get: yr => yr.cccr_index, fmt: v => v.toFixed(0) },
                        { label: 'CCCR Lvl',   get: yr => yr.cccr_level },
                      ]}
                    />
                  </div>

                  {/* Regents Exams — subject rows for the selected year */}
                  <div className="mb-10">
                    <SubSectionHead>Regents Exams · {fmtNysedYear(selectedYear)}</SubSectionHead>
                    <RegentsTable rows={regentsForYear} />
                  </div>

                  {/* Attendance & Absenteeism */}
                  <div className="mb-10">
                    <SubSectionHead>Attendance &amp; Absenteeism</SubSectionHead>
                    <RcYearTable
                      selectedYear={selectedYear}
                      onSelectYear={setSelectedYear}
                      rows={yearsAsc.filter(yr => yr.chronic_abs_rate != null || yr.attendance_level != null)}
                      cols={[
                        { label: 'Attendance Lvl', strong: true, get: yr => yr.attendance_level },
                        { label: 'Chronic Abs %',  get: yr => yr.chronic_abs_rate, fmt: fmtPct },
                      ]}
                    />
                  </div>

                  {/* Spending & Staffing */}
                  <div className="mb-2">
                    <SubSectionHead>Spending &amp; Staffing</SubSectionHead>
                    <RcYearTable
                      selectedYear={selectedYear}
                      onSelectYear={setSelectedYear}
                      rows={yearsAsc.filter(yr => yr.exp_per_pupil != null || yr.inexp_teach_pct != null || yr.out_of_cert_pct != null)}
                      cols={[
                        { label: '$/Pupil',     strong: true, get: yr => yr.exp_per_pupil, fmt: fmtUSD },
                        { label: 'Inexp Tch %', get: yr => yr.inexp_teach_pct, fmt: fmtPct },
                        { label: 'Out-Cert %',  get: yr => yr.out_of_cert_pct, fmt: fmtPct },
                      ]}
                    />
                  </div>
                </RevealFx>
              </section>

              {/* ── Academic ─────────────────────────────────────────── */}
              <section id="academic" ref={(el: HTMLElement | null) => { sectionRefs.current.academic = el }} className="mb-20 scroll-mt-24">
                <RevealFx delay={0.24} translateY={8}>
                  <SectionHead
                    title={`${fmtNysedYear(selectedYear)} Academic`}
                    blurb="Academic and enrollment snapshot. SAT and college-acceptance values are static; enrollment, AP, and graduation rate respond to the year selector."
                  />
                  <Tablet>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Metric</th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {([
                            ['Division',          `Division ${school.division}`],
                            ['Section',           school.section ? `Section ${school.section}` : '--'],
                            ['Enrollment (9-12)',  enrollment != null ? enrollment.toLocaleString() : '--'],
                            ['Avg SAT',           school.avg_sat != null ? String(school.avg_sat) : '--'],
                            ['AP Pass Rate',      apPct != null ? `${apPct}%` : '--'],
                            ['Graduation Rate',   gradPct != null ? `${gradPct}%` : '--'],
                            ['College Acceptance', school.coll_pct != null ? `${school.coll_pct}%` : '--'],
                            ['N/RC Tier',         ys?.needs_index ? `${ys.needs_index} · ${NRC_SHORT[ys.needs_index] ?? ''}` : '--'],
                            ...(school.address ? [['Address', school.address]] : []),
                          ] as [string, string][]).map(([label, value], i) => (
                            <tr key={label} className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}>
                              <td className={cn(td, 'pl-5 text-[var(--paper-muted)]')} style={SERIF}>{label}</td>
                              <td className={cn(td, 'text-right pr-5 text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Tablet>
                </RevealFx>
              </section>

              {/* ── Demographic ──────────────────────────────────────── */}
              <section id="demographic" ref={(el: HTMLElement | null) => { sectionRefs.current.demographic = el }} className="mb-20 scroll-mt-24">
                <RevealFx delay={0.22} translateY={8}>
                  <SectionHead
                    title={`${fmtNysedYear(selectedYear)} Demographic`}
                    blurb="Race and ethnicity breakdown by student population."
                    meta={<span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>{k12 != null ? `${k12.toLocaleString()} K-12` : ''}</span>}
                  />
                  <Tablet>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Group</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">%</th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {([
                            ['White',       whitePct,  ys?.num_white],
                            ['Black',       blackPct,  ys?.num_black],
                            ['Hispanic',    hispPct,   ys?.num_hisp],
                            ['Asian',       asianPct,  ys?.num_asian],
                            ['Multiracial', multiPct,  ys?.num_multi],
                          ] as [string, number | null, number | null | undefined][]).map(([label, pct, count], i) => (
                            <tr key={label} className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}>
                              <td className={cn(td, 'pl-5 text-[var(--paper-muted)]')} style={SERIF}>{label}</td>
                              <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{pct != null ? `${pct.toFixed(0)}%` : '--'}</td>
                              <td className={cn(td, 'text-right pr-5 text-[var(--paper-muted)] tabular-nums')} style={MONO}>{count != null ? Number(count).toLocaleString() : '--'}</td>
                            </tr>
                          ))}
                          <tr className="border-t border-[var(--paper-rule)]">
                            <td className={cn(td, 'pl-5 text-[var(--paper-text)] font-medium')} style={SERIF}>Total K-12</td>
                            <td className={td} />
                            <td className={cn(td, 'text-right pr-5 text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{k12 != null ? k12.toLocaleString() : '--'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Tablet>
                </RevealFx>
              </section>

              {/* ── Need ──────────────────────────────────────────────── */}
              <section id="need" ref={(el: HTMLElement | null) => { sectionRefs.current.need = el }} className="mb-20 scroll-mt-24">
                <RevealFx delay={0.28} translateY={8}>
                  <SectionHead
                    title={`${fmtNysedYear(selectedYear)} Need`}
                    blurb="Economic disadvantage, language, disabilities, and housing instability."
                    meta={ys?.needs_index ? (
                      <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
                        N/RC {ys.needs_index} · {NRC_SHORT[ys.needs_index] ?? ''}
                      </span>
                    ) : undefined}
                  />
                  <Tablet>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Indicator</th>
                            <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">%</th>
                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {([
                            ['Econ. Disadvantaged', ecdisPct,     ys?.num_ecdis],
                            ['English Language Learner', ellPct,  ys?.num_ell],
                            ['Students w/ Disabilities', swdPct,  ys?.num_swd],
                            ['Homeless',            homelessPct,  ys?.num_homeless],
                          ] as [string, number | null, number | null | undefined][]).map(([label, pct, count], i) => (
                            <tr key={label} className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}>
                              <td className={cn(td, 'pl-5 text-[var(--paper-muted)]')} style={SERIF}>{label}</td>
                              <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{pct != null ? `${pct.toFixed(0)}%` : '--'}</td>
                              <td className={cn(td, 'text-right pr-5 text-[var(--paper-muted)] tabular-nums')} style={MONO}>{count != null ? Number(count).toLocaleString() : '--'}</td>
                            </tr>
                          ))}
                          {ys?.needs_index && (
                            <tr className="border-t border-[var(--paper-rule)]">
                              <td className={cn(td, 'pl-5 text-[var(--paper-text)] font-medium')} style={SERIF}>N/RC Tier</td>
                              <td className={td} />
                              <td className={cn(td, 'text-right pr-5 text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                                {ys.needs_index} · {NRC_SHORT[ys.needs_index] ?? ''}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Tablet>
                </RevealFx>
              </section>

              {/* ── Trend ─────────────────────────────────────────────── */}
              <section id="trend" ref={(el: HTMLElement | null) => { sectionRefs.current.trend = el }} className="mb-20 scroll-mt-24">
                <RevealFx delay={0.32} translateY={8}>
                  {(() => {
                    const sortedByYear = [...yearStats].sort((a, b) => a.year - b.year)
                    const first = sortedByYear[0]
                    const last  = sortedByYear[sortedByYear.length - 1]
                    const firstEnroll = first?.g9_12
                    const lastEnroll  = last?.g9_12
                    const delta = (firstEnroll != null && lastEnroll != null) ? lastEnroll - firstEnroll : null
                    const deltaPct = (firstEnroll != null && lastEnroll != null && firstEnroll > 0)
                      ? (delta! / firstEnroll) * 100 : null

                    const firstK12 = first?.k12
                    const lastK12  = last?.k12
                    const k12Delta = (firstK12 != null && lastK12 != null) ? lastK12 - firstK12 : null
                    const k12DeltaPct = (firstK12 != null && lastK12 != null && firstK12 > 0)
                      ? (k12Delta! / firstK12) * 100 : null

                    return (
                      <>
                        <SectionHead
                          title="Trend"
                          blurb={`Enrollment change from ${first ? fmtNysedYear(first.year) : '--'} to ${last ? fmtNysedYear(last.year) : '--'}.`}
                        />
                        <Tablet>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                              <thead>
                                <tr>
                                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Metric</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">{first ? fmtNysedYear(first.year) : '--'}</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">{last ? fmtNysedYear(last.year) : '--'}</th>
                                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Δ</th>
                                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Δ %</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className={cn(td, 'pl-5 text-[var(--paper-muted)]')} style={SERIF}>Enrollment (9-12)</td>
                                  <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{firstEnroll != null ? firstEnroll.toLocaleString() : '--'}</td>
                                  <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{lastEnroll != null ? lastEnroll.toLocaleString() : '--'}</td>
                                  <td className={cn(td, 'text-right tabular-nums')} style={MONO}>
                                    <span className={cn(
                                      delta != null && delta > 0 && 'text-emerald-500',
                                      delta != null && delta < 0 && 'text-rose-500',
                                      (delta == null || delta === 0) && 'text-[var(--paper-faint)]',
                                    )}>
                                      {delta == null ? '--' : (delta >= 0 ? `+${delta}` : delta)}
                                    </span>
                                  </td>
                                  <td className={cn(td, 'text-right pr-5 tabular-nums font-medium')} style={MONO}>
                                    <span className={cn(
                                      deltaPct != null && deltaPct > 0 && 'text-emerald-500',
                                      deltaPct != null && deltaPct < 0 && 'text-rose-500',
                                      (deltaPct == null || deltaPct === 0) && 'text-[var(--paper-faint)]',
                                    )}>
                                      {deltaPct == null ? '--' : (deltaPct >= 0 ? '+' : '') + deltaPct.toFixed(1)}
                                    </span>
                                  </td>
                                </tr>
                                <tr className="border-t border-[var(--paper-rule-soft)]">
                                  <td className={cn(td, 'pl-5 text-[var(--paper-muted)]')} style={SERIF}>Total K-12</td>
                                  <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{firstK12 != null ? firstK12.toLocaleString() : '--'}</td>
                                  <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{lastK12 != null ? lastK12.toLocaleString() : '--'}</td>
                                  <td className={cn(td, 'text-right tabular-nums')} style={MONO}>
                                    <span className={cn(
                                      k12Delta != null && k12Delta > 0 && 'text-emerald-500',
                                      k12Delta != null && k12Delta < 0 && 'text-rose-500',
                                      (k12Delta == null || k12Delta === 0) && 'text-[var(--paper-faint)]',
                                    )}>
                                      {k12Delta == null ? '--' : (k12Delta >= 0 ? `+${k12Delta}` : k12Delta)}
                                    </span>
                                  </td>
                                  <td className={cn(td, 'text-right pr-5 tabular-nums font-medium')} style={MONO}>
                                    <span className={cn(
                                      k12DeltaPct != null && k12DeltaPct > 0 && 'text-emerald-500',
                                      k12DeltaPct != null && k12DeltaPct < 0 && 'text-rose-500',
                                      (k12DeltaPct == null || k12DeltaPct === 0) && 'text-[var(--paper-faint)]',
                                    )}>
                                      {k12DeltaPct == null ? '--' : (k12DeltaPct >= 0 ? '+' : '') + k12DeltaPct.toFixed(1)}
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </Tablet>
                      </>
                    )
                  })()}
                </RevealFx>
              </section>

              {/* ── Football ──────────────────────────────────────────── */}
              {teamSeasons.length > 0 && (
                <section id="football" ref={(el: HTMLElement | null) => { sectionRefs.current.football = el }} className="mb-20 scroll-mt-24">
                  <RevealFx delay={0.34} translateY={8}>
                    <SectionHead
                      title="Football"
                      blurb={`All-time: ${totalWins}-${totalLosses} across ${teamSeasons.length} seasons. Win pct ${fmtPctWin(totalWins, totalLosses)}.`}
                      meta={
                        teamSlug ? (
                          <Link href={`/team/${teamSlug}`}
                            className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline underline-offset-4 transition-colors text-sm"
                            style={{ ...SERIF, fontStyle: 'italic' }}>
                            View full team page
                          </Link>
                        ) : undefined
                      }
                    />
                    <Tablet>
                      <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                          <thead>
                            <tr>
                              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Season</th>
                              <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">W</th>
                              <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">L</th>
                              <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">T</th>
                              <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap border-b border-[var(--paper-rule)]">Record</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamSeasons.map((s, i) => (
                              <tr key={s.season} className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}>
                                <td className={cn(td, 'pl-5')} style={SERIF}>
                                  <Link href={`/team/${s.slug}`}
                                    className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline underline-offset-4 transition-colors">
                                    {fmtSeason(s.season)}
                                  </Link>
                                </td>
                                <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{s.overall_wins ?? '--'}</td>
                                <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{s.overall_losses ?? '--'}</td>
                                <td className={cn(td, 'text-right text-[var(--paper-faint)] tabular-nums')} style={MONO}>{s.overall_ties ?? 0}</td>
                                <td className={cn(td, 'text-right pr-5 tabular-nums font-medium')} style={MONO}>
                                  <span className={cn(
                                    (s.overall_wins ?? 0) > (s.overall_losses ?? 0) && 'text-emerald-500',
                                    (s.overall_wins ?? 0) < (s.overall_losses ?? 0) && 'text-rose-500',
                                    (s.overall_wins ?? 0) === (s.overall_losses ?? 0) && 'text-[var(--paper-faint)]',
                                  )}>
                                    {fmtRecord(s.overall_wins, s.overall_losses, s.overall_ties)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Tablet>
                  </RevealFx>
                </section>
              )}

              {/* ── Division ──────────────────────────────────────────── */}
              {divPeers.length > 0 && (
                <section id="division" ref={(el: HTMLElement | null) => { sectionRefs.current.division = el }} className="mb-20 scroll-mt-24">
                  <RevealFx delay={0.4} translateY={8}>
                    <SectionHead
                      title={`Division ${school.division}`}
                      blurb={`${divPeers.length} other schools in Division ${school.division}.`}
                      meta={
                        <div className="flex items-center gap-2">
                          <button onClick={() => divRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                            className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => divRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                            className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      }
                    />
                    <div ref={divRef} className="overflow-x-auto no-scrollbar">
                      <div className="flex gap-3 pb-2">
                        {divPeers.map(p => {
                          const logo = SCHOOL_LOGOS[p.slug]
                          return (
                            <Link key={p.slug} href={`/school/${p.slug}`}
                              className="shrink-0 w-[260px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 flex flex-col gap-2 hover:bg-[var(--paper-quiet)] transition-colors"
                              style={{ borderRadius: 3 }}>
                              <div className="flex items-center gap-2 min-w-0">
                                {logo && <Image src={logo} alt="" width={20} height={20} className="shrink-0 object-contain" unoptimized />}
                                <span className="text-[13.5px] text-[var(--paper-text)] truncate leading-snug" style={{ ...SERIF, fontWeight: 500 }}>{p.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {p.enrollment != null && <span className="text-[12px] text-[var(--paper-muted)]" style={MONO}>{p.enrollment.toLocaleString()} students</span>}
                                {p.avg_sat != null && <span className="text-[12px] text-[var(--paper-faint)]" style={MONO}>SAT {p.avg_sat}</span>}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </RevealFx>
                </section>
              )}

              {/* ── Colophon ──────────────────────────────────────────── */}
              <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
                <p className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>
                  Academic figures are drawn from public school reports. Demographic
                  and need percentages are from NYSED BEDS Day Enrollment and
                  Demographic Factors tables for the selected school year. Football
                  records are from Section XI official results and Newsday box scores.
                </p>
              </div>

            </main>
          </div>
        </div>
      </AppLayout>

      <div style={PAPER_BRIDGE}>
        <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
        <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)} context={school.name} />
      </div>
    </>
  )
}
