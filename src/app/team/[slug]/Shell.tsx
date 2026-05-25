'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  ChartSpline, Info, ArrowUpRight, ArrowLeft, ArrowRight, FileUser, MessageCircle,
} from 'lucide-react'
import Image from 'next/image'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS, SCHOOL_LOGOS, PLAYER_PHOTOS } from '@/lib/team-images'
import { SCHOOL_COLORS } from '@/lib/school-colors'
import { RevealFx } from '@/components/RevealFx'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { AppPanel } from '@/components/AppPanel'
import { cn, formatSeason } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import { GLOSSARY_TERMS } from '@/lib/glossary-terms'
import {
  EditorialHead,
  EditorialButtonGroup,
  SectionHead,
  StickyControlBar,
  ContentsNav,
  SearchInput,
  useSearchHotkey,
  PAPER_BRIDGE,
  MONO,
  TABLET_RADIUS,
} from '@/components/editorial'

const GLOSSARY_MAP = Object.fromEntries(GLOSSARY_TERMS.map(t => [t.id, t]))
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }

/* ── Sort header ─────────────────────────────────────────────────── */
function SortTh({ col, label, right, glossaryId, sortCol, sortDir, onSort }: {
  col: string; label: string; right?: boolean; glossaryId?: string
  sortCol: string | null; sortDir: 'asc' | 'desc'; onSort: (col: string) => void
}) {
  const active = sortCol === col
  const term = glossaryId ? GLOSSARY_MAP[glossaryId] : undefined
  return (
    <th className={cn('px-3 py-3 border-b border-[var(--paper-rule)]', right ? 'text-right' : 'text-left')}>
      <div className={cn('relative group/th', right ? 'inline-flex justify-end w-full' : 'inline-block')}>
        <button onClick={e => { e.stopPropagation(); onSort(col) }}
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap',
            active ? 'text-[var(--paper-text)]' : 'text-[var(--paper-faint)] hover:text-[var(--paper-muted)]',
          )}>
          {label}
          {active
            ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
            : <ChevronDown className="h-3 w-3 opacity-40" />}
        </button>
        {term && (
          <div className={cn(
            'pointer-events-none group-hover/th:pointer-events-auto absolute top-full z-50 mt-2 hidden group-hover/th:block w-64 rounded-xl border border-[var(--paper-rule)] bg-[var(--paper)] shadow-xl text-left normal-case tracking-normal whitespace-normal overflow-hidden',
            right ? 'right-0' : 'left-0',
          )}>
            <div className="px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--paper-text)] mb-1.5">{term.name}</p>
              <p className="text-[12px] text-[var(--paper-muted)] leading-relaxed font-normal">{term.definition}</p>
            </div>
            <Link href={`/glossary#${glossaryId}`} onClick={e => e.stopPropagation()}
              className="pointer-events-auto flex items-center justify-between gap-2 border-t border-[var(--paper-rule)] px-3.5 py-2.5 text-[11px] font-medium hover:bg-[var(--paper-quiet)] transition-colors"
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

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtPct(w: number | null, l: number | null): string {
  const wins = w ?? 0; const losses = l ?? 0; const g = wins + losses
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

function fmtRecord(w: number | null, l: number | null, ties?: number | null): string {
  if (w == null && l == null) return '—'
  const t = ties ?? 0
  return t > 0 ? `${w ?? 0}–${l ?? 0}–${t}` : `${w ?? 0}–${l ?? 0}`
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmtGameDate(raw: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  if (isNaN(d.getTime())) return '—'
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}

function fmtFullDate(raw: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  if (isNaN(d.getTime())) return '—'
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function fmtSeason(y: number) { return `${y}-${String(y + 1).slice(2)}` }

/* ── Types ───────────────────────────────────────────────────────── */
type PlayerGameLog = {
  game_id: number; player_slug: string; player_name: string; school_slug: string
  team_name: string | null; stat_type: string | null; season: number
  rush_att: number | null; rush_yds: number | null; rush_tds: number | null
  pass_comp: number | null; pass_att: number | null; pass_yds: number | null
  pass_tds: number | null; pass_int: number | null
  rec_rec: number | null; rec_yds: number | null; rec_tds: number | null
  kick_pat: number | null; kick_fg: number | null; kick_points: number | null
  def_int: number | null; def_sacks: number | null; def_fumbles: number | null
  home_team_slug: string; away_team_slug: string
  home_score: number | null; away_score: number | null; game_date: string | null
  home_team_name: string | null; away_team_name: string | null
}

type GameRow = {
  id: number; game_date: string | null; season: number
  home_team_slug: string; away_team_slug: string
  home_score: number | null; away_score: number | null
  is_division_game: boolean | null; game_number: number | null
  home_team_name: string | null; away_team_name: string | null
}

/* ── Panel wrapper ───────────────────────────────────────────────── */
function MaybeLayout({ panelMode, mobileHeader, children }: {
  panelMode: boolean; mobileHeader: React.ReactNode; children: React.ReactNode
}) {
  if (panelMode) return <>{children}</>
  return (
    <AppLayout mobileHeader={mobileHeader}>
      <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
    </AppLayout>
  )
}

/* ══════════════════════════════════════════════════════════════════ */
function topGameStat(log: PlayerGameLog): { label: string; value: string } {
  const s = log.stat_type ?? ''
  if (s === 'Passing')   return { label: 'Pass Yds', value: log.pass_yds != null ? String(log.pass_yds) : '—' }
  if (s === 'Rushing')   return { label: 'Rush Yds', value: log.rush_yds != null ? String(log.rush_yds) : '—' }
  if (s === 'Receiving') return { label: 'Recv Yds', value: log.rec_yds  != null ? String(log.rec_yds)  : '—' }
  if (s === 'Kicking')   return { label: 'Points',   value: log.kick_points != null ? String(log.kick_points) : '—' }
  if (s === 'Defense') {
    const parts = [
      log.def_int    ? `${log.def_int} INT`   : '',
      log.def_sacks  ? `${log.def_sacks} SCK` : '',
      log.def_fumbles? `${log.def_fumbles} FR` : '',
    ].filter(Boolean)
    return { label: 'Defense', value: parts.join(' ') || '—' }
  }
  return { label: s || 'Stat', value: '—' }
}

export function TeamShell({
  team, prevSlug, nextSlug, seasonRows, divTeams, playerRows, rosterRows = [], gameRows,
  allSeasonStats = [], totalRecords = 0, playerGameLogs = [], panelMode = false,
}: {
  team: Record<string, unknown>
  prevSlug: string; nextSlug: string
  seasonRows: Record<string, unknown>[]
  divTeams: Record<string, unknown>[]
  playerRows: Record<string, unknown>[]
  rosterRows?: Record<string, unknown>[]
  gameRows: GameRow[]
  allSeasonStats?: { team_slug: string; season: number; overall_wins: number; overall_losses: number }[]
  totalRecords?: number
  playerGameLogs?: Record<string, unknown>[]
  panelMode?: boolean
}) {
  const [chartsOpen,  setChartsOpen]  = useState(false)
  const [chatOpen,    setChatOpen]    = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const [sortCol, setSortCol]         = useState<string | null>(null)
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc')
  const [slideIdx, setSlideIdx]       = useState(0)
  const [query,   setQuery]           = useState('')
  const [activeSection, setActiveSection] = useState<string>('seasons')

  type TeamSectionId = 'seasons' | 'schedule' | 'player-logs' | 'players'
  const sectionRefs = useRef<Record<TeamSectionId, HTMLElement | null>>({
    seasons: null, schedule: null, 'player-logs': null, players: null,
  })
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  const teamName   = team.name as string
  const division   = team.division as string
  const schoolSlug = team.school_slug as string
  const cleanName  = teamName.replace(/\s+Varsity\s+Football$/i, '').trim()

  const heroPhotos = TEAM_PHOTOS[schoolSlug] ?? []
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

  /* ── Scroll-spy ──────────────────────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.4] }
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Season cycling ──────────────────────────────────────────── */
  const gameSeasons = useMemo(() =>
    [...new Set(gameRows.map(g => g.season))].sort((a, b) => b - a),
    [gameRows]
  )
  const [activeSeason, setActiveSeason] = useState<number | null>(gameSeasons[0] ?? null)
  const seasonCycleOptions: (number | null)[] = [null, ...gameSeasons]
  const cycleIdx = activeSeason === null ? 0 : seasonCycleOptions.indexOf(activeSeason)
  const seasonLabel = activeSeason === null ? 'All-Time' : formatSeason(activeSeason)
  const hasSeasonControl = seasonCycleOptions.length > 1

  function shiftSeason(delta: 1 | -1) {
    const len = seasonCycleOptions.length
    const next = (cycleIdx + delta + len) % len
    setActiveSeason(seasonCycleOptions[next])
  }

  /* ── Opponent win % map ──────────────────────────────────────── */
  const oppStatMap = useMemo(() => {
    const map: Record<number, Record<string, { rank: number; pct: number }>> = {}
    const seasons = [...new Set(allSeasonStats.map(r => r.season))]
    for (const season of seasons) {
      const rows = allSeasonStats
        .filter(r => r.season === season)
        .map(r => {
          const gp = (r.overall_wins ?? 0) + (r.overall_losses ?? 0)
          return { team_slug: r.team_slug, pct: gp > 0 ? r.overall_wins / gp : 0, wins: r.overall_wins ?? 0 }
        })
        .sort((a, b) => b.pct - a.pct || b.wins - a.wins)
      map[season] = {}
      rows.forEach((r, i) => { map[season][r.team_slug] = { rank: i + 1, pct: r.pct } })
    }
    return map
  }, [allSeasonStats])

  /* ── History rows ────────────────────────────────────────────── */
  const historyRows = seasonRows.map(s => {
    const pf  = s.points_for  as number | null
    const pa  = s.points_against as number | null
    const ow  = (s.overall_wins    as number | null) ?? 0
    const ol  = (s.overall_losses  as number | null) ?? 0
    const ot  = (s.overall_ties    as number | null) ?? 0
    const cw  = (s.conference_wins   as number | null) ?? 0
    const cl  = (s.conference_losses as number | null) ?? 0
    const gp  = ow + ol + ot
    const avgPf   = pf != null && gp > 0 ? pf / gp : null
    const avgPa   = pa != null && gp > 0 ? pa / gp : null
    const diff    = pf != null && pa != null ? pf - pa : null
    const winPct  = gp > 0 ? ow / gp : null
    return {
      seasonKey: s.season as number,
      season: formatSeason(s.season as number),
      overall: fmtRecord(ow, ol, ot),
      conf: fmtRecord(cw, cl),
      pf, pa, avgPf, avgPa, diff,
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
        case 'diff':    return r.diff ?? -Infinity
        case 'sos':     return r.sos ?? -Infinity
        default:        return 0
      }
    }
    return [...historyRows].sort((a, b) => sortDir === 'asc' ? key(a) - key(b) : key(b) - key(a))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyRows, sortCol, sortDir])

  /* ── Search query ────────────────────────────────────────────── */
  const q = query.trim().toLowerCase()

  /* ── Filtered data ───────────────────────────────────────────── */
  const seasonGames = activeSeason !== null
    ? gameRows.filter(g => g.season === activeSeason)
    : gameRows

  function opInfo(g: GameRow) {
    const isHome  = g.home_team_slug === (team.slug as string)
    const opName  = ((isHome ? g.away_team_name : g.home_team_name) ?? '').replace(/\s+Varsity\s+Football$/i, '')
    const opSlug  = isHome ? g.away_team_slug : g.home_team_slug
    const opSchoolSlug = opSlug.replace(/-varsity-football$/, '')
    return { isHome, opName, opSlug, opSchoolSlug }
  }
  function gameMatchesQ(g: GameRow) {
    const { opName, opSlug } = opInfo(g)
    return opName.toLowerCase().includes(q) || opSlug.replace(/-/g, ' ').includes(q)
  }

  const filteredGames  = q ? seasonGames.filter(gameMatchesQ) : seasonGames
  const matchedPlayers = q
    ? playerRows.filter(p => (p.player_name as string).toLowerCase().includes(q))
    : playerRows

  /* ── Player game logs ────────────────────────────────────────── */
  const typedLogs = playerGameLogs as unknown as PlayerGameLog[]
  const gameOpponentMap = useMemo(() => {
    const map: Record<number, string> = {}
    typedLogs.forEach(log => {
      if (map[log.game_id] != null) return
      const isHome = log.home_team_slug === (team.slug as string)
      map[log.game_id] = ((isHome ? log.away_team_name : log.home_team_name) ?? '').toLowerCase()
    })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedLogs])

  const gameWeekMap = useMemo(() => {
    const map: Record<number, number | null> = {}
    gameRows.forEach(g => { map[g.id] = g.game_number })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameRows])

  const matchedPlayerLogs = q
    ? typedLogs.filter(log =>
        (gameOpponentMap[log.game_id] ?? '').includes(q) ||
        log.player_name.toLowerCase().includes(q) ||
        (log.team_name ?? '').toLowerCase().includes(q)
      )
    : typedLogs

  /* ── Section counts ──────────────────────────────────────────── */
  const sectionCounts = {
    seasons:       historyRows.length,
    schedule:      filteredGames.length,
    'player-logs': matchedPlayerLogs.length,
    players:       matchedPlayers.length,
  }

  function metaCount(count: number, total: number, noun: string): React.ReactNode {
    if (total === 0) return null
    return (
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] tabular-nums">
        {q && count !== total ? `${count} / ${total}` : `${total} ${noun}${total === 1 ? '' : 's'}`}
      </span>
    )
  }

  const totalVisible = sectionCounts.schedule + sectionCounts['player-logs'] + sectionCounts.players
  const totalRanked  = seasonGames.length + typedLogs.length + playerRows.length

  /* ── ContentsNav items ───────────────────────────────────────── */
  const navItems = [
    { id: 'seasons',     label: 'Seasons',       count: q ? 0 : sectionCounts.seasons },
    { id: 'schedule',    label: 'Schedule',      count: sectionCounts.schedule },
    { id: 'player-logs', label: 'Player Logs',   count: sectionCounts['player-logs'] },
    { id: 'players',     label: 'Player Totals', count: sectionCounts.players },
  ]

  /* ── Mobile header ───────────────────────────────────────────── */
  const heroLogo = SCHOOL_LOGOS[schoolSlug]
  const mobileHeader = (
    <div className="flex items-center gap-2 w-full">
      {heroLogo && (
        <Image src={heroLogo} alt="" width={36} height={36}
          className="shrink-0 h-9 w-9 rounded-full bg-white p-0.5 object-contain ring-1 ring-[var(--border)]" unoptimized />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-tight truncate">{cleanName}</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight">Section XI · Division {division}</p>
      </div>
    </div>
  )

  /* ── Table cell styles ───────────────────────────────────────── */
  const td = 'px-3 py-2.5 border-b border-[var(--paper-rule)] text-[13px]'
  const th = 'px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]'

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <>
      <MaybeLayout panelMode={panelMode} mobileHeader={mobileHeader}>
        <div style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}>

          {/* ── Masthead ────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
            <EditorialHead
              size="xl"
              eyebrow={
                <span className="inline-flex items-center gap-2">
                  <Link href="/section/section-xi" className="hover:text-[var(--paper-text)] transition-colors">Section XI</Link>
                  <span className="opacity-40">·</span>
                  <Link href={`/division/division-${division.toLowerCase()}`} className="hover:text-[var(--paper-text)] transition-colors">Division {division}</Link>
                </span>
              }
              subhead="Varsity Football"
              meta={[`${gameRows.length} Games`, `${playerRows.length} Players`, `${totalRecords.toLocaleString()} Records`]}
              rightSlot={
                <EditorialButtonGroup
                  prevHref={`/team/${prevSlug}`}
                  nextHref={`/team/${nextSlug}`}
                  buttons={[
                    { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen,  onClick: () => setChartsOpen(v => !v) },
                    { icon: FileUser,      tooltip: 'Players',       active: playersOpen, onClick: () => setPlayersOpen(v => !v) },
                    { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,    onClick: () => setChatOpen(v => !v) },
                  ]}
                />
              }
            >
              {cleanName}
            </EditorialHead>
          </div>

          {/* ── Hero slider ─────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-12">
            <RevealFx delay={0.1} translateY={8}>
              <div className="relative overflow-hidden w-full h-[520px] border border-[var(--paper-rule)]"
                style={{ borderRadius: TABLET_RADIUS }}>
                {heroSlides.map((slide, i) => (
                  <div key={i}
                    className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: i === slideIdx ? 1 : 0 }}>
                    {slide.kind === 'placeholder' ? (
                      <div className="absolute inset-0 flex items-center justify-center"
                        style={{ background: SCHOOL_COLORS[schoolSlug]?.primary ?? '#033882' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {heroLogo && (
                          <Image src={heroLogo} alt="" width={96} height={96}
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
                <div className="absolute bottom-0 left-0 p-6 pointer-events-none">
                  <p className="text-lg font-bold text-white leading-snug" style={SERIF}>{cleanName}</p>
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
            </RevealFx>
          </div>

          {/* ── Sticky control bar ──────────────────────────────── */}
          <StickyControlBar>
            {hasSeasonControl && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">Season</span>
                <button onClick={() => shiftSeason(-1)} aria-label="Previous season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}>
                  {seasonLabel}
                </span>
                <button onClick={() => shiftSeason(1)} aria-label="Next season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <SearchInput
              value={query}
              onChange={setQuery}
              inputRef={searchRef}
              placeholder="Search opponents & players…"
            />
            <div className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums hidden md:block">
              {q
                ? `${totalVisible} / ${totalRanked} entries`
                : filteredGames.length > 0 ? `${filteredGames.length} games` : ''}
            </div>
          </StickyControlBar>

          {/* ── Body: sidebar + sections ─────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

            <ContentsNav items={navItems} activeId={activeSection} />

            <main className="min-w-0">

              {/* ── Seasons ───────────────────────────────────────── */}
              {!q && (
              <RevealFx delay={0.2} translateY={8}>
              <section id="seasons" className="mb-20 scroll-mt-24"
                ref={(el: HTMLElement | null) => { sectionRefs.current.seasons = el }}>
                <SectionHead
                  title="Seasons"
                  blurb="Click any row to jump to that season"
                  meta={metaCount(historyRows.length, historyRows.length, 'season')}
                />
                {historyRows.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--paper-muted)] italic" style={SERIF}>No season data recorded.</p>
                ) : (
                  <div className="border border-[var(--paper-rule)] overflow-x-auto" style={{ borderRadius: TABLET_RADIUS }}>
                    <table className="min-w-[560px] w-full">
                      <thead>
                        <tr>
                          <SortTh col="season"  label="Season"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                          <th className={th}>Team</th>
                          <SortTh col="pf"      label="PF"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="pf" right />
                          <SortTh col="pa"      label="PA"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="pa" right />
                          <SortTh col="diff"    label="Diff"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="diff" right />
                          <SortTh col="conf"    label="Conf"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="conf" right />
                          <SortTh col="overall" label="Result"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} glossaryId="overall" right />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedHistoryRows.map(row => {
                          const seasonIdx = gameSeasons.indexOf(row.seasonKey)
                          return (
                            <tr key={row.season}
                              className="hover:bg-[var(--paper-quiet)] cursor-pointer transition-colors"
                              onClick={() => {
                                if (seasonIdx !== -1) setActiveSeason(row.seasonKey)
                                document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }}>
                              <td className={cn(td, 'text-[var(--paper-muted)]')} style={MONO}>{row.season}</td>
                              <td className={td}>
                                <div className="flex items-center gap-2 min-w-0">
                                  {heroLogo && <Image src={heroLogo} alt="" width={18} height={18} className="shrink-0 object-contain" unoptimized />}
                                  <span className="truncate text-[var(--paper-text)]" style={SERIF}>{cleanName}</span>
                                </div>
                              </td>
                              <td className={cn(td, 'text-right text-[var(--paper-muted)]')} style={MONO}>{row.pf ?? '—'}</td>
                              <td className={cn(td, 'text-right text-[var(--paper-muted)]')} style={MONO}>{row.pa ?? '—'}</td>
                              <td className={cn(td, 'text-right font-semibold')}
                                style={{ ...MONO, color: row.diff == null ? 'var(--paper-muted)' : row.diff >= 0 ? '#15803d' : '#b91c1c' }}>
                                {row.diff == null ? '—' : row.diff >= 0 ? `+${row.diff}` : String(row.diff)}
                              </td>
                              <td className={cn(td, 'text-right text-[var(--paper-muted)]')} style={MONO}>{row.conf}</td>
                              <td className={cn(td, 'text-right font-semibold')}
                                style={{ ...MONO, color: row._winPct == null ? 'var(--paper-muted)' : row._winPct > 0.5 ? '#15803d' : row._winPct < 0.5 ? '#b91c1c' : 'var(--paper-muted)' }}>
                                {row.overall}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              </RevealFx>
              )}

              {/* ── Schedule ──────────────────────────────────────── */}
              {(!q || filteredGames.length > 0) && (
              <RevealFx delay={0.25} translateY={8}>
              <section id="schedule" className="mb-20 scroll-mt-24"
                ref={(el: HTMLElement | null) => { sectionRefs.current.schedule = el }}>
                <SectionHead
                  title={activeSeason !== null ? `${fmtSeason(activeSeason)} Schedule` : 'Schedule'}
                  blurb={`Game-by-game results${activeSeason !== null ? ` · ${fmtSeason(activeSeason)} season` : ' · all seasons'}`}
                  meta={metaCount(filteredGames.length, seasonGames.length, 'game')}
                />
                {filteredGames.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--paper-muted)] italic" style={SERIF}>
                    No game data recorded.
                  </p>
                ) : (
                  <div className="border border-[var(--paper-rule)] overflow-x-auto" style={{ borderRadius: TABLET_RADIUS }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]">Season</th>
                          <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]">Opponent</th>
                          <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)] hidden sm:table-cell">Opp %</th>
                          <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]">PF</th>
                          <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]">PA</th>
                          <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]">Diff</th>
                          <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGames.map(g => {
                          const isHome   = g.home_team_slug === team.slug
                          const opSlug   = isHome ? g.away_team_slug : g.home_team_slug
                          const opName   = isHome ? g.away_team_name : g.home_team_name
                          const myScore  = isHome ? g.home_score : g.away_score
                          const opScore  = isHome ? g.away_score : g.home_score
                          const result   = myScore == null || opScore == null ? '—'
                            : myScore > opScore ? 'W' : myScore < opScore ? 'L' : 'T'
                          const scoreStr = myScore != null && opScore != null ? `${myScore}–${opScore}` : '—'
                          const opDisplay = (opName ?? opSlug)
                            .replace(/\s+Varsity\s+Football$/i, '')
                            .replace(/-varsity-football$/, '')
                            .replace(/-/g, ' ')
                            .replace(/\b\w/g, c => c.toUpperCase())
                          const opSchoolSlug = opSlug.replace(/-varsity-football$/, '')
                          const opLogo = SCHOOL_LOGOS[opSchoolSlug]
                          const diff = myScore != null && opScore != null ? myScore - opScore : null
                          const resultColor = result === 'W' ? '#15803d' : result === 'L' ? '#b91c1c' : 'var(--paper-muted)'
                          return (
                            <tr key={g.id}
                              className="hover:bg-[var(--paper-quiet)] transition-colors">
                              <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtSeason(g.season)}</td>
                              <td className={td}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[11px] text-[var(--paper-faint)] shrink-0">{isHome ? 'vs' : 'at'}</span>
                                  {opLogo && <Image src={opLogo} alt="" width={18} height={18} className="shrink-0 object-contain" unoptimized />}
                                  <Link href={`/team/${opSlug}`}
                                    className="truncate text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                    style={SERIF}>
                                    {opDisplay}
                                  </Link>
                                </div>
                              </td>
                              <td className={cn(td, 'text-right tabular-nums text-[var(--paper-muted)] hidden sm:table-cell')} style={MONO}>
                                {oppStatMap[g.season]?.[opSlug] != null
                                  ? oppStatMap[g.season][opSlug].pct.toFixed(3).replace(/^0/, '')
                                  : '—'}
                              </td>
                              <td className={cn(td, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{myScore ?? '—'}</td>
                              <td className={cn(td, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{opScore ?? '—'}</td>
                              <td className={cn(td, 'text-right tabular-nums font-semibold')} style={{ ...MONO, color: diff == null || diff === 0 ? 'var(--paper-muted)' : diff > 0 ? '#15803d' : '#b91c1c' }}>
                                {diff == null ? '—' : diff > 0 ? `+${diff}` : diff < 0 ? String(diff) : '0'}
                              </td>
                              <td className={cn(td, 'text-right font-semibold')} style={{ ...MONO, color: resultColor }}>
                                {g.id ? (
                                  <Link href={`/game/${g.id}?ref=${team.slug}`} className="hover:underline">{scoreStr}</Link>
                                ) : scoreStr}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              </RevealFx>
              )}

              {/* ── Player Logs ───────────────────────────────────── */}
              {(!q || matchedPlayerLogs.length > 0) && (
              <RevealFx delay={0.35} translateY={8}>
              <section id="player-logs" className="mb-20 scroll-mt-24"
                ref={(el: HTMLElement | null) => { sectionRefs.current['player-logs'] = el }}>
                <SectionHead
                  title="Player Logs"
                  blurb="Individual game stat lines — search by opponent or player name"
                  meta={metaCount(matchedPlayerLogs.length, typedLogs.length, 'log')}
                />
                {matchedPlayerLogs.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--paper-muted)] italic" style={SERIF}>
                    {q ? `No player logs match "${query}".` : 'No player game data recorded.'}
                  </p>
                ) : (
                  <div className="border border-[var(--paper-rule)] overflow-x-auto" style={{ borderRadius: TABLET_RADIUS }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className={cn(th, 'hidden sm:table-cell')}>Season</th>
                          <th className={th}>Player</th>
                          <th className={cn(th, 'hidden sm:table-cell')}>Week</th>
                          <th className={th}>Game</th>
                          <th className={cn(th, 'hidden md:table-cell')}>Type</th>
                          <th className={cn(th, 'text-right')}>Stat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedPlayerLogs.map((log, i) => {
                          // Perspective = player's own school, not the page team
                          const playerTeamSlug = `${log.school_slug}-varsity-football`
                          const playerIsHome = log.home_team_slug === playerTeamSlug
                          const opName = ((playerIsHome ? log.away_team_name : log.home_team_name) ?? '')
                            .replace(/\s+Varsity\s+Football$/i, '')
                            .replace(/-varsity-football$/, '')
                          const opSlug = playerIsHome ? log.away_team_slug : log.home_team_slug
                          const opSchoolSlug = opSlug.replace(/-varsity-football$/, '')
                          const opLogo = SCHOOL_LOGOS[opSchoolSlug]
                          const playerLogo = SCHOOL_LOGOS[log.school_slug]
                          const stat = topGameStat(log)
                          return (
                            <tr key={`${log.game_id}-${log.player_slug}-${log.stat_type ?? i}`}
                              className="hover:bg-[var(--paper-quiet)] transition-colors">
                              <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums hidden sm:table-cell')} style={MONO}>
                                {log.season != null ? fmtSeason(log.season) : '—'}
                              </td>
                              <td className={td}>
                                <div className="flex items-center gap-2 min-w-0">
                                  {playerLogo && <Image src={playerLogo} alt="" width={18} height={18} className="shrink-0 object-contain" unoptimized />}
                                  <Link href={`/player/${log.player_slug}`}
                                    className="truncate text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                    style={SERIF}>
                                    {log.player_name}
                                  </Link>
                                </div>
                              </td>
                              <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums whitespace-nowrap hidden sm:table-cell')} style={MONO}>
                                {gameWeekMap[log.game_id] != null ? `Week ${gameWeekMap[log.game_id]}` : fmtFullDate(log.game_date)}
                              </td>
                              <td className={td}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[11px] text-[var(--paper-faint)] shrink-0">{playerIsHome ? 'vs' : 'at'}</span>
                                  {opLogo && <Image src={opLogo} alt="" width={18} height={18} className="shrink-0 object-contain" unoptimized />}
                                  <Link href={`/game/${log.game_id}`}
                                    className="truncate text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                    style={SERIF}>
                                    {opName}
                                  </Link>
                                </div>
                              </td>
                              <td className={cn(td, 'text-[var(--paper-muted)] hidden md:table-cell')}>
                                {log.stat_type ?? '—'}
                              </td>
                              <td className={cn(td, 'text-right font-semibold tabular-nums text-[var(--paper-text)]')} style={MONO}>
                                {stat.value}
                                <span className="ml-1.5 text-[11px] font-normal text-[var(--paper-muted)]">{stat.label}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              </RevealFx>
              )}

              {/* ── Player Totals ─────────────────────────────────── */}
              {(!q || matchedPlayers.length > 0) && (
              <RevealFx delay={0.4} translateY={8}>
              <section id="players" className="mb-20 scroll-mt-24"
                ref={(el: HTMLElement | null) => { sectionRefs.current.players = el }}>
                <SectionHead
                  title="Player Totals"
                  blurb="Season statistical totals — all-time leaders by category"
                  meta={metaCount(matchedPlayers.length, playerRows.length, 'player')}
                />
                {matchedPlayers.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--paper-muted)] italic" style={SERIF}>
                    {q ? `No players match "${query}".` : 'No player data recorded.'}
                  </p>
                ) : (
                  <div className="border border-[var(--paper-rule)] overflow-x-auto" style={{ borderRadius: TABLET_RADIUS }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className={th}>Player</th>
                          <th className={cn(th, 'hidden sm:table-cell')}>Season</th>
                          <th className={cn(th, 'hidden md:table-cell')}>Type</th>
                          <th className={cn(th, 'text-right')}>Yards</th>
                          <th className={cn(th, 'text-right hidden sm:table-cell')}>TDs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedPlayers.map((p, i) => {
                          const playerSlug = p.player_slug as string
                          const statType   = p.stat_type as string
                          const playerLogo = SCHOOL_LOGOS[schoolSlug]
                          const yds = statType === 'Passing'   ? p.pass_yards as number | null
                                    : statType === 'Rushing'   ? p.rush_yards as number | null
                                    : statType === 'Receiving' ? p.recv_yards as number | null
                                    : null
                          const tds = statType === 'Passing'   ? p.pass_tds as number | null
                                    : statType === 'Rushing'   ? p.rush_tds as number | null
                                    : statType === 'Receiving' ? p.recv_tds as number | null
                                    : null
                          return (
                            <tr key={`${playerSlug}-${statType}-${i}`}
                              className="hover:bg-[var(--paper-quiet)] transition-colors">
                              <td className={td}>
                                <div className="flex items-center gap-2 min-w-0">
                                  {playerLogo && <Image src={playerLogo} alt="" width={18} height={18} className="shrink-0 object-contain" unoptimized />}
                                  <Link href={`/player/${playerSlug}`}
                                    className="truncate text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                    style={SERIF}>
                                    {p.player_name as string}
                                  </Link>
                                </div>
                              </td>
                              <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums hidden sm:table-cell')} style={MONO}>
                                {p.season != null ? fmtSeason(p.season as number) : '—'}
                              </td>
                              <td className={cn(td, 'text-[var(--paper-muted)] hidden md:table-cell')}>
                                {statType}
                              </td>
                              <td className={cn(td, 'text-right font-semibold tabular-nums text-[var(--paper-text)]')} style={MONO}>
                                {yds != null ? yds.toLocaleString() : '—'}
                              </td>
                              <td className={cn(td, 'text-right tabular-nums text-[var(--paper-muted)] hidden sm:table-cell')} style={MONO}>
                                {tds != null ? String(tds) : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              </RevealFx>
              )}

            </main>
          </div>

        </div>
      </MaybeLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={teamName} />
      <AppPanel open={playersOpen} onClose={() => setPlayersOpen(false)} title="Players">
        {(() => {
          const teamLogo = SCHOOL_LOGOS[schoolSlug]
          const seasons = [...new Set((rosterRows as Record<string, unknown>[]).map(r => Number(r.season)))].sort((a, b) => b - a)
          if (seasons.length === 0) return (
            <div className="flex items-center justify-center h-32 text-sm text-[var(--muted)]">No roster data</div>
          )
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
