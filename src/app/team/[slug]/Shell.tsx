'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChartSpline, Map, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS, SCHOOL_LOGOS, PLAYER_PHOTOS } from '@/lib/team-images'
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

function topStat(row: Record<string, unknown>): { label: string; value: string } {
  const stat = row.stat_type as string
  if (stat === 'Passing') return { label: 'Pass Yds', value: String(row.pass_yards ?? 0) }
  if (stat === 'Rushing') return { label: 'Rush Yds', value: String(row.rush_yards ?? 0) }
  return { label: 'Recv Yds', value: String(row.recv_yards ?? 0) }
}

function fmtRecord(w: number | null, l: number | null, ties?: number | null): string {
  if (w == null && l == null) return '—'
  const t = ties ?? 0
  return t > 0 ? `${w ?? 0}–${l ?? 0}–${t}` : `${w ?? 0}–${l ?? 0}`
}


type GameRow = {
  id: number
  game_date: string | null
  season: number
  home_team_slug: string
  away_team_slug: string
  home_score: number | null
  away_score: number | null
  is_division_game: boolean | null
  game_number: number | null
  home_team_name: string | null
  away_team_name: string | null
}

function fmtGameDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function TeamShell({
  team, prevSlug, nextSlug, seasonRows, divTeams, playerRows, gameRows,
}: {
  team: Record<string, unknown>
  prevSlug: string
  nextSlug: string
  seasonRows: Record<string, unknown>[]
  divTeams: Record<string, unknown>[]
  playerRows: Record<string, unknown>[]
  gameRows: GameRow[]
}) {
  const [profileIdx, setProfileIdx]   = useState(0)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [chartsOpen, setChartsOpen]   = useState(false)
  const [mapsOpen,   setMapsOpen]     = useState(false)
  const [chatOpen,   setChatOpen]     = useState(false)
  const playersRef  = useRef<HTMLDivElement>(null)
  const divRef      = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches) {
      setInfoExpanded(true)
    }
  }, [])

  const gameSeasons = useMemo(() =>
    [...new Set(gameRows.map(g => g.season))].sort((a, b) => b - a),
    [gameRows]
  )

  const teamName = team.name as string
  const division = team.division as string
  const section  = team.section as string
  const level    = team.level as string | undefined
  const gender   = team.gender as string | undefined
  const schoolSlug = team.school_slug as string

  // Build season history rows
  const historyRows = seasonRows.map(s => ({
    season: String(s.season),
    overall: fmtRecord(s.overall_wins as number | null, s.overall_losses as number | null, s.overall_ties as number | null),
    conf: fmtRecord(s.conference_wins as number | null, s.conference_losses as number | null, s.conference_ties as number | null),
  }))

  const PROFILES = [
    { title: 'Season History', h2: 'History',       kind: 'history' as const },
    ...gameSeasons.map(s => ({ title: String(s), h2: String(s), kind: 'games' as const, season: s })),
  ]

  const activeProfile = PROFILES[profileIdx]

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const roundBtn = 'inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors'
  const td = 'px-4 py-2.5 border-b border-[var(--border)] text-sm'

  const heroLogo  = SCHOOL_LOGOS[schoolSlug]
  const mobileHeader = (
    <div className="flex items-center gap-2 min-w-0">
      {heroLogo ? (
        <Image src={heroLogo} alt="" width={36} height={36} className="shrink-0 h-9 w-9 rounded-full bg-white p-0.5 object-contain ring-1 ring-[var(--border)]" unoptimized />
      ) : null}
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-tight truncate">{teamName}</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight truncate">Section XI · Division {division}</p>
      </div>
    </div>
  )

  return (
    <>
      <AppLayout mobileHeader={mobileHeader}>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 pt-2 pb-8 sm:py-8">

            {/* Header — hidden on mobile (team info moved to AppLayout header) */}
            <div className="hidden sm:flex mb-8 items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-[var(--txt)]">{teamName}</h1>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/team/${prevSlug}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
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
                    <Link href={`/team/${nextSlug}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero — team photo or gradient fallback (hidden on mobile) */}
            {(() => {
              const photo = TEAM_PHOTOS[schoolSlug]
              const logo  = SCHOOL_LOGOS[schoolSlug]
              return photo ? (
                <div className="hidden sm:block mb-8 h-[390px] w-full rounded-2xl overflow-hidden relative">
                  <Image src={photo} alt={teamName} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    {logo && (
                      <Image src={logo} alt="" width={40} height={40} className="rounded-full bg-white/90 p-0.5 object-contain" unoptimized />
                    )}
                    <div>
                      <p className="text-sm font-bold text-white leading-snug">{teamName}</p>
                      <p className="text-xs text-white/70">Section XI · Division {division}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex mb-8 h-[390px] w-full rounded-2xl border border-[var(--border)] overflow-hidden flex-col items-center justify-center gap-3"
                  style={{ background: `linear-gradient(135deg,${ACCENT_COLOR}22 0%,${ACCENT_COLOR}44 100%)` }}>
                  {logo ? (
                    <Image src={logo} alt="" width={64} height={64} className="object-contain" unoptimized />
                  ) : (
                    <Map className="h-12 w-12 text-[var(--muted)]" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--txt2)]">{teamName} · Section XI Division {division}</p>
                  </div>
                </div>
              )
            })()}

            {/* Profiles */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">{activeProfile.h2}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setProfileIdx(i => (i - 1 + PROFILES.length) % PROFILES.length); setInfoExpanded(false) }} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => { setProfileIdx(i => (i + 1) % PROFILES.length); setInfoExpanded(false) }} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">

                {/* Season History */}
                {PROFILES[profileIdx].kind === 'history' && (
                  historyRows.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--muted)]">No season data available.</div>
                  ) : (
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr onClick={() => setInfoExpanded(v => !v)}
                          className="bg-[var(--surface)] hover:bg-[var(--inp-bg)] cursor-pointer transition-colors">
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Season</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Overall</th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Conf</th>
                          <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Win%</th>
                          <th className="w-10 px-3 py-3 text-right text-[var(--muted)]">
                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200 ml-auto', infoExpanded && 'rotate-180')} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(infoExpanded ? historyRows : historyRows.slice(0, 2)).map(row => (
                          <tr key={row.season} className="border-t border-[var(--border)]">
                            <td className={td}>{row.season}</td>
                            <td className={cn(td, 'font-medium text-[var(--txt)]')}>{row.overall}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.conf}</td>
                            <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>
                              {(() => {
                                const s = seasonRows.find(s2 => String(s2.season) === row.season)
                                return fmtPct(s?.overall_wins as number | null, s?.overall_losses as number | null)
                              })()}
                            </td>
                            <td className={cn(td, 'w-10')} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {/* Game season table */}
                {PROFILES[profileIdx].kind === 'games' && (() => {
                  const profileSeason = (PROFILES[profileIdx] as { season: number }).season
                  const games = gameRows.filter(g => g.season === profileSeason)
                  const visible = infoExpanded ? games : games.slice(0, 2)
                  return (
                    <>
                      {games.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-[var(--muted)] border-t border-[var(--border)]">No game data for {profileSeason}.</div>
                      ) : (
                        <div className="overflow-x-auto no-scrollbar">
                          <table className="w-full text-sm table-fixed" style={{ borderSpacing: 0 }}>
                            <thead>
                              <tr onClick={() => setInfoExpanded(v => !v)}
                                className="bg-[var(--surface)] hover:bg-[var(--inp-bg)] cursor-pointer transition-colors">
                                <th style={{width:'14%'}} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Date</th>
                                <th style={{width:'44%'}} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Opponent</th>
                                <th style={{width:'22%'}} className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Score</th>
                                <th style={{width:'14%'}} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Result</th>
                                <th style={{width:'6%'}} className="px-3 py-3 text-right text-[var(--muted)]">
                                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200 ml-auto', infoExpanded && 'rotate-180')} />
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {visible.map((g, i) => {
                                const isHome  = g.home_team_slug === team.slug
                                const opSlug  = isHome ? g.away_team_slug : g.home_team_slug
                                const opName  = isHome ? g.away_team_name : g.home_team_name
                                const myScore = isHome ? g.home_score : g.away_score
                                const opScore = isHome ? g.away_score : g.home_score
                                const result  = myScore == null || opScore == null ? '—'
                                  : myScore > opScore ? 'W' : myScore < opScore ? 'L' : 'T'
                                const scoreStr = myScore != null && opScore != null ? `${myScore}–${opScore}` : '—'
                                const opDisplay = (opName ?? opSlug)
                                  .replace(/\s+Varsity\s+Football$/i, '')
                                  .replace(/-varsity-football$/, '')
                                  .replace(/-/g, ' ')
                                  .replace(/\b\w/g, c => c.toUpperCase())
                                return (
                                  <tr key={g.id} className="border-t border-[var(--border)] hover:bg-[var(--inp-bg)] transition-colors">
                                    <td className={cn(td, 'text-[var(--txt2)] tabular-nums')}>{fmtGameDate(g.game_date)}</td>
                                    <td className={cn(td, 'font-medium')}>
                                      <span className="text-xs text-[var(--muted)] mr-1.5">{isHome ? 'vs' : 'at'}</span>
                                      <Link href={`/team/${opSlug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{opDisplay}</Link>
                                    </td>
                                    <td className={cn(td, 'text-right font-medium text-[var(--txt)]')}>{scoreStr}</td>
                                    <td className={cn(td, 'text-left')}>
                                      <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-bold',
                                        result === 'W' ? 'text-green-700 bg-green-50' :
                                        result === 'L' ? 'text-red-700 bg-red-50' :
                                        'text-[var(--muted)] bg-[var(--inp-bg)]')}>
                                        {result}
                                      </span>
                                    </td>
                                    <td className={cn(td, 'w-10')} />
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Top Players carousel */}
            {playerRows.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Players</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => playersRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => playersRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={playersRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {playerRows.map((p, i) => {
                      const stat = topStat(p)
                      return (
                        <Link key={`${p.player_slug}-${p.stat_type}-${i}`}
                          href={`/player/${p.player_slug}`}
                          className="shrink-0 w-[210px] h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 flex items-center gap-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                          <div className="shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden">
                            {PLAYER_PHOTOS[p.player_slug as string] ? (
                              <Image src={PLAYER_PHOTOS[p.player_slug as string]} alt="" width={60} height={60} className="w-full h-full object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full bg-[var(--inp-bg)] rounded-lg" />
                            )}
                          </div>
                          <div className="flex flex-col justify-between flex-1 min-w-0 h-[60px]">
                            <div>
                              <p className="text-sm font-bold text-[var(--txt)] leading-snug truncate">{p.player_name as string}</p>
                              <p className="text-xs text-[var(--muted)] mt-0.5">{p.stat_type as string}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{stat.value}</span>
                              <span className="text-xs text-[var(--muted)]">{stat.label}</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Division Standings carousel */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Division {division} Standings</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => divRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => divRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div ref={divRef} className="overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-1">
                  {divTeams.map(t => {
                    const tSchoolSlug = (t.slug as string).replace(/-varsity-football$/, '')
                    const tLogo = SCHOOL_LOGOS[tSchoolSlug]
                    return (
                      <Link key={t.slug as string} href={`/team/${t.slug}`}
                        className="shrink-0 w-[210px] h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 flex items-center gap-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                        {/* Logo */}
                        <div className="shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden flex items-center justify-center">
                          {tLogo ? (
                            <Image src={tLogo} alt="" width={60} height={60} className="w-full h-full object-contain p-1" unoptimized />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                        {/* Text */}
                        <div className="flex flex-col justify-between flex-1 min-w-0 h-[60px]">
                          <p className="text-sm font-bold text-[var(--txt)] leading-snug truncate">{(t.name as string).replace(/\s+Varsity\s+Football$/i, '')}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>
                              {fmtRecord(t.overall_wins as number | null, t.overall_losses as number | null)}
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              {fmtPct(t.overall_wins as number | null, t.overall_losses as number | null)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={teamName} />
    </>
  )
}
