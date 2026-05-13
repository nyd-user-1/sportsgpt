'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

type Passer = {
  player_slug: string
  player_name: string
  school_name: string
  completions: number | null
  attempts: number | null
  pass_yards: number | null
  pass_tds: number | null
  interceptions: number | null
  season: number
}

type Rusher = {
  player_slug: string
  player_name: string
  school_name: string
  rush_attempts: number | null
  rush_yards: number | null
  rush_tds: number | null
  season: number
}

type Receiver = {
  player_slug: string
  player_name: string
  school_name: string
  receptions: number | null
  recv_yards: number | null
  recv_tds: number | null
  season: number
}

type Tab = 'Passing' | 'Rushing' | 'Receiving'

export default function PlayerTable({
  passers,
  rushers,
  receivers,
}: {
  passers: Passer[]
  rushers: Rusher[]
  receivers: Receiver[]
}) {
  const [tab, setTab] = useState<Tab>('Passing')

  const td  = 'px-4 py-2.5 border-b border-[var(--border)] text-sm'
  const th  = 'px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap text-left'
  const thR = th + ' text-right'
  const tdR = td + ' text-right text-[var(--txt)]'

  const tabs: Tab[] = ['Passing', 'Rushing', 'Receiving']

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Tab bar */}
        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-0 border-b border-[var(--border)]">
          <div className="flex gap-0">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
                  tab === t
                    ? 'border-b-2 text-[var(--txt)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]',
                )}
                style={tab === t ? { borderBottomColor: ACCENT_COLOR } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tables */}
        <div className="flex-1 min-h-0 overflow-hidden px-5 pt-4 pb-5">
          <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)]">

            {tab === 'Passing' && (
              <table className="text-sm whitespace-nowrap w-full" style={{ borderSpacing: 0 }}>
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className={cn(th, 'sticky left-0 z-30 min-w-[40px]')}>#</th>
                    <th className={cn(th, 'sticky left-[40px] z-30 min-w-[180px]')}>Player</th>
                    <th className={th}>School</th>
                    <th className={thR}>YDS</th>
                    <th className={thR}>TD</th>
                    <th className={thR}>INT</th>
                    <th className={thR}>COMP</th>
                    <th className={thR}>ATT</th>
                    <th className={thR}>COMP%</th>
                  </tr>
                </thead>
                <tbody>
                  {passers.map((p, i) => {
                    const compPct = (p.attempts && p.completions != null && p.attempts > 0)
                      ? ((p.completions / p.attempts) * 100).toFixed(1) + '%'
                      : '—'
                    return (
                      <tr key={p.player_slug + i} className="group hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                        <td className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                        <td className={cn(td, 'sticky left-[40px] z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] font-semibold text-[var(--txt)] transition-colors')}>
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
                  {passers.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No passing data available</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {tab === 'Rushing' && (
              <table className="text-sm whitespace-nowrap w-full" style={{ borderSpacing: 0 }}>
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className={cn(th, 'sticky left-0 z-30 min-w-[40px]')}>#</th>
                    <th className={cn(th, 'sticky left-[40px] z-30 min-w-[180px]')}>Player</th>
                    <th className={th}>School</th>
                    <th className={thR}>YDS</th>
                    <th className={thR}>TD</th>
                    <th className={thR}>ATT</th>
                    <th className={thR}>YPC</th>
                  </tr>
                </thead>
                <tbody>
                  {rushers.map((p, i) => {
                    const ypc = (p.rush_attempts && p.rush_yards != null && p.rush_attempts > 0)
                      ? (p.rush_yards / p.rush_attempts).toFixed(1)
                      : '—'
                    return (
                      <tr key={p.player_slug + i} className="group hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                        <td className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                        <td className={cn(td, 'sticky left-[40px] z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] font-semibold text-[var(--txt)] transition-colors')}>
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
                  {rushers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No rushing data available</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {tab === 'Receiving' && (
              <table className="text-sm whitespace-nowrap w-full" style={{ borderSpacing: 0 }}>
                <thead className="sticky top-0 z-20">
                  <tr>
                    <th className={cn(th, 'sticky left-0 z-30 min-w-[40px]')}>#</th>
                    <th className={cn(th, 'sticky left-[40px] z-30 min-w-[180px]')}>Player</th>
                    <th className={th}>School</th>
                    <th className={thR}>YDS</th>
                    <th className={thR}>TD</th>
                    <th className={thR}>REC</th>
                    <th className={thR}>YPR</th>
                  </tr>
                </thead>
                <tbody>
                  {receivers.map((p, i) => {
                    const ypr = (p.receptions && p.recv_yards != null && p.receptions > 0)
                      ? (p.recv_yards / p.receptions).toFixed(1)
                      : '—'
                    return (
                      <tr key={p.player_slug + i} className="group hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                        <td className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                        <td className={cn(td, 'sticky left-[40px] z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] font-semibold text-[var(--txt)] transition-colors')}>
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
                  {receivers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No receiving data available</td></tr>
                  )}
                </tbody>
              </table>
            )}

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
