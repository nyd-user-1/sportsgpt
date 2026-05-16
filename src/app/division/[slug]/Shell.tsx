'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChartSpline, Map, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

type StandingRow = {
  slug: string
  name: string
  school_slug: string | null
  overall_wins: number | null
  overall_losses: number | null
  overall_ties: number | null
  conference_wins: number | null
  conference_losses: number | null
  season: number | null
}

type TopPlayer = {
  player_slug: string
  player_name: string
  school_name: string
  pass_yards?: number | null
  pass_tds?: number | null
  completions?: number | null
  attempts?: number | null
  rush_yards?: number | null
  rush_tds?: number | null
  season: number
}

const DIV_ORDER = ['division-i', 'division-ii', 'division-iii', 'division-iv']

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0
  const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

export function DivisionShell({
  divSlug,
  division,
  standings,
  topPassers,
  topRushers,
}: {
  divSlug: string
  division: string
  standings: StandingRow[]
  topPassers: TopPlayer[]
  topRushers: TopPlayer[]
}) {
  const [chartsOpen, setChartsOpen] = useState(false)
  const [mapsOpen,   setMapsOpen]   = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [standingsExpanded, setStandingsExpanded] = useState(false)
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [slideIdx, setSlideIdx] = useState(0)

  const DIVISION_SCHOOLS: Record<string, string[]> = {
    I:   ['bay-shore',            'ward-melville', 'commack',      'sachem-east'],
    II:  ['northport',            'bellport',      'west-islip',   'lindenhurst'],
    III: ['hauppauge',            'kings-park',    'rocky-point',  'harborfields'],
    IV:  ['shoreham-wading-river','glenn',         'hampton-bays'],
  }
  const slides = (DIVISION_SCHOOLS[division] ?? [])
    .map(s => TEAM_PHOTOS[s]?.[0])
    .filter(Boolean) as string[]

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [slides.length])
  const passRef = useRef<HTMLDivElement>(null)
  const rushRef = useRef<HTMLDivElement>(null)

  const availableSeasons = [...new Set(standings.map(s => s.season).filter(Boolean) as number[])].sort((a, b) => b - a)
  const selectedSeason   = availableSeasons[seasonIdx] ?? 2024
  const filteredStandings = standings.filter(s => s.season === selectedSeason)

  const curIdx  = DIV_ORDER.indexOf(divSlug)
  const n       = DIV_ORDER.length
  const prevDiv = DIV_ORDER[(curIdx - 1 + n) % n]
  const nextDiv = DIV_ORDER[(curIdx + 1) % n]

  const visibleStandings = standingsExpanded ? filteredStandings : filteredStandings.slice(0, 2)

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const roundBtn = 'inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors'
  const th = 'px-3 py-3 bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap'
  const td = 'px-3 py-2.5 text-sm border-b border-[var(--border)]'

  return (
    <>
      <AppLayout>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 py-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-[var(--txt)]">Division {division}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ background: ACCENT_COLOR }}>Section XI</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/division/${prevDiv}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
                    <span className={tip}>Prev Division</span>
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
                    <Link href={`/division/${nextDiv}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next Division</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero slider */}
            {slides.length > 0 && (
              <div className="mb-8 relative rounded-2xl overflow-hidden w-full" style={{ height: 420 }}>
                {slides.map((src, i) => (
                  <div key={src}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: i === slideIdx ? 1 : 0 }}>
                    <Image src={src} alt="" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  </div>
                ))}
                <div className="absolute bottom-0 left-0 p-5 pointer-events-none">
                  <p className="text-base font-bold text-white leading-snug">Division {division}</p>
                  <p className="text-sm text-white/60 mt-0.5">Section XI Football</p>
                </div>
                {slides.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {slides.map((_, i) => (
                      <button key={i} onClick={() => setSlideIdx(i)}
                        className="h-2 rounded-full bg-white transition-all duration-500 ease-in-out"
                        style={{ width: i === slideIdx ? 28 : 8, opacity: i === slideIdx ? 1 : 0.45 }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Standings with season carousel */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[var(--txt)]">{selectedSeason} Standings</h2>
                {availableSeasons.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSeasonIdx(i => (i - 1 + availableSeasons.length) % availableSeasons.length); setStandingsExpanded(false) }}
                      className={roundBtn}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setSeasonIdx(i => (i + 1) % availableSeasons.length); setStandingsExpanded(false) }}
                      className={roundBtn}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr onClick={() => setStandingsExpanded(v => !v)}
                      className="bg-[var(--surface)] hover:bg-[var(--inp-bg)] cursor-pointer transition-colors">
                      <th className={cn(th, 'text-left w-10')}>#</th>
                      <th className={cn(th, 'text-left')}>Team</th>
                      <th className={cn(th, 'text-right w-12')}>W</th>
                      <th className={cn(th, 'text-right w-12')}>L</th>
                      <th className={cn(th, 'text-right w-16')}>PCT</th>
                      <th className={cn(th, 'text-right w-20')}>Conf W-L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStandings.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No standings data for {selectedSeason}</td></tr>
                    )}
                    {visibleStandings.map((t, i) => (
                      <tr key={t.slug} className="border-t border-[var(--border)] hover:bg-[var(--inp-bg)] transition-colors">
                        <td className={cn(td, 'text-[var(--muted)]')}>{i + 1}</td>
                        <td className={cn(td, 'font-semibold')}>
                          <Link href={`/team/${t.slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>
                            {t.name.replace(/\s+Varsity\s+Football$/i, '')}
                          </Link>
                        </td>
                        <td className={cn(td, 'text-right font-bold text-[var(--txt)]')}>{t.overall_wins ?? '—'}</td>
                        <td className={cn(td, 'text-right text-[var(--muted)]')}>{t.overall_losses ?? '—'}</td>
                        <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtPct(t.overall_wins, t.overall_losses)}</td>
                        <td className={cn(td, 'text-right text-[var(--muted)]')}>
                          {(t.conference_wins != null || t.conference_losses != null)
                            ? `${t.conference_wins ?? 0}–${t.conference_losses ?? 0}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Passers carousel */}
            {topPassers.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Passers · 2024</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => passRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => passRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={passRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {topPassers.map(p => (
                      <Link key={p.player_slug} href={`/player/${p.player_slug}`}
                        className="shrink-0 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                        <p className="text-sm font-bold text-[var(--txt)] leading-snug">{p.player_name}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{p.school_name}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{p.pass_yards ?? '—'} YDS</span>
                          <span className="text-xs text-[var(--muted)]">{p.pass_tds ?? '—'} TD</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Rushers carousel */}
            {topRushers.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Rushers · 2024</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => rushRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => rushRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={rushRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {topRushers.map(p => (
                      <Link key={p.player_slug} href={`/player/${p.player_slug}`}
                        className="shrink-0 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                        <p className="text-sm font-bold text-[var(--txt)] leading-snug">{p.player_name}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{p.school_name}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{p.rush_yards ?? '—'} YDS</span>
                          <span className="text-xs text-[var(--muted)]">{p.rush_tds ?? '—'} TD</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={`Division ${division}`} />
    </>
  )
}
