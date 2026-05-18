'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChartSpline, Map, MessageCircle, Info, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS, SCHOOL_LOGOS, PLAYER_PHOTOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { InfoTable } from '@/components/InfoTable'
import { cn, formatSeason } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import { GLOSSARY_TERMS } from '@/lib/glossary-terms'
import { CardLandscapeMini, WLBadge } from '@/components/CardLandscapeMini'

const GLOSSARY_MAP = Object.fromEntries(GLOSSARY_TERMS.map(t => [t.id, t]))

function SortTh({ col, label, right, glossaryId, sortCol, sortDir, onSort }: {
  col: string; label: string; right?: boolean; glossaryId?: string
  sortCol: string | null; sortDir: 'asc' | 'desc'; onSort: (col: string) => void
}) {
  const active = sortCol === col
  const term = glossaryId ? GLOSSARY_MAP[glossaryId] : undefined
  return (
    <th className={cn('px-2 py-3 border-b border-[var(--border)] bg-[var(--surface)]', right ? 'text-right' : 'text-left')}>
      <div className={cn('relative inline-block group/th', right && 'text-right')} style={{ textAlign: right ? 'right' : 'left' }}>
        <button onClick={() => onSort(col)}
          className={cn('inline-flex items-center gap-1 rounded-md px-0 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 whitespace-nowrap',
            active ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>
          {label}
          {active
            ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
            : <ChevronUp className="h-3 w-3 opacity-0" />}
        </button>
        {term && (
          <div className={cn(
            'pointer-events-none group-hover/th:pointer-events-auto absolute top-full z-50 mt-2 hidden group-hover/th:block w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl text-left normal-case tracking-normal whitespace-normal overflow-hidden',
            right ? 'right-0' : 'left-0'
          )}>
            <div className="px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--txt)] mb-1.5">{term.name}</p>
              <p className="text-[12px] text-[var(--muted)] leading-relaxed font-normal">{term.definition}</p>
            </div>
            <Link href={`/glossary#${glossaryId}`} onClick={e => e.stopPropagation()}
              className="pointer-events-auto flex items-center justify-between gap-2 border-t border-[var(--border)] px-3.5 py-2.5 text-[11px] font-medium hover:bg-[var(--inp-bg)] transition-colors"
              style={{ color: ACCENT_COLOR }}>
              <span className="inline-flex items-center gap-1.5"><Info className="h-3 w-3" />Learn more</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </th>
  )
}

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

function MaybeLayout({ panelMode, mobileHeader, children }: {
  panelMode: boolean; mobileHeader: React.ReactNode; children: React.ReactNode
}) {
  if (panelMode) return <>{children}</>
  return (
    <AppLayout mobileHeader={mobileHeader}>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </AppLayout>
  )
}

export function TeamShell({
  team, prevSlug, nextSlug, seasonRows, divTeams, playerRows, gameRows,
  panelMode = false,
}: {
  team: Record<string, unknown>
  prevSlug: string
  nextSlug: string
  seasonRows: Record<string, unknown>[]
  divTeams: Record<string, unknown>[]
  playerRows: Record<string, unknown>[]
  gameRows: GameRow[]
  panelMode?: boolean
}) {
  const [profileIdx, setProfileIdx]     = useState(0)
  const [infoExpanded, setInfoExpanded] = useState(true)
  const [chartsOpen, setChartsOpen]     = useState(false)
  const [mapsOpen,   setMapsOpen]       = useState(false)
  const [chatOpen,   setChatOpen]       = useState(false)
  const [sortCol, setSortCol]           = useState<string | null>(null)
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc')
  const [slideIdx, setSlideIdx]         = useState(0)
  const playersRef  = useRef<HTMLDivElement>(null)
  const divRef      = useRef<HTMLDivElement>(null)

  const gameSeasons = useMemo(() =>
    [...new Set(gameRows.map(g => g.season))].sort((a, b) => b - a),
    [gameRows]
  )

  const teamName = team.name as string
  const division = team.division as string
  const section  = team.section as string
  const level    = team.level as string | undefined
  const gender   = team.gender as string | undefined
  const schoolSlug  = team.school_slug as string
  const heroPhotos  = TEAM_PHOTOS[schoolSlug] ?? []

  useEffect(() => {
    if (heroPhotos.length < 2) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % heroPhotos.length), 4000)
    return () => clearInterval(t)
  }, [heroPhotos.length])

  // Build season history rows
  const historyRows = seasonRows.map(s => {
    const pf = s.points_for as number | null
    const pa = s.points_against as number | null
    const ow = (s.overall_wins as number | null) ?? 0
    const ol = (s.overall_losses as number | null) ?? 0
    const ot = (s.overall_ties as number | null) ?? 0
    const cw = (s.conference_wins as number | null) ?? 0
    const cl = (s.conference_losses as number | null) ?? 0
    const gp = ow + ol + ot
    const avgPf = pf != null && gp > 0 ? pf / gp : null
    const avgPa = pa != null && gp > 0 ? pa / gp : null
    const diff = pf != null && pa != null ? pf - pa : null
    const winPct = gp > 0 ? ow / gp : null
    const defGrade = avgPa == null ? null
      : avgPa <= 14 ? 'Elite'
      : avgPa <= 21 ? 'Strong'
      : avgPa <= 28 ? 'Average'
      : 'Vulnerable'
    return {
      seasonKey: s.season as number,
      season: formatSeason(s.season as number),
      overall: fmtRecord(ow, ol, ot),
      conf: fmtRecord(cw, cl),
      pf, pa, avgPf, avgPa, diff, defGrade,
      sos: s.sos_value as number | null,
      _ow: ow, _cw: cw, _winPct: winPct,
    }
  })

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sortedHistoryRows = useMemo(() => {
    if (!sortCol) return historyRows
    const key = (r: typeof historyRows[0]): number => {
      switch (sortCol) {
        case 'season':  return r.seasonKey
        case 'overall': return r._ow
        case 'conf':    return r._cw
        case 'pf':      return r.pf ?? -Infinity
        case 'pa':      return r.pa ?? -Infinity
        case 'avgPf':   return r.avgPf ?? -Infinity
        case 'avgPa':   return r.avgPa ?? -Infinity
        case 'defGrade': return r.avgPa != null ? -r.avgPa : Infinity
        case 'sos':      return r.sos ?? -Infinity
        case 'diff':    return r.diff ?? -Infinity
        case 'winPct':  return r._winPct ?? -Infinity
        default:        return 0
      }
    }
    return [...historyRows].sort((a, b) => sortDir === 'asc' ? key(a) - key(b) : key(b) - key(a))
  }, [historyRows, sortCol, sortDir])

  const fmtSeason = (y: number) => `${y}-${String(y + 1).slice(2)}`

  const PROFILES = [
    { title: 'All Seasons', h2: 'All Seasons', kind: 'history' as const },
    ...gameSeasons.map(s => ({ title: fmtSeason(s), h2: fmtSeason(s), kind: 'games' as const, season: s })),
  ]

  const activeProfile = PROFILES[profileIdx]

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const roundBtn = 'inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors'
  const td = 'px-2 py-2.5 border-b border-[var(--border)] text-sm'

  const heroLogo  = SCHOOL_LOGOS[schoolSlug]
  const mobileHeader = (
    <div className="flex items-center gap-2 w-full">
      {heroLogo ? (
        <Image src={heroLogo} alt="" width={36} height={36} className="shrink-0 h-9 w-9 rounded-full bg-white p-0.5 object-contain ring-1 ring-[var(--border)]" unoptimized />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-tight truncate">{teamName.replace(/\s*Varsity\s+/i, ' ').trim()}</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight truncate">Section XI · Division {division}</p>
      </div>
    </div>
  )

  return (
    <>
      <MaybeLayout panelMode={panelMode} mobileHeader={mobileHeader}>
        <div className="mx-auto max-w-4xl px-5 pt-2 pb-8 sm:py-8">

            {/* Header — hidden on mobile (team info moved to AppLayout header) */}
            <div className="hidden sm:flex mb-8 items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[var(--txt)]">{teamName}</h1>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <Link href="/section/xi" className="hover:text-[var(--txt)] transition-colors">Section XI</Link>
                  <span>/</span>
                  <Link href={`/division/division-${division.toLowerCase()}`} className="hover:text-[var(--txt)] transition-colors">Division {division}</Link>
                  <span>/</span>
                  <span className="font-medium" style={{ color: ACCENT_COLOR }}>{teamName}</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={panelMode ? `/maps/${prevSlug}` : `/team/${prevSlug}`} scroll={!panelMode} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
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
                    <Link href={panelMode ? `/maps/${nextSlug}` : `/team/${nextSlug}`} scroll={!panelMode} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero slider */}
            {heroPhotos.length > 0 ? (
              <div className="hidden sm:block mb-8 relative rounded-2xl overflow-hidden w-full" style={{ height: 400 }}>
                {heroPhotos.map((src, i) => (
                  <div key={src}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: i === slideIdx ? 1 : 0 }}>
                    <Image src={src} alt="" fill className="object-cover object-top" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  </div>
                ))}
                <div className="absolute bottom-0 left-0 p-5 pointer-events-none">
                  <p className="text-base font-bold text-white leading-snug">{teamName.replace(/\s*Varsity\s+Football\s*/i, '').trim()}</p>
                  <p className="text-sm text-white/60 mt-0.5">Section XI · Division {division}</p>
                </div>
                {heroPhotos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                    {heroPhotos.map((_, i) => (
                      <button key={i} onClick={() => setSlideIdx(i)}
                        className="h-2 rounded-full bg-white transition-all duration-500 ease-in-out"
                        style={{ width: i === slideIdx ? 28 : 8, opacity: i === slideIdx ? 1 : 0.45 }} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex mb-8 h-[400px] w-full rounded-2xl border border-[var(--border)] overflow-hidden flex-col items-center justify-center gap-3"
                style={{ background: `linear-gradient(135deg,${ACCENT_COLOR}22 0%,${ACCENT_COLOR}44 100%)` }}>
                {SCHOOL_LOGOS[schoolSlug] ? (
                  <Image src={SCHOOL_LOGOS[schoolSlug]!} alt="" width={64} height={64} className="object-contain" unoptimized />
                ) : (
                  <Map className="h-12 w-12 text-[var(--muted)]" />
                )}
                <p className="text-sm font-semibold text-[var(--txt2)]">{teamName} · Section XI Division {division}</p>
              </div>
            )}

            {/* Profiles */}
            <div className="mb-8">
              <InfoTable
                title={activeProfile.h2}
                onToggle={() => setInfoExpanded(v => !v)}
                onPrev={() => { setProfileIdx(i => (i - 1 + PROFILES.length) % PROFILES.length); setInfoExpanded(true) }}
                onNext={() => { setProfileIdx(i => (i + 1) % PROFILES.length); setInfoExpanded(true) }}
              >

                {/* Season History */}
                {PROFILES[profileIdx].kind === 'history' && (
                  historyRows.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--muted)]">No season data available.</div>
                  ) : (
                    <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr>
                          <SortTh col="season"  label="Season"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                          <SortTh col="overall" label="Overall" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="overall" />
                          <SortTh col="conf"    label="Conf"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="conf" />
                          <SortTh col="pf"      label="PF"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="pf"     right />
                          <SortTh col="pa"      label="PA"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="pa"     right />
                          <SortTh col="avgPf"   label="Avg PF"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="avg-pf" right />
                          <SortTh col="avgPa"   label="Avg PA"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="avg-pa" right />
                          <SortTh col="defGrade" label="Def"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="defense-grade" right />
                          <SortTh col="sos"     label="SoS"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="sos"    right />
                          <SortTh col="diff"    label="Diff"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="diff"   right />
                          <SortTh col="winPct"  label="PCT"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="pct"    right />
                        </tr>
                      </thead>
                      <tbody>
                        {(infoExpanded ? sortedHistoryRows : sortedHistoryRows.slice(0, 2)).map(row => (
                          <tr key={row.season} className="border-t border-[var(--border)]">
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.season}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.overall}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.conf}</td>
                            <td className={cn(td, 'text-right text-[var(--muted)]')}>{row.pf ?? '—'}</td>
                            <td className={cn(td, 'text-right text-[var(--muted)]')}>{row.pa ?? '—'}</td>
                            <td className={cn(td, 'text-right text-[var(--muted)]')}>{row.avgPf != null ? row.avgPf.toFixed(1) : '—'}</td>
                            <td className={cn(td, 'text-right text-[var(--muted)]')}>{row.avgPa != null ? row.avgPa.toFixed(1) : '—'}</td>
                            <td className={cn(td, 'text-right')}>
                              {row.defGrade ? (
                                <span className={cn('text-xs font-semibold',
                                  row.defGrade === 'Elite'      ? 'text-green-600' :
                                  row.defGrade === 'Strong'     ? 'text-blue-600'  :
                                  row.defGrade === 'Average'    ? 'text-amber-600' :
                                  'text-red-500')}>
                                  {row.defGrade}
                                </span>
                              ) : '—'}
                            </td>
                            <td className={cn(td, 'text-right text-[var(--muted)]')}>
                              {row.sos != null ? row.sos.toFixed(3).replace(/^0/, '') : '—'}
                            </td>
                            <td className={cn(td, 'text-right font-medium', row.diff == null ? 'text-[var(--muted)]' : row.diff >= 0 ? 'text-green-600' : 'text-red-500')}>
                              {row.diff == null ? '—' : row.diff >= 0 ? `+${row.diff}` : String(row.diff)}
                            </td>
                            <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>
                              {row._winPct != null ? row._winPct.toFixed(3).replace(/^0/, '') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
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
                          <table className="w-full text-sm table-fixed">
                            <thead>
                              <tr onClick={() => setInfoExpanded(v => !v)}
                                className="bg-[var(--surface)] hover:bg-[var(--inp-bg)] cursor-pointer transition-colors">
                                <th className="w-[20%] px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Date</th>
                                <th className="w-[20%] px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Opponent</th>
                                <th className="w-[20%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Score</th>
                                <th className="w-[20%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Diff</th>
                                <th className="w-[20%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Result</th>
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
                                const opSchoolSlug = opSlug.replace(/-varsity-football$/, '')
                                const opLogo  = SCHOOL_LOGOS[opSchoolSlug]
                                const diff     = myScore != null && opScore != null ? myScore - opScore : null
                                const diffStr  = diff == null ? '—' : diff > 0 ? `+${diff}` : String(diff)
                                const diffColor = diff == null ? 'var(--muted)' : diff > 0 ? '#15803d' : diff < 0 ? '#b91c1c' : 'var(--muted)'
                                return (
                                  <tr key={g.id} className="border-t border-[var(--border)] hover:bg-[var(--inp-bg)] transition-colors">
                                    <td className={cn(td, 'text-[var(--txt2)] tabular-nums')}>{fmtGameDate(g.game_date)}</td>
                                    <td className={cn(td, 'font-medium overflow-hidden')}>
                                      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                                        <span className="text-xs text-[var(--muted)] shrink-0">{isHome ? 'vs' : 'at'}</span>
                                        {opLogo && (
                                          <Image src={opLogo} alt="" width={20} height={20} className="shrink-0 h-5 w-5 object-contain" unoptimized />
                                        )}
                                        <Link href={`/team/${opSlug}`} className="hover:underline truncate" style={{ color: ACCENT_COLOR }}>{opDisplay}</Link>
                                      </div>
                                    </td>
                                    <td className={cn(td, 'text-right font-medium whitespace-nowrap')}>
                                      {g.id ? (
                                        <Link href={`/game/${g.id}?ref=${team.slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{scoreStr}</Link>
                                      ) : scoreStr}
                                    </td>
                                    <td className={cn(td, 'text-right tabular-nums text-xs font-semibold')} style={{ color: diffColor }}>{diffStr}</td>
                                    <td className={cn(td, 'text-right')}>
                                      <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-bold',
                                        result === 'W' ? 'text-green-700 bg-green-50' :
                                        result === 'L' ? 'text-red-700 bg-red-50' :
                                        'text-[var(--muted)] bg-[var(--inp-bg)]')}>
                                        {result}
                                      </span>
                                    </td>
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
              </InfoTable>
            </div>

            {/* Games carousel — synced to active InfoTable season */}
            {(() => {
              const carouselSeason = activeProfile.kind === 'games'
                ? (activeProfile as { season: number }).season
                : gameSeasons[0]
              if (carouselSeason == null) return null
              const carouselGames = gameRows.filter(g => g.season === carouselSeason)
              if (carouselGames.length === 0) return null
              return (
                <div className="mb-8">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[var(--txt)]">Games · {fmtSeason(carouselSeason)}</h2>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 pb-1">
                      {carouselGames.map(g => {
                        const isHome    = g.home_team_slug === team.slug
                        const opSlug    = isHome ? g.away_team_slug  : g.home_team_slug
                        const opName    = isHome ? g.away_team_name  : g.home_team_name
                        const myScore   = isHome ? g.home_score      : g.away_score
                        const opScore   = isHome ? g.away_score      : g.home_score
                        const result    = myScore == null || opScore == null ? null
                          : myScore > opScore ? 'W' : myScore < opScore ? 'L' : 'T'
                        const opSchoolSlug = opSlug.replace(/-varsity-football$/, '')
                        const opLogo    = SCHOOL_LOGOS[opSchoolSlug]
                        const opDisplay = (opName ?? opSlug)
                          .replace(/\s+Varsity\s+Football$/i, '')
                          .replace(/-varsity-football$/, '')
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, c => c.toUpperCase())
                        return (
                          <CardLandscapeMini
                            key={g.id}
                            href={`/game/${g.id}?ref=${team.slug}`}
                            title={isHome ? opDisplay : `at ${opDisplay}`}
                            titlePadRight
                            badge={result ? <WLBadge result={result as 'W' | 'L' | 'T'} /> : undefined}
                            image={opLogo ? <Image src={opLogo} alt="" width={45} height={45} className="object-contain" unoptimized /> : undefined}
                            row2={{ text: fmtGameDate(g.game_date) ?? '—' }}
                            stat={{ value: myScore != null && opScore != null ? `${myScore}–${opScore}` : '—' }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Top Players carousel */}
            {playerRows.length > 0 && (
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Players</h2>
                </div>
                <div ref={playersRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {playerRows.map((p, i) => {
                      const stat = topStat(p)
                      const playerPhoto = PLAYER_PHOTOS[p.player_slug as string]
                      const fallbackLogo = SCHOOL_LOGOS[schoolSlug]
                      const img = playerPhoto
                        ? <Image src={playerPhoto} alt="" width={45} height={45} className="w-[45px] h-[45px] rounded-lg object-cover" unoptimized />
                        : fallbackLogo
                        ? <Image src={fallbackLogo} alt="" width={45} height={45} className="object-contain" unoptimized />
                        : undefined
                      return (
                        <CardLandscapeMini
                          key={`${p.player_slug}-${p.stat_type}-${i}`}
                          href={`/player/${p.player_slug}`}
                          image={img}
                          title={p.player_name as string}
                          row2={{ text: p.position ? `${p.position}, ${p.stat_type}` : (p.stat_type as string) }}
                          stat={{ value: stat.value, label: stat.label }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Division Standings carousel */}
            <div className="mb-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Division {division} Standings</h2>
              </div>
              <div ref={divRef} className="overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-1">
                  {divTeams.map(t => {
                    const tSchoolSlug = (t.slug as string).replace(/-varsity-football$/, '')
                    const tLogo = SCHOOL_LOGOS[tSchoolSlug]
                    return (
                      <CardLandscapeMini
                        key={t.slug as string}
                        href={`/team/${t.slug}`}
                        image={tLogo ? <Image src={tLogo} alt="" width={45} height={45} className="object-contain" unoptimized /> : undefined}
                        title={(t.name as string).replace(/\s+Varsity\s+Football$/i, '')}
                        stat={{ value: fmtRecord(t.overall_wins as number | null, t.overall_losses as number | null) }}
                        statFirst
                        row2={{ text: fmtPct(t.overall_wins as number | null, t.overall_losses as number | null) }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

          </div>
      </MaybeLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={teamName} />
    </>
  )
}
