'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChartSpline, Map, MessageCircle, Info, ArrowUpRight, ArrowLeft, ArrowRight, Users } from 'lucide-react'
import Image from 'next/image'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS, SCHOOL_LOGOS, PLAYER_PHOTOS } from '@/lib/team-images'
import { SCHOOL_COLORS } from '@/lib/school-colors'
import { RevealFx } from '@/components/RevealFx'
import { AnimatePresence, motion } from 'framer-motion'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { AppPanel } from '@/components/AppPanel'
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
    <th className={cn('px-2 py-3 border-b border-[var(--border)] bg-[var(--surface)]', right ? 'text-center' : 'text-left')}>
      <div className={cn('relative group/th', right ? 'w-full flex justify-center' : 'inline-block')}>
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
  const fmt = (n: unknown) => Number(n ?? 0).toLocaleString()
  if (stat === 'Passing')     return { label: 'Pass Yds',  value: fmt(row.pass_yards) }
  if (stat === 'Rushing')     return { label: 'Rush Yds',  value: fmt(row.rush_yards) }
  if (stat === 'Receiving')   return { label: 'Recv Yds',  value: fmt(row.recv_yards) }
  if (stat === 'Scoring')     return { label: 'Points',    value: fmt(row.points) }
  if (stat === 'Touchdowns')  return { label: 'TDs',       value: fmt(row.total_tds) }
  if (stat === 'Total Yards') return { label: 'Total Yds', value: fmt(row.total_yards) }
  return { label: 'Yds', value: fmt(row.total_yards) }
}

function statLabel(stat_type: string): string {
  const map: Record<string, string> = {
    'Passing': 'Passing Yards', 'Rushing': 'Rushing Yards', 'Receiving': 'Receiving Yards',
    'Scoring': 'Points', 'Touchdowns': 'Touchdowns', 'Total Yards': 'Total Yards',
  }
  return map[stat_type] ?? stat_type
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
  team, prevSlug, nextSlug, seasonRows, divTeams, playerRows, rosterRows = [], gameRows, allSeasonStats = [],
  panelMode = false,
}: {
  team: Record<string, unknown>
  prevSlug: string
  nextSlug: string
  seasonRows: Record<string, unknown>[]
  divTeams: Record<string, unknown>[]
  playerRows: Record<string, unknown>[]
  rosterRows?: Record<string, unknown>[]
  gameRows: GameRow[]
  allSeasonStats?: { team_slug: string; season: number; overall_wins: number; overall_losses: number }[]
  panelMode?: boolean
}) {
  const [profileIdx, setProfileIdx]     = useState(0)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [chartsOpen,  setChartsOpen]    = useState(false)
  const [mapsOpen,    setMapsOpen]      = useState(false)
  const [chatOpen,    setChatOpen]      = useState(false)
  const [playersOpen,   setPlayersOpen]  = useState(false)
  const [playerSearch,  setPlayerSearch] = useState('')
  const [sortCol, setSortCol]           = useState<string | null>(null)
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc')
  const [carouselDir, setCarouselDir]   = useState(1)
  const [slideIdx, setSlideIdx]         = useState(0)
  const playersRef  = useRef<HTMLDivElement>(null)
  const divRef      = useRef<HTMLDivElement>(null)

  const gameSeasons = useMemo(() =>
    [...new Set(gameRows.map(g => g.season))].sort((a, b) => b - a),
    [gameRows]
  )

  // PCT-based rank per season: { season -> { team_slug -> { rank, pct } } }
  const oppStatMap = useMemo(() => {
    const map: Record<number, Record<string, { rank: number; pct: number }>> = {}
    const seasons = [...new Set(allSeasonStats.map(r => r.season))]
    for (const season of seasons) {
      const rows = allSeasonStats
        .filter(r => r.season === season)
        .map(r => {
          const gp = (r.overall_wins ?? 0) + (r.overall_losses ?? 0)
          const pct = gp > 0 ? r.overall_wins / gp : 0
          return { team_slug: r.team_slug, pct, wins: r.overall_wins ?? 0 }
        })
        .sort((a, b) => b.pct - a.pct || b.wins - a.wins)
      map[season] = {}
      rows.forEach((r, i) => { map[season][r.team_slug] = { rank: i + 1, pct: r.pct } })
    }
    return map
  }, [allSeasonStats])

  const teamName = team.name as string
  const division = team.division as string
  const section  = team.section as string
  const level    = team.level as string | undefined
  const gender   = team.gender as string | undefined
  const schoolSlug  = team.school_slug as string
  const heroPhotos  = TEAM_PHOTOS[schoolSlug] ?? []

  // Placeholder is always slide 0 — makes it easy to spot teams needing more photos
  type HeroSlide = { kind: 'photo'; url: string } | { kind: 'placeholder' }
  const heroSlides: HeroSlide[] = [
    { kind: 'placeholder' },
    ...heroPhotos.map(url => ({ kind: 'photo' as const, url })),
  ]

  useEffect(() => {
    if (heroSlides.length < 2) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % heroSlides.length), 4000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroSlides.length])

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
  const slideVariants = {
    enter:  (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0 }),
  }

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
            <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
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
                    <button onClick={() => setPlayersOpen(v => !v)} className={`${btn} ${playersOpen ? active : ''}`}><Users className="h-4 w-4" /></button>
                    <span className={tip}>Players</span>
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
            </RevealFx>

            {/* Hero slider */}
            <RevealFx delay={0.15} translateY={16}>
            {heroSlides.length > 0 ? (
              <div className="block mb-8 relative rounded-2xl overflow-hidden w-full h-[400px]">
                {heroSlides.map((slide, i) => (
                  <div key={i}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: i === slideIdx ? 1 : 0 }}>
                    {slide.kind === 'placeholder' ? (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: SCHOOL_COLORS[schoolSlug]?.primary ?? ACCENT_COLOR }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {SCHOOL_LOGOS[schoolSlug] && (
                          <Image src={SCHOOL_LOGOS[schoolSlug]!} alt="" width={96} height={96}
                            className="object-contain relative z-10"
                            style={{ filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.45))' }}
                            unoptimized />
                        )}
                      </div>
                    ) : (
                      <>
                        <Image src={slide.url} alt="" fill className="object-cover object-top" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      </>
                    )}
                  </div>
                ))}
                <div className="absolute bottom-0 left-0 p-5 pointer-events-none">
                  <p className="text-base font-bold text-white leading-snug">{teamName.replace(/\s*Varsity\s+Football\s*/i, '').trim()}</p>
                  <p className="text-sm text-white/60 mt-0.5">Section XI · Division {division}</p>
                </div>
                {heroSlides.length > 1 && (
                  <>
                    <button onClick={() => setSlideIdx(i => (i - 1 + heroSlides.length) % heroSlides.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={() => setSlideIdx(i => (i + 1) % heroSlides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                      {heroSlides.map((_, i) => (
                        <button key={i} onClick={() => setSlideIdx(i)}
                          className="h-2 rounded-full bg-white transition-all duration-500 ease-in-out"
                          style={{ width: i === slideIdx ? 28 : 8, opacity: i === slideIdx ? 1 : 0.45 }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex mb-8 h-[220px] sm:h-[400px] w-full rounded-2xl border border-[var(--border)] overflow-hidden flex-col items-center justify-center gap-3"
                style={{ background: `linear-gradient(135deg,${ACCENT_COLOR}22 0%,${ACCENT_COLOR}44 100%)` }}>
                {SCHOOL_LOGOS[schoolSlug] ? (
                  <Image src={SCHOOL_LOGOS[schoolSlug]!} alt="" width={64} height={64} className="object-contain" unoptimized />
                ) : (
                  <Map className="h-12 w-12 text-[var(--muted)]" />
                )}
                <p className="text-sm font-semibold text-[var(--txt2)]">{teamName} · Section XI Division {division}</p>
              </div>
            )}
            </RevealFx>

            {/* Profiles */}
            <RevealFx delay={0.3} translateY={8}>
            <div className="mb-8">
              <div className="flex items-center justify-between pt-3 mb-4">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Program</h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setCarouselDir(-1); setProfileIdx(i => (i - 1 + PROFILES.length) % PROFILES.length); setInfoExpanded(false) }}
                    className="p-1 text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] rounded-md transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setCarouselDir(1); setProfileIdx(i => (i + 1) % PROFILES.length); setInfoExpanded(false) }}
                    className="p-1 text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] rounded-md transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <InfoTable
                title={activeProfile.h2}
                onToggle={() => setInfoExpanded(v => !v)}
              >

                {/* Season History */}
                {PROFILES[profileIdx].kind === 'history' && (
                  historyRows.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--muted)]">No season data available.</div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="min-w-[520px] w-full text-sm">
                      <thead>
                        <tr>
                          <SortTh col="season"  label="Season"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                          <SortTh col="overall" label="Overall" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="overall" />
                          <SortTh col="conf"    label="Conf"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="conf" />
                          <SortTh col="diff"    label="Diff"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="diff" />
                          <SortTh col="pf"      label="PF"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="pf" />
                          <SortTh col="pa"      label="PA"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="pa" />
                          <SortTh col="sos"     label="SoS"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="sos" />
                        </tr>
                      </thead>
                      <tbody>
                        {(infoExpanded ? sortedHistoryRows : sortedHistoryRows.slice(0, 2)).map(row => {
                          const seasonProfileIdx = PROFILES.findIndex(p => p.kind === 'games' && (p as { season: number }).season === row.seasonKey)
                          return (
                          <tr key={row.season} className="border-t border-[var(--border)] hover:bg-[var(--inp-bg)] cursor-pointer transition-colors"
                            onClick={() => { if (seasonProfileIdx !== -1) { setProfileIdx(seasonProfileIdx); setInfoExpanded(true) } }}>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.season}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.overall}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.conf}</td>
                            <td className={cn(td, 'font-medium', row.diff == null ? 'text-[var(--muted)]' : row.diff >= 0 ? 'text-green-600' : 'text-red-500')}>
                              {row.diff == null ? '—' : row.diff >= 0 ? `+${row.diff}` : String(row.diff)}
                            </td>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.pf ?? '—'}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>{row.pa ?? '—'}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>
                              {row.sos != null ? row.sos.toFixed(3).replace(/^0/, '') : '—'}
                            </td>
                          </tr>
                        )})}
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
                                <th className="w-[13%] px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Date</th>
                                <th className="w-[20%] px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Opponent</th>
                                <th className="w-[10%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Opp PCT</th>
                                <th className="w-[10%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">PF</th>
                                <th className="w-[10%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">PA</th>
                                <th className="w-[10%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Diff</th>
                                <th className="w-[14%] px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Result</th>
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
                                    <td className={cn(td, 'text-right tabular-nums text-[var(--muted)]')}>
                                      {oppStatMap[g.season]?.[opSlug] != null
                                        ? oppStatMap[g.season][opSlug].pct.toFixed(3).replace(/^0/, '')
                                        : '—'}
                                    </td>
                                    <td className={cn(td, 'text-right tabular-nums text-[var(--muted)]')}>{myScore ?? '—'}</td>
                                    <td className={cn(td, 'text-right tabular-nums text-[var(--muted)]')}>{opScore ?? '—'}</td>
                                    <td className={cn(td, 'text-right tabular-nums text-xs font-semibold')} style={{ color: diffColor }}>{diffStr}</td>
                                    <td className={cn(td, 'text-right font-medium whitespace-nowrap')}>
                                      {g.id ? (
                                        <Link href={`/game/${g.id}?ref=${team.slug}`} className="hover:underline"
                                          style={{ color: result === 'W' ? '#15803d' : result === 'L' ? '#b91c1c' : 'var(--muted)' }}>
                                          {scoreStr}
                                        </Link>
                                      ) : scoreStr}
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

            {/* Search */}
            <div className="sticky top-5 z-10 mb-8 bg-[var(--surface)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--txt)] mb-3">Search</h2>
              <input
                type="text"
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
                placeholder="Search players, games…"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--txt)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--muted)] transition-colors"
              />
            </div>

            {/* Games carousel — synced to active InfoTable season */}
            {(() => {
              const isAllSeasons = activeProfile.kind === 'history'
              const carouselSeason = isAllSeasons
                ? null
                : (activeProfile as { season: number }).season
              let carouselGames = carouselSeason != null
                ? gameRows.filter(g => g.season === carouselSeason)
                : gameRows
              if (playerSearch) {
                const q = playerSearch.toLowerCase()
                carouselGames = carouselGames.filter(g => {
                  const opName = (g.home_team_slug === team.slug ? g.away_team_name : g.home_team_name) ?? ''
                  return opName.toLowerCase().includes(q)
                })
              }
              if (carouselGames.length === 0) return null
              return (
                <div className="mb-8">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[var(--txt)]">
                      {isAllSeasons ? 'Games' : fmtSeason(carouselSeason!)}
                    </h2>
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
                            image={opLogo ? <Image src={opLogo} alt="" width={45} height={45} className="object-contain" unoptimized /> : undefined}
                            row2={g.game_number != null ? { text: `Week ${g.game_number}` } : undefined}
                            stat={{ value: myScore != null && opScore != null ? `${myScore}–${opScore}` : '—', color: result === 'W' ? '#15803d' : result === 'L' ? '#b91c1c' : undefined }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Players carousel — synced to active InfoTable season */}
            {(() => {
              const isAllSeasons = activeProfile.kind === 'history'
              const carouselSeason = isAllSeasons ? null : (activeProfile as { season: number }).season
              const teamLogo = SCHOOL_LOGOS[schoolSlug]

              // Build player list: filter by season, deduplicate for all-seasons view
              let players: { player_name: string; player_slug: string; position: string | null; season: number }[] = []
              if (carouselSeason != null) {
                players = (rosterRows as Record<string, unknown>[])
                  .filter(r => Number(r.season) === carouselSeason)
                  .map(r => ({ player_name: r.player_name as string, player_slug: r.player_slug as string, position: r.position as string | null, season: Number(r.season) }))
                  .sort((a, b) => a.player_name.localeCompare(b.player_name))
              } else {
                // All players — deduplicate by slug, keep most recent season
                const seen = new Set<string>()
                players = (rosterRows as Record<string, unknown>[])
                  .filter(r => { if (seen.has(r.player_slug as string)) return false; seen.add(r.player_slug as string); return true })
                  .map(r => ({ player_name: r.player_name as string, player_slug: r.player_slug as string, position: r.position as string | null, season: Number(r.season) }))
                  .sort((a, b) => a.player_name.localeCompare(b.player_name))
              }

              if (playerSearch) {
                const q = playerSearch.toLowerCase()
                players = players.filter(p => p.player_name.toLowerCase().includes(q))
              }

              if (players.length === 0) return null
              return (
                <div className="mb-8">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[var(--txt)]">
                      {isAllSeasons ? 'Players' : fmtSeason(carouselSeason!)}
                    </h2>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 pb-1">
                      {players.map(p => {
                        const photo = PLAYER_PHOTOS[p.player_slug]
                        const img = photo
                          ? <Image src={photo} alt="" width={45} height={45} className="w-[45px] h-[45px] rounded-lg object-cover" unoptimized />
                          : teamLogo
                          ? <Image src={teamLogo} alt="" width={45} height={45} className="object-contain" unoptimized />
                          : undefined
                        return (
                          <CardLandscapeMini
                            key={`${p.player_slug}-${p.season}`}
                            href={`/player/${p.player_slug}`}
                            image={img}
                            title={p.player_name}
                            row2={p.position ? { text: p.position } : undefined}
                            stat={{ value: fmtSeason(p.season) }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

            </RevealFx>

            {/* Leader carousels — one per stat type */}
            <RevealFx delay={0.42} translateY={8}>
            {(() => {
              const q = playerSearch.toLowerCase()
              const leaderRows = playerSearch
                ? playerRows.filter(p => (p.player_name as string).toLowerCase().includes(q))
                : playerRows
              if (leaderRows.length === 0) return null
              return (
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Leaders</h2>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {leaderRows.map((p, i) => {
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
                          row2={{ text: statLabel(p.stat_type as string) }}
                          stat={{ value: stat.value }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
              )
            })()}



            {/* Division Standings carousel */}
            <RevealFx delay={0.52} translateY={8}>
            {(() => {
              const q = playerSearch.toLowerCase()
              const standingRows = playerSearch
                ? divTeams.filter(t => (t.name as string).toLowerCase().includes(q))
                : divTeams
              if (standingRows.length === 0) return null
              return (
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Standings</h2>
                </div>
                <div ref={divRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                  {standingRows.map((t, i) => {
                    const tSchoolSlug = (t.slug as string).replace(/-varsity-football$/, '')
                    const tLogo = SCHOOL_LOGOS[tSchoolSlug]
                    return (
                      <CardLandscapeMini
                        key={t.slug as string}
                        href={`/team/${t.slug}`}
                        image={tLogo ? <Image src={tLogo} alt="" width={45} height={45} className="object-contain" unoptimized /> : undefined}
                        title={(t.name as string).replace(/\s+Varsity\s+Football$/i, '')}
                        badge={<span className="text-[11px] text-[var(--muted)]">#{i + 1}</span>}
                        stat={{ value: fmtRecord(t.overall_wins as number | null, t.overall_losses as number | null) }}
                        statFirst
                        row2={{ text: fmtPct(t.overall_wins as number | null, t.overall_losses as number | null) }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
              )
            })()}
            </RevealFx>

            </RevealFx>

        </div>
      </MaybeLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={teamName} />
      <AppPanel open={playersOpen} onClose={() => setPlayersOpen(false)} title="Players">
        {(() => {
          const teamLogo = SCHOOL_LOGOS[schoolSlug]
          const seasons = [...new Set((rosterRows as Record<string, unknown>[]).map(r => Number(r.season)))].sort((a, b) => b - a)
          if (seasons.length === 0) return <div className="flex items-center justify-center h-32 text-sm text-[var(--muted)]">No roster data</div>
          return (
            <div className="pb-4">
              {seasons.map(season => {
                const players = (rosterRows as Record<string, unknown>[]).filter(r => Number(r.season) === season)
                if (players.length === 0) return null
                return (
                  <div key={season}>
                    <div className="px-4 pt-5 pb-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{fmtSeason(season)}</span>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {players.map((p, i) => {
                        const photo = PLAYER_PHOTOS[p.player_slug as string]
                        const img = photo ?? (teamLogo ?? null)
                        const slug = p.player_slug as string
                        return (
                          <Link key={i} href={`/player/${slug}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors">
                            {img
                              ? <Image src={img} alt="" width={28} height={28} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                              : <div className="shrink-0 h-7 w-7 rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold truncate block hover:underline" style={{ color: ACCENT_COLOR }}>{p.player_name as string}</span>
                              <p className="text-xs text-[var(--muted)] truncate">
                                {[p.jersey_number != null ? `#${p.jersey_number}` : null, p.position ?? null, p.class ?? null].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </AppPanel>
    </>
  )
}
