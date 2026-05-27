'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChartSpline, Map, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

function fmtPct(w: number | null, l: number | null): string {
  const wins   = w ?? 0
  const losses = l ?? 0
  const g = wins + losses
  return g === 0 ? '—' : (wins / g).toFixed(3).replace(/^0/, '')
}

function fmtRecord(w: number | null, l: number | null): string {
  if (w == null && l == null) return '—'
  return `${w ?? 0}–${l ?? 0}`
}

export function SchoolShell({
  school, prevSlug, nextSlug, teamsRows, divSchools,
}: {
  school: Record<string, unknown>
  prevSlug: string
  nextSlug: string
  teamsRows: Record<string, unknown>[]
  divSchools: Record<string, unknown>[]
}) {
  const [profileIdx, setProfileIdx]   = useState(0)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [chartsOpen, setChartsOpen]   = useState(false)
  const [mapsOpen,   setMapsOpen]     = useState(false)
  const [chatOpen,   setChatOpen]     = useState(false)
  const divRef = useRef<HTMLDivElement>(null)

  const schoolName  = school.name as string
  const division    = school.division as string
  const section     = school.section as string
  const enrollment  = school.enrollment != null ? Number(school.enrollment) : null
  const gradRate    = school.graduation_rate != null ? Number(school.graduation_rate) : null
  const avgSat      = school.avg_sat != null ? Number(school.avg_sat) : null
  const apPass      = school.ap_pass_rate != null ? Number(school.ap_pass_rate) : null
  const collegeAcc  = school.college_acceptance_rate != null ? Number(school.college_acceptance_rate) : null
  const address     = school.address as string | undefined
  const description = school.short_description as string | undefined

  // 2024 football record from teamsRows
  const mainTeam = teamsRows[0]
  const wins2024   = mainTeam?.overall_wins != null ? Number(mainTeam.overall_wins) : null
  const losses2024 = mainTeam?.overall_losses != null ? Number(mainTeam.overall_losses) : null

  const fmtPct100 = (v: number | null) => v != null ? `${(v * 100).toFixed(1)}%` : '—'

  const PROFILES = [
    {
      title: 'School Info',
      rows: [
        { label: 'Division',           value: `Division ${division}`,                       highlight: false },
        { label: 'Section',            value: `Section ${section}`,                         highlight: false },
        { label: 'Enrollment',         value: enrollment != null ? enrollment.toLocaleString() : '—', highlight: true  },
        { label: 'Grad Rate',          value: fmtPct100(gradRate),                          highlight: false },
        { label: 'Avg SAT',            value: avgSat != null ? String(avgSat) : '—',        highlight: false },
        { label: 'AP Pass Rate',       value: fmtPct100(apPass),                            highlight: false },
        { label: 'College Acceptance', value: fmtPct100(collegeAcc),                        highlight: false },
        ...(address ? [{ label: 'Address', value: address, highlight: false }] : []),
      ],
    },
    {
      title: 'Football 2024',
      rows: [
        { label: 'Record',  value: fmtRecord(wins2024, losses2024),       highlight: false },
        { label: 'Win %',   value: fmtPct(wins2024, losses2024),          highlight: true  },
        { label: 'Wins',    value: wins2024 != null ? String(wins2024) : '—',    highlight: false },
        { label: 'Losses',  value: losses2024 != null ? String(losses2024) : '—', highlight: false },
      ],
    },
    ...(description ? [{
      title: 'About',
      rows: [{ label: '', value: description, highlight: false }],
    }] : []),
  ]

  const activeProfile = PROFILES[profileIdx]
  const DEFAULT_ROWS  = 2
  const visibleRows   = infoExpanded ? activeProfile.rows : activeProfile.rows.slice(0, DEFAULT_ROWS)

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const roundBtn = 'inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors'

  return (
    <>
      <AppLayout>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 py-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-[var(--txt)]">{schoolName}</h1>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/school/${prevSlug}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
                    <span className={tip}>Prev</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} ${chartsOpen ? active : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setMapsOpen(v => !v)} className={`${btn} ${mapsOpen ? active : ''}`}><Map className="h-4 w-4" /></button>
                    <span className={tip}>Map</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChatOpen(v => !v)} className={`${btn} ${chatOpen ? active : ''}`}><MessageCircle className="h-4 w-4" /></button>
                    <span className={tip}>Ask SportsGPT</span>
                  </div>
                  <div className="relative group">
                    <Link href={`/school/${nextSlug}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="mb-8 h-64 sm:h-80 w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg,#e8f4fb 0%,#d0eaf7 100%)' }}>
              <Map className="h-12 w-12 text-[var(--muted)]" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--txt2)]">{schoolName} · Section XI</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">School Location · Coming Soon</p>
              </div>
            </div>

            {/* Profiles */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Profiles</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setProfileIdx(i => (i - 1 + PROFILES.length) % PROFILES.length); setInfoExpanded(false) }} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => { setProfileIdx(i => (i + 1) % PROFILES.length); setInfoExpanded(false) }} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                <button onClick={() => setInfoExpanded(v => !v)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
                  <span className="text-sm font-semibold text-[var(--txt)]">{activeProfile.title}</span>
                  <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', infoExpanded && 'rotate-180')} />
                </button>
                {visibleRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
                    {row.label && <span className="text-sm text-[var(--muted)]">{row.label}</span>}
                    <span className={cn('text-sm text-right font-medium', !row.label && 'col-span-2 text-left', row.highlight ? 'font-bold' : 'text-[var(--txt)]')}
                      style={row.highlight ? { color: ACCENT_COLOR } : undefined}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Division Schools carousel */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Division {division} Schools</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => divRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => divRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div ref={divRef} className="overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-1">
                  {divSchools.map(s => (
                    <Link key={s.slug as string} href={`/school/${s.slug}`}
                      className="shrink-0 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                      <p className="text-sm font-bold text-[var(--txt)] leading-snug">{s.name as string}</p>
                      {s.enrollment != null && (
                        <p className="text-xs text-[var(--muted)] mt-0.5">{Number(s.enrollment).toLocaleString()} students</p>
                      )}
                      <div className="mt-2">
                        <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>
                          {fmtRecord(s.overall_wins as number | null, s.overall_losses as number | null)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   context={schoolName} />
    </>
  )
}
