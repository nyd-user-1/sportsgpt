'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChartSpline, Map, MessageCircle, User, Download } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PLAYER_PHOTOS, SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { InfoTable } from '@/components/InfoTable'
import { RevealFx } from '@/components/RevealFx'
import { CardLandscapeMini } from '@/components/CardLandscapeMini'
import { cn, formatSeason } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

type StatRow = {
  id: number
  player_slug: string
  player_name: string
  school_slug: string | null
  school_name: string | null
  team_name: string | null
  season: number
  stat_type: string
  completions: number | null
  attempts: number | null
  pass_yards: number | null
  pass_tds: number | null
  interceptions: number | null
  rush_attempts: number | null
  rush_yards: number | null
  rush_tds: number | null
  receptions: number | null
  recv_yards: number | null
  recv_tds: number | null
  pat: number | null
  season_rank: number | null
  games_played: number | null
  total_yards: number | null
  yards_per_game: number | null
  total_tds: number | null
  tds_per_game: number | null
  fumble_return_tds: number | null
  int_return_tds: number | null
  punt_return_tds: number | null
  kickoff_return_tds: number | null
  points: number | null
  points_per_game: number | null
  fg: number | null
  safeties: number | null
  ai_summary: string | null
}

type PlayerRow = {
  id: number
  slug: string
  name: string
  school_slug: string | null
  team_slug: string | null
  position: string | null
}

type SchoolInfo = {
  name: string
  division: string
}

type DivTeamRow = {
  slug: string
  name: string
  overall_wins: number | null
  overall_losses: number | null
}

type DivPlayerRow = {
  player_slug: string
  player_name: string
  school_name: string
  school_slug: string | null
  stat_type: string
  pass_yards: number | null
  rush_yards: number | null
  recv_yards: number | null
  position: string | null
}

// Games table uses shortened slugs for some teams — map to canonical teams-table slug
const GAME_SLUG_TO_TEAM_SLUG: Record<string, string> = {
  'pat-med-varsity-football': 'patchogue-medford-varsity-football',
  'swr-varsity-football': 'shoreham-wading-river-varsity-football',
}
const GAME_SLUG_TO_NAME: Record<string, string> = {
  'pat-med-varsity-football': 'Pat-Med',
  'swr-varsity-football': 'Shoreham-Wading River',
}

type GameLogStat = {
  stat_type: string
  season: number
  yds: number | null
  att: number | null
  tds: number | null
  comp: number | null
  pass_int: number | null
  rec: number | null
  pat: number | null
  fg: number | null
  points: number | null
}

type GameLogRow = {
  game_id: number
  game_date: string | null
  season: number
  game_number: number | null
  home_team_slug: string
  away_team_slug: string
  home_score: number | null
  away_score: number | null
  home_team_name: string | null
  away_team_name: string | null
  stat_type: string
  yds: number | null
  att: number | null
  tds: number | null
  comp: number | null
  pass_int: number | null
  rec: number | null
  pat: number | null
  fg: number | null
  points: number | null
  sacks: number | null
  fumbles: number | null
}

const STAT_TYPES = ['Total Yards', 'Passing', 'Rushing', 'Receiving', 'Touchdowns', 'Defense', 'Scoring'] as const
type StatTypeName = typeof STAT_TYPES[number]

function fmtVal(v: number | null | undefined) {
  return v == null ? '—' : String(v)
}

function fmtCompPct(comp: number | null, att: number | null) {
  if (!comp || !att || att === 0) return '—'
  return ((comp / att) * 100).toFixed(1) + '%'
}

function fmtRecord(w: number | null, l: number | null): string {
  if (w == null && l == null) return '—'
  return `${w ?? 0}–${l ?? 0}`
}

function fmtWinPct(w: number | null, l: number | null): string {
  const wins = w ?? 0
  const losses = l ?? 0
  const g = wins + losses
  return g === 0 ? '—' : (wins / g).toFixed(3).replace(/^0/, '')
}

function topStat(p: DivPlayerRow): { label: string; value: string } {
  if (p.stat_type === 'Passing') return { label: 'Pass Yds', value: String(p.pass_yards ?? 0) }
  if (p.stat_type === 'Rushing') return { label: 'Rush Yds', value: String(p.rush_yards ?? 0) }
  return { label: 'Recv Yds', value: String(p.recv_yards ?? 0) }
}

function getBestYards(stats: StatRow[]) {
  let best = 0
  let label = ''
  let season = 0
  for (const s of stats) {
    const py = s.pass_yards ?? 0
    const ry = s.rush_yards ?? 0
    const recy = s.recv_yards ?? 0
    if (py > best) { best = py; label = 'Pass Yds'; season = s.season }
    if (ry > best) { best = ry; label = 'Rush Yds'; season = s.season }
    if (recy > best) { best = recy; label = 'Recv Yds'; season = s.season }
  }
  return { yards: best, label, season }
}

function defaultStatType(label: string): StatTypeName {
  if (label === 'Pass Yds') return 'Passing'
  if (label === 'Rush Yds') return 'Rushing'
  if (label === 'Recv Yds') return 'Receiving'
  return 'Passing'
}

const TH = 'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]'
const TD = 'px-3 py-2 text-sm border-b border-[var(--border)]'

function recordColor(rec: string | undefined): string {
  if (!rec) return 'text-[var(--muted)]'
  const [w, l] = rec.split('–').map(Number)
  if (isNaN(w) || isNaN(l)) return 'text-[var(--muted)]'
  if (w > l) return 'text-green-600 dark:text-green-400'
  if (w < l) return 'text-red-500'
  return 'text-[var(--muted)]'
}

function sumN(...vals: (number | null | undefined)[]): number {
  return vals.reduce<number>((acc, v) => acc + (v ?? 0), 0)
}

function CareerRow({ cells }: { cells: React.ReactNode[] }) {
  return (
    <tr className="border-t-2 border-[var(--border)] bg-[var(--surface)]">
      {cells.map((c, i) => (
        <td key={i} className={cn(TD, 'font-semibold text-[var(--txt)]', i > 0 ? 'text-right' : '')}>{c}</td>
      ))}
    </tr>
  )
}

function StatTable({ type, rows, teamRecords = {}, showRollup, rollupRecord }: { type: StatTypeName; rows: StatRow[]; teamRecords?: Record<number, string>; showRollup?: boolean; rollupRecord?: string }) {
  if (rows.length === 0) {
    return <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No {type.toLowerCase()} data available.</div>
  }

  const RU = 'px-3 py-2 font-semibold text-[var(--muted)]'
  const rollupRow = (cells: React.ReactNode[]) => showRollup ? (
    <tr className="bg-[var(--inp-bg)] border-b border-[var(--border)]">
      <td className={RU}>All Seasons</td>
      {cells.map((c, i) => <td key={i} className={cn(RU, 'text-right tabular-nums')}>{c}</td>)}
    </tr>
  ) : null

  if (type === 'Passing') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full table-fixed text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead><tr className="bg-[var(--surface)]">
            <th className={cn(TH, 'text-left')} style={{ width: '25%' }}>Season</th>
            <th className={cn(TH, 'text-right')}>YDS</th><th className={cn(TH, 'text-right')}>ATT</th>
            <th className={cn(TH, 'text-right')}>COMP</th><th className={cn(TH, 'text-right')}>PCT</th>
            <th className={cn(TH, 'text-right')}>TD</th><th className={cn(TH, 'text-right')}>INT</th>
            <th className={cn(TH, 'text-right')}>Record</th>
          </tr></thead>
          <tbody>
            {rollupRow([sumN(...rows.map(r=>r.pass_yards)), sumN(...rows.map(r=>r.attempts)), sumN(...rows.map(r=>r.completions)), fmtCompPct(sumN(...rows.map(r=>r.completions)), sumN(...rows.map(r=>r.attempts))), sumN(...rows.map(r=>r.pass_tds)), sumN(...rows.map(r=>r.interceptions)), <span className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>])}
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.pass_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.attempts)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.completions)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtCompPct(r.completions, r.attempts)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.pass_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.interceptions)}</td>
                <td className={cn(TD, 'text-right', recordColor(teamRecords[r.season]))}>{teamRecords[r.season] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'Rushing') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full table-fixed text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead><tr className="bg-[var(--surface)]">
            <th className={cn(TH, 'text-left')} style={{ width: '25%' }}>Season</th>
            <th className={cn(TH, 'text-right')}>ATT</th><th className={cn(TH, 'text-right')}>YDS</th>
            <th className={cn(TH, 'text-right')}>TD</th><th className={cn(TH, 'text-right')}>Record</th>
          </tr></thead>
          <tbody>
            {rollupRow([sumN(...rows.map(r=>r.rush_attempts)), sumN(...rows.map(r=>r.rush_yards)), sumN(...rows.map(r=>r.rush_tds)), <span className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>])}
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.rush_attempts)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.rush_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.rush_tds)}</td>
                <td className={cn(TD, 'text-right', recordColor(teamRecords[r.season]))}>{teamRecords[r.season] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'Receiving') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead><tr className="bg-[var(--surface)]">
            <th className={cn(TH, 'text-left')} style={{ width: '25%' }}>Season</th>
            <th className={cn(TH, 'text-right')}>REC</th><th className={cn(TH, 'text-right')}>YDS</th>
            <th className={cn(TH, 'text-right')}>TD</th><th className={cn(TH, 'text-right')}>Record</th>
          </tr></thead>
          <tbody>
            {rollupRow([sumN(...rows.map(r=>r.receptions)), sumN(...rows.map(r=>r.recv_yards)), sumN(...rows.map(r=>r.recv_tds)), <span className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>])}
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.receptions)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.recv_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.recv_tds)}</td>
                <td className={cn(TD, 'text-right', recordColor(teamRecords[r.season]))}>{teamRecords[r.season] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'Total Yards') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full table-fixed text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead><tr className="bg-[var(--surface)]">
            {['Season', 'All Purpose', 'Pass', 'Rush', 'Rec', 'Record'].map(h => (
              <th key={h} className={cn(TH, h === 'Season' ? 'text-left' : 'text-right')} style={h === 'Season' ? { width: '25%' } : {}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rollupRow([sumN(...rows.map(r=>r.total_yards)), sumN(...rows.map(r=>r.pass_yards)), sumN(...rows.map(r=>r.rush_yards)), sumN(...rows.map(r=>r.recv_yards)), <span className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>])}
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.total_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.pass_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.rush_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.recv_yards)}</td>
                <td className={cn(TD, 'text-right', recordColor(teamRecords[r.season]))}>{teamRecords[r.season] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'Touchdowns') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead><tr className="bg-[var(--surface)]">
            {['Season', 'TOT', 'Pass', 'Rush', 'Rec', 'TD/G'].map(h => (
              <th key={h} className={cn(TH, h === 'Season' ? 'text-left' : 'text-right')} style={h === 'Season' ? { width: '25%' } : {}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rollupRow([sumN(...rows.map(r=>r.total_tds)), sumN(...rows.map(r=>r.pass_tds)), sumN(...rows.map(r=>r.rush_tds)), sumN(...rows.map(r=>r.recv_tds)), '—'])}
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.total_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.pass_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.rush_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.recv_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.tds_per_game)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (type === 'Defense') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full table-fixed text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead><tr className="bg-[var(--surface)]">
            <th className={cn(TH, 'text-left')} style={{ width: '25%' }}>Season</th>
            <th className={cn(TH, 'text-right')}>SK</th><th className={cn(TH, 'text-right')}>FUM</th>
            <th className={cn(TH, 'text-right')}>Record</th>
          </tr></thead>
          <tbody>
            {rollupRow([sumN(...rows.map(r=>r.rush_yards)), sumN(...rows.map(r=>r.rush_attempts)), <span className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>])}
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.rush_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.rush_attempts)}</td>
                <td className={cn(TD, 'text-right', recordColor(teamRecords[r.season]))}>{teamRecords[r.season] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Scoring
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full table-fixed text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
        <thead><tr className="bg-[var(--surface)]">
          {['Season', 'PTS', 'TD', 'FG', 'PAT', 'S', 'Record'].map(h => (
            <th key={h} className={cn(TH, h === 'Season' ? 'text-left' : 'text-right')}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rollupRow([sumN(...rows.map(r=>r.points)), sumN(...rows.map(r=>r.total_tds)), sumN(...rows.map(r=>r.fg)), sumN(...rows.map(r=>r.pat)), sumN(...rows.map(r=>r.safeties)), <span className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>])}
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
              <td className={cn(TD, 'text-[var(--txt)] font-medium')} style={{ width: '25%' }}>{formatSeason(r.season)}</td>
              <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.points)}</td>
              <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.total_tds)}</td>
              <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.fg)}</td>
              <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.pat)}</td>
              <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.safeties)}</td>
              <td className={cn(TD, 'text-right', recordColor(teamRecords[r.season]))}>{teamRecords[r.season] ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PlayerShell({
  player,
  stats,
  school,
  prevSlug,
  nextSlug,
  divTeams,
  divPlayers,
  gameLogSeasonStats,
  gameLog,
  teamRecords,
}: {
  player: PlayerRow
  stats: StatRow[]
  school: SchoolInfo | null
  prevSlug: string
  nextSlug: string
  divTeams: DivTeamRow[]
  divPlayers: DivPlayerRow[]
  gameLogSeasonStats: GameLogStat[]
  gameLog: GameLogRow[]
  teamRecords: Record<number, string>
}) {
  const { yards, label, season: bestSeason } = getBestYards(stats)

  const [statTypeIdx, setStatTypeIdx] = useState(0)
  const [statsExpanded, setStatsExpanded] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exportOpen])

  const [chartsOpen, setChartsOpen] = useState(false)
  const [mapsOpen,   setMapsOpen]   = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)

  // Merge player_season_stats with game log aggregates (fill seasons missing from DB)
  const mergedStats: StatRow[] = (() => {
    const filled: StatRow[] = [...stats]
    const base = { id: -1, player_slug: player.slug, player_name: player.name,
      school_slug: player.school_slug, school_name: school?.name ?? null, team_name: null,
      season_rank: null, games_played: null, total_yards: null, yards_per_game: null,
      total_tds: null, tds_per_game: null, fumble_return_tds: null, int_return_tds: null,
      punt_return_tds: null, kickoff_return_tds: null, points_per_game: null,
      safeties: null, ai_summary: null,
      completions: null, attempts: null, pass_yards: null, pass_tds: null, interceptions: null,
      rush_attempts: null, rush_yards: null, rush_tds: null,
      receptions: null, recv_yards: null, recv_tds: null,
      pat: null, fg: null, points: null,
    }

    for (const g of gameLogSeasonStats) {
      const exists = stats.some(s => s.stat_type === g.stat_type && s.season === g.season)
      if (exists) continue
      if (!['Rushing', 'Passing', 'Receiving'].includes(g.stat_type)) continue
      filled.push({ ...base, season: g.season, stat_type: g.stat_type,
        completions: g.comp, attempts: g.att, pass_yards: g.stat_type === 'Passing' ? g.yds : null,
        pass_tds: g.stat_type === 'Passing' ? g.tds : null, interceptions: g.pass_int,
        rush_attempts: g.att, rush_yards: g.stat_type === 'Rushing' ? g.yds : null,
        rush_tds: g.stat_type === 'Rushing' ? g.tds : null,
        receptions: g.rec, recv_yards: g.stat_type === 'Receiving' ? g.yds : null,
        recv_tds: g.stat_type === 'Receiving' ? g.tds : null,
        pat: g.pat, fg: g.fg, points: g.points,
      })
    }

    // Fill summary stat types for seasons missing from player_season_stats
    const glSeasons = [...new Set(gameLogSeasonStats.map(g => g.season))]
    for (const season of glSeasons) {
      const glForSeason = gameLogSeasonStats.filter(g => g.season === season)
      const passYds  = glForSeason.find(g => g.stat_type === 'Passing')?.yds   ?? 0
      const rushYds  = glForSeason.find(g => g.stat_type === 'Rushing')?.yds   ?? 0
      const recvYds  = glForSeason.find(g => g.stat_type === 'Receiving')?.yds ?? 0
      const passTds  = glForSeason.find(g => g.stat_type === 'Passing')?.tds   ?? 0
      const rushTds  = glForSeason.find(g => g.stat_type === 'Rushing')?.tds   ?? 0
      const recvTds  = glForSeason.find(g => g.stat_type === 'Receiving')?.tds ?? 0
      const kickPts  = glForSeason.find(g => g.stat_type === 'Kicking')?.points ?? 0
      const kickPat  = glForSeason.find(g => g.stat_type === 'Kicking')?.pat   ?? 0
      const kickFg   = glForSeason.find(g => g.stat_type === 'Kicking')?.fg    ?? 0
      const totalYds = passYds + rushYds + recvYds
      const totalTds = passTds + rushTds + recvTds
      const points   = totalTds * 6 + kickPts
      const gamesPlayed = [...new Set(gameLog.filter(r => r.season === season).map(r => r.game_id))].length

      if (!stats.some(s => s.stat_type === 'Total Yards' && s.season === season) && totalYds > 0) {
        filled.push({ ...base, season, stat_type: 'Total Yards',
          pass_yards: passYds || null, rush_yards: rushYds || null, recv_yards: recvYds || null,
          total_yards: totalYds, games_played: gamesPlayed || null,
          yards_per_game: gamesPlayed > 0 ? Math.round(totalYds / gamesPlayed) : null,
        })
      }
      if (!stats.some(s => s.stat_type === 'Touchdowns' && s.season === season) && totalTds > 0) {
        filled.push({ ...base, season, stat_type: 'Touchdowns',
          rush_tds: rushTds || null, recv_tds: recvTds || null, pass_tds: passTds || null,
          total_tds: totalTds, games_played: gamesPlayed || null,
          tds_per_game: gamesPlayed > 0 ? Math.round((totalTds / gamesPlayed) * 10) / 10 : null,
        })
      }
      // Defense — aggregate sacks/fumbles from gameLog (stored in rush_yards/rush_attempts)
      if (!stats.some(s => s.stat_type === 'Defense' && s.season === season)) {
        const defRows = gameLog.filter(r => r.stat_type === 'Defense' && r.season === season)
        const totalSacks = defRows.reduce((acc, r) => acc + (r.sacks ?? 0), 0)
        const totalFumbles = defRows.reduce((acc, r) => acc + (r.fumbles ?? 0), 0)
        filled.push({ ...base, season, stat_type: 'Defense',
          rush_yards: totalSacks,
          rush_attempts: totalFumbles,
        })
      }

      if (!stats.some(s => s.stat_type === 'Scoring' && s.season === season) && points > 0) {
        filled.push({ ...base, season, stat_type: 'Scoring',
          total_tds: totalTds || null, pat: kickPat || null, fg: kickFg || null,
          points: points || null, games_played: gamesPlayed || null,
          points_per_game: gamesPlayed > 0 ? Math.round((points / gamesPlayed) * 10) / 10 : null,
        })
      }
    }

    return filled.sort((a, b) => b.season - a.season)
  })()

  const selectedType = STAT_TYPES[statTypeIdx]
  const availableTypes = [...STAT_TYPES] // always all views

  const allSeasons = [...new Set([
    ...mergedStats.map(s => s.season),
    ...gameLog.map(r => r.season),
  ])].sort((a, b) => b - a)
  const allTabs = [null, ...allSeasons] as (number | null)[]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight') {
        setSelectedSeason(prev => {
          const idx = allTabs.indexOf(prev)
          return allTabs[(idx + 1) % allTabs.length]
        })
      } else if (e.key === 'ArrowLeft') {
        setSelectedSeason(prev => {
          const idx = allTabs.indexOf(prev)
          return allTabs[(idx - 1 + allTabs.length) % allTabs.length]
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [allTabs.length])

  // All seasons the player has any data for — used to synthesize 0-rows for missing stat types
  const allPlayerSeasons = [...new Set(mergedStats.map(s => s.season))].sort((a, b) => b - a)

  const tableRows = (() => {
    const rows = mergedStats.filter(s => s.stat_type === selectedType)
    if (rows.length > 0) return rows
    // No data for this stat type — synthesize 0-rows from known seasons
    return allPlayerSeasons.map(season => ({
      ...{
        id: -1, player_slug: player.slug, player_name: player.name,
        school_slug: player.school_slug, school_name: school?.name ?? null, team_name: null,
        season_rank: null, total_yards: 0, yards_per_game: 0, total_tds: 0, tds_per_game: 0,
        fumble_return_tds: null, int_return_tds: null, punt_return_tds: null, kickoff_return_tds: null,
        points: 0, points_per_game: 0, fg: 0, safeties: 0, ai_summary: null,
        completions: 0, attempts: 0, pass_yards: 0, pass_tds: 0, interceptions: 0,
        rush_attempts: 0, rush_yards: 0, rush_tds: 0,
        receptions: 0, recv_yards: 0, recv_tds: 0,
        pat: 0, games_played: null,
      },
      season, stat_type: selectedType,
    }))
  })()

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'

  const schoolSlug = player.school_slug
  const heroPhoto  = PLAYER_PHOTOS[player.slug] ?? (schoolSlug ? TEAM_PHOTOS[schoolSlug]?.[0] : null) ?? null
  const logo       = schoolSlug ? SCHOOL_LOGOS[schoolSlug] : null

  const mobileHeader = (
    <div className="flex items-center gap-2 w-full">
      {logo ? (
        <Image src={logo} alt="" width={36} height={36}
          className="shrink-0 h-9 w-9 rounded-full bg-white p-0.5 object-contain ring-1 ring-[var(--border)]" unoptimized />
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-tight truncate">{player.name}</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight truncate">
          {school?.name ?? ''}
          {player.position ? ` · ${player.position}` : ''}
        </p>
      </div>
    </div>
  )

  return (
    <>
      <AppLayout mobileHeader={mobileHeader}>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 pt-2 pb-8 sm:py-8">

            {/* Header — hidden on mobile */}
            <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <div className="hidden sm:flex mb-8 items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {logo && (
                    <Image src={logo} alt="" width={28} height={28}
                      className="shrink-0 h-7 w-7 object-contain" unoptimized />
                  )}
                  <h1 className="text-2xl font-bold text-[var(--txt)]">{player.name}</h1>
                </div>
                {school && (
                  <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-1">
                    <Link href={`/team/${player.school_slug}-varsity-football`} className="hover:text-[var(--txt)] transition-colors">{school.name}</Link>
                    {player.position && <><span>/</span><span>{player.position}</span></>}
                    <span>/</span>
                    <span className="text-[var(--txt)]">{player.name}</span>
                  </div>
                )}
              </div>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/player/${prevSlug}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
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
                    <Link href={`/player/${nextSlug}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next</span>
                  </div>
                </div>
              </div>
            </div>
            </RevealFx>

            {/* Hero — player photo → team photo → gradient fallback (hidden on mobile) */}
            <RevealFx delay={0.15} translateY={16}>
            {heroPhoto ? (
              <div className="hidden sm:block mb-8 h-[400px] w-full rounded-2xl overflow-hidden relative">
                <Image src={heroPhoto} alt={player.name} fill className="object-cover object-top" unoptimized />
              </div>
            ) : (
              <div className="hidden sm:flex mb-8 h-[400px] w-full rounded-2xl border border-[var(--border)] overflow-hidden flex-col items-center justify-center gap-3"
                style={{ background: `linear-gradient(135deg,${ACCENT_COLOR}22 0%,${ACCENT_COLOR}44 100%)` }}>
                {logo ? (
                  <Image src={logo} alt="" width={64} height={64} className="object-contain" unoptimized />
                ) : (
                  <User className="h-12 w-12 text-[var(--muted)]" />
                )}
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--txt2)]">
                    {player.name}{player.position ? ` · ${player.position}` : ''}
                  </p>
                </div>
              </div>
            )}
            </RevealFx>

            {/* Season filter + Stats + Game Log */}
            <RevealFx delay={0.3} translateY={8}>
            {(mergedStats.length > 0 || gameLog.length > 0) && (() => {
              const STAT_LABELS: Record<string, string> = { 'Total Yards': 'All Purpose', 'Touchdowns': 'TDs' }
              const title = STAT_LABELS[selectedType] ?? selectedType

              const AGG_TYPES = ['Total Yards', 'Touchdowns', 'Scoring']

              // Agg rows for selected season (used in season tab view)
              type AggRow = { game_id: number; home_team_slug: string; away_team_slug: string; home_team_name: string | null; away_team_name: string | null; home_score: number | null; away_score: number | null; totalYds: number; passYds: number; rushYds: number; recYds: number; totalTds: number; passTds: number; rushTds: number; recTds: number; pts: number; pat: number; fg: number }
              const glAggRows: AggRow[] = (() => {
                if (selectedSeason === null) return []
                const seasonRows = gameLog.filter(r => r.season === selectedSeason)
                const gameIds = [...new Set(seasonRows.map(r => r.game_id))]
                return gameIds.map(gid => {
                  const rows = seasonRows.filter(r => r.game_id === gid)
                  const ref = rows[0]
                  const passYds = rows.find(r => r.stat_type === 'Passing')?.yds ?? 0
                  const rushYds = rows.find(r => r.stat_type === 'Rushing')?.yds ?? 0
                  const recYds  = rows.find(r => r.stat_type === 'Receiving')?.yds ?? 0
                  const passTds = rows.find(r => r.stat_type === 'Passing')?.tds ?? 0
                  const rushTds = rows.find(r => r.stat_type === 'Rushing')?.tds ?? 0
                  const recTds  = rows.find(r => r.stat_type === 'Receiving')?.tds ?? 0
                  const kickPts = rows.find(r => r.stat_type === 'Kicking')?.points ?? 0
                  const kickPat = rows.find(r => r.stat_type === 'Kicking')?.pat ?? 0
                  const kickFg  = rows.find(r => r.stat_type === 'Kicking')?.fg ?? 0
                  const totalTds = passTds + rushTds + recTds
                  return { game_id: gid, home_team_slug: ref.home_team_slug, away_team_slug: ref.away_team_slug, home_team_name: ref.home_team_name, away_team_name: ref.away_team_name, home_score: ref.home_score, away_score: ref.away_score,
                    totalYds: passYds + rushYds + recYds, passYds, rushYds, recYds,
                    totalTds, passTds, rushTds, recTds,
                    pts: totalTds * 6 + kickPts, pat: kickPat, fg: kickFg }
                })
              })()

              // Game log column defs (used in season tab view)
              type ColDef = { label: string; right?: boolean }
              const glColsByType: Record<string, ColDef[]> = {
                'Total Yards': [{ label: 'Opponent' }, { label: 'Yards', right: true }, { label: 'Pass', right: true }, { label: 'Rush', right: true }, { label: 'Rec', right: true }, { label: 'Result', right: true }],
                Passing:     [{ label: 'Opponent' }, { label: 'YDS', right: true }, { label: 'ATT', right: true }, { label: 'COMP', right: true }, { label: 'PCT', right: true }, { label: 'TD', right: true }, { label: 'INT', right: true }, { label: 'Result', right: true }],
                Rushing:     [{ label: 'Opponent' }, { label: 'ATT', right: true }, { label: 'YDS', right: true }, { label: 'TD', right: true }, { label: 'Result', right: true }],
                Receiving:   [{ label: 'Opponent' }, { label: 'REC', right: true }, { label: 'YDS', right: true }, { label: 'TD', right: true }, { label: 'Result', right: true }],
                Touchdowns:  [{ label: 'Opponent' }, { label: 'Total', right: true }, { label: 'Pass', right: true }, { label: 'Rush', right: true }, { label: 'Rec', right: true }, { label: 'Result', right: true }],
                Defense:     [{ label: 'Opponent' }, { label: 'SK', right: true }, { label: 'FUM', right: true }, { label: 'Result', right: true }],
                Scoring:     [{ label: 'Opponent' }, { label: 'PTS', right: true }, { label: 'TD', right: true }, { label: 'FG', right: true }, { label: 'PAT', right: true }, { label: 'S', right: true }, { label: 'Result', right: true }],
              }
              const glCols = glColsByType[selectedType] ?? []

              const downloadCSV = () => {
                const rows = selectedSeason === null ? tableRows : tableRows.filter(r => r.season === selectedSeason)
                const headers = ['Season', selectedType]
                const lines = [headers.join(','), ...rows.map(r => [formatSeason(r.season), selectedType].join(','))]
                const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `${player.name}-${selectedType}.csv`; a.click()
                URL.revokeObjectURL(url)
              }

              const rollupRecord = (() => {
                const entries = Object.entries(teamRecords)
                if (!entries.length) return undefined
                let w = 0, l = 0
                for (const [, rec] of entries) {
                  const parts = rec.split('–').map(Number)
                  w += parts[0] || 0; l += parts[1] || 0
                }
                return `${w}–${l}`
              })()

              const navProps = {
                onPrev: () => { setStatTypeIdx(i => (i - 1 + STAT_TYPES.length) % STAT_TYPES.length); setStatsExpanded(true) },
                onNext: () => { setStatTypeIdx(i => (i + 1) % STAT_TYPES.length); setStatsExpanded(true) },
              }

              return (
                <div className="mb-8">
                  {/* Season filter tabs */}
                  <div className="flex items-center border-b border-[var(--border)] mb-5">
                    <div className="flex items-center gap-0 flex-1">
                      {(['Total', ...allSeasons.map(s => formatSeason(s))] as string[]).map((label, i) => {
                        const season = i === 0 ? null : allSeasons[i - 1]
                        const active = selectedSeason === season
                        return (
                          <button key={label} onClick={() => { setSelectedSeason(season); setStatsExpanded(true) }}
                            className={cn('px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                              active ? 'border-[#033882] text-[var(--txt)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
                            )}
                          >{label}</button>
                        )
                      })}
                    </div>
                    <div ref={exportRef} className="relative">
                      <button onClick={() => setExportOpen(v => !v)} className="p-1 mb-px text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] rounded-md transition-colors" aria-label="Export">
                        <Download className="h-4 w-4" />
                      </button>
                      {exportOpen && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
                          {[
                            { label: 'Export CSV', fn: () => { downloadCSV(); setExportOpen(false) } },
                            { label: 'Export Doc', fn: () => {
                              const rows = selectedSeason === null ? tableRows : tableRows.filter(r => r.season === selectedSeason)
                              const lines = rows.map(r => `${formatSeason(r.season)}\t${selectedType}`).join('\n')
                              const blob = new Blob([lines], { type: 'application/msword' })
                              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${player.name}-${selectedType}.doc`; a.click()
                              setExportOpen(false)
                            }},
                            { label: 'Export .MD', fn: () => {
                              const rows = selectedSeason === null ? tableRows : tableRows.filter(r => r.season === selectedSeason)
                              const header = `# ${player.name} — ${selectedType}\n\n| Season | ${selectedType} |\n|--------|------|\n`
                              const body = rows.map(r => `| ${formatSeason(r.season)} | ${selectedType} |`).join('\n')
                              const blob = new Blob([header + body], { type: 'text/markdown' })
                              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${player.name}-${selectedType}.md`; a.click()
                              setExportOpen(false)
                            }},
                            { label: 'Export PDF', fn: () => { window.print(); setExportOpen(false) } },
                          ].map(({ label, fn }) => (
                            <button key={label} onClick={fn} className="w-full text-left px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TOTAL TAB: career stats across all seasons */}
                  {selectedSeason === null && mergedStats.length > 0 && (
                    <InfoTable title={title} onToggle={() => setStatsExpanded(v => !v)} {...navProps}>
                      <StatTable type={selectedType} rows={statsExpanded ? tableRows : tableRows.slice(0, 2)} teamRecords={teamRecords} showRollup rollupRecord={rollupRecord} />
                    </InfoTable>
                  )}

                  {/* SEASON TAB: one combined table — roll-up row + game log */}
                  {selectedSeason !== null && (
                    <InfoTable title={title} onToggle={() => setStatsExpanded(v => !v)} {...navProps}>
                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full table-fixed text-sm whitespace-nowrap">
                          <thead>
                            <tr className="bg-[var(--surface)]">
                              {glCols.map((c, ci) => (
                                <th key={c.label} className={cn('px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]', c.right ? 'text-right' : 'text-left')} style={ci === 0 ? { width: '25%' } : {}}>{c.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Game rows */}
                            {statsExpanded && AGG_TYPES.includes(selectedType) && glAggRows.map((r, i) => {
                              const isHome = r.home_team_slug === `${player.school_slug}-varsity-football`
                              const rawOppSlug = isHome ? r.away_team_slug : r.home_team_slug
                              const oppSlug = GAME_SLUG_TO_TEAM_SLUG[rawOppSlug] ?? rawOppSlug
                              const oppSchoolSlug = oppSlug.replace(/-varsity-football$/, '')
                              const rawOppName = (isHome ? r.away_team_name : r.home_team_name)?.replace(/\s+Varsity\s+Football$/i, '')
                              const oppName = rawOppName ?? GAME_SLUG_TO_NAME[rawOppSlug] ?? '—'
                              const oppLogo = SCHOOL_LOGOS[oppSchoolSlug]
                              const myScore  = isHome ? r.home_score : r.away_score
                              const oppScore = isHome ? r.away_score : r.home_score
                              const win = myScore != null && oppScore != null && myScore > oppScore
                              const result = myScore != null && oppScore != null ? `${myScore}–${oppScore}` : '—'
                              const td = (v: number) => <td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{v || '—'}</td>
                              return (
                                <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--inp-bg)]">
                                  <td className="px-3 py-2">
                                    <Link href={`/game/${r.game_id}`} className="inline-flex items-center gap-2 hover:underline">
                                      <span className="text-[11px] text-[var(--muted)] w-4 shrink-0">{isHome ? 'vs' : 'at'}</span>
                                      {oppLogo && <Image src={oppLogo} alt="" width={20} height={20} className="shrink-0 object-contain" unoptimized />}
                                      <span className="font-medium" style={{ color: ACCENT_COLOR }}>{oppName}</span>
                                    </Link>
                                  </td>
                                  {selectedType === 'Total Yards' && <>{td(r.totalYds)}{td(r.passYds)}{td(r.rushYds)}{td(r.recYds)}</>}
                                  {selectedType === 'Touchdowns'  && <>{td(r.totalTds)}{td(r.passTds)}{td(r.rushTds)}{td(r.recTds)}</>}
                                  {selectedType === 'Scoring'     && <>{td(r.pts)}{td(r.totalTds)}{td(r.fg)}{td(r.pat)}{td(0)}</>}
                                  <td className="px-3 py-2 text-right font-medium tabular-nums"><Link href={`/game/${r.game_id}`} className={cn('hover:underline', win ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>{result}</Link></td>
                                </tr>
                              )
                            })}
                            {statsExpanded && !AGG_TYPES.includes(selectedType) && gameLog.filter(r => r.stat_type === selectedType && r.season === selectedSeason).map((r, i) => {
                              const isHome = r.home_team_slug === `${player.school_slug}-varsity-football`
                              const rawOppSlug = isHome ? r.away_team_slug : r.home_team_slug
                              const oppSlug = GAME_SLUG_TO_TEAM_SLUG[rawOppSlug] ?? rawOppSlug
                              const oppSchoolSlug = oppSlug.replace(/-varsity-football$/, '')
                              const rawOppName = (isHome ? r.away_team_name : r.home_team_name)?.replace(/\s+Varsity\s+Football$/i, '')
                              const oppName = rawOppName ?? GAME_SLUG_TO_NAME[rawOppSlug] ?? '—'
                              const oppLogo = SCHOOL_LOGOS[oppSchoolSlug]
                              const myScore  = isHome ? r.home_score : r.away_score
                              const oppScore = isHome ? r.away_score : r.home_score
                              const win = myScore != null && oppScore != null && myScore > oppScore
                              const result = myScore != null && oppScore != null ? `${myScore}–${oppScore}` : '—'
                              return (
                                <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--inp-bg)]">
                                  <td className="px-3 py-2">
                                    <Link href={`/game/${r.game_id}`} className="inline-flex items-center gap-2 hover:underline">
                                      <span className="text-[11px] text-[var(--muted)] w-4 shrink-0">{isHome ? 'vs' : 'at'}</span>
                                      {oppLogo && <Image src={oppLogo} alt="" width={20} height={20} className="shrink-0 object-contain" unoptimized />}
                                      <span className="font-medium" style={{ color: ACCENT_COLOR }}>{oppName}</span>
                                    </Link>
                                  </td>
                                  {selectedType === 'Rushing'   && <><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.att ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.yds ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.tds ?? '—'}</td></>}
                                  {selectedType === 'Passing'   && <><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.yds ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.att ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.comp ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.comp != null && r.att ? ((r.comp / r.att) * 100).toFixed(1) + '%' : '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.tds ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.pass_int ?? '—'}</td></>}
                                  {selectedType === 'Receiving' && <><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.rec ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.yds ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.tds ?? '—'}</td></>}
                                  {selectedType === 'Defense'   && <><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.sacks ?? '—'}</td><td className="px-3 py-2 text-right tabular-nums text-[var(--muted)]">{r.fumbles ?? '—'}</td></>}
                                  <td className="px-3 py-2 text-right font-medium tabular-nums"><Link href={`/game/${r.game_id}`} className={cn('hover:underline', win ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>{result}</Link></td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </InfoTable>
                  )}
                </div>
              )
            })()}
            </RevealFx>

            {/* AI Summaries */}
            <RevealFx delay={0.42} translateY={8}>
            {(() => {
              const summaries = stats
                .filter(s => s.ai_summary)
                .sort((a, b) => b.season - a.season)
              if (summaries.length === 0) return null
              return (
                <div className="mb-8 flex flex-col gap-3">
                  {summaries.map((s, i) => (
                    <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
                        {formatSeason(s.season)} {s.stat_type} · Season Summary
                      </p>
                      <p className="text-sm text-[var(--txt)] leading-relaxed">{s.ai_summary}</p>
                    </div>
                  ))}
                </div>
              )
            })()}
            </RevealFx>

            {/* Top Players carousel */}
            <RevealFx delay={0.52} translateY={8}>
            {divPlayers.length > 0 && (
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Players</h2>
                  {school && <p className="text-xs text-[var(--muted)] mt-0.5">Division {school.division} · 2024-25</p>}
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {divPlayers.map((p, i) => {
                      const stat        = topStat(p)
                      const playerPhoto = PLAYER_PHOTOS[p.player_slug]
                      const fallbackLogo = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : null
                      const img = playerPhoto
                        ? <Image src={playerPhoto} alt="" width={45} height={45} className="w-[45px] h-[45px] rounded-lg object-cover" unoptimized />
                        : fallbackLogo
                        ? <Image src={fallbackLogo} alt="" width={45} height={45} className="object-contain" unoptimized />
                        : undefined
                      return (
                        <CardLandscapeMini
                          key={`${p.player_slug}-${i}`}
                          href={`/player/${p.player_slug}`}
                          image={img}
                          title={p.player_name}
                          row2={{ text: p.position ? `${p.position}, ${p.stat_type}` : p.stat_type }}
                          stat={{ value: stat.value, label: stat.label }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            </RevealFx>

            {/* Division Standings carousel */}
            <RevealFx delay={0.62} translateY={8}>
            {divTeams.length > 0 && school && (
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Division {school.division} Standings</h2>
                  <p className="text-xs text-[var(--muted)] mt-0.5">2024-25</p>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {divTeams.map(t => {
                      const tSchoolSlug = t.slug.replace(/-varsity-football$/, '')
                      const tLogo = SCHOOL_LOGOS[tSchoolSlug]
                      return (
                        <CardLandscapeMini
                          key={t.slug}
                          href={`/team/${t.slug}`}
                          image={tLogo ? <Image src={tLogo} alt="" width={45} height={45} className="object-contain" unoptimized /> : undefined}
                          title={t.name.replace(/\s+Varsity\s+Football$/i, '')}
                          stat={{ value: fmtRecord(t.overall_wins, t.overall_losses) }}
                          statFirst
                          row2={{ text: fmtWinPct(t.overall_wins, t.overall_losses) }}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Best Season card */}
            {yards > 0 && (
              <div className="mb-8 rounded-2xl overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #0a52c7 100%)` }}>
                <div className="px-6 py-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-1">
                      Best Season · {formatSeason(bestSeason)}
                    </p>
                    <p className="text-4xl font-black text-white">{yards.toLocaleString()}</p>
                    <p className="text-sm text-white/80 mt-1">{label}</p>
                  </div>
                  {(() => {
                    const photo = PLAYER_PHOTOS[player.slug]
                    return photo ? (
                      <div className="shrink-0 h-20 w-20 rounded-full overflow-hidden border-2 border-white/30 relative">
                        <Image src={photo} alt={player.name} fill className="object-cover object-top" unoptimized />
                      </div>
                    ) : logo ? (
                      <div className="shrink-0 h-16 w-16 rounded-full bg-white/10 flex items-center justify-center p-1.5">
                        <Image src={logo} alt="" width={52} height={52} className="object-contain" unoptimized />
                      </div>
                    ) : (
                      <User className="shrink-0 h-16 w-16 text-white/20" />
                    )
                  })()}
                </div>
              </div>
            )}
            </RevealFx>

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={player.name} />
    </>
  )
}
