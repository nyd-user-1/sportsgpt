'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChartSpline, Map as MapIcon, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PLAYER_PHOTOS, SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { InfoTable } from '@/components/InfoTable'
import { RevealFx } from '@/components/RevealFx'
import { cn, formatSeason } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import { POSITIONS, type PositionConfig } from '@/lib/positions'

type PlayerRow = {
  slug: string
  name: string
  position: string | null
  school_slug: string | null
  school_name: string | null
  division: string | null
}

type StatRow = {
  player_slug: string
  season: number
  pass_yards: number | null
  pass_tds: number | null
  attempts: number | null
  completions: number | null
  interceptions: number | null
  rush_yards: number | null
  rush_tds: number | null
  rush_attempts: number | null
  recv_yards: number | null
  recv_tds: number | null
  receptions: number | null
  points: number | null
  total_tds: number | null
  fg: number | null
  pat: number | null
  games_played: number | null
}

type AggRow = { rank: number; player: PlayerRow; career: StatRow; totalPrimary: number }
type SeasonRow = { rank: number; player: PlayerRow; stat: StatRow }

function fv(v: number | null | undefined) {
  return v == null || v === 0 ? '—' : String(v)
}

function fmtPct(comp: number | null, att: number | null) {
  if (!comp || !att) return '—'
  return ((comp / att) * 100).toFixed(1) + '%'
}

function getPrimary(s: StatRow, slug: string): number {
  if (slug === 'qb') return s.pass_yards  ?? 0
  if (slug === 'rb') return s.rush_yards  ?? 0
  if (slug === 'wr' || slug === 'te') return s.recv_yards ?? 0
  if (slug === 'k')  return s.points      ?? 0
  return 0
}

function sumStat(rows: StatRow[], key: keyof StatRow): number | null {
  const total = rows.reduce((acc, r) => acc + ((r[key] as number | null) ?? 0), 0)
  return total > 0 ? total : null
}

function aggregateStats(rows: StatRow[]): StatRow {
  return {
    player_slug:   rows[0]?.player_slug ?? '',
    season:        -1,
    pass_yards:    sumStat(rows, 'pass_yards'),
    pass_tds:      sumStat(rows, 'pass_tds'),
    attempts:      sumStat(rows, 'attempts'),
    completions:   sumStat(rows, 'completions'),
    interceptions: sumStat(rows, 'interceptions'),
    rush_yards:    sumStat(rows, 'rush_yards'),
    rush_tds:      sumStat(rows, 'rush_tds'),
    rush_attempts: sumStat(rows, 'rush_attempts'),
    recv_yards:    sumStat(rows, 'recv_yards'),
    recv_tds:      sumStat(rows, 'recv_tds'),
    receptions:    sumStat(rows, 'receptions'),
    points:        sumStat(rows, 'points'),
    total_tds:     sumStat(rows, 'total_tds'),
    fg:            sumStat(rows, 'fg'),
    pat:           sumStat(rows, 'pat'),
    games_played:  sumStat(rows, 'games_played'),
  }
}

const TH = 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)] bg-[var(--surface)] whitespace-nowrap'
const TD = 'px-3 py-2.5 text-sm border-b border-[var(--border)]'

function PlayerCell({ player }: { player: PlayerRow }) {
  const logo = player.school_slug ? SCHOOL_LOGOS[player.school_slug] : null
  return (
    <td className={cn(TD, 'max-w-0 w-[44%]')}>
      <Link href={`/player/${player.slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
        {logo && <Image src={logo} alt="" width={20} height={20} className="shrink-0 h-5 w-5 object-contain" unoptimized />}
        <div className="min-w-0">
          <span className="font-medium truncate block" style={{ color: ACCENT_COLOR }}>{player.name}</span>
          <span className="text-[11px] text-[var(--muted)] truncate block">{player.school_name ?? '—'}</span>
        </div>
      </Link>
    </td>
  )
}

function RankCell({ rank }: { rank: number }) {
  return <td className={cn(TD, 'w-8 text-center text-xs text-[var(--muted)] tabular-nums')}>{rank}</td>
}

function DivCell({ division }: { division: string | null }) {
  return <td className={cn(TD, 'text-center text-xs text-[var(--muted)] w-12 hidden sm:table-cell')}>{division ? `D${division}` : '—'}</td>
}

function Num({ v, bold }: { v: number | null | undefined; bold?: boolean }) {
  return <td className={cn(TD, 'text-right tabular-nums text-[var(--muted)]', bold && 'font-semibold text-[var(--txt)]')}>{fv(v)}</td>
}

function QBTable({ rows }: { rows: (AggRow | SeasonRow)[] }) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead><tr>
          <th className={cn(TH, 'text-center w-8')}>#</th>
          <th className={cn(TH, 'text-left')}>Player</th>
          <th className={cn(TH, 'text-center hidden sm:table-cell')}>Div</th>
          <th className={cn(TH, 'text-right')}>YDS</th>
          <th className={cn(TH, 'text-right')}>ATT</th>
          <th className={cn(TH, 'text-right hidden sm:table-cell')}>COMP</th>
          <th className={cn(TH, 'text-right hidden sm:table-cell')}>PCT</th>
          <th className={cn(TH, 'text-right')}>TD</th>
          <th className={cn(TH, 'text-right')}>INT</th>
        </tr></thead>
        <tbody>
          {rows.map(r => {
            const s = 'career' in r ? r.career : r.stat
            return (
              <tr key={r.player.slug} className="hover:bg-[var(--inp-bg)] transition-colors">
                <RankCell rank={r.rank} />
                <PlayerCell player={r.player} />
                <DivCell division={r.player.division} />
                <Num v={s.pass_yards} bold />
                <Num v={s.attempts} />
                <td className={cn(TD, 'text-right tabular-nums text-[var(--muted)] hidden sm:table-cell')}>{fv(s.completions)}</td>
                <td className={cn(TD, 'text-right tabular-nums text-[var(--muted)] hidden sm:table-cell')}>{fmtPct(s.completions, s.attempts)}</td>
                <Num v={s.pass_tds} />
                <Num v={s.interceptions} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RBTable({ rows }: { rows: (AggRow | SeasonRow)[] }) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead><tr>
          <th className={cn(TH, 'text-center w-8')}>#</th>
          <th className={cn(TH, 'text-left')}>Player</th>
          <th className={cn(TH, 'text-center hidden sm:table-cell')}>Div</th>
          <th className={cn(TH, 'text-right')}>ATT</th>
          <th className={cn(TH, 'text-right')}>YDS</th>
          <th className={cn(TH, 'text-right')}>TD</th>
        </tr></thead>
        <tbody>
          {rows.map(r => {
            const s = 'career' in r ? r.career : r.stat
            return (
              <tr key={r.player.slug} className="hover:bg-[var(--inp-bg)] transition-colors">
                <RankCell rank={r.rank} /><PlayerCell player={r.player} /><DivCell division={r.player.division} />
                <Num v={s.rush_attempts} /><Num v={s.rush_yards} bold /><Num v={s.rush_tds} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReceiverTable({ rows }: { rows: (AggRow | SeasonRow)[] }) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead><tr>
          <th className={cn(TH, 'text-center w-8')}>#</th>
          <th className={cn(TH, 'text-left')}>Player</th>
          <th className={cn(TH, 'text-center hidden sm:table-cell')}>Div</th>
          <th className={cn(TH, 'text-right')}>REC</th>
          <th className={cn(TH, 'text-right')}>YDS</th>
          <th className={cn(TH, 'text-right')}>TD</th>
        </tr></thead>
        <tbody>
          {rows.map(r => {
            const s = 'career' in r ? r.career : r.stat
            return (
              <tr key={r.player.slug} className="hover:bg-[var(--inp-bg)] transition-colors">
                <RankCell rank={r.rank} /><PlayerCell player={r.player} /><DivCell division={r.player.division} />
                <Num v={s.receptions} /><Num v={s.recv_yards} bold /><Num v={s.recv_tds} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KickerTable({ rows }: { rows: (AggRow | SeasonRow)[] }) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead><tr>
          <th className={cn(TH, 'text-center w-8')}>#</th>
          <th className={cn(TH, 'text-left')}>Player</th>
          <th className={cn(TH, 'text-center hidden sm:table-cell')}>Div</th>
          <th className={cn(TH, 'text-right')}>PTS</th>
          <th className={cn(TH, 'text-right')}>TD</th>
          <th className={cn(TH, 'text-right')}>FG</th>
          <th className={cn(TH, 'text-right')}>PAT</th>
        </tr></thead>
        <tbody>
          {rows.map(r => {
            const s = 'career' in r ? r.career : r.stat
            return (
              <tr key={r.player.slug} className="hover:bg-[var(--inp-bg)] transition-colors">
                <RankCell rank={r.rank} /><PlayerCell player={r.player} /><DivCell division={r.player.division} />
                <Num v={s.points} bold /><Num v={s.total_tds} /><Num v={s.fg} /><Num v={s.pat} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RosterTable({ players }: { players: PlayerRow[] }) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead><tr>
          <th className={cn(TH, 'text-left')}>Player</th>
          <th className={cn(TH, 'text-center hidden sm:table-cell')}>Div</th>
          <th className={cn(TH, 'text-left text-[10px]')}>Position</th>
        </tr></thead>
        <tbody>
          {players.map(p => {
            const logo = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : null
            return (
              <tr key={p.slug} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'max-w-0 w-[55%]')}>
                  <Link href={`/player/${p.slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    {logo && <Image src={logo} alt="" width={20} height={20} className="shrink-0 h-5 w-5 object-contain" unoptimized />}
                    <div className="min-w-0">
                      <span className="font-medium truncate block" style={{ color: ACCENT_COLOR }}>{p.name}</span>
                      <span className="text-[11px] text-[var(--muted)] truncate block">{p.school_name ?? '—'}</span>
                    </div>
                  </Link>
                </td>
                <td className={cn(TD, 'text-center text-xs text-[var(--muted)] hidden sm:table-cell')}>{p.division ? `D${p.division}` : '—'}</td>
                <td className={cn(TD, 'text-xs text-[var(--muted)]')}>{p.position ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function PositionShell({
  config,
  players,
  stats,
}: {
  config: PositionConfig
  players: PlayerRow[]
  stats: StatRow[]
}) {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [tableExpanded, setTableExpanded]   = useState(true)
  const [slideIdx, setSlideIdx]             = useState(0)
  const [chartsOpen, setChartsOpen]         = useState(false)
  const [mapsOpen,   setMapsOpen]           = useState(false)
  const [chatOpen,   setChatOpen]           = useState(false)

  const posIdx  = POSITIONS.findIndex(p => p.slug === config.slug)
  const n       = POSITIONS.length
  const prevPos = POSITIONS[(posIdx - 1 + n) % n]
  const nextPos = POSITIONS[(posIdx + 1) % n]

  const availableSeasons = useMemo(
    () => [...new Set(stats.map(s => s.season))].sort((a, b) => b - a),
    [stats]
  )

  const playerMap = useMemo(() => {
    const m = new Map<string, PlayerRow>()
    for (const p of players) m.set(p.slug, p)
    return m
  }, [players])

  const aggRows: AggRow[] = useMemo(() => {
    if (!config.statType) return []
    const byPlayer = new Map<string, StatRow[]>()
    for (const s of stats) {
      const list = byPlayer.get(s.player_slug) ?? []
      list.push(s)
      byPlayer.set(s.player_slug, list)
    }
    return [...byPlayer.entries()]
      .map(([slug, rows]) => ({ slug, career: aggregateStats(rows), totalPrimary: rows.reduce((acc, r) => acc + getPrimary(r, config.slug), 0) }))
      .filter(e => e.totalPrimary > 0 && playerMap.has(e.slug))
      .sort((a, b) => b.totalPrimary - a.totalPrimary)
      .map((e, i) => ({ rank: i + 1, player: playerMap.get(e.slug)!, career: e.career, totalPrimary: e.totalPrimary }))
  }, [stats, config.statType, config.slug, playerMap])

  const seasonRows: SeasonRow[] = useMemo(() => {
    if (selectedSeason === null || !config.statType) return []
    return stats
      .filter(s => s.season === selectedSeason && getPrimary(s, config.slug) > 0)
      .sort((a, b) => getPrimary(b, config.slug) - getPrimary(a, config.slug))
      .map((s, i) => ({ rank: i + 1, player: playerMap.get(s.player_slug)!, stat: s }))
      .filter(r => r.player != null)
  }, [stats, selectedSeason, config.statType, config.slug, playerMap])

  const slides = useMemo(() => {
    const top = config.statType ? aggRows.slice(0, 8).map(r => r.player) : players.slice(0, 8)
    return top
      .map(p => PLAYER_PHOTOS[p.slug] ?? (p.school_slug ? TEAM_PHOTOS[p.school_slug]?.[0] : null))
      .filter((s): s is string => Boolean(s))
      .slice(0, 6)
  }, [aggRows, players, config.statType])

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [slides.length])

  // Season nav: current display season (used for nav arrows even when "All" is selected)
  const navSeason    = selectedSeason ?? availableSeasons[0]
  const navSeasonIdx = availableSeasons.indexOf(navSeason ?? -1)

  function prevSeason() {
    const newIdx = (navSeasonIdx - 1 + availableSeasons.length) % availableSeasons.length
    setSelectedSeason(availableSeasons[newIdx])
  }

  function nextSeason() {
    const newIdx = (navSeasonIdx + 1) % availableSeasons.length
    setSelectedSeason(availableSeasons[newIdx])
  }

  const tableRows    = selectedSeason === null ? aggRows : seasonRows
  const visibleRows  = tableExpanded ? tableRows : tableRows.slice(0, 5)
  const tableTitle   = selectedSeason === null
    ? `All-Time ${config.fullName}`
    : `${formatSeason(selectedSeason)} ${config.label}s`

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'

  const mobileHeader = (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-tight">{config.fullName}</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight">Section XI Football</p>
      </div>
    </div>
  )

  return (
    <>
      <AppLayout mobileHeader={mobileHeader}>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 pt-2 pb-8 sm:py-8">

            {/* Header */}
            <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <div className="hidden sm:flex mb-8 items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-[var(--txt)]">{config.fullName}</h1>
                <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-1">
                  <Link href="/section/section-xi" className="hover:text-[var(--txt)] transition-colors">Section XI</Link>
                  <span>/</span>
                  <span className="font-medium" style={{ color: ACCENT_COLOR }}>{config.label}</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/position/${prevPos.slug}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
                    <span className={tip}>{prevPos.label}</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} ${chartsOpen ? active : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setMapsOpen(v => !v)} className={`${btn} ${mapsOpen ? active : ''}`}><MapIcon className="h-4 w-4" /></button>
                    <span className={tip}>Map</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChatOpen(v => !v)} className={`${btn} ${chatOpen ? active : ''}`}><MessageCircle className="h-4 w-4" /></button>
                    <span className={tip}>Ask SportsGPT</span>
                  </div>
                  <div className="relative group">
                    <Link href={`/position/${nextPos.slug}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>{nextPos.label}</span>
                  </div>
                </div>
              </div>
            </div>
            </RevealFx>

            {/* Hero photo slider (desktop only) */}
            <RevealFx delay={0.15} translateY={16}>
            {slides.length > 0 && (
              <div className="hidden sm:block mb-8 relative rounded-2xl overflow-hidden" style={{ height: 400 }}>
                {slides.map((src, i) => (
                  <div key={src} className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: i === slideIdx ? 1 : 0 }}>
                    <Image src={src} alt="" fill className="object-cover object-top" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                ))}
                <div className="absolute bottom-0 left-0 p-5 pointer-events-none">
                  <p className="text-base font-bold text-white leading-snug">{config.fullName}</p>
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
            </RevealFx>

            {/* Stats / roster section */}
            <RevealFx delay={0.3} translateY={8}>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--txt)]">
                  {selectedSeason === null ? 'All-Time Leaders' : `${formatSeason(selectedSeason)} Leaders`}
                  {!config.statType && (
                    <span className="ml-2 text-[var(--muted)] font-normal text-base">({players.length})</span>
                  )}
                </h2>
                {config.statType && availableSeasons.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedSeason(null)}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                        selectedSeason === null
                          ? 'bg-[#033882] text-white border-[#033882]'
                          : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)]'
                      )}
                    >All</button>
                    <button onClick={prevSeason}
                      className="p-1 text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] rounded-md transition-colors">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedSeason(navSeason ?? availableSeasons[0])}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                        selectedSeason !== null
                          ? 'bg-[#033882] text-white border-[#033882]'
                          : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)]'
                      )}
                    >{navSeason ? formatSeason(navSeason) : '—'}</button>
                    <button onClick={nextSeason}
                      className="p-1 text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] rounded-md transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <InfoTable title={tableTitle} onToggle={() => setTableExpanded(v => !v)}>
                {config.statType ? (
                  tableRows.length === 0
                    ? <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No data for this period.</div>
                    : config.slug === 'qb' ? <QBTable rows={visibleRows} />
                    : config.slug === 'rb' ? <RBTable rows={visibleRows} />
                    : (config.slug === 'wr' || config.slug === 'te') ? <ReceiverTable rows={visibleRows} />
                    : <KickerTable rows={visibleRows} />
                ) : (
                  <RosterTable players={players} />
                )}
              </InfoTable>
            </div>
            </RevealFx>

            {/* Position nav pill bar */}
            <RevealFx delay={0.42} translateY={8}>
            <div className="mb-8 flex flex-wrap gap-2">
              {POSITIONS.map(p => (
                <Link key={p.slug} href={`/position/${p.slug}`}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                    p.slug === config.slug
                      ? 'bg-[#033882] text-white border-[#033882]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)]'
                  )}
                >{p.label}</Link>
              ))}
            </div>
            </RevealFx>

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={config.fullName} />
    </>
  )
}
