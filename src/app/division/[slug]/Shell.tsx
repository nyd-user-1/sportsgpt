'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChartSpline, Map, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS, PLAYER_PHOTOS, SCHOOL_LOGOS, DIVISION_LOGOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { InfoTable } from '@/components/InfoTable'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR, CURRENT_SEASON } from '@/lib/app-config'

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
  school_slug?: string
  pass_yards?: number | null
  pass_tds?: number | null
  completions?: number | null
  attempts?: number | null
  rush_yards?: number | null
  rush_tds?: number | null
  season: number
}

const DIV_ORDER = ['division-i', 'division-ii', 'division-iii', 'division-iv']

const fmtSeason = (y: number) => `${y}-${String(y + 1).slice(2)}`

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
  const [standingsExpanded, setStandingsExpanded] = useState(true)
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [slideIdx, setSlideIdx] = useState(0)

  const seenPhotoSlugs = new Set<string>()
  const slides = standings
    .filter(s => {
      const slug = s.school_slug
      if (!slug || seenPhotoSlugs.has(slug) || !TEAM_PHOTOS[slug]?.[0]) return false
      seenPhotoSlugs.add(slug)
      return true
    })
    .map(s => TEAM_PHOTOS[s.school_slug!]![0])
    .slice(0, 6)

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [slides.length])
  const passRef = useRef<HTMLDivElement>(null)
  const rushRef = useRef<HTMLDivElement>(null)

  const availableSeasons = [...new Set(standings.map(s => s.season).filter(Boolean) as number[])].sort((a, b) => b - a)
  const selectedSeason    = availableSeasons[seasonIdx] ?? CURRENT_SEASON
  const filteredStandings = standings.filter(s => s.season === selectedSeason)
  const seasonPassers     = topPassers.filter(p => p.season === selectedSeason).sort((a, b) => (b.pass_yards ?? 0) - (a.pass_yards ?? 0))
  const seasonRushers     = topRushers.filter(p => p.season === selectedSeason).sort((a, b) => (b.rush_yards ?? 0) - (a.rush_yards ?? 0))

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
                <div className="flex items-center gap-3">
                  {(() => {
                    const divNum = { I: 1, II: 2, III: 3, IV: 4 }[division as 'I'|'II'|'III'|'IV']
                    const logo = divNum ? DIVISION_LOGOS[divNum] : undefined
                    return logo ? (
                      <Image src={logo} alt="" width={48} height={48} className="shrink-0 h-12 w-12 object-contain" unoptimized />
                    ) : null
                  })()}
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-[var(--txt)]">Division {division}</h1>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-1">
                      <Link href="/section/section-xi" className="hover:text-[var(--txt)] transition-colors">Section XI</Link>
                      <span>/</span>
                      <span className="font-medium" style={{ color: ACCENT_COLOR }}>Division {division}</span>
                    </div>
                  </div>
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
                    <Image src={src} alt="" fill className="object-cover object-top" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  </div>
                ))}
                <div className="absolute bottom-0 left-0 p-5 pointer-events-none">
                  <p className="text-base font-bold text-white leading-snug">Division {division}</p>
                  <p className="text-sm text-white/60 mt-0.5">Section XI Football</p>
                </div>
                {slides.length > 1 && (
                  <>
                    <button onClick={() => setSlideIdx(i => (i - 1 + slides.length) % slides.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={() => setSlideIdx(i => (i + 1) % slides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                      {slides.map((_, i) => (
                        <button key={i} onClick={() => setSlideIdx(i)}
                          className="h-2 rounded-full bg-white transition-all duration-500 ease-in-out"
                          style={{ width: i === slideIdx ? 28 : 8, opacity: i === slideIdx ? 1 : 0.45 }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Standings with season carousel */}
            <div className="mb-8">
              <InfoTable
                title={`${fmtSeason(selectedSeason)} Standings`}
                onToggle={() => setStandingsExpanded(v => !v)}
                onPrev={availableSeasons.length > 1 ? () => setSeasonIdx(i => (i - 1 + availableSeasons.length) % availableSeasons.length) : undefined}
                onNext={availableSeasons.length > 1 ? () => setSeasonIdx(i => (i + 1) % availableSeasons.length) : undefined}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface)]">
                      <th className={cn(th, 'text-left')}>#</th>
                      <th className={cn(th, 'text-left')}>Team</th>
                      <th className={cn(th, 'text-right')}>W</th>
                      <th className={cn(th, 'text-right')}>L</th>
                      <th className={cn(th, 'text-right')}>PCT</th>
                      <th className={cn(th, 'text-right')}>Conf W-L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStandings.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No standings data for {fmtSeason(selectedSeason)}</td></tr>
                    )}
                    {visibleStandings.map((t, i) => (
                      <tr key={t.slug} className="border-t border-[var(--border)] hover:bg-[var(--inp-bg)] transition-colors">
                        <td className={cn(td, 'text-[var(--muted)]')}>{i + 1}</td>
                        <td className={cn(td, 'font-semibold')}>
                          <div className="flex items-center gap-2">
                            {t.school_slug && SCHOOL_LOGOS[t.school_slug] && (
                              <Image src={SCHOOL_LOGOS[t.school_slug]} alt="" width={20} height={20} className="shrink-0 h-5 w-5 object-contain" unoptimized />
                            )}
                            <Link href={`/team/${t.slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>
                              {t.name.replace(/\s+Varsity\s+Football$/i, '')}
                            </Link>
                          </div>
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
              </InfoTable>
            </div>

            {/* Top Passers carousel */}
            {seasonPassers.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Passers · {fmtSeason(selectedSeason)}</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => passRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => passRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={passRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {seasonPassers.map(p => {
                      const photo = PLAYER_PHOTOS[p.player_slug]
                      const logo  = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : undefined
                      return (
                        <Link key={p.player_slug} href={`/player/${p.player_slug}`}
                          className="shrink-0 w-[210px] h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 flex items-center gap-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                          <div className="shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden flex items-center justify-center">
                            {photo
                              ? <Image src={photo} alt="" width={60} height={60} className="w-full h-full object-cover" unoptimized />
                              : logo
                              ? <Image src={logo} alt="" width={44} height={44} className="object-contain" unoptimized />
                              : null}
                          </div>
                          <div className="flex flex-col justify-between flex-1 min-w-0 h-[60px]">
                            <div>
                              <p className="text-sm font-bold text-[var(--txt)] leading-snug truncate">{p.player_name}</p>
                              <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{p.school_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{p.pass_yards ?? '—'} YDS</span>
                              <span className="text-xs text-[var(--muted)]">{p.pass_tds ?? '—'} TD</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Top Rushers carousel */}
            {seasonRushers.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Rushers · {fmtSeason(selectedSeason)}</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => rushRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => rushRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={rushRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {seasonRushers.map(p => {
                      const photo = PLAYER_PHOTOS[p.player_slug]
                      const logo  = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : undefined
                      return (
                        <Link key={p.player_slug} href={`/player/${p.player_slug}`}
                          className="shrink-0 w-[210px] h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 flex items-center gap-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                          <div className="shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden flex items-center justify-center">
                            {photo
                              ? <Image src={photo} alt="" width={60} height={60} className="w-full h-full object-cover" unoptimized />
                              : logo
                              ? <Image src={logo} alt="" width={44} height={44} className="object-contain" unoptimized />
                              : null}
                          </div>
                          <div className="flex flex-col justify-between flex-1 min-w-0 h-[60px]">
                            <div>
                              <p className="text-sm font-bold text-[var(--txt)] leading-snug truncate">{p.player_name}</p>
                              <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{p.school_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{p.rush_yards ?? '—'} YDS</span>
                              <span className="text-xs text-[var(--muted)]">{p.rush_tds ?? '—'} TD</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
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
