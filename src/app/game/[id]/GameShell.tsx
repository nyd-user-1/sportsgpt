'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChartSpline, ChevronLeft, ChevronRight, FileUser, Image as ImageIcon, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { AppPanel } from '@/components/AppPanel'
import { InfoTable } from '@/components/InfoTable'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { PanelImage } from '@/components/PanelImage'
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
  team_name: string; player: string
  att?: number; yds?: number; tds?: number
  comp?: number; int?: number
  rec?: number; pat?: number
  fg?: number; points?: number
  sacks?: number; fumbles?: number
}

type Profile = { label: string; kind: 'score' | 'stat'; statType?: PlayerStat['stat_type'] }

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
                  <ChevronRight className="h-4 w-4" />
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
            const schoolSlug = schoolSlugs[p.team_name] ?? ''
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

function PanelPlayers({ stats, schoolSlugs, playerSlugs }: {
  stats: PlayerStat[]
  schoolSlugs: Record<string, string>
  playerSlugs: Record<string, string>
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
                const schoolSlug = schoolSlugs[p.team_name] ?? ''
                const logo = schoolSlug ? SCHOOL_LOGOS[schoolSlug] : null
                const playerSlug = playerSlugs[p.player.toLowerCase()]
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--inp-bg)] transition-colors">
                    {logo
                      ? <Image src={logo} alt="" width={28} height={28} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                      : <div className="shrink-0 h-7 w-7 rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                    <div className="flex-1 min-w-0">
                      {playerSlug
                        ? <Link href={`/player/${playerSlug}`} className="text-sm font-semibold hover:underline truncate block" style={{ color: ACCENT_COLOR }}>{p.player}</Link>
                        : <span className="text-sm font-semibold text-[var(--txt)] truncate block">{p.player}</span>}
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

// ── Main shell ────────────────────────────────────────────────────────────────

function parseInline(text: string, playerSlugs: Record<string, string>): React.ReactNode[] {
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
        ? <Link key={match.index} href={`/player/${slug}`} className="font-semibold text-[var(--txt)] hover:underline">{raw}</Link>
        : <span key={match.index} className="font-semibold text-[var(--txt)]">{raw}</span>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderHighlights(text: string, playerSlugs: Record<string, string>) {
  return text.split('\n\n').filter(Boolean).map((para, i) => (
    <p key={i} className="text-sm text-[var(--txt2)] leading-relaxed">
      {parseInline(para, playerSlugs)}
    </p>
  ))
}

export function GameShell({
  game, box, prevGameId, nextGameId, refSlug, playerSlugs,
}: {
  game: Record<string, unknown>
  box: Record<string, unknown> | null
  prevGameId: number | null
  nextGameId: number | null
  refSlug: string
  playerSlugs: Record<string, string>
}) {
  const router = useRouter()
  const [profileIdx, setProfileIdx] = useState(0)
  const [statExpanded, setStatExpanded] = useState(false)
  const [aiTitle, setAiTitle] = useState<string | null>(null)
  const [aiHighlights, setAiHighlights] = useState<string | null>(null)
  const [loadingHighlights, setLoadingHighlights] = useState(false)

  const gameIdNum = game.id as number

  useEffect(() => {
    const rawHighlights = box?.highlights as string | null
    if (!rawHighlights) return

    // Serve from sessionStorage on repeat visits
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

    let buffer = ''
    let titleDone = false
    let titleEndIdx = 0

    fetch(`/api/game/${gameIdNum}/highlights`)
      .then(async res => {
        if (!res.body) return
        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          if (!titleDone) {
            const nl = buffer.indexOf('\n')
            if (nl !== -1) {
              setAiTitle(buffer.slice(0, nl).trim())
              titleDone = true
              titleEndIdx = nl + 1
              setLoadingHighlights(false)
            }
          }
          if (titleDone) {
            setAiHighlights(buffer.slice(titleEndIdx).trimStart())
          }
        }

        // Cache for this session
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            title: buffer.slice(0, titleEndIdx - 1).trim(),
            text: buffer.slice(titleEndIdx).trimStart(),
          }))
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoadingHighlights(false))
  }, [gameIdNum, box])
  const [view, setView] = useState<'score' | 'stats'>('score')
  const [photoOpen,  setPhotoOpen]    = useState(false)
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
  const allStats    = (box?.player_stats  as PlayerStat[] | null)  ?? []
  const highlights  = box?.highlights as string | null

  const STAT_TYPES: PlayerStat['stat_type'][] = ['Rushing', 'Passing', 'Receiving', 'Kicking', 'Defense']
  const availableStats = STAT_TYPES.filter(t => allStats.some(p => p.stat_type === t))

  const PROFILES: Profile[] = availableStats.map(t => ({ label: t, kind: 'stat' as const, statType: t }))

  const active = PROFILES[profileIdx] ?? null

  function getTeamStats(statType: PlayerStat['stat_type'], teamName: string) {
    return allStats.filter(p => p.stat_type === statType && p.team_name === teamName)
  }

  // Header styling (matches team/division pages)
  const homeLogo = SCHOOL_LOGOS[homeSchool]
  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'

  const mobileHeader = (
    <span className="text-[15px] font-bold text-[var(--txt)] truncate">{awayName} at {homeName}</span>
  )

  return (
    <>
      <AppLayout mobileHeader={mobileHeader}>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 pt-2 pb-8 sm:py-8">

            {/* Header */}
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
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <button onClick={() => prevGameId && router.push(`/game/${prevGameId}?ref=${refSlug}`)} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></button>
                    <span className={tip}>Previous game</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setPhotoOpen(v => !v)} className={`${btn} ${photoOpen ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : ''}`}><ImageIcon className="h-4 w-4" /></button>
                    <span className={tip}>Photos</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} ${chartsOpen ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setPlayerOpen(v => !v)} className={`${btn} ${playerOpen ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : ''}`}><FileUser className="h-4 w-4" /></button>
                    <span className={tip}>Player</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChatOpen(v => !v)} className={`${btn} ${chatOpen ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : ''}`}><MessageCircle className="h-4 w-4" /></button>
                    <span className={tip}>Ask SportsGPT</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => nextGameId && router.push(`/game/${nextGameId}?ref=${refSlug}`)} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></button>
                    <span className={tip}>Next game</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero */}
            <GameHero
              homeSlug={homeSlug} awaySlug={awaySlug}
              homeName={homeName} awayName={awayName}
              homeSchool={homeSchool} awaySchool={awaySchool}
              homeScore={homeScore} awayScore={awayScore}
              gameNumber={gameNumber}
              division={division} awayDivision={awayDivision}
              gameDate={game.game_date as string | Date | null}
            />

            {/* Box Score / Stats toggle */}
            {(quarterRows.length > 0 || (PROFILES.length > 0 && active)) && (
              <div className="mb-8 relative" style={{ overflowX: 'clip' }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {(view === 'score' || !active) ? (
                    <motion.div key="score"
                      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                      transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
                    >
                      <ScoreTable
                        rows={quarterRows}
                        homeSlug={homeSlug}
                        gameNumber={gameNumber}
                        gameDate={game.game_date as string | Date | null}
                        onToggle={PROFILES.length > 0 && active ? () => setView('stats') : undefined}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="stats"
                      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                      transition={{ duration: 0.28, ease: [0.32, 0, 0.67, 0] }}
                    >
                      <InfoTable
                        title={active.label}
                        onToggle={() => setStatExpanded(v => !v)}
                        onPrev={() => { setProfileIdx(i => (i - 1 + PROFILES.length) % PROFILES.length); setStatExpanded(false) }}
                        onNext={() => { setProfileIdx(i => (i + 1) % PROFILES.length); setStatExpanded(false) }}
                        onViewToggle={quarterRows.length > 0 ? () => setView('score') : undefined}
                      >
                        {active.kind === 'stat' && active.statType && (
                          <StatTable
                            players={[...getTeamStats(active.statType, homeName), ...getTeamStats(active.statType, awayName)]}
                            statType={active.statType}
                            schoolSlugs={{ [homeName]: homeSchool, [awayName]: awaySchool }}
                            playerSlugs={playerSlugs}
                            expanded={statExpanded}
                          />
                        )}
                      </InfoTable>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Highlights */}
            {highlights && (
              <div className="mb-6">
                {loadingHighlights ? (
                  <div className="animate-pulse mb-3 h-6 bg-[var(--inp-bg)] rounded w-2/3" />
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-[var(--txt)] mb-1">
                      {aiTitle ?? 'Game Highlights'}
                    </h2>
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
                  <div className="space-y-3">{renderHighlights(aiHighlights, playerSlugs)}</div>
                ) : (
                  <p className="text-sm text-[var(--txt2)] leading-relaxed">{highlights}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </AppLayout>

      <PanelImage open={photoOpen} onClose={() => setPhotoOpen(false)} homeSchool={homeSchool} homeName={homeName} awaySchool={awaySchool} awayName={awayName} />
      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <AppPanel open={playerOpen} onClose={() => setPlayerOpen(false)} title="Players">
        <PanelPlayers
          stats={allStats}
          schoolSlugs={{ [homeName]: homeSchool, [awayName]: awaySchool }}
          playerSlugs={playerSlugs}
        />
      </AppPanel>
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)} countyName={`${awayName} at ${homeName}`} />
    </>
  )
}
