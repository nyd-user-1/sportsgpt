'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChartSpline, MapPlus, MessageCircle, Map } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { cn } from '@/lib/utils'

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

function fmtCurrency(n: number | null) {
  if (n == null) return '—'
  return `$${Math.round(n).toLocaleString()}/wk`
}

export type CountyStats = {
  county_name: string
  provider_count: number
  total_capacity: number
  infant_capacity: number
  toddler_capacity: number
  preschool_capacity: number
  school_age_capacity: number
}

export type CountyCosts = {
  mcinfant: number | null
  mctoddler: number | null
  mcpreschool: number | null
  mfccinfant: number | null
  mfcctoddler: number | null
  mfccpreschool: number | null
  mhi: number | null
  flfpr_20to64_under6: number | null
  pr_f: number | null
} | null

export type ZipEntry = {
  zip_code: string
  city: string
  providers: number
  seats: number
}

const DEFAULT_ROWS = 2

export function CountyShell({
  stats,
  costs,
  zips,
  prevSlug,
  nextSlug,
}: {
  stats: CountyStats
  costs: CountyCosts
  zips: ZipEntry[]
  prevSlug: string
  nextSlug: string
}) {
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [profileIdx, setProfileIdx]     = useState(0)
  const [chartsOpen, setChartsOpen]     = useState(false)
  const [mapsOpen, setMapsOpen]         = useState(false)
  const [chatOpen, setChatOpen]         = useState(false)
  const zipScrollRef = useRef<HTMLDivElement>(null)

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-sky-500 hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-sky-500 bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'

  const PROFILES = [
    {
      title: 'Inventory',
      rows: [
        { label: 'Licensed Providers',     value: String(stats.provider_count),   highlight: false },
        { label: 'Total Licensed Capacity',value: fmtNum(stats.total_capacity),   highlight: true  },
        { label: 'Infant Capacity',        value: String(stats.infant_capacity),   highlight: false },
        { label: 'Toddler Capacity',       value: String(stats.toddler_capacity),  highlight: false },
        { label: 'Preschool Capacity',     value: String(stats.preschool_capacity),highlight: false },
        { label: 'School-Age Capacity',    value: String(stats.school_age_capacity),highlight: false },
      ],
    },
    {
      title: 'Cost',
      rows: [
        { label: 'Median Infant Cost (Center)',    value: fmtCurrency(costs?.mcinfant ?? null),    highlight: false },
        { label: 'Median Toddler Cost (Center)',   value: fmtCurrency(costs?.mctoddler ?? null),   highlight: false },
        { label: 'Median Preschool Cost (Center)', value: fmtCurrency(costs?.mcpreschool ?? null), highlight: false },
        { label: 'Median Infant Cost (Family CC)', value: fmtCurrency(costs?.mfccinfant ?? null),  highlight: false },
        { label: 'Median Toddler Cost (Family CC)',value: fmtCurrency(costs?.mfcctoddler ?? null), highlight: false },
        { label: 'Median Preschool (Family CC)',   value: fmtCurrency(costs?.mfccpreschool ?? null),highlight: false },
        { label: 'Median Household Income',        value: costs?.mhi != null ? `$${Math.round(costs.mhi).toLocaleString()}` : '—', highlight: false },
        { label: "Women's LFPR (children under 6)", value: costs?.flfpr_20to64_under6 != null ? `${costs.flfpr_20to64_under6.toFixed(1)}%` : '—', highlight: false },
        { label: 'Female Poverty Rate',            value: costs?.pr_f != null ? `${costs.pr_f.toFixed(1)}%` : '—', highlight: false },
      ],
    },
  ]

  const cycleProfile = (dir: 1 | -1) => {
    setProfileIdx(i => (i + dir + PROFILES.length) % PROFILES.length)
    setInfoExpanded(false)
  }

  const activeProfile = PROFILES[profileIdx]
  const visibleRows = infoExpanded ? activeProfile.rows : activeProfile.rows.slice(0, DEFAULT_ROWS)

  return (
    <>
      <AppLayout paperMode>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 py-8">

            {/* ── Header ── */}
            <div className="mb-8 flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-[var(--txt)]">{stats.county_name} County</h1>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/county/${prevSlug}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
                    <span className={tip}>Prev</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} ${chartsOpen ? active : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setMapsOpen(v => !v)} className={`${btn} ${mapsOpen ? active : ''}`}><MapPlus className="h-4 w-4" /></button>
                    <span className={tip}>Maps</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChatOpen(v => !v)} className={`${btn} ${chatOpen ? active : ''}`}><MessageCircle className="h-4 w-4" /></button>
                    <span className={tip}>Ask ChildcareGPT</span>
                  </div>
                  <div className="relative group">
                    <Link href={`/county/${nextSlug}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Map placeholder ── */}
            <div className="mb-8 h-64 sm:h-96 w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg,#e8f4fb 0%,#d0eaf7 100%)' }}>
              <Map className="h-14 w-14 text-[var(--muted)]" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--txt2)]">{stats.county_name} County, NY</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">County Map · Coming Soon</p>
              </div>
            </div>

            {/* ── Profiles ── */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Profiles</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => cycleProfile(-1)} className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => cycleProfile(1)} className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
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
                    <span className={cn('text-sm text-right', row.highlight ? 'font-bold text-sky-500' : 'text-[var(--txt)]')}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Zip Codes carousel ── */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Zip Codes</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => zipScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => zipScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div ref={zipScrollRef} className="overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-1">
                  {zips.map(z => (
                    <Link key={z.zip_code} href={`/zip/${z.zip_code}`}
                      className="shrink-0 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                      <p className="text-base font-bold text-[var(--txt)]">{z.zip_code}</p>
                      <p className="text-xs font-medium text-[var(--txt2)] mt-0.5">{z.city}</p>
                      <div className="mt-2">
                        <span className="text-xs font-bold text-sky-500">{fmtNum(z.seats)} seats</span>
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
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   context={stats.county_name} />
    </>
  )
}
