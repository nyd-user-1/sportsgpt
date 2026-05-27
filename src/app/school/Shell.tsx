'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
} from '@/components/editorial'
import { ChatSeasonsPanel, type TeamMeta } from '@/components/ChatSeasonsPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { cn } from '@/lib/utils'
import type { SchoolIndexRow } from './page'

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

type AcadCol =
  | 'rank' | 'name' | 'division' | 'enrollment'
  | 'sat' | 'ap' | 'grad' | 'coll' | 'acad'

type AcadRow = SchoolIndexRow & { acad: number }

// ── Academic Index helpers ──────────────────────────────────────────────────

function buildAcadRows(rows: SchoolIndexRow[]): AcadRow[] {
  // Z-score each metric on the visible set, imputing the mean (z=0) for nulls.
  const z = (vals: (number | null)[]) => {
    const present = vals.filter((v): v is number => v != null)
    if (present.length === 0) return vals.map(() => 0)
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
  return rows.map((r, i) => ({
    ...r,
    acad: ((composites[i] - cMin) / span) * 100,
  }))
}

// ── Shell ───────────────────────────────────────────────────────────────────

export function SchoolMagazineShell({ schools }: { schools: SchoolIndexRow[] }) {
  const [activeDiv,    setActiveDiv]    = useState<'All' | 'I' | 'II' | 'III' | 'IV'>('All')
  const [query,        setQuery]        = useState('')
  const [acadCol,      setAcadCol]      = useState<AcadCol>('rank')
  const [acadDir,      setAcadDir]      = useState<'asc' | 'desc'>('asc')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  // Seasons panel state
  const [panelTeam,    setPanelTeam]    = useState<TeamMeta | null>(null)

  function handleRowClick(s: SchoolIndexRow) {
    setPanelTeam({ slug: s.slug, name: s.name })
  }

  function handleAcadSort(c: string) {
    const col = c as AcadCol
    if (acadCol === col) setAcadDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setAcadCol(col)
      setAcadDir(col === 'name' || col === 'division' || col === 'rank' ? 'asc' : 'desc')
    }
  }

  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => schools.filter(s => {
    if (activeDiv !== 'All' && s.division !== activeDiv) return false
    if (q && !s.name.toLowerCase().includes(q)) return false
    return true
  }), [schools, activeDiv, q])

  // ── Academic Index — derived rows + sort ───────────────────────────────
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
        case 'name':       av = a.name;            bv = b.name;            break
        case 'division':   av = a.division;        bv = b.division;        break
        case 'enrollment': av = a.enrollment ?? -1; bv = b.enrollment ?? -1; break
        case 'sat':        av = a.avg_sat  ?? -1;  bv = b.avg_sat  ?? -1;  break
        case 'ap':         av = a.ap_pct   ?? -1;  bv = b.ap_pct   ?? -1;  break
        case 'grad':       av = a.grad_pct ?? -1;  bv = b.grad_pct ?? -1;  break
        case 'coll':       av = a.coll_pct ?? -1;  bv = b.coll_pct ?? -1;  break
        case 'acad':       av = a.acad;            bv = b.acad;            break
        default:           av = 0;                 bv = 0
      }
      if (typeof av === 'string') return acadDir === 'asc'
        ? av.localeCompare(bv as string)
        : (bv as string).localeCompare(av)
      return acadDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [acadRows, acadCol, acadDir])

  // ── Masthead totals ─────────────────────────────────────────────────────
  const totalEnrollment = useMemo(
    () => schools.reduce((s, sch) => s + (sch.enrollment ?? 0), 0),
    [schools],
  )

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

        {/* ── Masthead ───────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow="Section XI · Academic Index"
              subhead={
                <>
                  Fifty-two Suffolk County high schools — enrollment, SAT,
                  AP pass rate, graduation and college acceptance.
                </>
              }
              meta={[
                `${schools.length} schools`,
                '4 divisions',
                `${totalEnrollment.toLocaleString()} students enrolled`,
              ]}
            >
              Schools
            </EditorialHead>
          </RevealFx>
        </div>

        {/* ── Sticky control bar: search ──────────────────────────────────── */}
        <StickyControlBar>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
              style={SANS}
            >
              Index
            </span>
            <span
              className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
              style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
            >
              Academic
            </span>
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            inputRef={searchRef}
            placeholder="Search schools…"
          />

          <SearchButtonGroup />
        </StickyControlBar>

        {/* ── Academic Index ──────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-12" id="academic-index">
          <RevealFx delay={0.15} translateY={8}>
            <SectionHead
              title="Academic Index"
              eyebrow={<DivisionDots active={activeDiv} />}
              blurb={
                activeDiv === 'All'
                  ? 'Enrollment, SAT, AP, graduation and college acceptance — with a composite signature stat.'
                  : `${DIV_LABEL[activeDiv]} — enrollment, SAT, AP, graduation and college acceptance.`
              }
              meta={<DivisionPills active={activeDiv} onChange={setActiveDiv} />}
            />

            {sortedAcad.length === 0 ? (
              <EmptyTablet
                label={q
                  ? `No schools match “${query}” in ${DIV_LABEL[activeDiv]}.`
                  : `No schools recorded in ${DIV_LABEL[activeDiv]}.`}
              />
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
                        <tr
                          key={s.slug}
                          onClick={() => handleRowClick(s)}
                          className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
                        >
                          <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
                            {String(i + 1).padStart(2, ' ')}.
                          </td>
                          <td className={tabletTd}>
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
                          </td>
                          <td className={cn(tabletTd, 'text-[var(--paper-muted)]')} style={{ ...SERIF, fontStyle: 'italic' }}>
                            Div. {s.division}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {s.enrollment != null ? s.enrollment.toLocaleString() : '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                            {s.avg_sat ?? '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {s.ap_pct != null ? `${s.ap_pct}` : '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {s.grad_pct != null ? `${s.grad_pct}` : '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {s.coll_pct != null ? `${s.coll_pct}` : '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right pr-5 text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                            {s.acad.toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tablet>
            )}
          </RevealFx>

          {/* ── Colophon ──────────────────────────────────────────────── */}
          <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
            <p
              className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
              style={{ ...SERIF, fontStyle: 'italic' }}
            >
              Academic figures are drawn from public school reports. The composite
              ACAD score is an equal-weight z-score blend of SAT, AP pass rate,
              graduation rate and college acceptance rate, rescaled 0–100 within
              the visible set.
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

// ── Division pills — sits in the SectionHead meta slot ─────────────────────
function DivisionPills({
  active,
  onChange,
}: {
  active: 'All' | 'I' | 'II' | 'III' | 'IV'
  onChange: (d: 'All' | 'I' | 'II' | 'III' | 'IV') => void
}) {
  const opts = ['All', 'I', 'II', 'III', 'IV'] as const
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {opts.map(d => {
        const on = active === d
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={cn(
              'px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] rounded-full border transition-colors',
              on
                ? 'border-[var(--paper-text)] bg-[var(--paper-text)] text-[var(--paper)]'
                : 'border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)]',
            )}
            style={SANS}
          >
            {d === 'All' ? 'All' : `Div ${d}`}
          </button>
        )
      })}
    </div>
  )
}
