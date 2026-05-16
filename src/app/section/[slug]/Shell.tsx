'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChartSpline, Map, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import Image from 'next/image'
import { cn, formatSeason } from '@/lib/utils'
import { ACCENT_COLOR, CURRENT_SEASON } from '@/lib/app-config'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'

type DivisionSummary = {
  division: string
  team_count: number
  avg_win_pct: number | null
}

type RecentChamp = {
  season: number
  division: string
  team_slug: string
  team_name: string
  overall_wins: number | null
  overall_losses: number | null
}

type TeamRow = {
  slug: string
  name: string
  division: string
  overall_wins: number | null
  overall_losses: number | null
}

const DIV_LABELS: Record<string, string> = {
  I: 'Division I', II: 'Division II', III: 'Division III', IV: 'Division IV',
}
const DIV_SLUGS: Record<string, string> = {
  I: 'division-i', II: 'division-ii', III: 'division-iii', IV: 'division-iv',
}
const DIV_ORDER = ['I', 'II', 'III', 'IV']

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0; const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

function fmtPctFromFloat(v: number | null) {
  if (v == null) return '—'
  return (v * 100).toFixed(1) + '%'
}

export function SectionShell({
  divisionSummary,
  recentChamps,
  allTeams,
}: {
  divisionSummary: DivisionSummary[]
  recentChamps: RecentChamp[]
  allTeams: TeamRow[]
}) {
  const [chartsOpen, setChartsOpen] = useState(false)
  const [mapsOpen,   setMapsOpen]   = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [activeDiv,  setActiveDiv]  = useState<string>('I')
  const [divCardIdx, setDivCardIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDivCardIdx(i => (i + 1) % DIV_ORDER.length), 4000)
    return () => clearInterval(t)
  }, [])

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const th     = 'px-3 py-3 bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap'
  const td     = 'px-3 py-2.5 text-sm border-b border-[var(--border)]'

  const filteredTeams = allTeams.filter(t => t.division === activeDiv)

  const DIV_PHOTOS: Record<string, string> = {
    I:   TEAM_PHOTOS['bay-shore']?.[0]             ?? '',
    II:  TEAM_PHOTOS['northport']?.[0]             ?? '',
    III: TEAM_PHOTOS['hauppauge']?.[0]             ?? '',
    IV:  TEAM_PHOTOS['shoreham-wading-river']?.[0] ?? '',
  }
  const DIV_SCHOOL: Record<string, string> = {
    I: 'bay-shore', II: 'northport', III: 'hauppauge', IV: 'shoreham-wading-river',
  }

  return (
    <>
      <AppLayout>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="mx-auto max-w-4xl px-5 py-8">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-[var(--txt)]">Section XI</h1>
                <p className="text-sm text-[var(--muted)] mt-0.5">Long Island Football · Suffolk County, NY</p>
              </div>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} rounded-l-full ${chartsOpen ? active : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setMapsOpen(v => !v)} className={`${btn} ${mapsOpen ? active : ''}`}><Map className="h-4 w-4" /></button>
                    <span className={tip}>Map</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChatOpen(v => !v)} className={`${btn} rounded-r-full ${chatOpen ? active : ''}`}><MessageCircle className="h-4 w-4" /></button>
                    <span className={tip}>Ask SportsGPT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Division slider */}
            <div className="mb-8">
              <div className="relative rounded-2xl overflow-hidden w-full" style={{ height: 420 }}>

                {/* Image layers — all stacked, fade in/out */}
                {DIV_ORDER.map((div, i) => {
                  const summary = divisionSummary.find(d => d.division === div)
                  const photo   = DIV_PHOTOS[div]
                  return (
                    <div key={div}
                      className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                      style={{ opacity: i === divCardIdx ? 1 : 0 }}>
                      {photo && <Image src={photo} alt="" fill className="object-cover" unoptimized />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-5 pointer-events-none">
                        <p className="text-base font-bold text-white leading-snug">Division {div}</p>
                        <p className="text-sm text-white/80 mt-0.5">{summary?.team_count ?? 0} teams</p>
                        {summary?.avg_win_pct != null && (
                          <p className="text-xs text-white/60">{fmtPctFromFloat(summary.avg_win_pct)} avg win%</p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Clickable link for active slide */}
                <Link href={`/division/${DIV_SLUGS[DIV_ORDER[divCardIdx]]}`}
                  className="absolute inset-0 z-10" />

                {/* Liquid dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {DIV_ORDER.map((_, i) => (
                    <button key={i}
                      onClick={(e) => { e.preventDefault(); setDivCardIdx(i) }}
                      className="h-2 rounded-full bg-white transition-all duration-500 ease-in-out"
                      style={{ width: i === divCardIdx ? 28 : 8, opacity: i === divCardIdx ? 1 : 0.45 }}
                    />
                  ))}
                </div>

              </div>
            </div>

            {/* All teams standings with division tabs */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[var(--txt)] mb-4">{formatSeason(CURRENT_SEASON)} Standings</h2>

              {/* Division tab bar */}
              <div className="flex gap-0 border-b border-[var(--border)] mb-0">
                {DIV_ORDER.map(div => (
                  <button key={div} onClick={() => setActiveDiv(div)}
                    className={cn(
                      'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                      activeDiv === div
                        ? 'text-[var(--txt)]'
                        : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]',
                    )}
                    style={activeDiv === div ? { borderBottomColor: ACCENT_COLOR } : undefined}>
                    Div. {div}
                  </button>
                ))}
              </div>

              <div className="rounded-b-xl border border-t-0 border-[var(--border)] overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th className={cn(th, 'text-left sticky left-0 z-20 min-w-[32px]')}>#</th>
                        <th className={cn(th, 'text-left sticky left-[32px] z-20 min-w-[180px]')}>Team</th>
                        <th className={cn(th, 'text-right')}>W</th>
                        <th className={cn(th, 'text-right')}>L</th>
                        <th className={cn(th, 'text-right')}>PCT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeams.map((t, i) => (
                        <tr key={t.slug} className="group hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                          <td className={cn(td, 'text-[var(--muted)] sticky left-0 z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] transition-colors')}>{i + 1}</td>
                          <td className={cn(td, 'sticky left-[32px] z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] font-semibold transition-colors')}>
                            <Link href={`/team/${t.slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{t.name}</Link>
                          </td>
                          <td className={cn(td, 'text-right font-bold text-[var(--txt)]')}>{t.overall_wins ?? '—'}</td>
                          <td className={cn(td, 'text-right text-[var(--muted)]')}>{t.overall_losses ?? '—'}</td>
                          <td className={cn(td, 'text-right text-[var(--txt)]')}>{fmtPct(t.overall_wins, t.overall_losses)}</td>
                        </tr>
                      ))}
                      {filteredTeams.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No teams in this division</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Division Leaders */}
            {recentChamps.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[var(--txt)] mb-4">Recent Division Leaders</h2>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-sm whitespace-nowrap" style={{ borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <th className={cn(th, 'text-left')}>Season</th>
                          <th className={cn(th, 'text-left')}>Division</th>
                          <th className={cn(th, 'text-left')}>Team</th>
                          <th className={cn(th, 'text-right')}>Record</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentChamps.map((r, i) => (
                          <tr key={i} className="group hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                            <td className={cn(td, 'text-[var(--txt)] font-medium')}>{r.season}</td>
                            <td className={cn(td, 'text-[var(--muted)]')}>Div. {r.division}</td>
                            <td className={cn(td, 'font-semibold')}>
                              <Link href={`/team/${r.team_slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{r.team_name}</Link>
                            </td>
                            <td className={cn(td, 'text-right text-[var(--txt)]')}>
                              {r.overall_wins ?? '—'}–{r.overall_losses ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName="Section XI" />
    </>
  )
}
