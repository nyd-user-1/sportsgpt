'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChevronDown, ChartSpline, Map, MessageCircle, User } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PLAYER_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { cn } from '@/lib/utils'
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

function fmtVal(v: number | null | undefined) {
  return v == null ? '—' : String(v)
}

function fmtPct(comp: number | null, att: number | null) {
  if (!comp || !att || att === 0) return '—'
  return ((comp / att) * 100).toFixed(1) + '%'
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

function PassingCard({ rows, expanded, onToggle }: { rows: StatRow[]; expanded: boolean; onToggle: () => void }) {
  const DEFAULT = 2
  const visible = expanded ? rows : rows.slice(0, DEFAULT)
  const td = 'px-3 py-2 text-sm border-b border-[var(--border)]'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
        <span className="text-sm font-semibold text-[var(--txt)]">Passing</span>
        <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">Season</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">COMP</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">ATT</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">YDS</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">TD</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">INT</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">COMP%</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(td, 'text-[var(--txt)] font-medium')}>{r.season}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.completions)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.attempts)}</td>
                <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.pass_yards)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.pass_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.interceptions)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtPct(r.completions, r.attempts)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-[var(--muted)]">No passing data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RushingCard({ rows, expanded, onToggle }: { rows: StatRow[]; expanded: boolean; onToggle: () => void }) {
  const DEFAULT = 2
  const visible = expanded ? rows : rows.slice(0, DEFAULT)
  const td = 'px-3 py-2 text-sm border-b border-[var(--border)]'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
        <span className="text-sm font-semibold text-[var(--txt)]">Rushing</span>
        <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">Season</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">ATT</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">YDS</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">TD</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(td, 'text-[var(--txt)] font-medium')}>{r.season}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_attempts)}</td>
                <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.rush_yards)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_tds)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-[var(--muted)]">No rushing data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReceivingCard({ rows, expanded, onToggle }: { rows: StatRow[]; expanded: boolean; onToggle: () => void }) {
  const DEFAULT = 2
  const visible = expanded ? rows : rows.slice(0, DEFAULT)
  const td = 'px-3 py-2 text-sm border-b border-[var(--border)]'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
        <span className="text-sm font-semibold text-[var(--txt)]">Receiving</span>
        <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">Season</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">REC</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">YDS</th>
              <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]">TD</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(td, 'text-[var(--txt)] font-medium')}>{r.season}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.receptions)}</td>
                <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.recv_yards)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.recv_tds)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-[var(--muted)]">No receiving data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ScoringCard({ rows, expanded, onToggle }: { rows: StatRow[]; expanded: boolean; onToggle: () => void }) {
  const visible = expanded ? rows : rows.slice(0, 2)
  const td = 'px-3 py-2 text-sm border-b border-[var(--border)]'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
        <span className="text-sm font-semibold text-[var(--txt)]">Scoring</span>
        <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              {['Season','PTS','PTS/G','TD','FG','PAT','S','GP'].map(h => (
                <th key={h} className={cn('px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]', h === 'Season' ? 'text-left' : 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(td, 'text-[var(--txt)] font-medium')}>{r.season}</td>
                <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.points)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.points_per_game)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.total_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.fg)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.pat)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.safeties)}</td>
                <td className={cn(td, 'text-right text-[var(--muted)]')}>{fmtVal(r.games_played)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TouchdownsCard({ rows, expanded, onToggle }: { rows: StatRow[]; expanded: boolean; onToggle: () => void }) {
  const visible = expanded ? rows : rows.slice(0, 2)
  const td = 'px-3 py-2 text-sm border-b border-[var(--border)]'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
        <span className="text-sm font-semibold text-[var(--txt)]">Touchdowns</span>
        <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              {['Season','TOT','Rush','Rec','FR','IR','PR','KOR','TD/G'].map(h => (
                <th key={h} className={cn('px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]', h === 'Season' ? 'text-left' : 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(td, 'text-[var(--txt)] font-medium')}>{r.season}</td>
                <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.total_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.recv_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.fumble_return_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.int_return_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.punt_return_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.kickoff_return_tds)}</td>
                <td className={cn(td, 'text-right text-[var(--muted)]')}>{fmtVal(r.tds_per_game)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TotalYardsCard({ rows, expanded, onToggle }: { rows: StatRow[]; expanded: boolean; onToggle: () => void }) {
  const visible = expanded ? rows : rows.slice(0, 2)
  const td = 'px-3 py-2 text-sm border-b border-[var(--border)]'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <button onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
        <span className="text-sm font-semibold text-[var(--txt)]">Total Yards</span>
        <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-[var(--surface)]">
              {['Season','TOT YDS','YDS/G','Pass','Rush','Rec','GP'].map(h => (
                <th key={h} className={cn('px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] border-b border-[var(--border)]', h === 'Season' ? 'text-left' : 'text-right')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="hover:bg-[var(--inp-bg)] transition-colors">
                <td className={cn(td, 'text-[var(--txt)] font-medium')}>{r.season}</td>
                <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>{fmtVal(r.total_yards)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.yards_per_game)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.pass_yards)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.rush_yards)}</td>
                <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtVal(r.recv_yards)}</td>
                <td className={cn(td, 'text-right text-[var(--muted)]')}>{fmtVal(r.games_played)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PlayerShell({
  player,
  stats,
  school,
  prevSlug,
  nextSlug,
}: {
  player: PlayerRow
  stats: StatRow[]
  school: SchoolInfo | null
  prevSlug: string
  nextSlug: string
}) {
  const [chartsOpen, setChartsOpen] = useState(false)
  const [mapsOpen,   setMapsOpen]   = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [passExpanded,   setPassExpanded]   = useState(true)
  const [rushExpanded,   setRushExpanded]   = useState(true)
  const [recvExpanded,   setRecvExpanded]   = useState(true)
  const [scoreExpanded,  setScoreExpanded]  = useState(true)
  const [tdExpanded,     setTdExpanded]     = useState(true)
  const [yardsExpanded,  setYardsExpanded]  = useState(true)

  const passingRows    = stats.filter(s => s.stat_type === 'Passing')
  const rushingRows    = stats.filter(s => s.stat_type === 'Rushing')
  const receivingRows  = stats.filter(s => s.stat_type === 'Receiving')
  const scoringRows    = stats.filter(s => s.stat_type === 'Scoring')
  const tdRows         = stats.filter(s => s.stat_type === 'Touchdowns')
  const totalYardRows  = stats.filter(s => s.stat_type === 'Total Yards')

  const { yards, label, season: bestSeason } = getBestYards(stats)

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'

  return (
    <>
      <AppLayout>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 py-8">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[var(--txt)]">{player.name}</h1>
                  {player.position && (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                      style={{ background: ACCENT_COLOR }}>{player.position}</span>
                  )}
                </div>
                {school && (
                  <p className="text-sm text-[var(--muted)]">
                    {school.name} · Division {school.division} · Section XI
                  </p>
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

            {/* Hero stat card */}
            {yards > 0 && (
              <div className="mb-8 rounded-2xl overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR} 0%, #0a52c7 100%)` }}>
                <div className="px-6 py-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-1">Best Season · {bestSeason}</p>
                    <p className="text-4xl font-black text-white">{yards.toLocaleString()}</p>
                    <p className="text-sm text-white/80 mt-1">{label}</p>
                  </div>
                  {(() => {
                    const photo = PLAYER_PHOTOS[player.slug]
                    const logo  = player.school_slug ? SCHOOL_LOGOS[player.school_slug] : null
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
                        {s.season} {s.stat_type} · Season Summary
                      </p>
                      <p className="text-sm text-[var(--txt)] leading-relaxed">{s.ai_summary}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Career Stats */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[var(--txt)] mb-4">Career Stats</h2>
              <div className="flex flex-col gap-4">
                {passingRows.length > 0 && (
                  <PassingCard rows={passingRows} expanded={passExpanded} onToggle={() => setPassExpanded(v => !v)} />
                )}
                {rushingRows.length > 0 && (
                  <RushingCard rows={rushingRows} expanded={rushExpanded} onToggle={() => setRushExpanded(v => !v)} />
                )}
                {receivingRows.length > 0 && (
                  <ReceivingCard rows={receivingRows} expanded={recvExpanded} onToggle={() => setRecvExpanded(v => !v)} />
                )}
                {totalYardRows.length > 0 && (
                  <TotalYardsCard rows={totalYardRows} expanded={yardsExpanded} onToggle={() => setYardsExpanded(v => !v)} />
                )}
                {tdRows.length > 0 && (
                  <TouchdownsCard rows={tdRows} expanded={tdExpanded} onToggle={() => setTdExpanded(v => !v)} />
                )}
                {scoringRows.length > 0 && (
                  <ScoringCard rows={scoringRows} expanded={scoreExpanded} onToggle={() => setScoreExpanded(v => !v)} />
                )}
                {stats.length === 0 && (
                  <div className="rounded-xl border border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                    No stats available for this player.
                  </div>
                )}
              </div>
            </div>

            {/* School card */}
            {school && player.school_slug && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[var(--txt)] mb-4">School</h2>
                <Link href={`/school/${player.school_slug}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                  <div>
                    <p className="text-sm font-bold text-[var(--txt)]">{school.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">Division {school.division} · Section XI</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                </Link>
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
