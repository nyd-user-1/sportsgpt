'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChartSpline, Map, MessageCircle, Download } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import Image from 'next/image'
import { cn, formatSeason } from '@/lib/utils'
import { ACCENT_COLOR, CURRENT_SEASON } from '@/lib/app-config'
import { TEAM_PHOTOS, SCHOOL_LOGOS, PLAYER_PHOTOS } from '@/lib/team-images'

type DivisionSummary = {
  division: string
  team_count: number
  avg_win_pct: number | null
}

type RecentChamp = {
  season: number
  division: string
  team_slug: string
  team_name: string
  overall_wins: number | null
  overall_losses: number | null
}

type GameRow = {
  id: number
  game_date: string | null
  season: number
  home_team_slug: string
  away_team_slug: string
  home_score: number | null
  away_score: number | null
  home_name: string
  away_name: string
  home_school_slug: string | null
  away_school_slug: string | null
}

type LeaderRow = {
  player_slug: string
  player_name: string
  school_name: string
  school_slug: string | null
  pass_yards: number | null
  pass_tds: number | null
  season: number
}

type TeamRow = {
  slug: string
  name: string
  division: string
  school_slug: string | null
  overall_wins: number | null
  overall_losses: number | null
  conference_wins: number | null
  conference_losses: number | null
  season: number
}

const DIV_LABELS: Record<string, string> = {
  I: 'Division I', II: 'Division II', III: 'Division III', IV: 'Division IV',
}
const DIV_SLUGS: Record<string, string> = {
  I: 'division-i', II: 'division-ii', III: 'division-iii', IV: 'division-iv',
}
const DIV_ORDER = ['I', 'II', 'III', 'IV']

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0; const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

function fmtPctFromFloat(v: number | null) {
  if (v == null) return '—'
  return (v * 100).toFixed(1) + '%'
}

function fmtGameDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function SectionShell({
  divisionSummary,
  recentChamps,
  allTeams,
  games,
  leaders,
}: {
  divisionSummary: DivisionSummary[]
  recentChamps: RecentChamp[]
  allTeams: TeamRow[]
  games: GameRow[]
  leaders: LeaderRow[]
}) {
  const [chartsOpen,         setChartsOpen]         = useState(false)
  const [mapsOpen,           setMapsOpen]           = useState(false)
  const [chatOpen,           setChatOpen]           = useState(false)
  const [activeDiv,          setActiveDiv]          = useState<string>('I')
  const [divCardIdx,         setDivCardIdx]         = useState(0)
  const [standingsExpanded,  setStandingsExpanded]  = useState(true)
  const [seasonIdx,          setSeasonIdx]          = useState(0)
  const [downloadOpen,       setDownloadOpen]       = useState(false)
  const downloadRef = useRef<HTMLDivElement>(null)
  const scheduleRef = useRef<HTMLDivElement>(null)
  const leaderRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setDivCardIdx(i => (i + 1) % DIV_ORDER.length), 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!downloadRef.current?.contains(e.target as Node)) setDownloadOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const btn      = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const roundBtn = 'inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const th     = 'px-3 py-3 bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap'
  const td     = 'px-3 py-2.5 text-sm border-b border-[var(--border)]'

  const availableSeasons = [...new Set(allTeams.map(t => t.season))].sort((a, b) => b - a)
  const selectedSeason   = availableSeasons[seasonIdx] ?? CURRENT_SEASON
  const filteredTeams    = allTeams.filter(t => t.division === activeDiv && t.season === selectedSeason)
  const visibleTeams     = standingsExpanded ? filteredTeams : filteredTeams.slice(0, 2)
  const seasonGames      = games.filter(g => g.season === selectedSeason)
  const seasonLeaders    = leaders.filter(l => l.season === selectedSeason)

  const DIV_PHOTOS: Record<string, string> = {}
  const DIV_SCHOOL: Record<string, string> = {}
  for (const div of DIV_ORDER) {
    for (const team of allTeams.filter(t => t.division === div)) {
      const schoolSlug = team.slug.replace(/-varsity-football$/, '')
      if (TEAM_PHOTOS[schoolSlug]?.[0]) {
        DIV_PHOTOS[div] = TEAM_PHOTOS[schoolSlug][0]
        DIV_SCHOOL[div] = schoolSlug
        break
      }
    }
  }

  return (
    <>
      <AppLayout>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 py-8">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-[var(--txt)]">Section XI</h1>
                <p className="text-sm text-[var(--muted)] mt-0.5">Long Island Football · Suffolk County, NY</p>
              </div>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} rounded-l-full ${chartsOpen ? active : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setMapsOpen(v => !v)} className={`${btn} ${mapsOpen ? active : ''}`}><Map className="h-4 w-4" /></button>
                    <span className={tip}>Map</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChatOpen(v => !v)} className={`${btn} rounded-r-full ${chatOpen ? active : ''}`}><MessageCircle className="h-4 w-4" /></button>
                    <span className={tip}>Ask SportsGPT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Division slider */}
            <div className="mb-8">
              <div className="relative rounded-2xl overflow-hidden w-full" style={{ height: 420 }}>

                {/* Image layers — all stacked, fade in/out */}
                {DIV_ORDER.map((div, i) => {
                  const summary = divisionSummary.find(d => d.division === div)
                  const photo   = DIV_PHOTOS[div]
                  return (
                    <div key={div}
                      className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                      style={{ opacity: i === divCardIdx ? 1 : 0 }}>
                      {photo && <Image src={photo} alt="" fill className="object-cover" unoptimized />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-5 pointer-events-none">
                        <p className="text-base font-bold text-white leading-snug">Division {div}</p>
                        <p className="text-sm text-white/80 mt-0.5">{summary?.team_count ?? 0} teams</p>
                        {summary?.avg_win_pct != null && (
                          <p className="text-xs text-white/60">{fmtPctFromFloat(summary.avg_win_pct)} avg win%</p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Clickable link for active slide */}
                <Link href={`/division/${DIV_SLUGS[DIV_ORDER[divCardIdx]]}`}
                  className="absolute inset-0 z-10" />

                {/* Liquid dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {DIV_ORDER.map((_, i) => (
                    <button key={i}
                      onClick={(e) => { e.preventDefault(); setDivCardIdx(i) }}
                      className="h-2 rounded-full bg-white transition-all duration-500 ease-in-out"
                      style={{ width: i === divCardIdx ? 28 : 8, opacity: i === divCardIdx ? 1 : 0.45 }}
                    />
                  ))}
                </div>

              </div>
            </div>

            {/* All teams standings — InfoTableDivision pattern */}
            <div className="mb-8">
              <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">

                {/* Toolbar */}
                <div onClick={() => setStandingsExpanded(v => !v)}
                  className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-[var(--txt)]">{formatSeason(selectedSeason)} Standings</span>
                    {availableSeasons.length > 1 && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setSeasonIdx(i => (i - 1 + availableSeasons.length) % availableSeasons.length) }}
                          className="p-1 text-[var(--muted)] hover:text-[var(--txt)] transition-colors" aria-label="Previous">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setSeasonIdx(i => (i + 1) % availableSeasons.length) }}
                          className="p-1 text-[var(--muted)] hover:text-[var(--txt)] transition-colors" aria-label="Next">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <div ref={downloadRef} className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setDownloadOpen(v => !v)}
                      className="p-1.5 text-[var(--muted)] hover:text-[var(--txt)] transition-colors" aria-label="Download">
                      <Download className="h-4 w-4" />
                    </button>
                    {downloadOpen && (
                      <div className="absolute right-0 top-full mt-1 z-50 min-w-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
                        {['CSV', 'DOC', 'MD', 'PDF'].map((fmt, i) => (
                          <button key={fmt} onClick={() => setDownloadOpen(false)}
                            className={cn('w-full px-3 py-2 text-left text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors',
                              i > 0 && 'border-t border-[var(--border)]')}>
                            {fmt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Division tabs */}
                <div className="flex border-b border-[var(--border)] bg-[var(--surface)]" onClick={e => e.stopPropagation()}>
                  {DIV_ORDER.map(div => (
                    <button key={div} onClick={() => setActiveDiv(div)}
                      className={cn(
                        'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                        activeDiv === div ? 'text-[var(--txt)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]',
                      )}
                      style={activeDiv === div ? { borderBottomColor: ACCENT_COLOR } : undefined}>
                      Div. {div}
                    </button>
                  ))}
                </div>

                {/* Table */}
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
                    {visibleTeams.map((t, i) => (
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
                    {filteredTeams.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No standings data for {formatSeason(selectedSeason)}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule carousel */}
            {seasonGames.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Schedule · {formatSeason(selectedSeason)}</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => scheduleRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => scheduleRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={scheduleRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {seasonGames.map(g => {
                      const logo = g.home_school_slug ? SCHOOL_LOGOS[g.home_school_slug] : (g.away_school_slug ? SCHOOL_LOGOS[g.away_school_slug] : undefined)
                      const scored = g.home_score != null && g.away_score != null
                      return (
                        <Link key={g.id} href={`/team/${g.home_team_slug}`}
                          className="shrink-0 w-[210px] h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 flex items-center gap-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                          <div className="shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden flex items-center justify-center">
                            {logo
                              ? <Image src={logo} alt="" width={44} height={44} className="object-contain" unoptimized />
                              : null}
                          </div>
                          <div className="flex flex-col justify-between flex-1 min-w-0 h-[60px]">
                            <div>
                              <p className="text-sm font-bold text-[var(--txt)] leading-snug truncate">{g.home_name}</p>
                              <p className="text-xs text-[var(--muted)] mt-0.5 truncate">vs {g.away_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {scored
                                ? <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{g.home_score}–{g.away_score}</span>
                                : <span className="text-xs text-[var(--muted)]">{fmtGameDate(g.game_date)}</span>}
                              {scored && <span className="text-xs text-[var(--muted)]">{fmtGameDate(g.game_date)}</span>}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard carousel */}
            {seasonLeaders.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Leaderboard · {formatSeason(selectedSeason)}</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => leaderRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => leaderRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={leaderRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {seasonLeaders.map(p => {
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

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName="Section XI" />
    </>
  )
}
