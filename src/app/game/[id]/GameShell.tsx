'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChartSpline, FileUser, MessageCircle } from 'lucide-react'
import { ButtonGroup } from '@/components/ButtonGroup'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { AppPanel } from '@/components/AppPanel'
import { InfoTable } from '@/components/InfoTable'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
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

type GameTabType = 'Box Score' | PlayerStat['stat_type']

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanName(raw: string | null | undefined) {
  return (raw ?? '').replace(/\s+Varsity\s+Football$/i, '').trim()
}

function fmtDate(raw: string | Date | null): string {
  if (!raw) return '—'
  const d = raw instanceof Date ? raw : new Date(String(raw).includes('T') ? raw : raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Split-screen hero (ported from launchpad) ─────────────────────────────────

function GameHero({ homeSlug, awaySlug, homeName, awayName, homeSchool, awaySchool,
  homeScore, awayScore, gameNumber, division, awayDivision, gameDate }: {
  homeSlug: string; awaySlug: string; homeName: string; awayName: string
  homeSchool: string; awaySchool: string
  homeScore: number | null; awayScore: number | null; gameNumber: number | null
  division: string | null; awayDivision: string | null; gameDate: string | Date | null
}) {
  const homePhoto = TEAM_PHOTOS[homeSchool]?.[0]
  const awayPhoto = TEAM_PHOTOS[awaySchool]?.[0]
  const homeLogo  = SCHOOL_LOGOS[homeSchool]
  const awayLogo  = SCHOOL_LOGOS[awaySchool]
  const scored    = homeScore != null && awayScore != null
  const homeWon   = scored && homeScore! > awayScore!
  const awayWon   = scored && awayScore! > homeScore!

  return (
    <div className="hidden sm:block mb-8 h-[400px] w-full rounded-2xl overflow-hidden relative">
      {/* Split photo background — heavier darken for readability */}
      <div className="absolute inset-0 flex">
        <div className="relative flex-1">
          {homePhoto
            ? <><Image src={homePhoto} alt={homeName} fill className="object-cover" unoptimized />
</>
            : <div className="h-full" style={{ background: `linear-gradient(135deg,${ACCENT_COLOR}55,${ACCENT_COLOR}99)` }} />}
        </div>
        <div className="relative flex-1">
          {awayPhoto
            ? <><Image src={awayPhoto} alt={awayName} fill className="object-cover" unoptimized />
</>
            : <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />}
        </div>
      </div>

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent z-[5]" />

      {/* Week badge — top left */}
      {gameNumber != null && (
        <div className="absolute top-3 left-4 z-10">
          <span className="text-xs font-semibold text-black bg-white rounded-full px-2.5 py-0.5">Week {gameNumber}</span>
        </div>
      )}


      {/* Scoreboard — centered, three-column */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="flex items-center w-full max-w-xl px-8 gap-6">

          <div className="flex-1" />

          {/* Score badge */}
          <div className="shrink-0 text-center bg-black/65 backdrop-blur-md rounded-2xl px-6 py-5 border border-white/10 shadow-xl">
            {scored ? (
              <>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-8xl font-black tabular-nums leading-none text-white">{homeScore}</span>
                  <span className="text-8xl font-black tabular-nums leading-none text-white">–</span>
                  <span className="text-8xl font-black tabular-nums leading-none text-white">{awayScore}</span>
                </div>
              </>
            ) : (
              <p className="text-2xl font-bold text-white/40">vs</p>
            )}
          </div>

          <div className="flex-1" />

        </div>
      </div>
    </div>
  )
}

// ── Score table ───────────────────────────────────────────────────────────────

function ScoreTable({ rows, homeSlug, gameNumber, gameDate, onToggle }: {
  rows: QuarterRow[]; homeSlug: string; gameNumber: number | null
  gameDate: string | Date | null; onToggle?: () => void
}) {
  const hasOT = rows.some(r => r.ot1 > 0 || r.ot2 > 0 || r.ot3 > 0)
  const ordered = [...rows].sort((a, b) => (a.team_slug === homeSlug ? -1 : 1))
  const maxFinal = Math.max(...ordered.map(r => r.final))
  const th = 'px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-right first:text-left'
  const td = 'px-3 py-3 text-sm tabular-nums text-right text-[var(--muted)]'
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm">
        <thead className="bg-[var(--inp-bg)] border-b border-[var(--border)]">
          <tr>
            <th className={cn(th, 'normal-case tracking-normal')}>{gameNumber != null ? `Week ${gameNumber}${gameDate ? ` · ${fmtDate(gameDate)}` : ''}` : 'Team'}</th>
            <th className={th}>Q1</th><th className={th}>Q2</th>
            <th className={th}>Q3</th><th className={th}>Q4</th>
            {hasOT && <th className={th}>OT</th>}
            <th className={cn(th, 'font-black text-[var(--txt)]')}>F</th>
            <th className="px-2 py-3 w-9 text-right">
              {onToggle && (
                <button onClick={onToggle} className="inline-flex items-center justify-center p-1 rounded-md text-[var(--muted)] hover:text-[var(--txt)] transition-colors" aria-label="View player stats">
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {ordered.map((r, i) => {
            const isHome = r.team_slug === homeSlug
            const schoolSlug = r.team_slug.replace(/-varsity-football$/, '')
            const logo = SCHOOL_LOGOS[schoolSlug]
            return (
              <tr key={i}>
                <td className="px-3 py-3 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    {logo
                      ? <Image src={logo} alt="" width={22} height={22} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                      : <div className="shrink-0 h-[22px] w-[22px] rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                    <Link href={`/team/${r.team_slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{r.team_name}</Link>
                    <span className="text-[10px] font-normal text-[var(--muted)]">{isHome ? '(H)' : '(A)'}</span>
                    {r.final === maxFinal
                      ? <span className="text-[10px] font-bold" style={{ color: '#16a34a' }}>W</span>
                      : <span className="text-[10px] font-bold" style={{ color: '#dc2626' }}>L</span>}
                  </div>
                </td>
                <td className={td}>{r.q1}</td><td className={td}>{r.q2}</td>
                <td className={td}>{r.q3}</td><td className={td}>{r.q4}</td>
                {hasOT && <td className={td}>{r.ot1 || r.ot2 || r.ot3}</td>}
                <td className={cn(td, 'font-black text-[var(--txt)]')}>{r.final}</td>
                <td className="px-2 py-3 w-9" />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Player stat table ─────────────────────────────────────────────────────────

function StatTable({ players, statType, schoolSlugs, playerSlugs, expanded }: {
  players: PlayerStat[]
  statType: PlayerStat['stat_type']
  schoolSlugs: Record<string, string>
  playerSlugs: Record<string, string>
  expanded: boolean
}) {
  const visible = expanded ? players : players.slice(0, 2)
  const colHeaders: Record<string, string[]> = {
    Rushing:   ['ATT', 'YDS', 'TDS'],
    Passing:   ['ATT', 'COMP', 'YDS', 'TDS', 'INT'],
    Receiving: ['REC', 'YDS', 'TDS'],
    Kicking:   ['FG', 'PAT', 'PTS'],
    Defense:   ['INT', 'SACKS', 'FUM'],
  }
  function statCells(p: PlayerStat): (string | number)[] {
    if (statType === 'Rushing')   return [p.att ?? 0, p.yds ?? 0, p.tds ?? 0]
    if (statType === 'Passing')   return [p.att ?? 0, p.comp ?? 0, p.yds ?? 0, p.tds ?? 0, p.int ?? 0]
    if (statType === 'Receiving') return [p.rec ?? 0, p.yds ?? 0, p.tds ?? 0]
    if (statType === 'Kicking')   return [p.fg ?? 0, p.pat ?? 0, p.points ?? 0]
    return [p.int ?? 0, p.sacks ?? 0, p.fumbles ?? 0]
  }
  const th = 'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-right border-b border-[var(--border)]'
  const td = 'px-3 py-2.5 text-sm tabular-nums text-right text-[var(--muted)]'
  if (players.length === 0) return null
  return (
    <div className="border-t border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-left border-b border-[var(--border)]">Player</th>
            {colHeaders[statType].map(h => <th key={h} className={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {visible.map((p, i) => {
            const normTeam2 = cleanName(p.team_name).toLowerCase()
            const schoolSlug = (p.team_slug ? p.team_slug.replace(/-varsity-football$/, '') : null)
              ?? Object.entries(schoolSlugs).find(([k]) => normTeam2.includes(k.toLowerCase()) || k.toLowerCase().includes(normTeam2))?.[1]
              ?? ''
            const logo = schoolSlug ? SCHOOL_LOGOS[schoolSlug] : null
            const playerSlug = playerSlugs[p.player.toLowerCase()]
            return (
              <tr key={i}>
                <td className="px-3 py-2.5 text-sm text-[var(--txt)]">
                  <div className="flex items-center gap-2">
                    {logo
                      ? <Image src={logo} alt="" width={20} height={20} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                      : <div className="shrink-0 h-5 w-5 rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                    {playerSlug
                      ? <Link href={`/player/${playerSlug}`} className="font-semibold hover:underline" style={{ color: ACCENT_COLOR }}>{p.player}</Link>
                      : <span className="font-semibold">{p.player}</span>}
                  </div>
                </td>
                {statCells(p).map((v, j) => <td key={j} className={td}>{v}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Player panel list ─────────────────────────────────────────────────────────

const STAT_ORDER: PlayerStat['stat_type'][] = ['Rushing', 'Passing', 'Receiving', 'Kicking', 'Defense']

function mainStat(p: PlayerStat): string {
  if (p.stat_type === 'Rushing')   return `${p.yds ?? 0} yds`
  if (p.stat_type === 'Passing')   return `${p.yds ?? 0} yds`
  if (p.stat_type === 'Receiving') return `${p.yds ?? 0} yds`
  if (p.stat_type === 'Kicking')   return `${p.points ?? 0} pts`
  if (p.stat_type === 'Defense')   return `${p.sacks ?? 0} sacks`
  return ''
}

function PanelPlayers({ stats, schoolSlugs, playerSlugs, onPlayerSelect }: {
  stats: PlayerStat[]
  schoolSlugs: Record<string, string>
  playerSlugs: Record<string, string>
  onPlayerSelect: (slug: string) => void
}) {
  if (stats.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm text-[var(--muted)]">No player data</div>
  )
  return (
    <div className="pb-4">
      {STAT_ORDER.map(type => {
        const group = stats.filter(p => p.stat_type === type)
        if (group.length === 0) return null
        return (
          <div key={type}>
            <div className="px-4 pt-5 pb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{type}</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {group.map((p, i) => {
                const normTeam = cleanName(p.team_name).toLowerCase()
                const schoolSlug = (p.team_slug ? p.team_slug.replace(/-varsity-football$/, '') : null)
                  ?? Object.entries(schoolSlugs).find(([k]) => normTeam.includes(k.toLowerCase()) || k.toLowerCase().includes(normTeam))?.[1]
                  ?? ''
                const logo = schoolSlug ? SCHOOL_LOGOS[schoolSlug] : null
                const playerSlug = playerSlugs[p.player.toLowerCase()]
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${playerSlug ? 'cursor-pointer hover:bg-[var(--inp-bg)]' : 'hover:bg-[var(--inp-bg)]'}`}
                    onClick={() => {
                      if (!playerSlug) return
                      onPlayerSelect(playerSlug)
                    }}
                  >
                    {logo
                      ? <Image src={logo} alt="" width={28} height={28} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                      : <div className="shrink-0 h-7 w-7 rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold truncate block ${playerSlug ? 'hover:underline' : 'text-[var(--txt)]'}`} style={playerSlug ? { color: ACCENT_COLOR } : undefined}>{p.player}</span>
                      <p className="text-xs text-[var(--muted)] truncate">{cleanName(p.team_name)}</p>
                    </div>
                    <span className="text-sm tabular-nums font-medium text-[var(--txt)] shrink-0">{mainStat(p)}</span>
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

// ── Per-stat-type two-team block ──────────────────────────────────────────────

function GameStatSection({ statType, players }: {
  statType: string
  players: FlatPlayerStat[]
}) {
  const colsByType: Record<string, string[]> = {
    Passing:   ['ATT', 'COMP', 'YDS', 'TDS', 'INT'],
    Rushing:   ['ATT', 'YDS', 'TDS'],
    Receiving: ['REC', 'YDS', 'TDS', 'PAT'],
    Kicking:   ['FG', 'PAT', 'PTS'],
    Defense:   ['INT', 'SACKS', 'FUM'],
  }
  const cols = colsByType[statType] ?? []
  const TH = 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-right border-b border-[var(--border)]'
  const TD = 'px-3 py-2.5 text-sm tabular-nums text-right text-[var(--muted)]'

  function statCells(p: FlatPlayerStat): (number | null)[] {
    if (statType === 'Passing')   return [p.pass_att, p.pass_comp, p.pass_yds, p.pass_tds, p.pass_int]
    if (statType === 'Rushing')   return [p.rush_att, p.rush_yds, p.rush_tds]
    if (statType === 'Receiving') return [p.rec_rec, p.rec_yds, p.rec_tds, p.kick_pat]
    if (statType === 'Kicking')   return [p.kick_fg, p.kick_pat, p.kick_points]
    return [p.def_int, p.def_sacks, p.def_fumbles]
  }

  if (players.length === 0) return (
    <div className="rounded-xl border border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">No {statType.toLowerCase()} data</div>
  )

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--surface)]">
            <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-left border-b border-[var(--border)]" style={{ width: '30%' }}>Player</th>
            {cols.map(c => <th key={c} className={TH}>{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {players.map((p, i) => {
            const logo = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : null
            return (
              <tr key={i} className="hover:bg-[var(--inp-bg)]">
                <td className="px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    {logo
                      ? <Image src={logo} alt="" width={20} height={20} className="shrink-0 object-contain" unoptimized />
                      : <div className="shrink-0 h-5 w-5 rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                    {p.player_slug
                      ? <Link href={`/player/${p.player_slug}`} className="font-semibold hover:underline" style={{ color: ACCENT_COLOR }}>{p.player_name}</Link>
                      : <span className="font-semibold text-[var(--txt)]">{p.player_name}</span>}
                  </div>
                </td>
                {statCells(p).map((v, j) => <td key={j} className={TD}>{v ?? 0}</td>)}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────

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
      nodes.push(<strong key={match.index}>{match[1]}</strong>)
    } else if (match[2]) {
      nodes.push(<em key={match.index}>{match[2]}</em>)
    } else {
      const raw = match[0]
      const slug = playerSlugs[raw.toLowerCase()]
      nodes.push(slug
        ? <Link key={match.index} href={`/game/${gameId}/player/${slug}`} className="font-semibold text-[var(--txt)] hover:underline">{raw}</Link>
        : <span key={match.index} className="font-semibold text-[var(--txt)]">{raw}</span>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderHighlights(text: string, playerSlugs: Record<string, string>, gameId: number) {
  return text.split('\n\n').filter(Boolean).map((para, i) => (
    <p key={i} className="text-sm text-[var(--txt2)] leading-relaxed">
      {parseInline(para, playerSlugs, gameId)}
    </p>
  ))
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

export function GameShell({
  game, box, playerGameStats, prevGameId, nextGameId, refSlug, playerSlugs,
}: {
  game: Record<string, unknown>
  box: Record<string, unknown> | null
  playerGameStats: Record<string, unknown>[]
  prevGameId: number | null
  nextGameId: number | null
  refSlug: string
  playerSlugs: Record<string, string>
}) {
  const router = useRouter()
  const [gameTab, setGameTab] = useState<GameTabType>('Box Score')
  const [aiTitle, setAiTitle] = useState<string | null>(null)
  const [aiHighlights, setAiHighlights] = useState<string | null>(null)
  const [loadingHighlights, setLoadingHighlights] = useState(false)

  const gameIdNum = game.id as number

  useEffect(() => {
    const rawHighlights = box?.highlights as string | null
    if (!rawHighlights) return

    const cacheKey = `hl-${gameIdNum}`
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const p = JSON.parse(cached)
        setAiTitle(p.title ?? null)
        setAiHighlights(p.text ?? null)
        return
      }
    } catch {}

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
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ title, text: body })) } catch {}
        } else {
          setAiHighlights(text.trim())
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHighlights(false))
  }, [gameIdNum, box])
  const [chartsOpen, setChartsOpen]   = useState(false)
  const [playerOpen, setPlayerOpen]   = useState(false)
  const [chatOpen,   setChatOpen]     = useState(false)

  const homeSlug   = game.home_team_slug as string
  const awaySlug   = game.away_team_slug as string
  const homeSchool = (game.home_school_slug as string) ?? homeSlug.replace(/-varsity-football$/, '')
  const awaySchool = (game.away_school_slug as string) ?? awaySlug.replace(/-varsity-football$/, '')
  const homeName   = cleanName(game.home_team_name as string)
  const awayName   = cleanName(game.away_team_name as string)
  const homeScore  = game.home_score as number | null
  const awayScore  = game.away_score as number | null
  const division      = game.division      as string | null
  const awayDivision  = game.away_division as string | null
  const gameNumber = game.game_number as number | null

  const quarterRows = (box?.quarter_scores as QuarterRow[] | null) ?? []
  const highlights  = box?.highlights as string | null

  // Use player_game_stats flat table (school_slug + player_slug on every row)
  const flatStats = (playerGameStats as unknown as FlatPlayerStat[])
  const allStats  = (box?.player_stats as PlayerStat[] | null) ?? [] // for PanelPlayers fallback

  const STAT_STAT_TYPES = ['Passing', 'Rushing', 'Receiving', 'Kicking', 'Defense'] as const
  const availableStats = STAT_STAT_TYPES.filter(t =>
    flatStats.some(p => p.stat_type === t) || allStats.some(p => p.stat_type === t)
  )

  function getFlatStats(statType: string) {
    return flatStats.filter(p => p.stat_type === statType)
  }
  function getTeamStats(statType: PlayerStat['stat_type'], teamSlug: string) {
    const bySlug = allStats.filter(p => p.stat_type === statType && p.team_slug === teamSlug)
    if (bySlug.length > 0) return bySlug
    const schoolName = teamSlug.replace(/-varsity-football$/, '').replace(/-/g, ' ')
    return allStats.filter(p => p.stat_type === statType && cleanName(p.team_name).toLowerCase() === schoolName)
  }

  const homeLogo = SCHOOL_LOGOS[homeSchool]

  const mobileHeader = (
    <span className="text-[15px] font-bold text-[var(--txt)] truncate">{awayName} at {homeName}</span>
  )

  return (
    <>
      <AppLayout mobileHeader={mobileHeader}>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 pt-2 pb-8 sm:py-8">

            {/* Header */}
            <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <div className="hidden sm:flex mb-8 items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[var(--txt)]">{awayName} at {homeName}</h1>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  {division && (
                    <><Link href={`/division/division-${division.toLowerCase()}`} className="hover:text-[var(--txt)] transition-colors">Division {division}</Link>
                    <span>/</span></>
                  )}
                  <Link href={`/team/${homeSlug}`} className="hover:text-[var(--txt)] transition-colors">{homeName}</Link>
                  <span>/</span>
                  <span className="font-medium" style={{ color: ACCENT_COLOR }}>{fmtDate(game.game_date as string | Date)}</span>
                </div>
              </div>
              <ButtonGroup
                onPrev={() => prevGameId && router.push(`/game/${prevGameId}?ref=${refSlug}`)}
                onNext={() => nextGameId && router.push(`/game/${nextGameId}?ref=${refSlug}`)}
                buttons={[
                  { icon: ChartSpline,   tooltip: 'Charts',         active: chartsOpen, onClick: () => setChartsOpen(v => !v) },
                  { icon: FileUser,      tooltip: 'Players',        active: playerOpen, onClick: () => setPlayerOpen(v => !v) },
                  { icon: MessageCircle, tooltip: 'Ask SportsGPT',  active: chatOpen,   onClick: () => setChatOpen(v => !v) },
                ]}
              />
            </div>
            </RevealFx>

            {/* Hero */}
            <RevealFx delay={0.15} translateY={16}>
            <GameHero
              homeSlug={homeSlug} awaySlug={awaySlug}
              homeName={homeName} awayName={awayName}
              homeSchool={homeSchool} awaySchool={awaySchool}
              homeScore={homeScore} awayScore={awayScore}
              gameNumber={gameNumber}
              division={division} awayDivision={awayDivision}
              gameDate={game.game_date as string | Date | null}
            />
            </RevealFx>

            {/* Box Score / Stats tabs */}
            <RevealFx delay={0.3} translateY={8}>
            {(quarterRows.length > 0 || allStats.length > 0) && (
              <div className="mb-8">
                <div className="flex items-center gap-0 border-b border-[var(--border)] mb-5">
                  {(['Box Score', ...availableStats] as GameTabType[]).map(tab => (
                    <button key={tab}
                      onClick={() => setGameTab(tab)}
                      className={cn('px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                        gameTab === tab ? 'border-[#033882] text-[var(--txt)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
                      )}
                    >{tab}</button>
                  ))}
                </div>

                {gameTab === 'Box Score' && quarterRows.length > 0 && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    <ScoreTable rows={quarterRows} homeSlug={homeSlug} gameNumber={gameNumber} gameDate={game.game_date as string | Date | null} />
                  </div>
                )}

                {gameTab !== 'Box Score' && (
                  <GameStatSection
                    statType={gameTab}
                    players={getFlatStats(gameTab)}
                  />
                )}
              </div>
            )}
            </RevealFx>

            {/* Highlights */}
            <RevealFx delay={0.42} translateY={8}>
            {highlights && (
              <div className="mb-6">
                {loadingHighlights ? (
                  <div className="animate-pulse mb-3 h-6 bg-[var(--inp-bg)] rounded w-2/3" />
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-[var(--txt)] mb-1">{aiTitle ?? 'Game Highlights'}</h2>
                    <p className="text-xs text-[var(--muted)] mb-3">By NYSgpt</p>
                  </>
                )}
                {loadingHighlights ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-[var(--inp-bg)] rounded w-full" />
                    <div className="h-4 bg-[var(--inp-bg)] rounded w-[95%]" />
                    <div className="h-4 bg-[var(--inp-bg)] rounded w-[88%]" />
                    <div className="h-4 bg-[var(--inp-bg)] rounded w-full mt-3" />
                    <div className="h-4 bg-[var(--inp-bg)] rounded w-[92%]" />
                    <div className="h-4 bg-[var(--inp-bg)] rounded w-[75%]" />
                  </div>
                ) : aiHighlights ? (
                  <div className="space-y-3">{renderHighlights(aiHighlights, playerSlugs, gameIdNum)}</div>
                ) : (
                  <p className="text-sm text-[var(--txt)] leading-relaxed">{highlights}</p>
                )}
              </div>
            )}
            </RevealFx>

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <AppPanel open={playerOpen} onClose={() => setPlayerOpen(false)} title="Game Log">
        <PanelPlayers
          stats={allStats}
          schoolSlugs={{ [homeName]: homeSchool, [awayName]: awaySchool }}
          playerSlugs={playerSlugs}
          onPlayerSelect={(slug) => router.push(`/game/${gameIdNum}/player/${slug}`, { scroll: false })}
        />
      </AppPanel>
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)} countyName={`${awayName} at ${homeName}`} />
    </>
  )
}
