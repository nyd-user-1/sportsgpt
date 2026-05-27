'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  SectionHead,
  StickyControlBar,
  SearchInput,
  useSearchHotkey,
  SearchButtonGroup,
  Tablet,
  EmptyTablet,
  SortTh,
  MONO,
  tabletTd,
  DivisionTabs,
} from '@/components/editorial'
import { ChatSeasonsPanel, type TeamMeta } from '@/components/ChatSeasonsPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { cn } from '@/lib/utils'
import type { SchoolIndexRow, YearStatRow } from './page'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

const DIV_LABEL: Record<string, string> = {
  All: 'All Divisions',
  I:   'Division I',
  II:  'Division II',
  III: 'Division III',
  IV:  'Division IV',
}

const DIV_DOT_COUNT: Record<'All' | 'I' | 'II' | 'III' | 'IV', number> = {
  All: 5, I: 1, II: 2, III: 3, IV: 4,
}

function DivisionDots({ active }: { active: 'All' | 'I' | 'II' | 'III' | 'IV' }) {
  const solid = DIV_DOT_COUNT[active]
  return (
    <span
      role="img"
      aria-label={DIV_LABEL[active]}
      className="inline-flex items-center align-middle text-[var(--paper-strong)]"
      style={{ gap: 4 }}
    >
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          aria-hidden
          className="block rounded-full bg-current"
          style={{ width: 5, height: 5, opacity: n <= solid ? 1 : 0.18 }}
        />
      ))}
    </span>
  )
}

// Short labels for the three N/RC tiers present in Suffolk.
const NRC_SHORT: Record<string, string> = {
  '3': 'High Need',
  '5': 'Average',
  '6': 'Low Need',
}

// ── Sort column types ───────────────────────────────────────────────────────

type AcadCol = 'rank' | 'name' | 'division' | 'enrollment' | 'sat' | 'ap' | 'grad' | 'coll' | 'acad'
type DemCol  = 'rank' | 'name' | 'division' | 'white' | 'black' | 'hisp' | 'asian' | 'multi' | 'diversity'
type NeedCol = 'rank' | 'name' | 'division' | 'ecdis' | 'ell' | 'swd' | 'homeless' | 'nrc'
type TrendCol= 'rank' | 'name' | 'division' | 'first' | 'latest' | 'delta' | 'deltaPct'

type AcadRow  = SchoolIndexRow & { acad: number }
type DemRow   = SchoolIndexRow & { whitePct: number | null; blackPct: number | null; hispPct: number | null; asianPct: number | null; multiPct: number | null; diversity: number | null }
type NeedRow  = SchoolIndexRow & { ecdisPct: number | null; ellPct: number | null; swdPct: number | null; homelessPct: number | null }
type TrendRow = SchoolIndexRow & { delta: number | null; deltaPct: number | null }

// ── Composite helpers ───────────────────────────────────────────────────────

function buildAcadRows(rows: SchoolIndexRow[]): AcadRow[] {
  const z = (vals: (number | null)[]) => {
    const present = vals.filter((v): v is number => v != null)
    if (!present.length) return vals.map(() => 0)
    const mean = present.reduce((a, b) => a + b, 0) / present.length
    const variance = present.reduce((a, b) => a + (b - mean) ** 2, 0) / present.length
    const std = Math.sqrt(variance) || 1
    return vals.map(v => v == null ? 0 : (v - mean) / std)
  }
  const zSat  = z(rows.map(r => r.avg_sat))
  const zAp   = z(rows.map(r => r.ap_pct))
  const zGrad = z(rows.map(r => r.grad_pct))
  const zColl = z(rows.map(r => r.coll_pct))
  const composites = rows.map((_, i) => (zSat[i] + zAp[i] + zGrad[i] + zColl[i]) / 4)
  const cMin = Math.min(...composites, 0)
  const cMax = Math.max(...composites, 0)
  const span = cMax - cMin || 1
  return rows.map((r, i) => ({ ...r, acad: ((composites[i] - cMin) / span) * 100 }))
}

function pctOf(n: number | null, denom: number | null): number | null {
  if (n == null || denom == null || denom === 0) return null
  return (n / denom) * 100
}

// Blau's index of heterogeneity (= Gini-Simpson / Simpson): 1 − Σpᵢ²,
// rescaled 0-100 within the visible set. Includes all 6 race buckets
// (am_ind, white, black, hisp, asian, multi).
function buildDemRows(rows: SchoolIndexRow[]): DemRow[] {
  const enriched = rows.map(r => {
    const k = r.k12
    const whitePct = pctOf(r.num_white, k)
    const blackPct = pctOf(r.num_black, k)
    const hispPct  = pctOf(r.num_hisp,  k)
    const asianPct = pctOf(r.num_asian, k)
    const multiPct = pctOf(r.num_multi, k)
    const amPct    = pctOf(r.num_am_ind, k)
    // Simpson: 1 − Σpᵢ² where pᵢ = num/k12 (not rescaled to 1 — uses k12 denominator)
    let raw: number | null = null
    if (k && k > 0) {
      const ps = [r.num_white, r.num_black, r.num_hisp, r.num_asian, r.num_multi, r.num_am_ind]
        .map(n => (n ?? 0) / k)
      raw = 1 - ps.reduce((s, p) => s + p * p, 0)
    }
    return { ...r, whitePct, blackPct, hispPct, asianPct, multiPct, _raw: raw }
  })
  const raws = enriched.map(r => r._raw).filter((v): v is number => v != null)
  const rMin = Math.min(...raws, 0)
  const rMax = Math.max(...raws, 0)
  const span = rMax - rMin || 1
  return enriched.map(r => ({
    ...r,
    diversity: r._raw == null ? null : ((r._raw - rMin) / span) * 100,
  }))
}

function buildNeedRows(rows: SchoolIndexRow[]): NeedRow[] {
  return rows.map(r => ({
    ...r,
    ecdisPct:    pctOf(r.num_ecdis,    r.k12),
    ellPct:      pctOf(r.num_ell,      r.k12),
    swdPct:      pctOf(r.num_swd,      r.k12),
    homelessPct: pctOf(r.num_homeless, r.k12),
  }))
}

function buildTrendRows(rows: SchoolIndexRow[]): TrendRow[] {
  return rows.map(r => {
    const first  = r.enrollment_first
    const latest = r.enrollment
    if (first == null || latest == null || first === 0) {
      return { ...r, delta: null, deltaPct: null }
    }
    const delta = latest - first
    return { ...r, delta, deltaPct: (delta / first) * 100 }
  })
}

// ── Generic sort comparator ─────────────────────────────────────────────────
function cmp(av: number | string, bv: number | string, dir: 'asc' | 'desc') {
  if (typeof av === 'string') {
    return dir === 'asc'
      ? av.localeCompare(bv as string)
      : (bv as string).localeCompare(av)
  }
  return dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
}

// ── School-name cell (logo + serif link) — reused across every table ───────
function NameCell({ s }: { s: SchoolIndexRow }) {
  return (
    <div className="flex items-center gap-3 text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors min-w-0">
      {SCHOOL_LOGOS[s.slug] && (
        <Link
          href={`/school/${s.slug}`}
          onClick={e => e.stopPropagation()}
          aria-label={`${s.name} school page`}
          className="shrink-0"
        >
          <Image
            src={SCHOOL_LOGOS[s.slug]}
            alt=""
            width={24}
            height={24}
            className="h-[24px] w-[24px] object-contain"
            unoptimized
          />
        </Link>
      )}
      <Link
        href={`/school/${s.slug}`}
        onClick={e => e.stopPropagation()}
        className="text-[16px] leading-tight truncate hover:underline underline-offset-4 decoration-[var(--paper-rule)]"
        style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
      >
        {s.name}
      </Link>
    </div>
  )
}

function DivCell({ s }: { s: SchoolIndexRow }) {
  return (
    <span className="text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
      Div. {s.division}
    </span>
  )
}

function fmtPct(v: number | null, digits = 0) {
  return v == null ? '—' : v.toFixed(digits)
}
function fmtSigned(n: number | null) {
  if (n == null) return '—'
  return n >= 0 ? `+${n}` : String(n)
}
function fmtSignedPct(n: number | null) {
  if (n == null) return '—'
  return (n >= 0 ? '+' : '') + n.toFixed(1)
}

// ── Shell ───────────────────────────────────────────────────────────────────

export function SchoolMagazineShell({
  schools,
  yearStats,
}: {
  schools: SchoolIndexRow[]
  yearStats: YearStatRow[]
}) {
  const [activeDiv, setActiveDiv] = useState<'All' | 'I' | 'II' | 'III' | 'IV'>('All')
  const [query,     setQuery]     = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  // ── Season state + navigation ──────────────────────────────────────────
  const availableSeasons = useMemo(
    () => [...new Set(yearStats.map(s => s.year))].sort((a, b) => b - a),
    [yearStats],
  )
  const defaultSeason = availableSeasons[0] ?? 2025
  const [selectedSeason, setSelectedSeason] = useState<number>(defaultSeason)

  function shiftSeason(delta: 1 | -1) {
    const idx = availableSeasons.indexOf(selectedSeason)
    const next = (idx + delta + availableSeasons.length) % availableSeasons.length
    setSelectedSeason(availableSeasons[next])
  }

  function fmtSeason(y: number) { return `${y - 1}-${String(y).slice(-2)}` }
  const seasonLabel = fmtSeason(selectedSeason)

  // ── Year-keyed data overlay ────────────────────────────────────────────
  const yearMap = useMemo(() => {
    const m = new Map<string, YearStatRow>()
    for (const s of yearStats) {
      if (s.year === selectedSeason) m.set(s.school_slug, s)
    }
    return m
  }, [yearStats, selectedSeason])

  const effectiveSchools = useMemo<SchoolIndexRow[]>(() => {
    return schools.map(s => {
      const ys = yearMap?.get(s.slug)
      if (!ys) return s
      return {
        ...s,
        enrollment: ys.g9_12,
        k12: ys.k12,
        num_white: ys.num_white,
        num_black: ys.num_black,
        num_hisp: ys.num_hisp,
        num_asian: ys.num_asian,
        num_multi: ys.num_multi,
        num_am_ind: ys.num_am_ind,
        num_ell: ys.num_ell,
        num_swd: ys.num_swd,
        num_ecdis: ys.num_ecdis,
        num_homeless: ys.num_homeless,
        needs_index: ys.needs_index,
        needs_index_desc: ys.needs_index_desc,
        grad_pct: ys.grad_pct ?? s.grad_pct,
        ap_pct: ys.ap_pct ?? s.ap_pct,
      }
    })
  }, [schools, yearMap])

  // Section cycling — one table visible at a time, arrow advances
  type SectionTab = 'academic' | 'demographic' | 'need' | 'trend'
  const SECTION_ORDER: SectionTab[] = ['academic', 'demographic', 'need', 'trend']
  const SECTION_TITLE: Record<SectionTab, string> = {
    academic: 'Academic Index', demographic: 'Demographic Index', need: 'Need Index', trend: 'Trend Index',
  }
  const [sectionTab, setSectionTab] = useState<SectionTab>('academic')
  function nextSection() {
    setSectionTab(t => SECTION_ORDER[(SECTION_ORDER.indexOf(t) + 1) % SECTION_ORDER.length])
  }

  // Per-table sort state
  const [acadCol,  setAcadCol]  = useState<AcadCol>('rank')
  const [acadDir,  setAcadDir]  = useState<'asc' | 'desc'>('asc')
  const [demCol,   setDemCol]   = useState<DemCol>('rank')
  const [demDir,   setDemDir]   = useState<'asc' | 'desc'>('asc')
  const [needCol,  setNeedCol]  = useState<NeedCol>('ecdis')
  const [needDir,  setNeedDir]  = useState<'asc' | 'desc'>('desc')
  const [trendCol, setTrendCol] = useState<TrendCol>('deltaPct')
  const [trendDir, setTrendDir] = useState<'asc' | 'desc'>('desc')

  // Seasons panel
  const [panelTeam, setPanelTeam] = useState<TeamMeta | null>(null)
  function handleRowClick(s: SchoolIndexRow) {
    setPanelTeam({ slug: s.slug, name: s.name })
  }

  function makeSortHandler<C extends string>(
    col: C, setCol: (c: C) => void,
    dir: 'asc' | 'desc', setDir: (d: 'asc' | 'desc') => void,
    ascDefault: (c: C) => boolean,
  ) {
    return (c: string) => {
      const next = c as C
      if (col === next) setDir(dir === 'asc' ? 'desc' : 'asc')
      else { setCol(next); setDir(ascDefault(next) ? 'asc' : 'desc') }
    }
  }
  const handleAcadSort  = makeSortHandler<AcadCol>(acadCol,  setAcadCol,  acadDir,  setAcadDir,  c => c === 'name' || c === 'division' || c === 'rank')
  const handleDemSort   = makeSortHandler<DemCol>(demCol,   setDemCol,   demDir,   setDemDir,   c => c === 'name' || c === 'division' || c === 'rank')
  const handleNeedSort  = makeSortHandler<NeedCol>(needCol,  setNeedCol,  needDir,  setNeedDir,  c => c === 'name' || c === 'division')
  const handleTrendSort = makeSortHandler<TrendCol>(trendCol, setTrendCol, trendDir, setTrendDir, c => c === 'name' || c === 'division')

  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => effectiveSchools.filter(s => {
    if (activeDiv !== 'All' && s.division !== activeDiv) return false
    if (q && !s.name.toLowerCase().includes(q)) return false
    return true
  }), [effectiveSchools, activeDiv, q])

  // ── Academic Index ─────────────────────────────────────────────────────
  const acadRows = useMemo(() => buildAcadRows(filtered), [filtered])
  const sortedAcad = useMemo(() => {
    const arr = [...acadRows]
    if (acadCol === 'rank') {
      arr.sort((a, b) => b.acad - a.acad)
      if (acadDir === 'desc') arr.reverse()
      return arr
    }
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (acadCol) {
        case 'name':       av = a.name; bv = b.name; break
        case 'division':   av = a.division; bv = b.division; break
        case 'enrollment': av = a.enrollment ?? -1; bv = b.enrollment ?? -1; break
        case 'sat':        av = a.avg_sat  ?? -1; bv = b.avg_sat  ?? -1; break
        case 'ap':         av = a.ap_pct   ?? -1; bv = b.ap_pct   ?? -1; break
        case 'grad':       av = a.grad_pct ?? -1; bv = b.grad_pct ?? -1; break
        case 'coll':       av = a.coll_pct ?? -1; bv = b.coll_pct ?? -1; break
        case 'acad':       av = a.acad; bv = b.acad; break
        default:           av = 0; bv = 0
      }
      return cmp(av, bv, acadDir)
    })
    return arr
  }, [acadRows, acadCol, acadDir])

  // ── Demographic Index ──────────────────────────────────────────────────
  const demRows = useMemo(() => buildDemRows(filtered), [filtered])
  const sortedDem = useMemo(() => {
    const arr = [...demRows]
    if (demCol === 'rank') {
      arr.sort((a, b) => (b.diversity ?? -1) - (a.diversity ?? -1))
      if (demDir === 'desc') arr.reverse()
      return arr
    }
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (demCol) {
        case 'name':     av = a.name; bv = b.name; break
        case 'division': av = a.division; bv = b.division; break
        case 'white':    av = a.whitePct ?? -1; bv = b.whitePct ?? -1; break
        case 'black':    av = a.blackPct ?? -1; bv = b.blackPct ?? -1; break
        case 'hisp':     av = a.hispPct  ?? -1; bv = b.hispPct  ?? -1; break
        case 'asian':    av = a.asianPct ?? -1; bv = b.asianPct ?? -1; break
        case 'multi':    av = a.multiPct ?? -1; bv = b.multiPct ?? -1; break
        case 'diversity':      av = a.diversity      ?? -1; bv = b.diversity      ?? -1; break
        default:         av = 0; bv = 0
      }
      return cmp(av, bv, demDir)
    })
    return arr
  }, [demRows, demCol, demDir])

  // ── Need Index ─────────────────────────────────────────────────────────
  const needRows = useMemo(() => buildNeedRows(filtered), [filtered])
  const sortedNeed = useMemo(() => {
    const arr = [...needRows]
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (needCol) {
        case 'rank':     av = a.ecdisPct ?? -1; bv = b.ecdisPct ?? -1; break
        case 'name':     av = a.name; bv = b.name; break
        case 'division': av = a.division; bv = b.division; break
        case 'ecdis':    av = a.ecdisPct    ?? -1; bv = b.ecdisPct    ?? -1; break
        case 'ell':      av = a.ellPct      ?? -1; bv = b.ellPct      ?? -1; break
        case 'swd':      av = a.swdPct      ?? -1; bv = b.swdPct      ?? -1; break
        case 'homeless': av = a.homelessPct ?? -1; bv = b.homelessPct ?? -1; break
        case 'nrc':      av = a.needs_index ? Number(a.needs_index) : 99; bv = b.needs_index ? Number(b.needs_index) : 99; break
        default:         av = 0; bv = 0
      }
      return cmp(av, bv, needDir)
    })
    return arr
  }, [needRows, needCol, needDir])

  // ── Trend Index ────────────────────────────────────────────────────────
  const trendRows = useMemo(() => buildTrendRows(filtered), [filtered])
  const sortedTrend = useMemo(() => {
    const arr = [...trendRows]
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (trendCol) {
        case 'rank':     av = a.deltaPct ?? -999; bv = b.deltaPct ?? -999; break
        case 'name':     av = a.name; bv = b.name; break
        case 'division': av = a.division; bv = b.division; break
        case 'first':    av = a.enrollment_first ?? -1; bv = b.enrollment_first ?? -1; break
        case 'latest':   av = a.enrollment       ?? -1; bv = b.enrollment       ?? -1; break
        case 'delta':    av = a.delta            ?? -999; bv = b.delta          ?? -999; break
        case 'deltaPct': av = a.deltaPct         ?? -999; bv = b.deltaPct       ?? -999; break
        default:         av = 0; bv = 0
      }
      return cmp(av, bv, trendDir)
    })
    return arr
  }, [trendRows, trendCol, trendDir])

  // ── Year window for Trend label ────────────────────────────────────────
  const trendYears = useMemo(() => {
    const first  = schools.find(s => s.first_year  != null)?.first_year
    const latest = schools.find(s => s.latest_year != null)?.latest_year
    return { first, latest }
  }, [schools])

  const totalEnrollment = useMemo(
    () => effectiveSchools.reduce((s, sch) => s + (sch.enrollment ?? 0), 0),
    [effectiveSchools],
  )

  // ── Render helpers for tabular cells ───────────────────────────────────
  const td = tabletTd
  const rankCell = (i: number) => (
    <td className={cn(td, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
      {String(i + 1).padStart(2, ' ')}.
    </td>
  )

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

        {/* ── Masthead ───────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow={`Section XI · Suffolk County · ${seasonLabel}`}
              subhead={
                <>
                  Fifty-two Suffolk County high schools — academic profile,
                  demographic mix, need indicators, and enrollment trend.
                </>
              }
              meta={[
                `${schools.length} schools`,
                '4 divisions',
                `${totalEnrollment.toLocaleString()} students enrolled`,
              ]}
            >
              School
            </EditorialHead>
          </RevealFx>
        </div>

        {/* ── Sticky control bar ──────────────────────────────────────────── */}
        <StickyControlBar>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
              style={SANS}
            >
              School Year
            </span>
            {availableSeasons.length > 1 && (
              <button
                onClick={() => shiftSeason(-1)}
                aria-label="Previous"
                className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <span
              className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
              style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
            >
              {seasonLabel}
            </span>
            {availableSeasons.length > 1 && (
              <button
                onClick={() => shiftSeason(1)}
                aria-label="Next"
                className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            inputRef={searchRef}
            placeholder="Search schools…"
          />

          <SearchButtonGroup />
        </StickyControlBar>

        {/* ── Single section — cycles Academic → Demographic → Need → Trend ── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-12" id="index-section">
          <RevealFx delay={0.15} translateY={8} key={sectionTab}>
            <SectionHead
              eyebrow={<DivisionDots active={activeDiv} />}
              noRule
              title={
                <span className="inline-flex items-center gap-4">
                  <span>{SECTION_TITLE[sectionTab]}</span>
                  <button
                    onClick={nextSection}
                    aria-label="Next index"
                    className="inline-flex items-center justify-center text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-colors duration-150"
                  >
                    <ArrowRight className="h-8 w-8" />
                  </button>
                </span>
              }
            />

            <DivisionTabs active={activeDiv} onChange={setActiveDiv} />

            {/* ── Academic Index table ───────────────────────────────── */}
            {sectionTab === 'academic' && (sortedAcad.length === 0 ? (
              <EmptyTablet label={q ? `No schools match "${query}" in ${DIV_LABEL[activeDiv]}.` : `No schools recorded in ${DIV_LABEL[activeDiv]}.`} />
            ) : (
              <Tablet>
                <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                  <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <SortTh col="rank"       label="#"      sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} className="pl-5 w-14" />
                        <SortTh col="name"       label="School" sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} />
                        <SortTh col="division"   label="Div"    sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} className="w-20" />
                        <SortTh col="enrollment" label="Enroll" sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} right className="w-24" glossaryId="enroll" />
                        <SortTh col="sat"        label="SAT"    sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} right className="w-20" glossaryId="sat" />
                        <SortTh col="ap"         label="AP %"   sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} right className="w-20" glossaryId="ap" />
                        <SortTh col="grad"       label="Grad %" sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} right className="w-20" glossaryId="grad" />
                        <SortTh col="coll"       label="Coll %" sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} right className="w-20" glossaryId="coll" />
                        <SortTh col="acad"       label="ACAD"   sortCol={acadCol} sortDir={acadDir} onSort={handleAcadSort} right className="w-20 pr-5" glossaryId="acad" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAcad.map((s, i) => (
                        <tr key={s.slug} onClick={() => handleRowClick(s)}
                            className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                          {rankCell(i)}
                          <td className={td}><NameCell s={s} /></td>
                          <td className={td}><DivCell s={s} /></td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{s.enrollment != null ? s.enrollment.toLocaleString() : '—'}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{s.avg_sat ?? '—'}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{s.ap_pct   ?? '—'}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{s.grad_pct ?? '—'}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{s.coll_pct ?? '—'}</td>
                          <td className={cn(td, 'text-right pr-5 text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{s.acad.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tablet>
            ))}

            {/* ── Demographic Index table ────────────────────────────── */}
            {sectionTab === 'demographic' && (sortedDem.length === 0 ? (
              <EmptyTablet label={q ? `No schools match "${query}" in ${DIV_LABEL[activeDiv]}.` : `No schools recorded.`} />
            ) : (
              <Tablet>
                <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                  <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <SortTh col="rank"     label="#"      sortCol={demCol} sortDir={demDir} onSort={handleDemSort} className="pl-5 w-14" />
                        <SortTh col="name"     label="School" sortCol={demCol} sortDir={demDir} onSort={handleDemSort} />
                        <SortTh col="division" label="Div"    sortCol={demCol} sortDir={demDir} onSort={handleDemSort} className="w-20" />
                        <SortTh col="white"    label="White %"   sortCol={demCol} sortDir={demDir} onSort={handleDemSort} right className="w-24" glossaryId="dem-white" />
                        <SortTh col="black"    label="Black %"   sortCol={demCol} sortDir={demDir} onSort={handleDemSort} right className="w-24" glossaryId="dem-black" />
                        <SortTh col="hisp"     label="Hisp %"    sortCol={demCol} sortDir={demDir} onSort={handleDemSort} right className="w-24" glossaryId="dem-hisp" />
                        <SortTh col="asian"    label="Asian %"   sortCol={demCol} sortDir={demDir} onSort={handleDemSort} right className="w-24" glossaryId="dem-asian" />
                        <SortTh col="multi"    label="Multi %"   sortCol={demCol} sortDir={demDir} onSort={handleDemSort} right className="w-24" glossaryId="dem-multi" />
                        <SortTh col="diversity" label="DIVERSITY" sortCol={demCol} sortDir={demDir} onSort={handleDemSort} right className="w-32 pr-5" glossaryId="diversity" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDem.map((s, i) => (
                        <tr key={s.slug} onClick={() => handleRowClick(s)}
                            className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                          {rankCell(i)}
                          <td className={td}><NameCell s={s} /></td>
                          <td className={td}><DivCell s={s} /></td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.whitePct)}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.blackPct)}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.hispPct)}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.asianPct)}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.multiPct)}</td>
                          <td className={cn(td, 'text-right pr-5 text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{s.diversity == null ? '—' : s.diversity.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tablet>
            ))}

            {/* ── Need Index table ───────────────────────────────────── */}
            {sectionTab === 'need' && (sortedNeed.length === 0 ? (
              <EmptyTablet label={q ? `No schools match "${query}" in ${DIV_LABEL[activeDiv]}.` : `No schools recorded.`} />
            ) : (
              <Tablet>
                <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                  <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <SortTh col="rank"     label="#"      sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} className="pl-5 w-14" />
                        <SortTh col="name"     label="School" sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} />
                        <SortTh col="division" label="Div"    sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} className="w-20" />
                        <SortTh col="ecdis"    label="Econ Dis %" sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} right className="w-28" glossaryId="ecdis" />
                        <SortTh col="ell"      label="ELL %"      sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} right className="w-24" glossaryId="ell" />
                        <SortTh col="swd"      label="SWD %"      sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} right className="w-24" glossaryId="swd" />
                        <SortTh col="homeless" label="Homeless %" sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} right className="w-28" glossaryId="homeless" />
                        <SortTh col="nrc"      label="N/RC"       sortCol={needCol} sortDir={needDir} onSort={handleNeedSort} right className="w-40 pr-5" glossaryId="nrc" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedNeed.map((s, i) => (
                        <tr key={s.slug} onClick={() => handleRowClick(s)}
                            className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                          {rankCell(i)}
                          <td className={td}><NameCell s={s} /></td>
                          <td className={td}><DivCell s={s} /></td>
                          <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{fmtPct(s.ecdisPct)}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.ellPct)}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.swdPct)}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtPct(s.homelessPct)}</td>
                          <td className={cn(td, 'text-right pr-5 tabular-nums')} style={MONO}>
                            {s.needs_index ? (
                              <>
                                <span className="text-[var(--paper-text)] font-medium">{s.needs_index}</span>
                                <span className="text-[var(--paper-muted)]"> · {NRC_SHORT[s.needs_index] ?? s.needs_index_desc ?? ''}</span>
                              </>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tablet>
            ))}

            {/* ── Trend Index table ──────────────────────────────────── */}
            {sectionTab === 'trend' && (sortedTrend.length === 0 ? (
              <EmptyTablet label={q ? `No schools match "${query}" in ${DIV_LABEL[activeDiv]}.` : `No schools recorded.`} />
            ) : (
              <Tablet>
                <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                  <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <SortTh col="rank"     label="#"      sortCol={trendCol} sortDir={trendDir} onSort={handleTrendSort} className="pl-5 w-14" />
                        <SortTh col="name"     label="School" sortCol={trendCol} sortDir={trendDir} onSort={handleTrendSort} />
                        <SortTh col="division" label="Div"    sortCol={trendCol} sortDir={trendDir} onSort={handleTrendSort} className="w-20" />
                        <SortTh col="first"    label={trendYears.first  != null ? `${trendYears.first  - 1}-${String(trendYears.first).slice(-2)}`   : '—'}
                          sortCol={trendCol} sortDir={trendDir} onSort={handleTrendSort} right className="w-24" />
                        <SortTh col="latest"   label={trendYears.latest != null ? `${trendYears.latest - 1}-${String(trendYears.latest).slice(-2)}` : '—'}
                          sortCol={trendCol} sortDir={trendDir} onSort={handleTrendSort} right className="w-24" />
                        <SortTh col="delta"    label="Δ"   sortCol={trendCol} sortDir={trendDir} onSort={handleTrendSort} right className="w-20" glossaryId="trend-delta" />
                        <SortTh col="deltaPct" label="Δ %" sortCol={trendCol} sortDir={trendDir} onSort={handleTrendSort} right className="w-24 pr-5" glossaryId="trend-delta-pct" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTrend.map((s, i) => (
                        <tr key={s.slug} onClick={() => handleRowClick(s)}
                            className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                          {rankCell(i)}
                          <td className={td}><NameCell s={s} /></td>
                          <td className={td}><DivCell s={s} /></td>
                          <td className={cn(td, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{s.enrollment_first != null ? s.enrollment_first.toLocaleString() : '—'}</td>
                          <td className={cn(td, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{s.enrollment != null ? s.enrollment.toLocaleString() : '—'}</td>
                          <td className={cn(td, 'text-right tabular-nums')} style={MONO}>
                            <span className={cn(
                              s.delta != null && s.delta > 0 && 'text-emerald-500',
                              s.delta != null && s.delta < 0 && 'text-rose-500',
                              (s.delta == null || s.delta === 0) && 'text-[var(--paper-faint)]',
                            )}>
                              {fmtSigned(s.delta)}
                            </span>
                          </td>
                          <td className={cn(td, 'text-right pr-5 tabular-nums font-medium')} style={MONO}>
                            <span className={cn(
                              s.deltaPct != null && s.deltaPct > 0 && 'text-emerald-500',
                              s.deltaPct != null && s.deltaPct < 0 && 'text-rose-500',
                              (s.deltaPct == null || s.deltaPct === 0) && 'text-[var(--paper-faint)]',
                            )}>
                              {fmtSignedPct(s.deltaPct)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tablet>
            ))}
          </RevealFx>

          {/* ── Colophon ──────────────────────────────────────────────── */}
          <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
            <p
              className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
              style={{ ...SERIF, fontStyle: 'italic' }}
            >
              Academic figures are drawn from public school reports. ACAD is an
              equal-weight z-score blend of SAT, AP pass rate, graduation rate
              and college acceptance rate, rescaled 0–100 within the visible
              set. DIVERSITY is Blau&apos;s index of heterogeneity (1 − Σpᵢ²,
              equivalent to Gini-Simpson) across six race groups, likewise
              rescaled 0–100 within the visible set. Demographic and
              need percentages are derived from NYSED&apos;s BEDS Day Enrollment
              and Demographic Factors tables for the latest school year on
              file. For multi-building districts (Brentwood, Ward Melville,
              GSMHS, East Hampton coop) the K-12 denominator includes the
              feeder buildings used to attribute football-aged students, which
              may shift their demographic percentages slightly.
            </p>
          </div>
        </div>

        <ChatSeasonsPanel
          open={panelTeam != null}
          onClose={() => setPanelTeam(null)}
          teams={panelTeam ? [panelTeam] : []}
          initialSeason={null}
        />
      </div>
    </AppLayout>
  )
}
