'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChartSpline, Map, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

function fmtPct(w: number | null, l: number | null): string {
  const wins   = w ?? 0
  const losses = l ?? 0
  const g = wins + losses
  return g === 0 ? '—' : (wins / g).toFixed(3).replace(/^0/, '')
}

function fmtRecord(w: number | null, l: number | null, ties?: number | null): string {
  if (w == null && l == null) return '—'
  const t = ties ?? 0
  return t > 0 ? `${w ?? 0}–${l ?? 0}–${t}` : `${w ?? 0}–${l ?? 0}`
}

function topStat(row: Record<string, unknown>): { label: string; value: string } {
  const stat = row.stat_type as string
  if (stat === 'Passing') return { label: 'Pass Yds', value: String(row.pass_yards ?? 0) }
  if (stat === 'Rushing') return { label: 'Rush Yds', value: String(row.rush_yards ?? 0) }
  return { label: 'Recv Yds', value: String(row.recv_yards ?? 0) }
}

export function TeamShell({
  team, prevSlug, nextSlug, seasonRows, divTeams, playerRows,
}: {
  team: Record<string, unknown>
  prevSlug: string
  nextSlug: string
  seasonRows: Record<string, unknown>[]
  divTeams: Record<string, unknown>[]
  playerRows: Record<string, unknown>[]
}) {
  const [profileIdx, setProfileIdx]   = useState(0)
  const [infoExpanded, setInfoExpanded] = useState(false)
  const [chartsOpen, setChartsOpen]   = useState(false)
  const [mapsOpen,   setMapsOpen]     = useState(false)
  const [chatOpen,   setChatOpen]     = useState(false)
  const playersRef  = useRef<HTMLDivElement>(null)
  const divRef      = useRef<HTMLDivElement>(null)

  const teamName = team.name as string
  const division = team.division as string
  const section  = team.section as string
  const level    = team.level as string | undefined
  const gender   = team.gender as string | undefined
  const schoolSlug = team.school_slug as string

  // Build season history rows
  const historyRows = seasonRows.map(s => ({
    season: String(s.season),
    overall: fmtRecord(s.overall_wins as number | null, s.overall_losses as number | null, s.overall_ties as number | null),
    conf: fmtRecord(s.conference_wins as number | null, s.conference_losses as number | null, s.conference_ties as number | null),
  }))

  const PROFILES = [
    { title: 'Season History' },
    {
      title: 'Team Info',
      rows: [
        { label: 'School',   value: schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), highlight: false },
        { label: 'Division', value: `Division ${division}`,        highlight: false },
        { label: 'Section',  value: `Section ${section}`,          highlight: false },
        ...(level   ? [{ label: 'Level',  value: level,  highlight: false }] : []),
        ...(gender  ? [{ label: 'Gender', value: gender, highlight: false }] : []),
      ],
    },
  ]

  const activeProfile = PROFILES[profileIdx]
  const visibleInfoRows = infoExpanded
    ? (activeProfile as { rows?: { label: string; value: string; highlight: boolean }[] }).rows ?? []
    : ((activeProfile as { rows?: { label: string; value: string; highlight: boolean }[] }).rows ?? []).slice(0, 2)

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const roundBtn = 'inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors'
  const td = 'px-4 py-2.5 border-b border-[var(--border)] text-sm'

  return (
    <>
      <AppLayout>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 py-8">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-[var(--txt)]">{teamName}</h1>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/team/${prevSlug}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
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
                    <Link href={`/team/${nextSlug}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="mb-8 h-64 sm:h-80 w-full rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg,#e8f4fb 0%,#d0eaf7 100%)' }}>
              <Map className="h-12 w-12 text-[var(--muted)]" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--txt2)]">{teamName} · Section XI Division {division}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">School Map · Coming Soon</p>
              </div>
            </div>

            {/* Profiles */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Profiles</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setProfileIdx(i => (i - 1 + PROFILES.length) % PROFILES.length); setInfoExpanded(false) }} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => { setProfileIdx(i => (i + 1) % PROFILES.length); setInfoExpanded(false) }} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                <button onClick={() => setInfoExpanded(v => !v)}
                  className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors">
                  <span className="text-sm font-semibold text-[var(--txt)]">{activeProfile.title}</span>
                  <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', infoExpanded && 'rotate-180')} />
                </button>

                {/* Season History table */}
                {profileIdx === 0 && (
                  <>
                    {historyRows.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[var(--muted)] border-t border-[var(--border)]">No season data available.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-t border-[var(--border)] bg-[var(--surface)]">
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Season</th>
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Overall</th>
                            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Conf</th>
                            <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Win%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(infoExpanded ? historyRows : historyRows.slice(0, 3)).map(row => (
                            <tr key={row.season} className="border-t border-[var(--border)]">
                              <td className={td}>{row.season}</td>
                              <td className={cn(td, 'font-medium text-[var(--txt)]')}>{row.overall}</td>
                              <td className={cn(td, 'text-[var(--muted)]')}>{row.conf}</td>
                              <td className={cn(td, 'text-right font-bold')} style={{ color: ACCENT_COLOR }}>
                                {(() => {
                                  const s = seasonRows.find(s2 => String(s2.season) === row.season)
                                  return fmtPct(s?.overall_wins as number | null, s?.overall_losses as number | null)
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}

                {/* Team Info rows */}
                {profileIdx === 1 && visibleInfoRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
                    <span className="text-sm text-[var(--muted)]">{row.label}</span>
                    <span className={cn('text-sm text-right font-medium', row.highlight ? 'font-bold' : 'text-[var(--txt)]')}
                      style={row.highlight ? { color: ACCENT_COLOR } : undefined}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Players carousel */}
            {playerRows.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--txt)]">Top Players</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => playersRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => playersRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div ref={playersRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-1">
                    {playerRows.map((p, i) => {
                      const stat = topStat(p)
                      return (
                        <Link key={`${p.player_slug}-${p.stat_type}-${i}`}
                          href={`/player/${p.player_slug}`}
                          className="shrink-0 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                          <p className="text-sm font-bold text-[var(--txt)] leading-snug truncate">{p.player_name as string}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{p.stat_type as string}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>{stat.value}</span>
                            <span className="text-xs text-[var(--muted)]">{stat.label}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Division Standings carousel */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--txt)]">Division {division} Standings</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => divRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className={roundBtn}><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => divRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className={roundBtn}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
              <div ref={divRef} className="overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-1">
                  {divTeams.map(t => (
                    <Link key={t.slug as string} href={`/team/${t.slug}`}
                      className="shrink-0 w-52 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                      <p className="text-sm font-bold text-[var(--txt)] leading-snug">{t.name as string}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: ACCENT_COLOR }}>
                          {fmtRecord(t.overall_wins as number | null, t.overall_losses as number | null)}
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          {fmtPct(t.overall_wins as number | null, t.overall_losses as number | null)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={teamName} />
    </>
  )
}
