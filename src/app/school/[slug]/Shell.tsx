'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChartSpline, Map, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import type { SchoolRow } from '@/lib/placeholder-data'

function fmtPct(w: number, l: number) {
  const g = w + l
  return g === 0 ? '—' : (w / g).toFixed(3).replace(/^0/, '')
}

export function SchoolShell({
  school, prevSlug, nextSlug, divisionSchools,
}: {
  school: SchoolRow
  prevSlug: string
  nextSlug: string
  divisionSchools: SchoolRow[]
}) {
  const [profileIdx, setProfileIdx] = useState(0)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [chartsOpen, setChartsOpen]     = useState(false)
  const [chatOpen, setChatOpen]         = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const PROFILES = [
    {
      title: 'School Info',
      rows: [
        { label: 'City',       value: school.city,                          highlight: false },
        { label: 'County',     value: `${school.county} County`,           highlight: false },
        { label: 'Division',   value: `Division ${school.division}`,       highlight: false },
        { label: 'Section',    value: `Section ${school.section}`,         highlight: false },
        { label: 'Enrollment', value: school.enrollment.toLocaleString(),  highlight: true  },
        { label: 'Teams',      value: String(school.teams),                highlight: false },
      ],
    },
    {
      title: 'Football',
      rows: [
        { label: 'Record', value: `${school.wins}–${school.losses}`,         highlight: false },
        { label: 'Win %',  value: fmtPct(school.wins, school.losses),        highlight: true  },
        { label: 'Wins',   value: String(school.wins),                       highlight: false },
        { label: 'Losses', value: String(school.losses),                     highlight: false },
      ],
    },
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
              <h1 className="text-2xl font-bold text-[var(--txt)]">{school.name}</h1>
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
                    <button className={btn}><Map className="h-4 w-4" /></button>
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
                <p className="text-sm font-semibold text-[var(--txt2)]">{school.city}, NY</p>
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
                    <span className="text-sm text-[var(--muted)]">{row.label}</span>
                    <span className={cn('text-sm text-right font-medium', row.highlight ? 'font-bold' : 'text-[var(--txt)]')}
                      style={row.highlight ? { color: ACCENT_COLOR } : undefined}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Division carousel */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Division {school.division} Schools</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => carouselRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => carouselRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div ref={carouselRef} className="overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-1">
                  {divisionSchools.filter(s => s.id !== school.id).map(s => (
                    <Link key={s.id} href={`/school/${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="shrink-0 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                      <p className="text-sm font-bold text-[var(--txt)] leading-snug">{s.name}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{s.city} · {s.enrollment.toLocaleString()} students</p>
                      <div className="mt-2">
                        <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{fmtPct(s.wins, s.losses)} win%</span>
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
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={school.name} />
    </>
  )
}
