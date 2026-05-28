'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, ChartSpline, FileUser, Sparkles,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { AppPanel } from '@/components/AppPanel'
import { PanelChart } from '@/components/PanelChart'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead, EditorialButtonGroup,
  SectionHead, SubSectionHead, ContentsNav,
  PAPER_BRIDGE, TABLET_RADIUS,
  Tablet, EmptyTablet, ScrollTable,
  StickyControlBar, SearchInput, useSearchHotkey,
  SearchButtonGroup,
  MONO, tabletTd,
} from '@/components/editorial'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason, cn } from '@/lib/utils'
import { primaryPositionSlug } from '@/lib/positions'

// ── Types ─────────────────────────────────────────────────────────────────────

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

type SchoolInfo = { name: string; division: string }

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

// ── Style tokens ──────────────────────────────────────────────────────────────

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

// ── Helpers ───────────────────────────────────────────────────────────────────

const GAME_SLUG_TO_TEAM_SLUG: Record<string, string> = {
  'pat-med-varsity-football': 'patchogue-medford-varsity-football',
  'swr-varsity-football': 'shoreham-wading-river-varsity-football',
}
const GAME_SLUG_TO_NAME: Record<string, string> = {
  'pat-med-varsity-football': 'Pat-Med',
  'swr-varsity-football': 'Shoreham-Wading River',
}

const stripVarsity = (n: string | null | undefined) =>
  (n ?? '').replace(/\s+Varsity\s+Football$/i, '')

function fmtVal(v: number | null | undefined) {
  return v == null ? '—' : v.toLocaleString()
}

function fmtCompPct(comp: number | null, att: number | null) {
  if (!comp || !att || att === 0) return '—'
  return ((comp / att) * 100).toFixed(1) + '%'
}

function fmtRecord(w: number | null, l: number | null) {
  if (w == null && l == null) return '—'
  return `${w ?? 0}–${l ?? 0}`
}

function fmtWinPct(w: number | null, l: number | null) {
  const ww = w ?? 0, ll = l ?? 0, g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

function sumN(...vals: (number | null | undefined)[]): number {
  return vals.reduce<number>((a, v) => a + (v ?? 0), 0)
}

function getBestYards(stats: StatRow[]) {
  let best = 0, label = '', season = 0
  for (const s of stats) {
    const py = s.pass_yards ?? 0, ry = s.rush_yards ?? 0, recy = s.recv_yards ?? 0
    if (py > best) { best = py; label = 'Pass Yds'; season = s.season }
    if (ry > best) { best = ry; label = 'Rush Yds'; season = s.season }
    if (recy > best) { best = recy; label = 'Recv Yds'; season = s.season }
  }
  return { yards: best, label, season }
}

function topStat(p: DivPlayerRow): { label: string; value: string } {
  if (p.stat_type === 'Passing')   return { label: 'pass yds', value: String(p.pass_yards ?? 0) }
  if (p.stat_type === 'Rushing')   return { label: 'rush yds', value: String(p.rush_yards ?? 0) }
  return { label: 'recv yds', value: String(p.recv_yards ?? 0) }
}

const STAT_LABELS: Record<string, string> = { 'Total Yards': 'All Purpose', 'Touchdowns': 'TDs' }
const STAT_BLURBS: Record<StatTypeName, string> = {
  'Total Yards': 'All-purpose yardage across passing, rushing, and receiving.',
  Passing:    'Attempts, completions, yardage, touchdowns, and interceptions through the air.',
  Rushing:    'Carries, yardage, and touchdowns on the ground.',
  Receiving:  'Receptions, yardage, and touchdowns through the catch.',
  Touchdowns: 'Total scoring plays, by category.',
  Defense:    'Sacks, fumbles recovered, and defensive plays.',
  Scoring:    'Points, touchdowns, field goals, and PATs.',
}

// ── Recap parser — wraps **bold**, player names, team names ──────────────────

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseRecapPara(
  text: string,
  playerMap: Record<string, string>,
  teamMap: Record<string, string>,
): React.ReactNode[] {
  // Build name patterns — longest first so multi-word names match before single
  const playerNames = Object.keys(playerMap).sort((a, b) => b.length - a.length)
  const teamNames   = Object.keys(teamMap).sort((a, b) => b.length - a.length)
  const allNames    = [...playerNames, ...teamNames].map(escapeRegex)

  const pattern = allNames.length > 0
    ? `\\*\\*([^*]+)\\*\\*|(${allNames.join('|')})`
    : `\\*\\*([^*]+)\\*\\*`
  const regex = new RegExp(pattern, 'gi')

  const nodes: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))

    if (match[1]) {
      // **bold** — career stat line
      nodes.push(<strong key={match.index} className="text-[var(--paper-text)] font-medium">{match[1]}</strong>)
    } else if (match[2]) {
      const raw = match[0]
      const key = raw.toLowerCase()
      const playerSlug = playerMap[key]
      const teamSlug   = teamMap[key]
      if (playerSlug) {
        nodes.push(
          <Link key={match.index} href={`/player/${playerSlug}?profile=open`} scroll={false}
            className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors">
            {raw}
          </Link>
        )
      } else if (teamSlug) {
        nodes.push(
          <Link key={match.index} href={`/team/${teamSlug}`}
            className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors">
            {raw}
          </Link>
        )
      } else {
        nodes.push(raw)
      }
    }

    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// ── Stat table for the Stats section ─────────────────────────────────────────

const TH_CLS = 'px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)]'

function recordColor(rec: string | undefined) {
  if (!rec) return 'text-[var(--paper-muted)]'
  const [w, l] = rec.split('–').map(Number)
  if (isNaN(w) || isNaN(l)) return 'text-[var(--paper-muted)]'
  if (w > l) return 'text-emerald-500'
  if (w < l) return 'text-rose-500'
  return 'text-[var(--paper-muted)]'
}

function StatTable({
  type, rows, teamRecords = {}, rollupRecord, showRollup,
}: {
  type: StatTypeName
  rows: StatRow[]
  teamRecords?: Record<number, string>
  rollupRecord?: string
  showRollup?: boolean
}) {
  if (rows.length === 0) {
    return <EmptyTablet label={`No ${type.toLowerCase()} data recorded.`} />
  }

  const cell = cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')
  const cellMuted = cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')

  function Rollup({ cells }: { cells: React.ReactNode[] }) {
    if (!showRollup) return null
    return (
      <tr className="border-t border-[var(--paper-rule)] bg-[color:color-mix(in_srgb,var(--paper-text)_3%,transparent)]">
        <td className={cn(tabletTd, 'pl-5 text-[var(--paper-muted)]')} style={{ ...SERIF, fontStyle: 'italic' }}>All Seasons</td>
        {cells.map((c, i) => <td key={i} className={cn(cell, 'font-medium pr-5 last:pr-5')} style={MONO}>{c}</td>)}
      </tr>
    )
  }

  function Header({ cols }: { cols: string[] }) {
    return (
      <thead>
        <tr>
          <th className={cn(TH_CLS, 'pl-5 text-left')} style={SANS}>Season</th>
          {cols.map((c, i) => (
            <th
              key={c}
              className={cn(TH_CLS, 'text-right', i === cols.length - 1 && 'pr-5')}
              style={SANS}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
    )
  }

  function SeasonCell({ season }: { season: number }) {
    return (
      <td className={cn(tabletTd, 'pl-5 text-[var(--paper-text)]')} style={{ ...SERIF, fontWeight: 500 }}>
        {formatSeason(season)}
      </td>
    )
  }

  function RecordCell({ rec, last }: { rec: string | undefined; last?: boolean }) {
    return (
      <td className={cn(tabletTd, 'text-right tabular-nums font-medium', last && 'pr-5', recordColor(rec))} style={MONO}>
        {rec ?? '—'}
      </td>
    )
  }

  if (type === 'Passing') {
    const cols = ['YDS', 'ATT', 'COMP', 'PCT', 'TD', 'INT', 'RECORD']
    return (
      <ScrollTable maxH={0}>
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <Header cols={cols} />
          <tbody>
            <Rollup cells={[
              sumN(...rows.map(r => r.pass_yards)),
              sumN(...rows.map(r => r.attempts)),
              sumN(...rows.map(r => r.completions)),
              fmtCompPct(sumN(...rows.map(r => r.completions)), sumN(...rows.map(r => r.attempts))),
              sumN(...rows.map(r => r.pass_tds)),
              sumN(...rows.map(r => r.interceptions)),
              <span key="rec" className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>,
            ]} />
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                <SeasonCell season={r.season} />
                <td className={cell} style={MONO}>{fmtVal(r.pass_yards)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.attempts)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.completions)}</td>
                <td className={cell} style={MONO}>{fmtCompPct(r.completions, r.attempts)}</td>
                <td className={cell} style={MONO}>{fmtVal(r.pass_tds)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.interceptions)}</td>
                <RecordCell rec={teamRecords[r.season]} last />
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    )
  }

  if (type === 'Rushing') {
    const cols = ['ATT', 'YDS', 'TD', 'RECORD']
    return (
      <ScrollTable maxH={0}>
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <Header cols={cols} />
          <tbody>
            <Rollup cells={[
              sumN(...rows.map(r => r.rush_attempts)),
              sumN(...rows.map(r => r.rush_yards)),
              sumN(...rows.map(r => r.rush_tds)),
              <span key="rec" className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>,
            ]} />
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                <SeasonCell season={r.season} />
                <td className={cellMuted} style={MONO}>{fmtVal(r.rush_attempts)}</td>
                <td className={cell} style={MONO}>{fmtVal(r.rush_yards)}</td>
                <td className={cell} style={MONO}>{fmtVal(r.rush_tds)}</td>
                <RecordCell rec={teamRecords[r.season]} last />
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    )
  }

  if (type === 'Receiving') {
    const cols = ['REC', 'YDS', 'TD', 'RECORD']
    return (
      <ScrollTable maxH={0}>
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <Header cols={cols} />
          <tbody>
            <Rollup cells={[
              sumN(...rows.map(r => r.receptions)),
              sumN(...rows.map(r => r.recv_yards)),
              sumN(...rows.map(r => r.recv_tds)),
              <span key="rec" className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>,
            ]} />
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                <SeasonCell season={r.season} />
                <td className={cellMuted} style={MONO}>{fmtVal(r.receptions)}</td>
                <td className={cell} style={MONO}>{fmtVal(r.recv_yards)}</td>
                <td className={cell} style={MONO}>{fmtVal(r.recv_tds)}</td>
                <RecordCell rec={teamRecords[r.season]} last />
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    )
  }

  if (type === 'Total Yards') {
    const cols = ['ALL PURPOSE', 'PASS', 'RUSH', 'REC', 'RECORD']
    return (
      <ScrollTable maxH={0}>
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <Header cols={cols} />
          <tbody>
            <Rollup cells={[
              sumN(...rows.map(r => r.total_yards)),
              sumN(...rows.map(r => r.pass_yards)),
              sumN(...rows.map(r => r.rush_yards)),
              sumN(...rows.map(r => r.recv_yards)),
              <span key="rec" className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>,
            ]} />
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                <SeasonCell season={r.season} />
                <td className={cell} style={MONO}>{fmtVal(r.total_yards)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.pass_yards)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.rush_yards)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.recv_yards)}</td>
                <RecordCell rec={teamRecords[r.season]} last />
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    )
  }

  if (type === 'Touchdowns') {
    const cols = ['TOT', 'PASS', 'RUSH', 'REC', 'TD/G']
    return (
      <ScrollTable maxH={0}>
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <Header cols={cols} />
          <tbody>
            <Rollup cells={[
              sumN(...rows.map(r => r.total_tds)),
              sumN(...rows.map(r => r.pass_tds)),
              sumN(...rows.map(r => r.rush_tds)),
              sumN(...rows.map(r => r.recv_tds)),
              '—',
            ]} />
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                <SeasonCell season={r.season} />
                <td className={cell} style={MONO}>{fmtVal(r.total_tds)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.pass_tds)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.rush_tds)}</td>
                <td className={cellMuted} style={MONO}>{fmtVal(r.recv_tds)}</td>
                <td className={cn(cellMuted, 'pr-5')} style={MONO}>{fmtVal(r.tds_per_game)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    )
  }

  if (type === 'Defense') {
    const cols = ['SK', 'FUM', 'RECORD']
    return (
      <ScrollTable maxH={0}>
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <Header cols={cols} />
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                <SeasonCell season={r.season} />
                <td className={cellMuted} style={MONO}>—</td>
                <td className={cellMuted} style={MONO}>—</td>
                <RecordCell rec={teamRecords[r.season]} last />
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    )
  }

  // Scoring
  const cols = ['PTS', 'TD', 'FG', 'PAT', 'S', 'RECORD']
  return (
    <ScrollTable maxH={0}>
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <Header cols={cols} />
        <tbody>
          <Rollup cells={[
            sumN(...rows.map(r => r.points)),
            sumN(...rows.map(r => r.total_tds)),
            sumN(...rows.map(r => r.fg)),
            sumN(...rows.map(r => r.pat)),
            sumN(...rows.map(r => r.safeties)),
            <span key="rec" className={recordColor(rollupRecord)}>{rollupRecord ?? '—'}</span>,
          ]} />
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
              <SeasonCell season={r.season} />
              <td className={cell} style={MONO}>{fmtVal(r.points)}</td>
              <td className={cellMuted} style={MONO}>{fmtVal(r.total_tds)}</td>
              <td className={cellMuted} style={MONO}>{fmtVal(r.fg)}</td>
              <td className={cellMuted} style={MONO}>{fmtVal(r.pat)}</td>
              <td className={cellMuted} style={MONO}>{fmtVal(r.safeties)}</td>
              <RecordCell rec={teamRecords[r.season]} last />
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  )
}

// ── Game Log (per-season) ────────────────────────────────────────────────────

// Opponent display name for a game-log row (mirrors the row-render logic).
// Shared by the table render and the search matcher so they never drift.
function gameOppName(ref: GameLogRow, schoolSlug: string): string {
  const isHome = ref.home_team_slug === `${schoolSlug}-varsity-football`
  const rawOpp = isHome ? ref.away_team_slug : ref.home_team_slug
  return stripVarsity(isHome ? ref.away_team_name : ref.home_team_name) || GAME_SLUG_TO_NAME[rawOpp] || ''
}

function gameMatchesQuery(ref: GameLogRow, schoolSlug: string, q: string): boolean {
  if (!q) return true
  return gameOppName(ref, schoolSlug).toLowerCase().includes(q) || formatSeason(ref.season).toLowerCase().includes(q)
}

function GameLogTable({
  player, season, gameLog, query,
}: {
  player: PlayerRow
  season: number | null
  gameLog: GameLogRow[]
  query: string
}) {
  const rows = useMemo(
    () => season === null ? gameLog : gameLog.filter(r => r.season === season),
    [gameLog, season],
  )

  // Aggregate per game (rows from JSONB can have multiple stat_types per game)
  const byGame = useMemo(() => {
    const map: Record<number, GameLogRow[]> = {}
    for (const r of rows) {
      if (!map[r.game_id]) map[r.game_id] = []
      map[r.game_id].push(r)
    }
    return Object.values(map).sort((a, b) =>
      // Newest first when all-time, oldest first when season-scoped
      season === null
        ? (b[0].game_date ?? '').localeCompare(a[0].game_date ?? '')
        : (a[0].game_date ?? '').localeCompare(b[0].game_date ?? ''),
    )
  }, [rows, season])

  const q = query.trim().toLowerCase()
  const visible = useMemo(
    () => q ? byGame.filter(entries => gameMatchesQuery(entries[0], player.school_slug, q)) : byGame,
    [byGame, q, player.school_slug],
  )

  if (rows.length === 0) return <EmptyTablet label={season === null
    ? 'No game log recorded for this player.'
    : `No game log recorded for ${formatSeason(season)}.`} />

  if (visible.length === 0) return <EmptyTablet label={`No games match “${query.trim()}”.`} />

  const showSeason = season === null

  return (
    <ScrollTable maxH={0}>
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            {showSeason && (
              <th className={cn(TH_CLS, 'pl-5 text-left')} style={SANS}>Season</th>
            )}
            <th className={cn(TH_CLS, showSeason ? 'text-left' : 'pl-5 text-left')} style={SANS}>Opponent</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>Pass</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>Rush</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>Rec</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>TD</th>
            <th className={cn(TH_CLS, 'text-right pr-5')} style={SANS}>Result</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((entries, i) => {
            const ref = entries[0]
            const passYds = entries.find(r => r.stat_type === 'Passing')?.yds   ?? 0
            const rushYds = entries.find(r => r.stat_type === 'Rushing')?.yds   ?? 0
            const recYds  = entries.find(r => r.stat_type === 'Receiving')?.yds ?? 0
            const passTds = entries.find(r => r.stat_type === 'Passing')?.tds   ?? 0
            const rushTds = entries.find(r => r.stat_type === 'Rushing')?.tds   ?? 0
            const recTds  = entries.find(r => r.stat_type === 'Receiving')?.tds ?? 0
            const totalTds = passTds + rushTds + recTds

            const isHome = ref.home_team_slug === `${player.school_slug}-varsity-football`
            const rawOpp = isHome ? ref.away_team_slug : ref.home_team_slug
            const oppSlug = GAME_SLUG_TO_TEAM_SLUG[rawOpp] ?? rawOpp
            const oppSchool = oppSlug.replace(/-varsity-football$/, '')
            const oppName = stripVarsity(isHome ? ref.away_team_name : ref.home_team_name)
              || GAME_SLUG_TO_NAME[rawOpp] || '—'
            const oppLogo = SCHOOL_LOGOS[oppSchool]

            const myScore  = isHome ? ref.home_score : ref.away_score
            const oppScore = isHome ? ref.away_score : ref.home_score
            const win = myScore != null && oppScore != null && myScore > oppScore
            const lose = myScore != null && oppScore != null && myScore < oppScore
            const result = myScore != null && oppScore != null ? `${myScore}–${oppScore}` : '—'

            return (
              <tr
                key={i}
                className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
              >
                {showSeason && (
                  <td className={cn(tabletTd, 'pl-5 text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                    {formatSeason(ref.season)}
                  </td>
                )}
                <td className={showSeason ? tabletTd : 'px-5 py-3.5'}>
                  <Link href={`/team/${oppSlug}`} className="flex items-center gap-3 min-w-0 text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors group/g">
                    <span className="text-[11px] text-[var(--paper-faint)] shrink-0" style={SANS}>
                      {isHome ? 'vs' : 'at'}
                    </span>
                    {oppLogo && <Image src={oppLogo} alt="" width={22} height={22} className="shrink-0 object-contain" unoptimized />}
                    <span className="truncate group-hover/g:underline" style={{ ...SERIF, fontSize: 15, fontWeight: 500 }}>{oppName}</span>
                  </Link>
                </td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{passYds || '—'}</td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{rushYds || '—'}</td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{recYds || '—'}</td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{totalTds || '—'}</td>
                <td className={cn(tabletTd, 'text-right pr-5 tabular-nums font-medium', win && 'text-emerald-500', lose && 'text-rose-500', !win && !lose && 'text-[var(--paper-muted)]')} style={MONO}>
                  {result === '—' ? (
                    result
                  ) : (
                    <Link href={`/game/${ref.game_id}?ref=${player.school_slug}-varsity-football`} className="hover:underline">
                      {result}
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollTable>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────

type SectionId = 'best-season' | 'stats' | 'recap' | 'games' | 'seasons'

export function PlayerShell({
  player,
  stats,
  school,
  prevSlug,
  nextSlug,
  allPlayers = [],
  allTeams = [],
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
  allPlayers?: { player_slug: string; player_name: string }[]
  allTeams?: { slug: string; name: string }[]
  divTeams: DivTeamRow[]
  divPlayers: DivPlayerRow[]
  gameLogSeasonStats: GameLogStat[]
  gameLog: GameLogRow[]
  teamRecords: Record<number, string>
}) {
  // ── URL state: profile=open keeps the panel persistent across prev/next nav
  const searchParams = useSearchParams()
  const initialPanelOpen = searchParams.get('profile') === 'open'

  // ── Panels ──────────────────────────────────────────────────────────────
  const [chartsOpen,  setChartsOpen]  = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const [profilePanelOpen, setProfilePanelOpen] = useState(initialPanelOpen)

  // ── Sticky bar ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))
  const q = query.trim().toLowerCase()

  // ── Recap section trigger (matches Game Highlights pattern) ─────────────
  const [recapTriggered, setRecapTriggered] = useState(false)
  const [recapTitle,     setRecapTitle]     = useState<string | null>(null)
  const [recapBody,      setRecapBody]      = useState<string | null>(null)
  const [loadingRecap,   setLoadingRecap]   = useState(false)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(`recap-v2-${player.slug}`)
      if (cached) {
        const p = JSON.parse(cached)
        setRecapTitle(p.title ?? null)
        setRecapBody(p.body ?? null)
        setRecapTriggered(true)
      }
    } catch {}
  }, [player.slug])

  function triggerRecap() {
    if (recapTriggered || loadingRecap) return
    setRecapTriggered(true)
    setLoadingRecap(true)
    fetch(`/api/player/${player.slug}/recap`)
      .then(async res => {
        const text = await res.text()
        const nl = text.indexOf('\n')
        if (nl !== -1) {
          const title = text.slice(0, nl).trim().replace(/^#+\s*/, '')
          const body  = text.slice(nl + 1).trimStart()
          setRecapTitle(title)
          setRecapBody(body)
          try { sessionStorage.setItem(`recap-v2-${player.slug}`, JSON.stringify({ title, body })) } catch {}
        } else {
          setRecapBody(text.trim())
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRecap(false))
  }

  // Auto-trigger when the panel opens (or arrives open via ?profile=open)
  useEffect(() => {
    if (profilePanelOpen) triggerRecap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePanelOpen])

  // ── Inline-link maps for the recap text ─────────────────────────────────
  // Map name → slug. Lowercased keys. Drop the current player so the recap
  // doesn't link the subject to themselves. Skip very short names (1-3 chars)
  // to avoid noisy false matches on common words.
  const playerNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of allPlayers) {
      if (p.player_slug === player.slug) continue
      if (!p.player_name || p.player_name.length < 4) continue
      m[p.player_name.toLowerCase()] = p.player_slug
    }
    return m
  }, [allPlayers, player.slug])

  const teamNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const t of allTeams) {
      const display = t.name.replace(/\s+Varsity\s+Football$/i, '').trim()
      if (display.length < 4) continue
      m[display.toLowerCase()] = t.slug
    }
    return m
  }, [allTeams])

  // ── Merge stats (preserve original logic) ───────────────────────────────
  const mergedStats: StatRow[] = useMemo(() => {
    const filled: StatRow[] = [...stats]
    const base = {
      id: -1, player_slug: player.slug, player_name: player.name,
      school_slug: player.school_slug, school_name: school?.name ?? null, team_name: null,
      season_rank: null, games_played: null, total_yards: null, yards_per_game: null,
      total_tds: null, tds_per_game: null, fumble_return_tds: null, int_return_tds: null,
      punt_return_tds: null, kickoff_return_tds: null, points_per_game: null,
      safeties: null, ai_summary: null,
      completions: null, attempts: null, pass_yards: null, pass_tds: null, interceptions: null,
      rush_attempts: null, rush_yards: null, rush_tds: null,
      receptions: null, recv_yards: null, recv_tds: null,
      pat: null, fg: null, points: null,
    } as Omit<StatRow, 'season' | 'stat_type'>

    for (const g of gameLogSeasonStats) {
      if (stats.some(s => s.stat_type === g.stat_type && s.season === g.season)) continue
      if (!['Rushing', 'Passing', 'Receiving'].includes(g.stat_type)) continue
      filled.push({
        ...base, season: g.season, stat_type: g.stat_type,
        completions: g.comp, attempts: g.att,
        pass_yards:  g.stat_type === 'Passing'   ? g.yds : null,
        pass_tds:    g.stat_type === 'Passing'   ? g.tds : null,
        interceptions: g.pass_int,
        rush_attempts: g.att,
        rush_yards:  g.stat_type === 'Rushing'   ? g.yds : null,
        rush_tds:    g.stat_type === 'Rushing'   ? g.tds : null,
        receptions: g.rec,
        recv_yards:  g.stat_type === 'Receiving' ? g.yds : null,
        recv_tds:    g.stat_type === 'Receiving' ? g.tds : null,
        pat: g.pat, fg: g.fg, points: g.points,
      })
    }

    // Fill summary stat types
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
      const gp = [...new Set(gameLog.filter(r => r.season === season).map(r => r.game_id))].length

      if (!stats.some(s => s.stat_type === 'Total Yards' && s.season === season) && totalYds > 0) {
        filled.push({
          ...base, season, stat_type: 'Total Yards',
          pass_yards: passYds || null, rush_yards: rushYds || null, recv_yards: recvYds || null,
          total_yards: totalYds, games_played: gp || null,
          yards_per_game: gp > 0 ? Math.round(totalYds / gp) : null,
        })
      }
      if (!stats.some(s => s.stat_type === 'Touchdowns' && s.season === season) && totalTds > 0) {
        filled.push({
          ...base, season, stat_type: 'Touchdowns',
          pass_tds: passTds || null, rush_tds: rushTds || null, recv_tds: recvTds || null,
          total_tds: totalTds, games_played: gp || null,
          tds_per_game: gp > 0 ? Math.round((totalTds / gp) * 10) / 10 : null,
        })
      }
      if (!stats.some(s => s.stat_type === 'Scoring' && s.season === season) && points > 0) {
        filled.push({
          ...base, season, stat_type: 'Scoring',
          total_tds: totalTds || null, pat: kickPat || null, fg: kickFg || null,
          points: points || null, games_played: gp || null,
          points_per_game: gp > 0 ? Math.round((points / gp) * 10) / 10 : null,
        })
      }
    }

    return filled.sort((a, b) => b.season - a.season)
  }, [stats, gameLogSeasonStats, gameLog, player, school])

  // ── Season cycle: All-Time + per-season ─────────────────────────────────
  const availableSeasons = useMemo(
    () => [...new Set([
      ...mergedStats.map(s => s.season),
      ...gameLog.map(r => r.season),
    ])].sort((a, b) => b - a),
    [mergedStats, gameLog],
  )
  const seasonOptions: (number | null)[] = useMemo(
    () => [null, ...availableSeasons],
    [availableSeasons],
  )
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  function shiftSeason(delta: 1 | -1) {
    if (seasonOptions.length < 2) return
    const idx = seasonOptions.indexOf(selectedSeason)
    const next = (idx + delta + seasonOptions.length) % seasonOptions.length
    setSelectedSeason(seasonOptions[next])
  }
  const seasonLabel = selectedSeason === null ? 'All-Time' : formatSeason(selectedSeason)

  // ── Stat types this player has data for (drives the exploded Stats list) ─
  const availableStatTypes = useMemo<StatTypeName[]>(() => {
    const present = new Set(mergedStats.map(s => s.stat_type))
    return STAT_TYPES.filter(t => present.has(t))
  }, [mergedStats])

  function rowsForType(type: StatTypeName): StatRow[] {
    const all = mergedStats.filter(s => s.stat_type === type)
    if (selectedSeason !== null) return all.filter(s => s.season === selectedSeason)
    return all
  }

  // ── Rollup record across all seasons ────────────────────────────────────
  const rollupRecord = useMemo(() => {
    const entries = Object.entries(teamRecords)
    if (!entries.length) return undefined
    let w = 0, l = 0
    for (const [, rec] of entries) {
      const parts = rec.split('–').map(Number)
      w += parts[0] || 0; l += parts[1] || 0
    }
    return `${w}–${l}`
  }, [teamRecords])

  // Total stat rows count for the Stats nav entry
  const statRowsCount = useMemo(() => {
    const all = selectedSeason !== null
      ? mergedStats.filter(s => s.season === selectedSeason)
      : mergedStats
    return all.length
  }, [mergedStats, selectedSeason])

  // ── Best season ─────────────────────────────────────────────────────────
  const { yards: bestYards, label: bestLabel, season: bestSeason } = getBestYards(stats)

  // ── ContentsNav items ───────────────────────────────────────────────────
  const hasStatsForRecap = stats.length > 0

  // Number of distinct games matching the search (drives the Games nav count
  // when a query is active, since every other section collapses).
  const matchedGamesCount = useMemo(() => {
    if (!q) return 0
    const base = selectedSeason !== null ? gameLog.filter(r => r.season === selectedSeason) : gameLog
    const ids = new Set<number>()
    for (const r of base) {
      if (gameMatchesQuery(r, player.school_slug, q)) ids.add(r.game_id)
    }
    return ids.size
  }, [q, selectedSeason, gameLog, player.school_slug])

  const sections = useMemo(() => {
    const gamesCount = selectedSeason !== null
      ? gameLog.filter(r => r.season === selectedSeason).length
      : [...new Set(gameLog.map(r => r.game_id))].length
    const seasonsCount = availableSeasons.length

    // While searching, only the Games section is shown — collapse the nav to match.
    if (q) return [{ id: 'games' as SectionId, label: 'Games', count: matchedGamesCount }]

    const list: { id: SectionId; label: string; count: number; subItems?: { id: string; label: string }[] }[] = [
      { id: 'seasons',     label: 'Seasons',     count: seasonsCount },
      { id: 'games',       label: 'Games',       count: gamesCount },
      { id: 'best-season', label: 'Best Season', count: bestYards > 0 ? 1 : 0 },
      {
        id: 'stats', label: 'Stats', count: statRowsCount,
        subItems: availableStatTypes.map(t => ({ id: `stats-${t.toLowerCase().replace(/\s+/g, '-')}`, label: STAT_LABELS[t] ?? t })),
      },
      { id: 'recap',       label: 'Recap',       count: hasStatsForRecap ? 1 : 0 },
    ]
    return list
  }, [statRowsCount, selectedSeason, gameLog, hasStatsForRecap, availableSeasons.length, bestYards, availableStatTypes, q, matchedGamesCount])

  const [activeSection, setActiveSection] = useState<SectionId>('seasons')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const ob = new IntersectionObserver(
      entries => {
        const v = entries.filter(e => e.isIntersecting)
        if (!v.length) return
        v.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveSection(v[0].target.id as SectionId)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.4] },
    )
    Object.values(sectionRefs.current).forEach(el => el && ob.observe(el))
    return () => ob.disconnect()
  }, [sections])

  function handleNavSelect(id: string) {
    if (id === 'recap') triggerRecap()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Mobile header ───────────────────────────────────────────────────────
  const logo = player.school_slug ? SCHOOL_LOGOS[player.school_slug] : null
  const mobileHeader = (
    <div className="flex items-center gap-2 w-full">
      {logo && (
        <Image
          src={logo}
          alt=""
          width={36}
          height={36}
          className="shrink-0 h-9 w-9 rounded-full bg-[var(--paper-quiet)] p-0.5 object-contain border border-[var(--paper-rule)]"
          unoptimized
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--paper-text)] leading-tight truncate" style={SERIF}>
          {player.name}
        </p>
        <p className="text-[11px] text-[var(--paper-muted)] leading-tight truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
          {school?.name ?? ''}{player.position ? ` · ${player.position}` : ''}
        </p>
      </div>
    </div>
  )

  return (
    <>
      <AppLayout mobileHeader={mobileHeader} paperMode>
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}
        >

          {/* ── Masthead ─────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
            <RevealFx delay={0} translateY={4}>
              <EditorialHead
                size="lg"
                eyebrow={
                  <>
                    <Link href="/section/section-xi" className="hover:text-[var(--paper-strong)] transition-colors">
                      Section XI
                    </Link>
                    {school && (
                      <>
                        {' · '}
                        <Link href={`/team/${player.school_slug}-varsity-football`} className="hover:text-[var(--paper-strong)] transition-colors">
                          {school.name}
                        </Link>
                      </>
                    )}
                    {school?.division && (
                      <>
                        {' · '}
                        <Link href={`/division/division-${school.division.toLowerCase()}`} className="hover:text-[var(--paper-strong)] transition-colors">
                          Division {school.division}
                        </Link>
                      </>
                    )}
                  </>
                }
                subhead={
                  <>
                    {player.position && primaryPositionSlug(player.position) ? (
                      <Link href={`/position/${primaryPositionSlug(player.position)}`} className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors">
                        {player.position}
                      </Link>
                    ) : (
                      <span>{player.position ?? 'Player'}</span>
                    )}
                    {' — '}career record across {availableSeasons.length || 0}{' '}
                    {availableSeasons.length === 1 ? 'season' : 'seasons'}.
                  </>
                }
                meta={[
                  rollupRecord ? `Team ${rollupRecord}` : null,
                  bestYards > 0 ? `Best ${bestYards.toLocaleString()} ${bestLabel.toLowerCase()}` : null,
                  bestSeason ? formatSeason(bestSeason) : null,
                ].filter(Boolean) as string[]}
                rightSlot={
                  <EditorialButtonGroup
                    prevHref={`/player/${prevSlug}${profilePanelOpen ? '?profile=open' : ''}`}
                    nextHref={`/player/${nextSlug}${profilePanelOpen ? '?profile=open' : ''}`}
                    prevLabel="Previous player"
                    nextLabel="Next player"
                    buttons={[
                      { icon: ChartSpline, tooltip: 'Charts',     active: chartsOpen,      onClick: () => setChartsOpen(v => !v) },
                      { icon: FileUser,    tooltip: 'Players',    active: playersOpen,     onClick: () => setPlayersOpen(v => !v) },
                      { icon: Sparkles,    tooltip: 'AI Profile', active: profilePanelOpen, onClick: () => { setProfilePanelOpen(v => !v); triggerRecap() } },
                    ]}
                  />
                }
              >
                {player.name}
              </EditorialHead>
            </RevealFx>
          </div>

          {/* ── Sticky control bar ──────────────────────────────── */}
          <StickyControlBar>
            {seasonOptions.length > 1 && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
                  Season
                </span>
                <button onClick={() => shiftSeason(-1)} aria-label="Previous season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span
                  className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
                  style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
                >
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
              placeholder="Search opponents & seasons…"
            />

            <SearchButtonGroup />
          </StickyControlBar>

          {/* ── Body: sidebar + main ─────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

            <ContentsNav
              items={sections}
              activeId={activeSection}
              onSelect={handleNavSelect}
              label="Page"
              topChildren={
                <div className="mb-8">
                  <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>Site</p>
                  <ol className="flex flex-col">
                    {([
                      { roman: 'I',   label: 'Division', count: 4,             href: school?.division ? `/division/division-${school.division.toLowerCase()}` : '/section/section-xi' },
                      { roman: 'II',  label: 'Team',     count: 1,             href: player.school_slug ? `/team/${player.school_slug}-varsity-football` : '/team' },
                      { roman: 'III', label: 'Players',  count: divPlayers.length, href: '/player' },
                    ] as const).map(link => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group flex items-baseline gap-3 py-1.5 text-[13px] leading-tight text-[var(--paper-muted)] hover:text-[var(--paper-strong)] transition-colors"
                        >
                          <span className="shrink-0 w-6 text-right italic" style={{ ...SERIF, fontSize: 12 }}>{link.roman}</span>
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

              {/* ── Seasons (1st) ──────────────────────────────── */}
              <section
                id="seasons"
                ref={(el) => { sectionRefs.current.seasons = el }}
                className={cn('mb-20 scroll-mt-24', q && 'hidden')}
              >
                <SectionHead
                  title="Seasons"
                  eyebrow="Career timeline"
                  blurb="One row per season — click a year to filter the page."
                />
                {availableSeasons.length === 0 ? (
                  <EmptyTablet label="No seasons on file." />
                ) : (
                  <ScrollTable maxH={0}>
                    <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <th className={cn(TH_CLS, 'pl-5 text-left')} style={SANS}>Season</th>
                          <th className={cn(TH_CLS, 'text-right')} style={SANS}>Best Stat</th>
                          <th className={cn(TH_CLS, 'text-right')} style={SANS}>Games</th>
                          <th className={cn(TH_CLS, 'text-right pr-5')} style={SANS}>Team Record</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableSeasons.map(yr => {
                          const seasonStats = mergedStats.filter(s => s.season === yr)
                          const passYds = seasonStats.find(s => s.stat_type === 'Passing')?.pass_yards   ?? 0
                          const rushYds = seasonStats.find(s => s.stat_type === 'Rushing')?.rush_yards   ?? 0
                          const recvYds = seasonStats.find(s => s.stat_type === 'Receiving')?.recv_yards ?? 0
                          let bestSeasonStat: string
                          if (passYds >= rushYds && passYds >= recvYds && passYds > 0) {
                            bestSeasonStat = `${passYds.toLocaleString()} pass`
                          } else if (rushYds >= recvYds && rushYds > 0) {
                            bestSeasonStat = `${rushYds.toLocaleString()} rush`
                          } else if (recvYds > 0) {
                            bestSeasonStat = `${recvYds.toLocaleString()} rec`
                          } else {
                            bestSeasonStat = '—'
                          }
                          const games = [...new Set(gameLog.filter(r => r.season === yr).map(r => r.game_id))].length
                          const rec = teamRecords[yr]
                          const isActive = selectedSeason === yr
                          return (
                            <tr
                              key={yr}
                              onClick={() => setSelectedSeason(yr)}
                              className={cn(
                                'group/row border-t border-[var(--paper-rule-soft)] cursor-pointer transition-colors',
                                isActive
                                  ? 'bg-[color:color-mix(in_srgb,var(--paper-text)_6%,transparent)]'
                                  : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
                              )}
                            >
                              <td className="px-5 py-3.5">
                                <span
                                  className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors"
                                  style={{ ...SERIF, fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em' }}
                                >
                                  {formatSeason(yr)}
                                </span>
                              </td>
                              <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>
                                {bestSeasonStat}
                              </td>
                              <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>
                                {games || '—'}
                              </td>
                              <td className={cn(tabletTd, 'text-right pr-5 tabular-nums font-medium', recordColor(rec))} style={MONO}>
                                {rec ?? '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </ScrollTable>
                )}
              </section>

              {/* ── Games (2nd) ────────────────────────────────── */}
              <section
                id="games"
                ref={(el) => { sectionRefs.current.games = el }}
                className="mb-20 scroll-mt-24"
              >
                <SectionHead
                  title="Games"
                  eyebrow={selectedSeason === null ? 'Career · all seasons' : `Season · ${formatSeason(selectedSeason)}`}
                  blurb="Game-by-game results — click an opponent for its team page, a result for the game."
                />
                <GameLogTable player={player} season={selectedSeason} gameLog={gameLog} query={query} />
              </section>

              {/* ── Best Season (3rd) ──────────────────────────── */}
              {bestYards > 0 && (
                <section
                  id="best-season"
                  ref={(el) => { sectionRefs.current['best-season'] = el }}
                  className={cn('mb-20 scroll-mt-24', q && 'hidden')}
                >
                  <SectionHead
                    title="Best Season"
                    eyebrow={formatSeason(bestSeason)}
                    blurb="The peak — single-season yardage high water mark on file."
                  />
                  <Tablet>
                    <div className="px-6 py-8 flex items-baseline justify-between gap-6">
                      <div className="min-w-0">
                        <p
                          className="text-[var(--paper-text)] tabular-nums leading-none"
                          style={{ ...MONO, fontSize: 56, fontWeight: 500 }}
                        >
                          {bestYards.toLocaleString()}
                        </p>
                        <p
                          className="mt-2 text-[14px] text-[var(--paper-muted)]"
                          style={{ ...SERIF, fontStyle: 'italic' }}
                        >
                          {bestLabel.toLowerCase()} · {formatSeason(bestSeason)}
                        </p>
                      </div>
                      <div className="shrink-0 hidden sm:block">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
                          Career best
                        </p>
                      </div>
                    </div>
                  </Tablet>
                </section>
              )}

              {/* ── Stats (4th — exploded) ─────────────────────── */}
              <section
                id="stats"
                ref={(el) => { sectionRefs.current.stats = el }}
                className={cn('mb-20 scroll-mt-24', q && 'hidden')}
              >
                <SectionHead
                  title="Stats"
                  eyebrow={selectedSeason === null ? 'Career · All Seasons' : `Season · ${formatSeason(selectedSeason)}`}
                  blurb="Every stat line on file, broken out by category."
                />

                {availableStatTypes.length === 0 ? (
                  <EmptyTablet label="No stat lines on file." />
                ) : (
                  availableStatTypes.map(type => {
                    const subId = `stats-${type.toLowerCase().replace(/\s+/g, '-')}`
                    const rows  = rowsForType(type)
                    return (
                      <div key={type} id={subId} className="mb-10 scroll-mt-24">
                        <SubSectionHead>{STAT_LABELS[type] ?? type}</SubSectionHead>
                        <StatTable
                          type={type}
                          rows={rows}
                          teamRecords={teamRecords}
                          showRollup={selectedSeason === null && rows.length > 1}
                          rollupRecord={rollupRecord}
                        />
                      </div>
                    )
                  })
                )}
              </section>

              {/* ── Recap (5th) — AI career profile ─────────────── */}
              <section
                id="recap"
                ref={(el) => { sectionRefs.current.recap = el }}
                className={cn('mb-20 scroll-mt-24', q && 'hidden')}
              >
                <SectionHead
                  title={recapBody && recapTitle ? recapTitle : 'Recap'}
                  eyebrow="AI Profile"
                  blurb={recapBody
                    ? 'Filed by NYSgpt — AI career profile drawn from this player\'s stat lines.'
                    : 'A career retrospective generated from this player\'s season-by-season totals.'}
                />

                {!recapTriggered ? (
                  <Tablet>
                    <div className="px-6 py-10 text-center">
                      <p className="mb-5 text-[15px] text-[var(--paper-muted)] max-w-md mx-auto" style={{ ...SERIF, fontStyle: 'italic' }}>
                        The recap hasn&apos;t been written yet. Generate an AI career profile from this player&apos;s stat lines.
                      </p>
                      <button
                        onClick={triggerRecap}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--paper-rule)] text-[11px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                        style={{ ...SANS, borderRadius: TABLET_RADIUS }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate Recap
                      </button>
                    </div>
                  </Tablet>
                ) : loadingRecap ? (
                  <div className="space-y-3 animate-pulse max-w-[68ch]">
                    <div className="h-4 bg-[var(--paper-quiet)] rounded w-full" />
                    <div className="h-4 bg-[var(--paper-quiet)] rounded w-[96%]" />
                    <div className="h-4 bg-[var(--paper-quiet)] rounded w-[88%]" />
                    <div className="h-4 bg-[var(--paper-quiet)] rounded w-full mt-4" />
                    <div className="h-4 bg-[var(--paper-quiet)] rounded w-[92%]" />
                    <div className="h-4 bg-[var(--paper-quiet)] rounded w-[75%]" />
                  </div>
                ) : recapBody ? (
                  <div className="space-y-5 max-w-[68ch]">
                    {recapBody.split('\n\n').filter(Boolean).map((para, i) => (
                      <p
                        key={i}
                        className="text-[16px] leading-[1.75] text-[var(--paper-muted)]"
                        style={SERIF}
                      >
                        {parseRecapPara(para, playerNameMap, teamNameMap)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <EmptyTablet label="No stat lines on file — recap unavailable." />
                )}
              </section>

              {/* ── Colophon ───────────────────────────────────── */}
              <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
                <p
                  className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
                  style={{ ...SERIF, fontStyle: 'italic' }}
                >
                  Stat lines come from Section XI official records and Newsday box scores.
                  Game-by-game totals are aggregated from each week's box score; career
                  rollups sum the per-season records.
                </p>
              </div>

            </main>
          </div>
        </div>
      </AppLayout>

      <div style={PAPER_BRIDGE}>
        <PanelChart open={chartsOpen}  onClose={() => setChartsOpen(false)} />
        <AppPanel   open={playersOpen} onClose={() => setPlayersOpen(false)} title="Players" />

        <AppPanel
          open={profilePanelOpen}
          onClose={() => setProfilePanelOpen(false)}
          title={
            <span className="flex items-center gap-2 min-w-0">
              {player.school_slug && SCHOOL_LOGOS[player.school_slug] && (
                <span
                  className="shrink-0 rounded-full overflow-hidden bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center"
                  style={{ width: 22, height: 22 }}
                >
                  <Image
                    src={SCHOOL_LOGOS[player.school_slug]}
                    alt=""
                    width={17}
                    height={17}
                    className="object-contain"
                    unoptimized
                  />
                </span>
              )}
              <span className="truncate" style={SERIF}>{school?.name ?? player.name}</span>
            </span>
          }
          footer={
            <div className="px-5 py-3.5 bg-[var(--paper)]">
              <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
                AI Profile Panel
              </span>
            </div>
          }
        >
          <div className="px-6 sm:px-10 md:px-14 pt-8 pb-10">
            <SectionHead
              title={recapBody && recapTitle ? recapTitle : 'AI Profile'}
              eyebrow="Recap"
              blurb={recapBody
                ? 'Filed by NYSgpt — AI career profile drawn from this player\'s stat lines.'
                : undefined}
            />

            {!recapTriggered ? (
              <Tablet>
                <div className="px-6 py-10 text-center">
                  <p
                    className="mb-5 text-[15px] text-[var(--paper-muted)] max-w-md mx-auto"
                    style={{ ...SERIF, fontStyle: 'italic' }}
                  >
                    The recap hasn&apos;t been written yet. Generate an AI career profile
                    from this player&apos;s stat lines.
                  </p>
                  <button
                    onClick={triggerRecap}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--paper-rule)] text-[11px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                    style={{ ...SANS, borderRadius: TABLET_RADIUS }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate AI Profile
                  </button>
                </div>
              </Tablet>
            ) : loadingRecap ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-full" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[96%]" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[88%]" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-full mt-4" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[92%]" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[75%]" />
              </div>
            ) : recapBody ? (
              <div className="space-y-5 max-w-[68ch]">
                {recapBody.split('\n\n').filter(Boolean).map((para, i) => (
                  <p
                    key={i}
                    className="text-[16px] leading-[1.75] text-[var(--paper-muted)]"
                    style={SERIF}
                  >
                    {parseRecapPara(para, playerNameMap, teamNameMap)}
                  </p>
                ))}
              </div>
            ) : (
              <p
                className="text-[16px] leading-[1.75] text-[var(--paper-muted)] max-w-[68ch]"
                style={{ ...SERIF, fontStyle: 'italic' }}
              >
                No stat lines on file — recap unavailable.
              </p>
            )}
          </div>
        </AppPanel>
      </div>
    </>
  )
}
