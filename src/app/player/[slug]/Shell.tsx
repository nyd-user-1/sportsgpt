'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, ArrowRight, ChartSpline, MessageCircle, FileUser, Sparkles,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { AppPanel } from '@/components/AppPanel'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead, EditorialButtonGroup,
  SectionHead, ContentsNav,
  PAPER_BRIDGE, TABLET_RADIUS,
  Tablet, EmptyTablet, ScrollTable,
  StickyControlBar, SearchInput, useSearchHotkey,
  MONO, tabletTd,
} from '@/components/editorial'
import { PLAYER_PHOTOS, SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
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

// ── Hero — matted single photo ───────────────────────────────────────────────

function PlayerHero({
  player, school,
}: {
  player: PlayerRow
  school: SchoolInfo | null
}) {
  const photo     = PLAYER_PHOTOS[player.slug]
  const teamPhoto = player.school_slug ? TEAM_PHOTOS[player.school_slug]?.[0] : null
  const heroSrc   = photo || teamPhoto
  const logo      = player.school_slug ? SCHOOL_LOGOS[player.school_slug] : null

  return (
    <div
      className="w-full border border-[var(--paper-rule)] bg-[var(--paper-quiet)]"
      style={{ padding: 8, borderRadius: TABLET_RADIUS }}
    >
      <div
        className="relative overflow-hidden w-full"
        style={{ height: 460, borderRadius: 1 }}
      >
        {heroSrc ? (
          <Image src={heroSrc} alt={player.name} fill className="object-cover object-top" unoptimized />
        ) : (
          <div
            className="h-full flex flex-col items-center justify-center gap-4"
            style={{ background: `linear-gradient(135deg,${ACCENT_COLOR}22 0%,${ACCENT_COLOR}55 100%)` }}
          >
            {logo && <Image src={logo} alt="" width={96} height={96} className="object-contain opacity-80" unoptimized />}
            <p className="text-white/85" style={{ ...SERIF, fontSize: 18 }}>
              {player.name}{player.position ? ` · ${player.position}` : ''}{school?.name ? ` — ${school.name}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
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

function GameLogTable({
  player, season, gameLog,
}: {
  player: PlayerRow
  season: number
  gameLog: GameLogRow[]
}) {
  const rows = useMemo(() => gameLog.filter(r => r.season === season), [gameLog, season])

  // Aggregate per game (rows from JSONB can have multiple stat_types per game)
  const byGame = useMemo(() => {
    const map: Record<number, GameLogRow[]> = {}
    for (const r of rows) {
      if (!map[r.game_id]) map[r.game_id] = []
      map[r.game_id].push(r)
    }
    return Object.values(map).sort((a, b) =>
      (a[0].game_date ?? '').localeCompare(b[0].game_date ?? '')
    )
  }, [rows])

  if (rows.length === 0) return <EmptyTablet label={`No game log recorded for ${formatSeason(season)}.`} />

  return (
    <ScrollTable maxH={0}>
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th className={cn(TH_CLS, 'pl-5 text-left')} style={SANS}>Opponent</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>Pass</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>Rush</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>Rec</th>
            <th className={cn(TH_CLS, 'text-right')} style={SANS}>TD</th>
            <th className={cn(TH_CLS, 'text-right pr-5')} style={SANS}>Result</th>
          </tr>
        </thead>
        <tbody>
          {byGame.map((entries, i) => {
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
                <td className="px-5 py-3.5">
                  <Link href={`/game/${ref.game_id}?ref=${player.school_slug}-varsity-football`} className="flex items-center gap-3 min-w-0 text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors group/g">
                    <span className="text-[11px] text-[var(--paper-faint)] shrink-0" style={SANS}>
                      {isHome ? 'vs' : 'at'}
                    </span>
                    {oppLogo && <Image src={oppLogo} alt="" width={22} height={22} className="shrink-0 object-contain" unoptimized />}
                    <span className="truncate" style={{ ...SERIF, fontSize: 15, fontWeight: 500 }}>{oppName}</span>
                  </Link>
                </td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{passYds || '—'}</td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{rushYds || '—'}</td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{recYds || '—'}</td>
                <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{totalTds || '—'}</td>
                <td className={cn(tabletTd, 'text-right pr-5 tabular-nums font-medium', win && 'text-emerald-500', lose && 'text-rose-500', !win && !lose && 'text-[var(--paper-muted)]')} style={MONO}>
                  {result}
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

type SectionId = 'stats' | 'game-log' | 'recap' | 'top-players' | 'standings' | 'best-season'

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
  // ── Panels ──────────────────────────────────────────────────────────────
  const [chartsOpen,  setChartsOpen]  = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const [chatOpen,    setChatOpen]    = useState(false)

  // ── Sticky bar ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  // ── Recap section trigger (matches Game Highlights pattern) ─────────────
  const [recapTriggered, setRecapTriggered] = useState(false)
  function triggerRecap() { setRecapTriggered(true) }

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

  // ── Stat type cycle (within Stats section) ──────────────────────────────
  const [statTypeIdx, setStatTypeIdx] = useState(0)
  const selectedType: StatTypeName = STAT_TYPES[statTypeIdx]
  const statTitle = STAT_LABELS[selectedType] ?? selectedType
  function shiftStat(delta: 1 | -1) {
    setStatTypeIdx(i => (i + delta + STAT_TYPES.length) % STAT_TYPES.length)
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

  // ── Stat rows for the Stats table ───────────────────────────────────────
  const tableRows = useMemo(() => {
    const all = mergedStats.filter(s => s.stat_type === selectedType)
    if (selectedSeason !== null) return all.filter(s => s.season === selectedSeason)
    return all
  }, [mergedStats, selectedType, selectedSeason])

  // ── Best season ─────────────────────────────────────────────────────────
  const { yards: bestYards, label: bestLabel, season: bestSeason } = getBestYards(stats)

  // ── ContentsNav items ───────────────────────────────────────────────────
  const summaries = useMemo(() => stats.filter(s => s.ai_summary).sort((a, b) => b.season - a.season), [stats])

  const sections = useMemo(() => {
    const list: { id: SectionId; label: string; count: number }[] = []
    list.push({ id: 'stats',       label: 'Stats',         count: tableRows.length })
    if (selectedSeason !== null) list.push({ id: 'game-log', label: 'Game Log', count: gameLog.filter(r => r.season === selectedSeason).length })
    list.push({ id: 'recap',       label: 'Recap',         count: summaries.length })
    list.push({ id: 'top-players', label: 'Top Players',   count: divPlayers.length })
    list.push({ id: 'standings',   label: 'Standings',     count: divTeams.length })
    list.push({ id: 'best-season', label: 'Best Season',   count: bestYards > 0 ? 1 : 0 })
    return list
  }, [tableRows, selectedSeason, gameLog, summaries, divPlayers, divTeams, bestYards])

  const [activeSection, setActiveSection] = useState<SectionId>('stats')
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
                size="xl"
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
                      <Link href={`/position/${primaryPositionSlug(player.position)}`} className="hover:text-[var(--paper-strong)] transition-colors underline-offset-4 decoration-[var(--paper-rule)] hover:underline">
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
                    prevHref={`/player/${prevSlug}`}
                    nextHref={`/player/${nextSlug}`}
                    prevLabel="Previous player"
                    nextLabel="Next player"
                    buttons={[
                      { icon: ChartSpline,   tooltip: 'Charts',         active: chartsOpen,  onClick: () => setChartsOpen(v => !v) },
                      { icon: FileUser,      tooltip: 'Players',        active: playersOpen, onClick: () => setPlayersOpen(v => !v) },
                      { icon: MessageCircle, tooltip: 'Ask SportsGPT',  active: chatOpen,    onClick: () => setChatOpen(v => !v) },
                    ]}
                  />
                }
              >
                {player.name}
              </EditorialHead>
            </RevealFx>
          </div>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-14">
            <RevealFx delay={0.15} translateY={12}>
              <PlayerHero player={player} school={school} />
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

            <div className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums hidden md:block" style={SANS}>
              {selectedSeason === null
                ? `${availableSeasons.length} ${availableSeasons.length === 1 ? 'season' : 'seasons'} on file`
                : `${formatSeason(selectedSeason)} season`}
            </div>
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

              {/* ── Stats ──────────────────────────────────────── */}
              <section
                id="stats"
                ref={(el) => { sectionRefs.current.stats = el }}
                className="mb-20 scroll-mt-24"
              >
                <SectionHead
                  title={statTitle}
                  eyebrow={selectedSeason === null ? 'Career · All Seasons' : `Season · ${formatSeason(selectedSeason)}`}
                  blurb={STAT_BLURBS[selectedType]}
                  meta={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => shiftStat(-1)}
                        aria-label="Previous stat"
                        className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => shiftStat(1)}
                        aria-label="Next stat"
                        className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  }
                />
                <StatTable
                  type={selectedType}
                  rows={tableRows}
                  teamRecords={teamRecords}
                  showRollup={selectedSeason === null && tableRows.length > 1}
                  rollupRecord={rollupRecord}
                />
              </section>

              {/* ── Game Log ───────────────────────────────────── */}
              {selectedSeason !== null && (
                <section
                  id="game-log"
                  ref={(el) => { sectionRefs.current['game-log'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Game Log"
                    eyebrow={`Season · ${formatSeason(selectedSeason)}`}
                    blurb="Game-by-game results — click any opponent to open the game page."
                  />
                  <GameLogTable player={player} season={selectedSeason} gameLog={gameLog} />
                </section>
              )}

              {/* ── Recap (AI Summaries) ───────────────────────── */}
              <section
                id="recap"
                ref={(el) => { sectionRefs.current.recap = el }}
                className="mb-20 scroll-mt-24"
              >
                <SectionHead
                  title="Recap"
                  eyebrow="AI Summaries"
                  blurb={summaries.length
                    ? `Filed by NYSgpt — narrative passes over ${summaries.length} ${summaries.length === 1 ? 'season' : 'seasons'} of stat lines.`
                    : 'No AI summaries on file yet for this player.'}
                />

                {!recapTriggered && summaries.length > 0 ? (
                  <Tablet>
                    <div className="px-6 py-10 text-center">
                      <p className="mb-5 text-[15px] text-[var(--paper-muted)] max-w-md mx-auto" style={{ ...SERIF, fontStyle: 'italic' }}>
                        The recap is filed but folded away. Open it to read AI narrative passes over {summaries.length}{' '}
                        {summaries.length === 1 ? 'season' : 'seasons'} of stat lines.
                      </p>
                      <button
                        onClick={triggerRecap}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--paper-rule)] text-[11px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                        style={{ ...SANS, borderRadius: TABLET_RADIUS }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Open Recap
                      </button>
                    </div>
                  </Tablet>
                ) : summaries.length > 0 ? (
                  <div className="space-y-6 max-w-[68ch]">
                    {summaries.map((s, i) => (
                      <article key={i}>
                        <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
                          {formatSeason(s.season)} · {s.stat_type}
                        </p>
                        <p className="text-[16px] leading-[1.75] text-[var(--paper-muted)]" style={SERIF}>
                          {s.ai_summary}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyTablet label="No AI summaries on file for this player yet." />
                )}
              </section>

              {/* ── Top Players ────────────────────────────────── */}
              {divPlayers.length > 0 && (
                <section
                  id="top-players"
                  ref={(el) => { sectionRefs.current['top-players'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Top Players"
                    eyebrow={school ? `Division ${school.division}` : undefined}
                    blurb="Other top performers in the same division — click to open a player."
                  />
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 pb-2">
                      {divPlayers.map(p => {
                        const stat = topStat(p)
                        const logoSrc = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : null
                        return (
                          <Link
                            key={p.player_slug}
                            href={`/player/${p.player_slug}`}
                            className="group/c shrink-0 w-[260px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 flex flex-col gap-2 hover:bg-[var(--paper-quiet)] transition-colors"
                            style={{ borderRadius: TABLET_RADIUS }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {logoSrc && <Image src={logoSrc} alt="" width={22} height={22} className="shrink-0 object-contain" unoptimized />}
                              <span
                                className="truncate text-[var(--paper-text)] group-hover/c:text-[var(--paper-strong)] transition-colors"
                                style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
                              >
                                {p.player_name}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
                              {p.position ? `${p.position} · ${p.school_name}` : p.school_name}
                            </p>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-[16px] tabular-nums font-medium text-[var(--paper-text)]" style={MONO}>{stat.value}</span>
                              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-muted)]" style={SANS}>{stat.label}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Standings ──────────────────────────────────── */}
              {divTeams.length > 0 && school && (
                <section
                  id="standings"
                  ref={(el) => { sectionRefs.current.standings = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title={`Division ${school.division} Standings`}
                    eyebrow="2024-25"
                    blurb="Conference standings the week the season was logged."
                  />
                  <ScrollTable maxH={0}>
                    <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <th className={cn(TH_CLS, 'pl-5 text-left')} style={SANS}>Team</th>
                          <th className={cn(TH_CLS, 'text-right')} style={SANS}>Record</th>
                          <th className={cn(TH_CLS, 'text-right pr-5')} style={SANS}>Win %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {divTeams.map((t, i) => {
                          const tSchool = t.slug.replace(/-varsity-football$/, '')
                          const tLogo = SCHOOL_LOGOS[tSchool]
                          return (
                            <tr key={t.slug} className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors">
                              <td className="px-5 py-3.5">
                                <Link href={`/team/${t.slug}`} className="flex items-center gap-3 min-w-0 text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors">
                                  <span className="shrink-0 tabular-nums text-[var(--paper-faint)] w-5 text-right" style={{ ...MONO, fontSize: 11 }}>{i + 1}.</span>
                                  {tLogo && <Image src={tLogo} alt="" width={22} height={22} className="shrink-0 object-contain" unoptimized />}
                                  <span className="truncate" style={{ ...SERIF, fontSize: 15, fontWeight: 500 }}>{stripVarsity(t.name)}</span>
                                </Link>
                              </td>
                              <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)] font-medium')} style={MONO}>
                                {fmtRecord(t.overall_wins, t.overall_losses)}
                              </td>
                              <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)] pr-5')} style={MONO}>
                                {fmtWinPct(t.overall_wins, t.overall_losses)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </ScrollTable>
                </section>
              )}

              {/* ── Best Season ────────────────────────────────── */}
              {bestYards > 0 && (
                <section
                  id="best-season"
                  ref={(el) => { sectionRefs.current['best-season'] = el }}
                  className="mb-20 scroll-mt-24"
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
        <PanelChat  open={chatOpen}    onClose={() => setChatOpen(false)} countyName={player.name} />
      </div>
    </>
  )
}
