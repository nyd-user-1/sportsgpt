'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChartSpline, FileUser, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { AppPanel } from '@/components/AppPanel'
import { PanelChart } from '@/components/PanelChart'
import { ChatSeasonsPanel } from '@/components/ChatSeasonsPanel'
import {
  EditorialHead,
  EditorialButtonGroup,
  SectionHead,
  ContentsNav,
  PAPER_BRIDGE,
  TABLET_RADIUS,
  Tablet,
  EmptyTablet,
  ScrollTable,
  StickyControlBar,
  SearchInput,
  useSearchHotkey,
  MONO,
  tabletTd,
} from '@/components/editorial'
import { SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type QuarterRow = {
  team_name: string; team_slug: string
  q1: number; q2: number; q3: number; q4: number
  ot1: number; ot2: number; ot3: number; final: number
}

type PlayerStat = {
  stat_type: 'Rushing' | 'Passing' | 'Receiving' | 'Kicking' | 'Defense'
  team_name: string; team_slug?: string; player: string
  att?: number; yds?: number; tds?: number
  comp?: number; int?: number
  rec?: number; pat?: number
  fg?: number; points?: number
  sacks?: number; fumbles?: number
}

type FlatPlayerStat = {
  player_slug: string | null
  player_name: string
  school_slug: string | null
  team_name: string
  stat_type: string
  rush_att: number | null; rush_yds: number | null; rush_tds: number | null
  pass_comp: number | null; pass_att: number | null; pass_yds: number | null; pass_tds: number | null; pass_int: number | null
  rec_rec: number | null; rec_yds: number | null; rec_tds: number | null
  kick_pat: number | null; kick_fg: number | null; kick_points: number | null
  def_int: number | null; def_sacks: number | null; def_fumbles: number | null
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

const STAT_ORDER: PlayerStat['stat_type'][] = ['Passing', 'Rushing', 'Receiving', 'Kicking', 'Defense']

const STAT_BLURB: Record<string, string> = {
  Passing:   'Attempts, completions, yardage, touchdowns, and interceptions for every quarterback who threw.',
  Rushing:   'Carries, yardage, and touchdowns on the ground.',
  Receiving: 'Receptions, yardage, touchdowns, and extra points.',
  Kicking:   'Field goals, extra points, and total kicking points.',
  Defense:   'Interceptions, sacks, and fumble recoveries on the defensive side.',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanName(raw: string | null | undefined) {
  return (raw ?? '').replace(/\s+Varsity\s+Football$/i, '').trim()
}

function fmtDate(raw: string | Date | null): string {
  if (!raw) return '—'
  const d = raw instanceof Date ? raw : new Date(String(raw).includes('T') ? raw : raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtSeason(y: number) { return `${y}-${String(y + 1).slice(2)}` }

// ── Hero — split-screen photos inside the matted editorial frame ─────────────

function GameHero({
  homeName, awayName, homeSchool, awaySchool,
  homeScore, awayScore, gameNumber,
}: {
  homeName: string; awayName: string
  homeSchool: string; awaySchool: string
  homeScore: number | null; awayScore: number | null
  gameNumber: number | null
}) {
  const homePhoto = TEAM_PHOTOS[homeSchool]?.[0]
  const awayPhoto = TEAM_PHOTOS[awaySchool]?.[0]
  const scored    = homeScore != null && awayScore != null

  return (
    <div
      className="w-full border border-[var(--paper-rule)] bg-[var(--paper-quiet)]"
      style={{ padding: 8, borderRadius: TABLET_RADIUS }}
    >
      <div
        className="relative overflow-hidden w-full"
        style={{ height: 460, borderRadius: 1 }}
      >
        {/* Split photo background */}
        <div className="absolute inset-0 flex">
          <div className="relative flex-1">
            {homePhoto
              ? <Image src={homePhoto} alt={homeName} fill className="object-cover object-top" unoptimized />
              : <div className="h-full" style={{ background: `linear-gradient(135deg,${ACCENT_COLOR}55,${ACCENT_COLOR}99)` }} />}
          </div>
          <div className="relative flex-1">
            {awayPhoto
              ? <Image src={awayPhoto} alt={awayName} fill className="object-cover object-top" unoptimized />
              : <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />}
          </div>
        </div>

        {/* Bottom darken for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent z-[5]" />

        {/* Week badge */}
        {gameNumber != null && (
          <div className="absolute top-4 left-4 z-10">
            <span
              className="text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 border border-white/30 bg-black/45 backdrop-blur-sm text-white/95"
              style={{ ...SANS, borderRadius: TABLET_RADIUS }}
            >
              Week {gameNumber}
            </span>
          </div>
        )}

        {/* Scoreboard */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="text-center px-7 py-5 backdrop-blur-md border border-white/15 shadow-xl"
            style={{ background: 'rgba(0,0,0,0.55)', borderRadius: TABLET_RADIUS }}
          >
            {scored ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-8xl font-black tabular-nums leading-none text-white">{homeScore}</span>
                <span className="text-8xl font-black tabular-nums leading-none text-white">–</span>
                <span className="text-8xl font-black tabular-nums leading-none text-white">{awayScore}</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-white/40">vs</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Box Score table — editorial palette ──────────────────────────────────────

function BoxScoreTable({
  rows,
  homeSlug,
}: {
  rows: QuarterRow[]
  homeSlug: string
}) {
  const hasOT   = rows.some(r => r.ot1 > 0 || r.ot2 > 0 || r.ot3 > 0)
  const ordered = [...rows].sort((a, b) => (a.team_slug === homeSlug ? -1 : 1))
  const maxFinal = Math.max(...ordered.map(r => r.final))

  return (
    <ScrollTable maxH={0}>
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th className={cn('px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)] text-left')} style={SANS}>Team</th>
            {(['Q1','Q2','Q3','Q4'] as const).map(q => (
              <th key={q} className={cn('px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)] text-right w-16')} style={SANS}>{q}</th>
            ))}
            {hasOT && (
              <th className={cn('px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)] text-right w-16')} style={SANS}>OT</th>
            )}
            <th className={cn('px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-text)] border-b border-[var(--paper-rule)] text-right w-20')} style={SANS}>Final</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((r, i) => {
            const isHome = r.team_slug === homeSlug
            const schoolSlug = r.team_slug.replace(/-varsity-football$/, '')
            const logo = SCHOOL_LOGOS[schoolSlug]
            const won  = r.final === maxFinal
            return (
              <tr
                key={i}
                className="border-t border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {logo && (
                      <Link href={`/team/${r.team_slug}`} aria-label={`${cleanName(r.team_name)} team page`} className="shrink-0">
                        <Image src={logo} alt="" width={26} height={26} className="object-contain" unoptimized />
                      </Link>
                    )}
                    <Link
                      href={`/team/${r.team_slug}`}
                      className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors truncate"
                      style={{ ...SERIF, fontSize: 17, fontWeight: 500, letterSpacing: '-0.005em' }}
                    >
                      {cleanName(r.team_name)}
                    </Link>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)]" style={SANS}>
                      {isHome ? 'Home' : 'Away'}
                    </span>
                  </div>
                </td>
                <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{r.q1}</td>
                <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{r.q2}</td>
                <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{r.q3}</td>
                <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>{r.q4}</td>
                {hasOT && (
                  <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                    {r.ot1 || r.ot2 || r.ot3}
                  </td>
                )}
                <td className={cn(tabletTd, 'pr-5 text-right tabular-nums font-medium text-[var(--paper-text)]')} style={MONO}>
                  <span className="inline-flex items-baseline gap-2 justify-end">
                    <span>{r.final}</span>
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-[0.18em] tabular-nums',
                        won ? 'text-[var(--paper-text)]' : 'text-[var(--paper-faint)]',
                      )}
                      style={SANS}
                    >
                      {won ? 'W' : 'L'}
                    </span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollTable>
  )
}

// ── Per-stat-type table ──────────────────────────────────────────────────────

const STAT_COLS: Record<string, string[]> = {
  Passing:   ['ATT', 'COMP', 'YDS', 'TDS', 'INT'],
  Rushing:   ['ATT', 'YDS', 'TDS'],
  Receiving: ['REC', 'YDS', 'TDS', 'PAT'],
  Kicking:   ['FG', 'PAT', 'PTS'],
  Defense:   ['INT', 'SACKS', 'FUM'],
}

function statCells(p: FlatPlayerStat, statType: string): (number | null)[] {
  if (statType === 'Passing')   return [p.pass_att, p.pass_comp, p.pass_yds, p.pass_tds, p.pass_int]
  if (statType === 'Rushing')   return [p.rush_att, p.rush_yds, p.rush_tds]
  if (statType === 'Receiving') return [p.rec_rec, p.rec_yds, p.rec_tds, p.kick_pat]
  if (statType === 'Kicking')   return [p.kick_fg, p.kick_pat, p.kick_points]
  return [p.def_int, p.def_sacks, p.def_fumbles]
}

function StatTable({
  statType,
  players,
  onPlayerSelect,
}: {
  statType: string
  players: FlatPlayerStat[]
  onPlayerSelect?: (slug: string) => void
}) {
  if (players.length === 0) {
    return <EmptyTablet label={`No ${statType.toLowerCase()} data recorded for this game.`} />
  }
  const cols = STAT_COLS[statType] ?? []

  return (
    <ScrollTable maxH={0}>
      <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)] text-left" style={SANS}>Player</th>
            {cols.map(c => (
              <th key={c} className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] border-b border-[var(--paper-rule)] text-right w-16" style={SANS}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const logo = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : null
            const teamSlug = p.school_slug ? `${p.school_slug}-varsity-football` : null
            return (
              <tr
                key={`${p.player_slug ?? p.player_name}-${i}`}
                onClick={p.player_slug && onPlayerSelect ? () => onPlayerSelect(p.player_slug!) : undefined}
                className={cn(
                  'group/row border-t border-[var(--paper-rule-soft)] transition-colors',
                  'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
                  p.player_slug && onPlayerSelect && 'cursor-pointer',
                )}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 tabular-nums text-[var(--paper-faint)] w-5 text-right" style={{ ...MONO, fontSize: 11 }}>
                      {i + 1}.
                    </span>
                    {logo && teamSlug && (
                      <Link
                        href={`/team/${teamSlug}`}
                        onClick={e => e.stopPropagation()}
                        aria-label={`${cleanName(p.team_name)} team page`}
                        className="shrink-0"
                      >
                        <Image src={logo} alt="" width={22} height={22} className="object-contain" unoptimized />
                      </Link>
                    )}
                    <div className="min-w-0">
                      <span
                        className={cn(
                          'leading-tight truncate block transition-colors',
                          p.player_slug && onPlayerSelect
                            ? 'text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)]'
                            : 'text-[var(--paper-text)]',
                        )}
                        style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
                      >
                        {p.player_name}
                      </span>
                      <p className="text-[11.5px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
                        {cleanName(p.team_name)}
                      </p>
                    </div>
                  </div>
                </td>
                {statCells(p, statType).map((v, j) => (
                  <td key={j} className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>
                    {v ?? 0}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollTable>
  )
}

// ── PanelPlayers (existing — used inside Game Log AppPanel) ───────────────────

function mainStatParts(p: PlayerStat): { value: string; unit: string } {
  if (p.stat_type === 'Rushing')   return { value: String(p.yds ?? 0),    unit: 'yds'  }
  if (p.stat_type === 'Passing')   return { value: String(p.yds ?? 0),    unit: 'yds'  }
  if (p.stat_type === 'Receiving') return { value: String(p.yds ?? 0),    unit: 'yds'  }
  if (p.stat_type === 'Kicking')   return { value: String(p.points ?? 0), unit: 'pts'  }
  if (p.stat_type === 'Defense')   return { value: String(p.sacks ?? 0),  unit: 'sacks'}
  return { value: '—', unit: '' }
}

function PanelPlayers({ stats, schoolSlugs, playerSlugs, onPlayerSelect }: {
  stats: PlayerStat[]
  schoolSlugs: Record<string, string>
  playerSlugs: Record<string, string>
  onPlayerSelect: (slug: string) => void
}) {
  if (stats.length === 0) return (
    <div className="flex items-center justify-center h-32">
      <p className="text-sm text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
        No player data available.
      </p>
    </div>
  )

  return (
    <div className="pb-6">
      {STAT_ORDER.map(type => {
        const group = stats.filter(p => p.stat_type === type)
        if (group.length === 0) return null
        return (
          <div key={type}>
            <div className="px-5 pt-6 pb-2 border-t border-[var(--paper-rule)] first:border-t-0">
              <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
                {type}
              </span>
            </div>
            <div className="divide-y divide-[var(--paper-rule-soft)]">
              {group.map((p, i) => {
                const normTeam = cleanName(p.team_name).toLowerCase()
                const schoolSlug = (p.team_slug ? p.team_slug.replace(/-varsity-football$/, '') : null)
                  ?? Object.entries(schoolSlugs).find(([k]) => normTeam.includes(k.toLowerCase()) || k.toLowerCase().includes(normTeam))?.[1]
                  ?? ''
                const logo = schoolSlug ? SCHOOL_LOGOS[schoolSlug] : null
                const playerSlug = playerSlugs[p.player.toLowerCase()]
                const { value, unit } = mainStatParts(p)
                return (
                  <div
                    key={i}
                    className="group flex items-center gap-2.5 px-5 py-3 hover:bg-[var(--paper-quiet)] transition-colors"
                    style={{ cursor: playerSlug ? 'pointer' : 'default' }}
                    onClick={() => { if (playerSlug) onPlayerSelect(playerSlug) }}
                  >
                    <span className="shrink-0 tabular-nums text-[var(--paper-faint)] w-5 text-right leading-none" style={{ ...MONO, fontSize: 11 }}>
                      {i + 1}.
                    </span>
                    {logo
                      ? <Image src={logo} alt="" width={28} height={28} className="shrink-0 rounded-full object-contain border border-[var(--paper-rule)]" style={{ background: 'var(--paper-quiet)' }} unoptimized />
                      : <div className="shrink-0 h-7 w-7 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]" />
                    }
                    <div className="flex-1 min-w-0">
                      <span
                        className={`truncate block leading-snug transition-colors ${playerSlug ? 'text-[var(--paper-text)] group-hover:text-[var(--paper-strong)]' : 'text-[var(--paper-text)]'}`}
                        style={{ ...SERIF, fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em' }}
                      >
                        {p.player}
                      </span>
                      <p className="text-[11.5px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
                        {cleanName(p.team_name)}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-baseline gap-1">
                      <span className="text-[13px] tabular-nums font-medium text-[var(--paper-text)]" style={MONO}>{value}</span>
                      {unit && <span className="text-[10px] text-[var(--paper-muted)]" style={SANS}>{unit}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Highlights renderer (paper palette) ──────────────────────────────────────

function parseInline(text: string, playerSlugs: Record<string, string>, gameId: number): React.ReactNode[] {
  const names = Object.keys(playerSlugs).sort((a, b) => b.length - a.length)
  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = escaped.length > 0
    ? `\\*\\*(.+?)\\*\\*|\\*(.+?)\\*|(${escaped.join('|')})`
    : `\\*\\*(.+?)\\*\\*|\\*(.+?)\\*`
  const regex = new RegExp(pattern, 'gi')
  const nodes: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    if (match[1]) {
      nodes.push(<strong key={match.index} className="text-[var(--paper-text)]">{match[1]}</strong>)
    } else if (match[2]) {
      nodes.push(<em key={match.index} className="text-[var(--paper-muted)]">{match[2]}</em>)
    } else {
      const raw = match[0]
      const slug = playerSlugs[raw.toLowerCase()]
      nodes.push(slug
        ? <Link key={match.index} href={`/game/${gameId}/player/${slug}`} className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors underline-offset-4 decoration-[var(--paper-rule)] hover:underline">{raw}</Link>
        : <span key={match.index} className="text-[var(--paper-text)] font-medium">{raw}</span>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderHighlights(text: string, playerSlugs: Record<string, string>, gameId: number) {
  return text.split('\n\n').filter(Boolean).map((para, i) => (
    <p
      key={i}
      className="text-[16px] leading-[1.75] text-[var(--paper-muted)]"
      style={SERIF}
    >
      {parseInline(para, playerSlugs, gameId)}
    </p>
  ))
}

// ── Main shell ───────────────────────────────────────────────────────────────

export function GameShell({
  game, box, playerGameStats, prevGameId, nextGameId, refSlug, playerSlugs,
  totalTeams = 52, totalPlayers = 0,
}: {
  game: Record<string, unknown>
  box: Record<string, unknown> | null
  playerGameStats: Record<string, unknown>[]
  prevGameId: number | null
  nextGameId: number | null
  refSlug: string
  playerSlugs: Record<string, string>
  totalTeams?: number
  totalPlayers?: number
}) {
  const router = useRouter()

  const [chartsOpen,         setChartsOpen]         = useState(false)
  const [playerOpen,         setPlayerOpen]         = useState(false)
  const [highlightsPanelOpen, setHighlightsPanelOpen] = useState(false)

  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  const [aiTitle,      setAiTitle]      = useState<string | null>(null)
  const [aiHighlights, setAiHighlights] = useState<string | null>(null)
  const [loadingHighlights, setLoadingHighlights] = useState(false)
  const [highlightsTriggered, setHighlightsTriggered] = useState(false)

  const gameIdNum = game.id as number
  const homeSlug   = game.home_team_slug as string
  const awaySlug   = game.away_team_slug as string
  const homeSchool = (game.home_school_slug as string) ?? homeSlug.replace(/-varsity-football$/, '')
  const awaySchool = (game.away_school_slug as string) ?? awaySlug.replace(/-varsity-football$/, '')
  const homeName   = cleanName(game.home_team_name as string)
  const awayName   = cleanName(game.away_team_name as string)
  const homeScore  = game.home_score as number | null
  const awayScore  = game.away_score as number | null
  const division   = game.division   as string | null
  const gameNumber = game.game_number as number | null
  const season     = game.season as number

  // Ref-team perspective — drives the title's lead team and at/vs connector.
  const refIsHome  = refSlug === homeSlug
  const refName    = refIsHome ? homeName : awayName
  const otherName  = refIsHome ? awayName : homeName
  const otherSlug  = refIsHome ? awaySlug : homeSlug
  const refSchool  = refIsHome ? homeSchool : awaySchool
  const connector  = refIsHome ? 'vs.' : 'at'

  const quarterRows = (box?.quarter_scores as QuarterRow[] | null) ?? []
  const rawHighlights = box?.highlights as string | null

  const flatStats = playerGameStats as unknown as FlatPlayerStat[]
  const allStats  = (box?.player_stats as PlayerStat[] | null) ?? []

  // ── On-mount: hydrate any cached highlights so we don't re-fetch ─────────
  useEffect(() => {
    if (!rawHighlights) return
    try {
      const cached = sessionStorage.getItem(`hl-${gameIdNum}`)
      if (cached) {
        const p = JSON.parse(cached)
        setAiTitle(p.title ?? null)
        setAiHighlights(p.text ?? null)
        setHighlightsTriggered(true)
      }
    } catch {}
  }, [gameIdNum, rawHighlights])

  function triggerHighlights() {
    if (!rawHighlights || highlightsTriggered || loadingHighlights) return
    setHighlightsTriggered(true)
    setLoadingHighlights(true)
    fetch(`/api/game/${gameIdNum}/highlights`)
      .then(async res => {
        const text = await res.text()
        const nl = text.indexOf('\n')
        if (nl !== -1) {
          const title = text.slice(0, nl).trim()
          const body  = text.slice(nl + 1).trimStart()
          setAiTitle(title)
          setAiHighlights(body)
          try { sessionStorage.setItem(`hl-${gameIdNum}`, JSON.stringify({ title, text: body })) } catch {}
        } else {
          setAiHighlights(text.trim())
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHighlights(false))
  }

  // ── Section structure ────────────────────────────────────────────────────
  const availableStatSections = useMemo(
    () => STAT_ORDER.filter(t => flatStats.some(p => p.stat_type === t)),
    [flatStats],
  )

  type SectionId = 'box-score' | 'passing' | 'rushing' | 'receiving' | 'kicking' | 'defense' | 'highlights'

  const sections = useMemo(() => {
    const list: { id: SectionId; label: string; count: number }[] = [
      { id: 'box-score', label: 'Box Score', count: quarterRows.length > 0 ? 1 : 0 },
    ]
    for (const t of availableStatSections) {
      list.push({
        id: t.toLowerCase() as SectionId,
        label: t,
        count: flatStats.filter(p => p.stat_type === t).length,
      })
    }
    list.push({ id: 'highlights', label: 'Game Highlights', count: rawHighlights ? 1 : 0 })
    return list
  }, [availableStatSections, flatStats, quarterRows.length, rawHighlights])

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const [activeSection, setActiveSection] = useState<SectionId>('box-score')

  // ── Stat-type cycle (sticky bar) ─────────────────────────────────────────
  const [selectedStat, setSelectedStat] = useState<PlayerStat['stat_type']>(
    () => availableStatSections[0] ?? 'Passing',
  )
  useEffect(() => {
    if (availableStatSections.length && !availableStatSections.includes(selectedStat)) {
      setSelectedStat(availableStatSections[0])
    }
  }, [availableStatSections, selectedStat])
  function shiftStat(delta: 1 | -1) {
    if (availableStatSections.length === 0) return
    const idx  = availableStatSections.indexOf(selectedStat)
    const next = (idx + delta + availableStatSections.length) % availableStatSections.length
    const nextStat = availableStatSections[next]
    setSelectedStat(nextStat)
    const el = document.getElementById(nextStat.toLowerCase())
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const statPlayerCount = useMemo(
    () => flatStats.filter(p => p.stat_type === selectedStat).length,
    [flatStats, selectedStat],
  )

  // ── Scroll-spy ───────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveSection(visible[0].target.id as SectionId)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.4] },
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  function handleNavSelect(id: string) {
    if (id === 'highlights') triggerHighlights()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Mobile header ────────────────────────────────────────────────────────
  const mobileHeader = (
    <span className="text-[15px] font-bold text-[var(--paper-text)] truncate" style={SERIF}>
      {awayName} at {homeName}
    </span>
  )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <AppLayout mobileHeader={mobileHeader} paperMode>
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}
        >

          {/* ── Masthead ───────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
            <RevealFx delay={0} translateY={4}>
              <EditorialHead
                size="lg"
                eyebrow={
                  <>
                    <Link
                      href="/section/section-xi"
                      className="hover:text-[var(--paper-strong)] transition-colors"
                    >
                      Section XI
                    </Link>
                    {' · '}Week {gameNumber ?? '—'} · {fmtSeason(season)}
                  </>
                }
                subhead={
                  <>
                    <Link
                      href={`/section/section-xi?season=${season}`}
                      className="hover:text-[var(--paper-strong)] transition-colors underline-offset-4 decoration-[var(--paper-rule)] hover:underline"
                    >
                      {fmtDate(game.game_date as string | Date)}
                    </Link>
                    {' — '}
                    {division ? `Division ${division}` : 'Section XI football'}.
                  </>
                }
                meta={[game.is_division_game ? 'Conference Game' : 'Non-Conference Game']}
                rightSlot={
                  <EditorialButtonGroup
                    prevHref={prevGameId ? `/game/${prevGameId}?ref=${refSlug}` : undefined}
                    nextHref={nextGameId ? `/game/${nextGameId}?ref=${refSlug}` : undefined}
                    prevLabel="Previous game"
                    nextLabel="Next game"
                    buttons={[
                      { icon: ChartSpline, tooltip: 'Charts',          active: chartsOpen,          onClick: () => setChartsOpen(v => !v) },
                      { icon: FileUser,    tooltip: 'Game log',        active: playerOpen,          onClick: () => setPlayerOpen(v => !v) },
                      { icon: Sparkles,    tooltip: 'Game Highlights', active: highlightsPanelOpen, onClick: () => { setHighlightsPanelOpen(v => !v); triggerHighlights() } },
                    ]}
                  />
                }
              >
                <Link
                  href={`/team/${refSlug}`}
                  className="hover:text-[var(--paper-strong)] transition-colors"
                >
                  {refName}
                </Link>{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--paper-muted)' }}>{connector}</em>{' '}
                <Link
                  href={`/team/${otherSlug}`}
                  className="hover:text-[var(--paper-strong)] transition-colors"
                >
                  {otherName}
                </Link>
              </EditorialHead>
            </RevealFx>
          </div>

          {/* ── Hero ───────────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-14">
            <RevealFx delay={0.15} translateY={12}>
              <GameHero
                homeName={homeName} awayName={awayName}
                homeSchool={homeSchool} awaySchool={awaySchool}
                homeScore={homeScore} awayScore={awayScore}
                gameNumber={gameNumber}
              />
            </RevealFx>
          </div>

          {/* ── Sticky control bar ─────────────────────────────────── */}
          <StickyControlBar>
            {availableStatSections.length > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
                  Stats
                </span>
                <button
                  onClick={() => shiftStat(-1)}
                  aria-label="Previous stat type"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span
                  className="text-[var(--paper-text)] min-w-[6rem] text-center"
                  style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
                >
                  {selectedStat}
                </span>
                <button
                  onClick={() => shiftStat(1)}
                  aria-label="Next stat type"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <SearchInput
              value={query}
              onChange={setQuery}
              inputRef={searchRef}
              placeholder="Search players & stats…"
            />

            <div
              className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums hidden md:block"
              style={SANS}
            >
              {statPlayerCount} {statPlayerCount === 1 ? 'player' : 'players'}
            </div>
          </StickyControlBar>

          {/* ── Body: sidebar + main ──────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

            <ContentsNav
              items={sections}
              activeId={activeSection}
              onSelect={handleNavSelect}
              label="Page"
              topChildren={
                <div className="mb-8">
                  <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">Site</p>
                  <ol className="flex flex-col">
                    {([
                      {
                        roman: 'I',
                        label: 'Division',
                        count: 4,
                        href: division
                          ? `/division/division-${division.toLowerCase()}`
                          : '/section/section-xi',
                      },
                      { roman: 'II',  label: 'Teams',   count: totalTeams,   href: '/team' },
                      { roman: 'III', label: 'Players', count: totalPlayers, href: '/player' },
                    ] as const).map(link => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="group flex items-baseline gap-3 py-1.5 text-[13px] leading-tight text-[var(--paper-muted)] hover:text-[var(--paper-strong)] transition-colors"
                        >
                          <span
                            className="shrink-0 w-6 text-right italic"
                            style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 12 }}
                          >
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

              {/* ── Box Score ──────────────────────────────────────── */}
              {quarterRows.length > 0 && (
                <section
                  id="box-score"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['box-score'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Box Score"
                    eyebrow={gameNumber != null ? `Week ${gameNumber}` : undefined}
                    blurb="Quarter-by-quarter scoring, final result, home vs. away."
                  />
                  <BoxScoreTable rows={quarterRows} homeSlug={homeSlug} />
                </section>
              )}

              {/* ── Stat sections ──────────────────────────────────── */}
              {availableStatSections.map(stat => (
                <section
                  key={stat}
                  id={stat.toLowerCase()}
                  ref={(el: HTMLElement | null) => { sectionRefs.current[stat.toLowerCase()] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title={stat}
                    eyebrow="Player stats"
                    blurb={STAT_BLURB[stat]}
                    meta={
                      <span
                        className="text-[11px] uppercase tracking-[0.22em] text-[var(--paper-faint)] tabular-nums"
                        style={SANS}
                      >
                        {flatStats.filter(p => p.stat_type === stat).length} players
                      </span>
                    }
                  />
                  <StatTable
                    statType={stat}
                    players={flatStats.filter(p => p.stat_type === stat)}
                    onPlayerSelect={(slug) => router.push(
                      `/game/${gameIdNum}/player/${slug}?stat=${stat}`,
                      { scroll: false },
                    )}
                  />
                </section>
              ))}

              {/* ── Game Highlights ────────────────────────────────── */}
              {rawHighlights && (
                <section
                  id="highlights"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['highlights'] = el }}
                  className="mb-12 scroll-mt-24"
                >
                  <SectionHead
                    title={aiTitle ?? 'Game Highlights'}
                    eyebrow="Recap"
                    blurb={aiHighlights ? 'Filed by NYSgpt — AI rewrite of the Newsday box score notes.' : undefined}
                  />

                  {!highlightsTriggered ? (
                    <Tablet>
                      <div className="px-6 py-10 text-center">
                        <p
                          className="mb-5 text-[15px] text-[var(--paper-muted)] max-w-md mx-auto"
                          style={{ ...SERIF, fontStyle: 'italic' }}
                        >
                          The recap hasn't been written yet. Generate the AI rewrite of
                          the Newsday box-score notes.
                        </p>
                        <button
                          onClick={triggerHighlights}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--paper-rule)] text-[11px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                          style={{ ...SANS, borderRadius: TABLET_RADIUS }}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate Game Highlights
                        </button>
                      </div>
                    </Tablet>
                  ) : loadingHighlights ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-[var(--paper-quiet)] rounded w-full" />
                      <div className="h-4 bg-[var(--paper-quiet)] rounded w-[96%]" />
                      <div className="h-4 bg-[var(--paper-quiet)] rounded w-[88%]" />
                      <div className="h-4 bg-[var(--paper-quiet)] rounded w-full mt-4" />
                      <div className="h-4 bg-[var(--paper-quiet)] rounded w-[92%]" />
                      <div className="h-4 bg-[var(--paper-quiet)] rounded w-[75%]" />
                    </div>
                  ) : aiHighlights ? (
                    <div className="space-y-5 max-w-[68ch]">
                      {renderHighlights(aiHighlights, playerSlugs, gameIdNum)}
                    </div>
                  ) : (
                    <div className="max-w-[68ch]">
                      <p
                        className="text-[16px] leading-[1.75] text-[var(--paper-muted)]"
                        style={SERIF}
                      >
                        {rawHighlights}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* ── Colophon ───────────────────────────────────────── */}
              <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
                <p
                  className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
                  style={{ ...SERIF, fontStyle: 'italic' }}
                >
                  Quarter scores and player stat lines are drawn from Newsday box scores
                  for the {fmtSeason(season)} season. Game Highlights are an AI rewrite of
                  the Newsday recap; click in the sidebar to generate when ready.
                </p>
              </div>

            </main>
          </div>
        </div>
      </AppLayout>

      <div style={PAPER_BRIDGE}>
        <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
        <ChatSeasonsPanel
          open={playerOpen}
          onClose={() => setPlayerOpen(false)}
          teams={[{ slug: refSchool, name: refName }]}
          initialGameId={gameIdNum}
          initialGameSeason={season}
        />
        <AppPanel
          open={highlightsPanelOpen}
          onClose={() => setHighlightsPanelOpen(false)}
          defaultExpanded
          title={
            <span className="flex items-center gap-2 min-w-0">
              {SCHOOL_LOGOS[refSchool] && (
                <span
                  className="shrink-0 rounded-full overflow-hidden bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center"
                  style={{ width: 22, height: 22 }}
                >
                  <Image
                    src={SCHOOL_LOGOS[refSchool]}
                    alt=""
                    width={17}
                    height={17}
                    className="object-contain"
                    unoptimized
                  />
                </span>
              )}
              <span className="truncate" style={SERIF}>{refName}</span>
            </span>
          }
          footer={
            <div className="px-5 py-3.5 bg-[var(--paper)]">
              <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
                Game Highlights Panel
              </span>
            </div>
          }
        >
          <div className="px-6 sm:px-10 md:px-14 pt-8 pb-10">
            <SectionHead
              title={aiTitle ?? 'Game Highlights'}
              eyebrow="Recap"
              blurb={aiHighlights ? 'Filed by NYSgpt — AI rewrite of the Newsday box score notes.' : undefined}
            />

            {!highlightsTriggered ? (
              <Tablet>
                <div className="px-6 py-10 text-center">
                  <p
                    className="mb-5 text-[15px] text-[var(--paper-muted)] max-w-md mx-auto"
                    style={{ ...SERIF, fontStyle: 'italic' }}
                  >
                    The recap hasn&apos;t been written yet. Generate the AI rewrite of
                    the Newsday box-score notes.
                  </p>
                  <button
                    onClick={triggerHighlights}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--paper-rule)] text-[11px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                    style={{ ...SANS, borderRadius: TABLET_RADIUS }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Game Highlights
                  </button>
                </div>
              </Tablet>
            ) : loadingHighlights ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-full" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[96%]" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[88%]" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-full mt-4" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[92%]" />
                <div className="h-4 bg-[var(--paper-quiet)] rounded w-[75%]" />
              </div>
            ) : aiHighlights ? (
              <div className="space-y-5 max-w-[68ch]">
                {renderHighlights(aiHighlights, playerSlugs, gameIdNum)}
              </div>
            ) : (
              <p
                className="text-[16px] leading-[1.75] text-[var(--paper-muted)] max-w-[68ch]"
                style={SERIF}
              >
                {rawHighlights}
              </p>
            )}
          </div>
        </AppPanel>
      </div>
    </>
  )
}
