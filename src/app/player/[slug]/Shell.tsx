'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChartSpline, Map, MessageCircle, User } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PLAYER_PHOTOS, SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { InfoTable } from '@/components/InfoTable'
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

const STAT_TYPES = ['Passing', 'Rushing', 'Receiving', 'Total Yards', 'Touchdowns', 'Scoring'] as const
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

function StatTable({ type, rows }: { type: StatTypeName; rows: StatRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
        No {type.toLowerCase()} data available.
      </div>
    )
  }

  if (type === 'Passing') {
    return (
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              <th className={cn(TH, 'text-left')}>Season</th>
              <th className={cn(TH, 'text-right')}>COMP</th>
              <th className={cn(TH, 'text-right')}>ATT</th>
              <th className={cn(TH, 'text-right')}>YDS</th>
              <th className={cn(TH, 'text-right')}>TD</th>
              <th className={cn(TH, 'text-right')}>INT</th>
              <th className={cn(TH, 'text-right')}>COMP%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.completions)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.attempts)}</td>
                <td className={cn(TD, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.pass_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.pass_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.interceptions)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtCompPct(r.completions, r.attempts)}</td>
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
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              <th className={cn(TH, 'text-left')}>Season</th>
              <th className={cn(TH, 'text-right')}>ATT</th>
              <th className={cn(TH, 'text-right')}>YDS</th>
              <th className={cn(TH, 'text-right')}>TD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_attempts)}</td>
                <td className={cn(TD, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.rush_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_tds)}</td>
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
          <thead>
            <tr className="bg-[var(--surface)]">
              <th className={cn(TH, 'text-left')}>Season</th>
              <th className={cn(TH, 'text-right')}>REC</th>
              <th className={cn(TH, 'text-right')}>YDS</th>
              <th className={cn(TH, 'text-right')}>TD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.receptions)}</td>
                <td className={cn(TD, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.recv_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.recv_tds)}</td>
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
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              {['Season', 'TOT YDS', 'YDS/G', 'Pass', 'Rush', 'Rec', 'GP'].map(h => (
                <th key={h} className={cn(TH, h === 'Season' ? 'text-left' : 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.total_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.yards_per_game)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.pass_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.recv_yards)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.games_played)}</td>
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
          <thead>
            <tr className="bg-[var(--surface)]">
              {['Season', 'TOT', 'Rush', 'Rec', 'FR', 'IR', 'PR', 'KOR', 'TD/G'].map(h => (
                <th key={h} className={cn(TH, h === 'Season' ? 'text-left' : 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
                <td className={cn(TD, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.total_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.recv_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.fumble_return_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.int_return_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.punt_return_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.kickoff_return_tds)}</td>
                <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.tds_per_game)}</td>
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
      <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
        <thead>
          <tr className="bg-[var(--surface)]">
            {['Season', 'PTS', 'PTS/G', 'TD', 'FG', 'PAT', 'S', 'GP'].map(h => (
              <th key={h} className={cn(TH, h === 'Season' ? 'text-left' : 'text-right')}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
              <td className={cn(TD, 'text-[var(--txt)] font-medium')}>{formatSeason(r.season)}</td>
              <td className={cn(TD, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.points)}</td>
              <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.points_per_game)}</td>
              <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.total_tds)}</td>
              <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.fg)}</td>
              <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.pat)}</td>
              <td className={cn(TD, 'text-right text-[var(--txt)]')}>{fmtVal(r.safeties)}</td>
              <td className={cn(TD, 'text-right text-[var(--muted)]')}>{fmtVal(r.games_played)}</td>
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
}: {
  player: PlayerRow
  stats: StatRow[]
  school: SchoolInfo | null
  prevSlug: string
  nextSlug: string
  divTeams: DivTeamRow[]
  divPlayers: DivPlayerRow[]
}) {
  const { yards, label, season: bestSeason } = getBestYards(stats)

  const defaultIdx = STAT_TYPES.indexOf(defaultStatType(label))
  const [statTypeIdx, setStatTypeIdx] = useState(defaultIdx >= 0 ? defaultIdx : 0)
  const [statsExpanded, setStatsExpanded] = useState(true)

  const [chartsOpen, setChartsOpen] = useState(false)
  const [mapsOpen,   setMapsOpen]   = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)

  const selectedType   = STAT_TYPES[statTypeIdx]
  const tableRows      = stats.filter(s => s.stat_type === selectedType)
  const availableTypes = STAT_TYPES.filter(t => stats.some(s => s.stat_type === t))

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
            <div className="hidden sm:flex mb-8 items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {logo && (
                    <Image src={logo} alt="" width={28} height={28}
                      className="shrink-0 h-7 w-7 object-contain" unoptimized />
                  )}
                  <h1 className="text-2xl font-bold text-[var(--txt)]">{player.name}</h1>
                  {player.position && (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                      style={{ background: ACCENT_COLOR }}>{player.position}</span>
                  )}
                </div>
                {school && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]"
                    style={{ paddingLeft: logo ? '36px' : '0' }}>
                    <Link href={`/division/division-${school.division.toLowerCase()}`} className="hover:text-[var(--txt)] transition-colors">Division {school.division}</Link>
                    <span>/</span>
                    <Link href={`/team/${schoolSlug}-varsity-football`} className="hover:text-[var(--txt)] transition-colors">{school.name}</Link>
                    <span>/</span>
                    <span className="font-medium" style={{ color: ACCENT_COLOR }}>{player.name}</span>
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

            {/* Hero — player photo → team photo → gradient fallback (hidden on mobile) */}
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

            {/* Career Stats in InfoTable with stat-type carousel */}
            {stats.length > 0 && (
              <div className="mb-8">
                <InfoTable
                  title={selectedType}
                  onToggle={() => setStatsExpanded(v => !v)}
                  onPrev={availableTypes.length > 1 ? () => {
                    const cur = availableTypes.indexOf(selectedType)
                    const prev = availableTypes[(cur - 1 + availableTypes.length) % availableTypes.length]
                    setStatTypeIdx(STAT_TYPES.indexOf(prev))
                    setStatsExpanded(true)
                  } : undefined}
                  onNext={availableTypes.length > 1 ? () => {
                    const cur = availableTypes.indexOf(selectedType)
                    const next = availableTypes[(cur + 1) % availableTypes.length]
                    setStatTypeIdx(STAT_TYPES.indexOf(next))
                    setStatsExpanded(true)
                  } : undefined}
                >
                  <StatTable type={selectedType} rows={statsExpanded ? tableRows : tableRows.slice(0, 2)} />
                </InfoTable>
              </div>
            )}

            {/* AI Summaries */}
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

            {/* Top Players carousel */}
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

            {/* Division Standings carousel */}
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

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={player.name} />
    </>
  )
}
