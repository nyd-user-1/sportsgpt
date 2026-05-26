'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChartSpline, ArrowLeft, ArrowRight, FileUser, MessageCircle,
  Search, X,
} from 'lucide-react'
import Image from 'next/image'
import { AppLayout } from '@/components/AppLayout'
import { ChatSeasonsPanel } from '@/components/ChatSeasonsPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { RevealFx } from '@/components/RevealFx'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { AppPanel } from '@/components/AppPanel'
import { cn, formatSeason } from '@/lib/utils'
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
  SortTh,
  ScrollTable,
  SubSectionHead,
} from '@/components/editorial'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }

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
    <AppLayout mobileHeader={mobileHeader} paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
    </AppLayout>
  )
}

/* ══════════════════════════════════════════════════════════════════ */
function topGameStat(log: PlayerGameLog): { label: string; value: string } {
  const s = log.stat_type ?? ''
  if (s === 'Passing')   return { label: 'Yds', value: log.pass_yds != null ? String(log.pass_yds) : '—' }
  if (s === 'Rushing')   return { label: 'Yds', value: log.rush_yds != null ? String(log.rush_yds) : '—' }
  if (s === 'Receiving') return { label: 'Yds', value: log.rec_yds  != null ? String(log.rec_yds)  : '—' }
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
  totalTeams = 52, totalPlayers = 0,
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
  totalTeams?: number
  totalPlayers?: number
}) {
  const [chartsOpen,     setChartsOpen]     = useState(false)
  const [chatOpen,       setChatOpen]       = useState(false)
  const [playersOpen,    setPlayersOpen]    = useState(false)
  const [rosterQuery,    setRosterQuery]    = useState('')
  const [selectedGameId,     setSelectedGameId]     = useState<number | null>(null)
  const [selectedGameSeason, setSelectedGameSeason] = useState<number | null>(null)

  useEffect(() => { if (!playersOpen) setRosterQuery('') }, [playersOpen])
  const [sortCol, setSortCol]         = useState<string | null>(null)
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc')
  const [schedSortCol, setSchedSortCol] = useState<string | null>(null)
  const [schedSortDir, setSchedSortDir] = useState<'asc' | 'desc'>('desc')
  const [logSortCol,   setLogSortCol]   = useState<string | null>(null)
  const [logSortDir,   setLogSortDir]   = useState<'asc' | 'desc'>('desc')
  const [plyrSortCol,  setPlyrSortCol]  = useState<string | null>(null)
  const [plyrSortDir,  setPlyrSortDir]  = useState<'asc' | 'desc'>('desc')
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

  function handleSchedSort(col: string) {
    if (schedSortCol === col) setSchedSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSchedSortCol(col); setSchedSortDir('desc') }
  }

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

  const sortedFilteredGames = useMemo(() => {
    if (!schedSortCol) return filteredGames
    const teamSlug = team.slug as string
    const key = (g: GameRow): number | string => {
      const isHome  = g.home_team_slug === teamSlug
      const my      = isHome ? g.home_score : g.away_score
      const op      = isHome ? g.away_score : g.home_score
      const opSlug  = isHome ? g.away_team_slug : g.home_team_slug
      const opName  = ((isHome ? g.away_team_name : g.home_team_name) ?? '').replace(/\s+Varsity\s+Football$/i, '')
      switch (schedSortCol) {
        case 'season':   return g.season
        case 'opponent': return opName.toLowerCase()
        case 'pf':       return my ?? -Infinity
        case 'pa':       return op ?? -Infinity
        case 'diff':     return (my != null && op != null) ? my - op : -Infinity
        case 'opp_pct':  return oppStatMap[g.season]?.[opSlug]?.pct ?? -Infinity
        case 'result':   return (my != null && op != null) ? my - op : -Infinity
        default:         return 0
      }
    }
    return [...filteredGames].sort((a, b) => {
      const ka = key(a), kb = key(b)
      if (typeof ka === 'string' && typeof kb === 'string')
        return schedSortDir === 'asc' ? ka.localeCompare(kb) : kb.localeCompare(ka)
      return schedSortDir === 'asc'
        ? (ka as number) - (kb as number)
        : (kb as number) - (ka as number)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredGames, schedSortCol, schedSortDir, oppStatMap])

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
    const map: Record<number, number> = {}
    // Group by season, sort by date, assign 1-based week index
    const bySeason: Record<number, GameRow[]> = {}
    gameRows.forEach(g => {
      if (!bySeason[g.season]) bySeason[g.season] = []
      bySeason[g.season].push(g)
    })
    Object.values(bySeason).forEach(games => {
      const sorted = [...games].sort((a, b) =>
        (a.game_date ?? '').localeCompare(b.game_date ?? '')
      )
      sorted.forEach((g, i) => {
        map[g.id] = g.game_number != null ? g.game_number : i + 1
      })
    })
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

  function handleLogSort(col: string) {
    if (logSortCol === col) setLogSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setLogSortCol(col); setLogSortDir('desc') }
  }

  const sortedPlayerLogs = useMemo(() => {
    if (!logSortCol) return matchedPlayerLogs
    const teamSlug = team.slug as string
    const key = (log: PlayerGameLog): number | string => {
      const playerTeamSlug = `${log.school_slug}-varsity-football`
      const playerIsHome   = log.home_team_slug === playerTeamSlug
      const opName         = ((playerIsHome ? log.away_team_name : log.home_team_name) ?? '').replace(/\s+Varsity\s+Football$/i, '')
      const stat           = topGameStat(log)
      switch (logSortCol) {
        case 'season':   return log.season ?? 0
        case 'player':   return log.player_name.toLowerCase()
        case 'week':     return gameWeekMap[log.game_id] ?? 0
        case 'opponent': return opName.toLowerCase()
        case 'type':     return log.stat_type?.toLowerCase() ?? ''
        case 'stat':     return Number(stat.value) || 0
        default:         return 0
      }
    }
    return [...matchedPlayerLogs].sort((a, b) => {
      const ka = key(a), kb = key(b)
      if (typeof ka === 'string' && typeof kb === 'string')
        return logSortDir === 'asc' ? ka.localeCompare(kb) : kb.localeCompare(ka)
      return logSortDir === 'asc' ? (ka as number) - (kb as number) : (kb as number) - (ka as number)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedPlayerLogs, logSortCol, logSortDir, gameWeekMap])

  function handlePlyrSort(col: string) {
    if (plyrSortCol === col) setPlyrSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setPlyrSortCol(col); setPlyrSortDir('desc') }
  }

  const sortedPlayers = useMemo(() => {
    if (!plyrSortCol) return matchedPlayers
    const key = (p: Record<string, unknown>): number | string => {
      const statType = p.stat_type as string
      const yds = statType === 'Passing' ? p.pass_yards : statType === 'Rushing' ? p.rush_yards : p.recv_yards
      const tds  = statType === 'Passing' ? p.pass_tds  : statType === 'Rushing' ? p.rush_tds  : p.recv_tds
      switch (plyrSortCol) {
        case 'player': return (p.player_name as string).toLowerCase()
        case 'season': return Number(p.season) || 0
        case 'type':   return (p.stat_type as string ?? '').toLowerCase()
        case 'yards':  return Number(yds) || 0
        case 'tds':    return Number(tds) || 0
        default:       return 0
      }
    }
    return [...matchedPlayers].sort((a, b) => {
      const ka = key(a as Record<string, unknown>), kb = key(b as Record<string, unknown>)
      if (typeof ka === 'string' && typeof kb === 'string')
        return plyrSortDir === 'asc' ? ka.localeCompare(kb) : kb.localeCompare(ka)
      return plyrSortDir === 'asc' ? (ka as number) - (kb as number) : (kb as number) - (ka as number)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedPlayers, plyrSortCol, plyrSortDir])

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
  const logSubTypes   = ['Passing', 'Rushing', 'Receiving', 'Defense', 'Kicking']
    .filter(st => typedLogs.some(l => l.stat_type === st))
  const plyrSubTypes  = ['Passing', 'Rushing', 'Receiving']
    .filter(st => playerRows.some(p => p.stat_type === st))

  const navItems = [
    { id: 'seasons',     label: 'Seasons',       count: q ? 0 : sectionCounts.seasons },
    { id: 'schedule',    label: 'Games',         count: sectionCounts.schedule },
    { id: 'player-logs', label: 'Player Logs',   count: sectionCounts['player-logs'],
      subItems: logSubTypes.map(st => ({ id: `player-logs-${st.toLowerCase()}`, label: st })) },
    { id: 'players',     label: 'Player Totals', count: sectionCounts.players,
      subItems: plyrSubTypes.map(st => ({ id: `players-${st.toLowerCase()}`, label: st })) },
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
  const td = 'px-3 py-4 border-b border-[var(--paper-rule)] text-[13px]'
  const th = 'px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)] sticky top-0 bg-[color:color-mix(in_srgb,var(--paper-text)_3.5%,var(--paper))] z-10'

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
              subhead={`Section XI varsity football — game results, season records, and player statistics for Division ${division}.`}
              meta={[
                <a key="seasons" href="#seasons" className="hover:text-[var(--paper-text)] transition-colors">{seasonRows.length} Season{seasonRows.length !== 1 ? 's' : ''}</a>,
                <a key="games" href="#schedule" className="hover:text-[var(--paper-text)] transition-colors">{gameRows.length} Game{gameRows.length !== 1 ? 's' : ''}</a>,
                <a key="logs" href="#player-logs" className="hover:text-[var(--paper-text)] transition-colors">{typedLogs.length} Player Log{typedLogs.length !== 1 ? 's' : ''}</a>,
              ]}
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

            <ContentsNav
              items={navItems}
              activeId={activeSection}
              label="Page"
              topChildren={
                <div className="mb-8">
                  <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">Site</p>
                  <ol className="flex flex-col">
                    {([
                      { roman: 'I',   label: 'Division', count: 4,            href: `/division/division-${(division as string).toLowerCase()}` },
                      { roman: 'II',  label: 'Teams',    count: totalTeams,   href: '/team' },
                      { roman: 'III', label: 'Players',  count: totalPlayers, href: '/player' },
                    ] as const).map(link => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group flex items-baseline gap-3 py-1.5 text-[13px] leading-tight text-[var(--paper-muted)] hover:text-[var(--paper-strong)] transition-colors"
                        >
                          <span className="shrink-0 w-6 text-right italic"
                            style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 12 }}>
                            {link.roman}
                          </span>
                          <span className="flex-1 truncate">{link.label}</span>
                          <span className="text-[10px] tabular-nums opacity-60">{link.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              }
            />

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
                  <ScrollTable>
                    <table className="min-w-[380px] w-full table-fixed">
                      <colgroup>
                        <col style={{ width: '120px' }} />
                        <col style={{ width: 'auto' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '110px' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <SortTh col="season"  label="Season"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                          <th className={th}>Team</th>
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
                              className="hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] cursor-pointer transition-colors"
                              onClick={() => {
                                if (seasonIdx !== -1) setActiveSeason(row.seasonKey)
                                document.getElementById('schedule')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }}>
                              <td className={cn(td, 'text-[var(--paper-muted)]')} style={MONO}>{row.season}</td>
                              <td className={td}>
                                <div className="flex items-center gap-2 min-w-0">
                                  {heroLogo && (
                                    <Link
                                      href={`/team/${team.slug as string}`}
                                      onClick={e => e.stopPropagation()}
                                      aria-label={`${cleanName} team page`}
                                      className="shrink-0"
                                    >
                                      <Image src={heroLogo} alt="" width={18} height={18} className="object-contain" unoptimized />
                                    </Link>
                                  )}
                                  <span className="truncate text-[var(--paper-text)]" style={SERIF}>{cleanName}</span>
                                </div>
                              </td>
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
                  </ScrollTable>
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
                  title={activeSeason !== null ? `${fmtSeason(activeSeason)} Games` : 'Games'}
                  blurb="Game-by-game results"
                  meta={metaCount(filteredGames.length, seasonGames.length, 'game')}
                />
                {filteredGames.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--paper-muted)] italic" style={SERIF}>
                    No game data recorded.
                  </p>
                ) : (
                  <ScrollTable>
                    <table className="w-full text-sm table-fixed min-w-[380px]">
                      <colgroup>
                        <col style={{ width: '120px' }} />
                        <col style={{ width: 'auto' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '110px' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <SortTh col="season"   label="Season"   sortCol={schedSortCol} sortDir={schedSortDir} onSort={handleSchedSort} />
                          <SortTh col="opponent" label="Opponent" sortCol={schedSortCol} sortDir={schedSortDir} onSort={handleSchedSort} />
                          <SortTh col="diff"     label="Diff"     sortCol={schedSortCol} sortDir={schedSortDir} onSort={handleSchedSort} glossaryId="diff" right />
                          <SortTh col="opp_pct"  label="Opp %"    sortCol={schedSortCol} sortDir={schedSortDir} onSort={handleSchedSort} glossaryId="opp-rank" right className="hidden sm:table-cell" />
                          <SortTh col="result"   label="Result"   sortCol={schedSortCol} sortDir={schedSortDir} onSort={handleSchedSort} glossaryId="overall" right />
                        </tr>
                      </thead>
                      <tbody>
                        {sortedFilteredGames.map(g => {
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
                              className="hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors cursor-pointer"
                              onClick={() => { setSelectedGameId(g.id); setSelectedGameSeason(g.season) }}>
                              <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtSeason(g.season)}</td>
                              <td className={td}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[11px] text-[var(--paper-faint)] shrink-0">{isHome ? 'vs' : 'at'}</span>
                                  {opLogo && (
                                    <Link
                                      href={`/team/${opSlug}`}
                                      onClick={e => e.stopPropagation()}
                                      aria-label={`${opDisplay} team page`}
                                      className="shrink-0"
                                    >
                                      <Image src={opLogo} alt="" width={18} height={18} className="object-contain" unoptimized />
                                    </Link>
                                  )}
                                  <Link href={`/team/${opSlug}`}
                                    onClick={e => e.stopPropagation()}
                                    className="truncate text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                    style={SERIF}>
                                    {opDisplay}
                                  </Link>
                                </div>
                              </td>
                              <td className={cn(td, 'text-right tabular-nums font-semibold')} style={{ ...MONO, color: diff == null || diff === 0 ? 'var(--paper-muted)' : diff > 0 ? '#15803d' : '#b91c1c' }}>
                                {diff == null ? '—' : diff > 0 ? `+${diff}` : diff < 0 ? String(diff) : '0'}
                              </td>
                              <td className={cn(td, 'text-right tabular-nums text-[var(--paper-muted)] hidden sm:table-cell')} style={MONO}>
                                {oppStatMap[g.season]?.[opSlug] != null
                                  ? oppStatMap[g.season][opSlug].pct.toFixed(3).replace(/^0/, '')
                                  : '—'}
                              </td>
                              <td className={cn(td, 'text-right')} style={MONO}>
                                <div className="inline-flex items-baseline gap-1.5 justify-end">
                                  {result !== '—' && (
                                    <span className="text-[11px] font-medium" style={{ color: resultColor }}>{result}</span>
                                  )}
                                  {g.id ? (
                                    <Link href={`/game/${g.id}?ref=${team.slug}`} onClick={e => e.stopPropagation()}
                                      className="font-semibold hover:underline" style={{ color: resultColor }}>{scoreStr}</Link>
                                  ) : <span className="font-semibold" style={{ color: resultColor }}>{scoreStr}</span>}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </ScrollTable>
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
                  blurb="Individual game stat lines"
                  meta={metaCount(matchedPlayerLogs.length, typedLogs.length, 'log')}
                />
                {matchedPlayerLogs.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[var(--paper-muted)] italic" style={SERIF}>
                    {q ? `No player logs match "${query}".` : 'No player game data recorded.'}
                  </p>
                ) : (
                  <>
                    {(['Passing', 'Rushing', 'Receiving', 'Defense', 'Kicking'] as const).map(statType => {
                      const rows = sortedPlayerLogs.filter(l => l.stat_type === statType)
                      if (rows.length === 0) return null
                      const subId = `player-logs-${statType.toLowerCase()}`
                      return (
                        <div key={statType} id={subId} className="mb-10 scroll-mt-24">
                          <SubSectionHead>{statType}</SubSectionHead>
                          <ScrollTable>
                            <table className="w-full text-sm min-w-[600px]">
                              <colgroup>
                                <col className="hidden sm:table-column" style={{ width: '90px' }} />
                                <col style={{ width: '190px' }} />
                                <col />
                                <col className="hidden sm:table-column" style={{ width: '90px' }} />
                                <col style={{ width: '110px' }} />
                              </colgroup>
                              <thead>
                                <tr>
                                  <SortTh col="season"   label="Season"   sortCol={logSortCol} sortDir={logSortDir} onSort={handleLogSort} className="hidden sm:table-cell" />
                                  <SortTh col="player"   label="Player"   sortCol={logSortCol} sortDir={logSortDir} onSort={handleLogSort} />
                                  <SortTh col="opponent" label="Opponent" sortCol={logSortCol} sortDir={logSortDir} onSort={handleLogSort} />
                                  <SortTh col="week"     label="Week"     sortCol={logSortCol} sortDir={logSortDir} onSort={handleLogSort} className="hidden sm:table-cell" />
                                  <SortTh col="stat"     label="Stat"     sortCol={logSortCol} sortDir={logSortDir} onSort={handleLogSort} right />
                                </tr>
                              </thead>
                              <tbody>
                                {rows.flatMap((log, i) => {
                                  const playerTeamSlug = `${log.school_slug}-varsity-football`
                                  const playerIsHome = log.home_team_slug === playerTeamSlug
                                  const opName = ((playerIsHome ? log.away_team_name : log.home_team_name) ?? '')
                                    .replace(/\s+Varsity\s+Football$/i, '')
                                    .replace(/-varsity-football$/, '')
                                  const opSlug = playerIsHome ? log.away_team_slug : log.home_team_slug
                                  const opSchoolSlug = opSlug.replace(/-varsity-football$/, '')
                                  const opLogo = SCHOOL_LOGOS[opSchoolSlug]
                                  const playerLogo = SCHOOL_LOGOS[log.school_slug]

                                  const makeRow = (statLabel: string, statValue: string, key: string) => (
                                    <tr key={key} className="hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                                      <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums hidden sm:table-cell')} style={MONO}>
                                        {log.season != null ? fmtSeason(log.season) : '—'}
                                      </td>
                                      <td className={td}>
                                        <div className="flex items-center gap-2 min-w-0">
                                          {playerLogo && (
                                            <Link
                                              href={`/team/${log.school_slug}-varsity-football`}
                                              aria-label="Team page"
                                              className="shrink-0"
                                            >
                                              <Image src={playerLogo} alt="" width={18} height={18} className="object-contain" unoptimized />
                                            </Link>
                                          )}
                                          <Link href={`/player/${log.player_slug}`}
                                            className="whitespace-nowrap text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                            style={SERIF}>
                                            {log.player_name}
                                          </Link>
                                        </div>
                                      </td>
                                      <td className={td}>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-[11px] text-[var(--paper-faint)] shrink-0">{playerIsHome ? 'vs' : 'at'}</span>
                                          {opLogo && (
                                            <Link
                                              href={`/team/${opSlug}`}
                                              aria-label={`${opName} team page`}
                                              className="shrink-0"
                                            >
                                              <Image src={opLogo} alt="" width={18} height={18} className="object-contain" unoptimized />
                                            </Link>
                                          )}
                                          <Link href={`/game/${log.game_id}`}
                                            className="truncate text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                            style={SERIF}>
                                            {opName}
                                          </Link>
                                        </div>
                                      </td>
                                      <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums whitespace-nowrap hidden sm:table-cell')} style={MONO}>
                                        {gameWeekMap[log.game_id] != null ? `Week ${gameWeekMap[log.game_id]}` : '—'}
                                      </td>
                                      <td className={cn(td, 'text-right font-semibold tabular-nums text-[var(--paper-text)]')} style={MONO}>
                                        {statValue}
                                        <span className="ml-1.5 text-[11px] font-normal text-[var(--paper-muted)]">{statLabel}</span>
                                      </td>
                                    </tr>
                                  )

                                  if (statType === 'Defense') {
                                    const defStats = [
                                      log.def_int     ? { label: 'INT', value: String(log.def_int) }     : null,
                                      log.def_sacks   ? { label: 'SCK', value: String(log.def_sacks) }   : null,
                                      log.def_fumbles ? { label: 'FR',  value: String(log.def_fumbles) } : null,
                                    ].filter((x): x is { label: string; value: string } => x !== null)
                                    if (defStats.length === 0) return []
                                    return defStats.map(ds => makeRow(ds.label, ds.value, `${log.game_id}-${log.player_slug ?? 'np'}-${i}-${ds.label}`))
                                  }
                                  const stat = topGameStat(log)
                                  return [makeRow(stat.label, stat.value, `${log.game_id}-${log.player_slug ?? 'np'}-${i}-${log.stat_type ?? 'nt'}`)]
                                })}
                              </tbody>
                            </table>
                          </ScrollTable>
                        </div>
                      )
                    })}
                  </>
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
                  <>
                    {(['Passing', 'Rushing', 'Receiving'] as const).map(statType => {
                      const rows = sortedPlayers.filter(p => p.stat_type === statType)
                      if (rows.length === 0) return null
                      const subId = `players-${statType.toLowerCase()}`
                      return (
                        <div key={statType} id={subId} className="mb-10 scroll-mt-24">
                          <SubSectionHead>{statType}</SubSectionHead>
                          <ScrollTable>
                            <table className="w-full text-sm min-w-[400px]">
                              <colgroup>
                                <col className="hidden sm:table-column" style={{ width: '90px' }} />
                                <col />
                                <col style={{ width: '100px' }} />
                                <col className="hidden sm:table-column" style={{ width: '80px' }} />
                              </colgroup>
                              <thead>
                                <tr>
                                  <SortTh col="season" label="Season" sortCol={plyrSortCol} sortDir={plyrSortDir} onSort={handlePlyrSort} className="hidden sm:table-cell" />
                                  <SortTh col="player" label="Player" sortCol={plyrSortCol} sortDir={plyrSortDir} onSort={handlePlyrSort} />
                                  <SortTh col="yards"  label="Yards"  sortCol={plyrSortCol} sortDir={plyrSortDir} onSort={handlePlyrSort} right />
                                  <SortTh col="tds"    label="TDs"    sortCol={plyrSortCol} sortDir={plyrSortDir} onSort={handlePlyrSort} right className="hidden sm:table-cell" />
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((p, i) => {
                                  const playerSlug = p.player_slug as string
                                  const playerLogo = SCHOOL_LOGOS[schoolSlug]
                                  const yds = statType === 'Passing'   ? p.pass_yards as number | null
                                            : statType === 'Rushing'   ? p.rush_yards as number | null
                                            : p.recv_yards as number | null
                                  const tds = statType === 'Passing'   ? p.pass_tds as number | null
                                            : statType === 'Rushing'   ? p.rush_tds as number | null
                                            : p.recv_tds as number | null
                                  return (
                                    <tr key={`${playerSlug}-${statType}-${i}`}
                                      className="hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                                      <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums hidden sm:table-cell')} style={MONO}>
                                        {p.season != null ? fmtSeason(p.season as number) : '—'}
                                      </td>
                                      <td className={td}>
                                        <div className="flex items-center gap-2 min-w-0">
                                          {playerLogo && (
                                            <Link
                                              href={`/team/${team.slug as string}`}
                                              aria-label="Team page"
                                              className="shrink-0"
                                            >
                                              <Image src={playerLogo} alt="" width={18} height={18} className="object-contain" unoptimized />
                                            </Link>
                                          )}
                                          <Link href={`/player/${playerSlug}`}
                                            className="whitespace-nowrap text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors"
                                            style={SERIF}>
                                            {p.player_name as string}
                                          </Link>
                                        </div>
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
                          </ScrollTable>
                        </div>
                      )
                    })}
                  </>
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
      <AppPanel open={playersOpen} onClose={() => setPlayersOpen(false)} title="Players" searchable onSearchChange={q => setRosterQuery(q)}>
        {(() => {
          const teamLogo = SCHOOL_LOGOS[schoolSlug]
          const rq = rosterQuery.trim().toLowerCase()
          const seasons = [...new Set((rosterRows as Record<string, unknown>[]).map(r => Number(r.season)))].sort((a, b) => b - a)
          if (seasons.length === 0) return (
            <div className="flex items-center justify-center h-32 text-sm text-[var(--paper-muted)] italic" style={SERIF}>No roster data</div>
          )
          return (
            <div className="pb-6" style={PAPER_BRIDGE}>
              {seasons.map(season => {
                const players = (rosterRows as Record<string, unknown>[])
                  .filter(r => Number(r.season) === season)
                  .filter(p => !rq ||
                    (p.player_name as string).toLowerCase().includes(rq) ||
                    (p.position as string ?? '').toLowerCase().includes(rq) ||
                    (p.class as string ?? '').toLowerCase().includes(rq) ||
                    String(p.jersey_number ?? '').includes(rq)
                  )
                if (players.length === 0) return null
                return (
                  <div key={season}>
                    <div className="px-5 pt-6 pb-2 border-t border-[var(--paper-rule)] first:border-t-0">
                      <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]">{fmtSeason(season)}</span>
                    </div>
                    <div className="divide-y divide-[var(--paper-rule)]">
                      {players.map((p, i) => {
                        const img = teamLogo ?? null
                        const slug = p.player_slug as string
                        const jerseyNum = p.jersey_number != null ? `#${p.jersey_number}` : null
                        const meta = [p.position ?? null, p.class ?? null].filter(Boolean).join(' · ')
                        return (
                          <Link key={i} href={`/player/${slug}`}
                            className="group flex items-center gap-3 px-5 py-3 hover:bg-[var(--paper-quiet)] transition-colors">
                            {img
                              ? <Image src={img} alt="" width={28} height={28} className="shrink-0 rounded-full object-contain bg-white border border-[var(--paper-rule)]" unoptimized />
                              : <div className="shrink-0 h-7 w-7 rounded-full border border-[var(--paper-rule)]" />}
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors block truncate" style={SERIF}>
                                {p.player_name as string}
                              </span>
                              {(jerseyNum || meta) && (
                                <p className="text-[11px] text-[var(--paper-muted)] truncate mt-0.5">
                                  <span style={MONO}>{jerseyNum}</span>
                                  {jerseyNum && meta ? <span className="opacity-40 mx-1">·</span> : null}
                                  {meta}
                                </p>
                              )}
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

      <ChatSeasonsPanel
        open={selectedGameId != null}
        onClose={() => { setSelectedGameId(null); setSelectedGameSeason(null) }}
        teams={[{ slug: schoolSlug, name: cleanName }]}
        initialGameId={selectedGameId}
        initialGameSeason={selectedGameSeason}
      />
    </>
  )
}
