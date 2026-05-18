'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChartSpline, ChevronLeft, ChevronRight, Map, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { InfoTable } from '@/components/InfoTable'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
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

function ScoreTable({ rows, homeSlug, gameNumber, gameDate }: { rows: QuarterRow[]; homeSlug: string; gameNumber: number | null; gameDate: string | Date | null }) {
  const hasOT = rows.some(r => r.ot1 > 0 || r.ot2 > 0 || r.ot3 > 0)
  const ordered = [...rows].sort((a, b) => (a.team_slug === homeSlug ? -1 : 1))
  const th = 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-right first:text-left'
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
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {ordered.map((r, i) => {
            const isHome = r.team_slug === homeSlug
            const schoolSlug = r.team_slug.replace(/-varsity-football$/, '')
            const logo = SCHOOL_LOGOS[schoolSlug]
            return (
              <tr key={i}>
                <td className="px-3 py-3 text-sm font-semibold text-[var(--txt)]">
                  <div className="flex items-center gap-2">
                    {logo
                      ? <Image src={logo} alt="" width={22} height={22} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                      : <div className="shrink-0 h-[22px] w-[22px] rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                    <span>{r.team_name}</span>
                    <span className="text-[10px] font-normal text-[var(--muted)]">{isHome ? '(H)' : '(A)'}</span>
                  </div>
                </td>
                <td className={td}>{r.q1}</td><td className={td}>{r.q2}</td>
                <td className={td}>{r.q3}</td><td className={td}>{r.q4}</td>
                {hasOT && <td className={td}>{r.ot1 || r.ot2 || r.ot3}</td>}
                <td className={cn(td, 'font-black text-[var(--txt)]')}>{r.final}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Player stat table ─────────────────────────────────────────────────────────

function StatTable({ players, statType, schoolSlugs, playerSlugs }: {
  players: PlayerStat[]
  statType: PlayerStat['stat_type']
  schoolSlugs: Record<string, string>  // team_name → school_slug
  playerSlugs: Record<string, string>  // player name (lowercase) → slug
}) {
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
  const th = 'px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-right bg-[var(--inp-bg)]'
  const td = 'px-3 py-2.5 text-sm tabular-nums text-right text-[var(--muted)]'
  if (players.length === 0) return null
  return (
    <div className="border-t border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] text-left bg-[var(--inp-bg)]">Player</th>
            {colHeaders[statType].map(h => <th key={h} className={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {players.map((p, i) => {
            const schoolSlug = schoolSlugs[p.team_name] ?? ''
            const logo = schoolSlug ? SCHOOL_LOGOS[schoolSlug] : null
            const playerSlug = playerSlugs[p.player.toLowerCase()]
            return (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className="px-3 py-2.5 text-sm text-[var(--txt)]">
                  <div className="flex items-center gap-2">
                    {logo
                      ? <Image src={logo} alt="" width={20} height={20} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                      : <div className="shrink-0 h-5 w-5 rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />}
                    {playerSlug
                      ? <Link href={`/player/${playerSlug}`} className="hover:underline" style={{ color: 'inherit' }}>{p.player}</Link>
                      : <span>{p.player}</span>}
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

// ── Main shell ────────────────────────────────────────────────────────────────

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
  const [chartsOpen, setChartsOpen] = useState(false)
  const [mapsOpen,   setMapsOpen]   = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)

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
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} ${chartsOpen ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setMapsOpen(v => !v)} className={`${btn} ${mapsOpen ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : ''}`}><Map className="h-4 w-4" /></button>
                    <span className={tip}>Map</span>
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

            {/* Standalone score table */}
            {quarterRows.length > 0 && (
              <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <ScoreTable rows={quarterRows} homeSlug={homeSlug} gameNumber={gameNumber} gameDate={game.game_date as string | Date | null} />
              </div>
            )}

            {/* Highlights */}
            {highlights && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[var(--txt)] mb-2">Game Highlights</h2>
                <p className="text-sm text-[var(--txt2)] leading-relaxed">{highlights}</p>
              </div>
            )}

            {/* InfoTable — stat types only */}
            {PROFILES.length > 0 && active && (
              <div className="mb-8">
                <InfoTable
                  title={active.label}
                  onToggle={() => {}}
                  onPrev={() => setProfileIdx(i => (i - 1 + PROFILES.length) % PROFILES.length)}
                  onNext={() => setProfileIdx(i => (i + 1) % PROFILES.length)}
                >
                  {active.kind === 'stat' && active.statType && (
                    <StatTable
                      players={[...getTeamStats(active.statType, homeName), ...getTeamStats(active.statType, awayName)]}
                      statType={active.statType}
                      schoolSlugs={{ [homeName]: homeSchool, [awayName]: awaySchool }}
                      playerSlugs={playerSlugs}
                    />
                  )}
                </InfoTable>
              </div>
            )}

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)} />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)} countyName={`${awayName} at ${homeName}`} />
    </>
  )
}
