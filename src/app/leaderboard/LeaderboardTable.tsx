'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Check } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

const SEASONS = [2024, 2023, 2022]

function SeasonFilterMenu({ selected, onChange }: { selected: number | null; onChange: (v: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'relative rounded-lg p-1.5 transition-colors',
          open || selected !== null
            ? 'bg-[var(--inp-bg)] text-[var(--txt)]'
            : 'text-[var(--muted)] hover:text-[var(--txt)]'
        )}
      >
        <Plus className="h-5 w-5" />
        {selected !== null && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white leading-none"
            style={{ background: ACCENT_COLOR }}>1</span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Season</span>
            {selected !== null && (
              <button onClick={() => { onChange(null); setOpen(false) }} className="text-[10px] hover:underline" style={{ color: ACCENT_COLOR }}>Clear</button>
            )}
          </div>
          {SEASONS.map((s, i) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[var(--inp-bg)]',
                i > 0 && 'border-t border-[var(--border)]'
              )}>
              <span className="font-semibold text-[var(--txt)]">{s}</span>
              {selected === s && <Check className="h-4 w-4" style={{ color: ACCENT_COLOR }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type Passer = {
  player_slug: string; player_name: string; school_name: string
  completions: number | null; attempts: number | null
  pass_yards: number | null; pass_tds: number | null
  interceptions: number | null; season: number
}
type Rusher = {
  player_slug: string; player_name: string; school_name: string
  rush_attempts: number | null; rush_yards: number | null
  rush_tds: number | null; season: number
}
type Receiver = {
  player_slug: string; player_name: string; school_name: string
  receptions: number | null; recv_yards: number | null
  recv_tds: number | null; season: number
}
type StatTab = 'Passing' | 'Rushing' | 'Receiving'

export default function LeaderboardTable({
  passers, rushers, receivers,
}: {
  passers: Passer[]; rushers: Rusher[]; receivers: Receiver[]
}) {
  const [statTab, setStatTab] = useState<StatTab>('Passing')
  const [season, setSeason]   = useState<number | null>(null)

  const td  = 'px-4 py-2.5 border-b border-[var(--border)] text-sm'
  const th  = 'px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap text-left'
  const thR = th + ' text-right'
  const tdR = td + ' text-right text-[var(--txt)]'

  const statTabs: StatTab[] = ['Passing', 'Rushing', 'Receiving']

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Stat type tabs + season filter */}
        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-0 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            {statTabs.map(t => (
              <button key={t} onClick={() => setStatTab(t)}
                className={cn(
                  'px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
                  statTab === t ? 'text-[var(--txt)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]',
                )}
                style={statTab === t ? { borderBottomColor: ACCENT_COLOR } : undefined}>
                {t}
              </button>
            ))}
            <div className="pb-1">
              <SeasonFilterMenu selected={season} onChange={setSeason} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-hidden px-5 pt-4 pb-5">
          <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)] px-2">

            {statTab === 'Passing' && (() => {
              const rows = season ? passers.filter(p => p.season === season) : passers
              return (
                <table className="text-sm whitespace-nowrap w-full border-separate" style={{ borderSpacing: 0 }}>
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th className={cn(th, 'sticky left-2 z-30 min-w-[40px]')}>#</th>
                      <th className={cn(th, 'sticky left-[48px] z-30 min-w-[180px]')}>Player</th>
                      <th className={th}>Team</th>
                      <th className={thR}>YDS</th>
                      <th className={thR}>TD</th>
                      <th className={thR}>INT</th>
                      <th className={thR}>COMP</th>
                      <th className={thR}>ATT</th>
                      <th className={thR}>COMP%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, i) => {
                      const compPct = (p.attempts && p.completions != null && p.attempts > 0)
                        ? ((p.completions / p.attempts) * 100).toFixed(1) + '%' : '—'
                      return (
                        <tr key={p.player_slug + i} className="group/row hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                          <td className={cn(td, 'sticky left-2 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                          <td className={cn(td, 'sticky left-[48px] z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold transition-colors')}>
                            <Link href={`/player/${p.player_slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{p.player_name}</Link>
                          </td>
                          <td className={cn(td, 'text-[var(--muted)]')}>{p.school_name}</td>
                          <td className={tdR + ' font-bold'} style={{ color: ACCENT_COLOR }}>{p.pass_yards ?? '—'}</td>
                          <td className={tdR}>{p.pass_tds ?? '—'}</td>
                          <td className={tdR}>{p.interceptions ?? '—'}</td>
                          <td className={tdR}>{p.completions ?? '—'}</td>
                          <td className={tdR}>{p.attempts ?? '—'}</td>
                          <td className={tdR}>{compPct}</td>
                        </tr>
                      )
                    })}
                    {rows.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No passing data{season ? ` for ${season}` : ''}</td></tr>
                    )}
                  </tbody>
                </table>
              )
            })()}

            {statTab === 'Rushing' && (() => {
              const rows = season ? rushers.filter(p => p.season === season) : rushers
              return (
                <table className="text-sm whitespace-nowrap w-full border-separate" style={{ borderSpacing: 0 }}>
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th className={cn(th, 'sticky left-2 z-30 min-w-[40px]')}>#</th>
                      <th className={cn(th, 'sticky left-[48px] z-30 min-w-[180px]')}>Player</th>
                      <th className={th}>Team</th>
                      <th className={thR}>YDS</th>
                      <th className={thR}>TD</th>
                      <th className={thR}>ATT</th>
                      <th className={thR}>YPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, i) => {
                      const ypc = (p.rush_attempts && p.rush_yards != null && p.rush_attempts > 0)
                        ? (p.rush_yards / p.rush_attempts).toFixed(1) : '—'
                      return (
                        <tr key={p.player_slug + i} className="group/row hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                          <td className={cn(td, 'sticky left-2 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                          <td className={cn(td, 'sticky left-[48px] z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold transition-colors')}>
                            <Link href={`/player/${p.player_slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{p.player_name}</Link>
                          </td>
                          <td className={cn(td, 'text-[var(--muted)]')}>{p.school_name}</td>
                          <td className={tdR + ' font-bold'} style={{ color: ACCENT_COLOR }}>{p.rush_yards ?? '—'}</td>
                          <td className={tdR}>{p.rush_tds ?? '—'}</td>
                          <td className={tdR}>{p.rush_attempts ?? '—'}</td>
                          <td className={tdR}>{ypc}</td>
                        </tr>
                      )
                    })}
                    {rows.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No rushing data{season ? ` for ${season}` : ''}</td></tr>
                    )}
                  </tbody>
                </table>
              )
            })()}

            {statTab === 'Receiving' && (() => {
              const rows = season ? receivers.filter(p => p.season === season) : receivers
              return (
                <table className="text-sm whitespace-nowrap w-full border-separate" style={{ borderSpacing: 0 }}>
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <th className={cn(th, 'sticky left-2 z-30 min-w-[40px]')}>#</th>
                      <th className={cn(th, 'sticky left-[48px] z-30 min-w-[180px]')}>Player</th>
                      <th className={th}>Team</th>
                      <th className={thR}>YDS</th>
                      <th className={thR}>TD</th>
                      <th className={thR}>REC</th>
                      <th className={thR}>YPR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p, i) => {
                      const ypr = (p.receptions && p.recv_yards != null && p.receptions > 0)
                        ? (p.recv_yards / p.receptions).toFixed(1) : '—'
                      return (
                        <tr key={p.player_slug + i} className="group/row hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                          <td className={cn(td, 'sticky left-2 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                          <td className={cn(td, 'sticky left-[48px] z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold transition-colors')}>
                            <Link href={`/player/${p.player_slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{p.player_name}</Link>
                          </td>
                          <td className={cn(td, 'text-[var(--muted)]')}>{p.school_name}</td>
                          <td className={tdR + ' font-bold'} style={{ color: ACCENT_COLOR }}>{p.recv_yards ?? '—'}</td>
                          <td className={tdR}>{p.recv_tds ?? '—'}</td>
                          <td className={tdR}>{p.receptions ?? '—'}</td>
                          <td className={tdR}>{ypr}</td>
                        </tr>
                      )
                    })}
                    {rows.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No receiving data{season ? ` for ${season}` : ''}</td></tr>
                    )}
                  </tbody>
                </table>
              )
            })()}

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
