'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import { DIVISION_LOGOS, SCHOOL_LOGOS } from '@/lib/team-images'
import type { TeamIndexRow } from './page'

const DIV_NUM: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 }

function pct(w: number | null, l: number | null): number {
  const wins = w ?? 0
  const losses = l ?? 0
  const g = wins + losses
  return g === 0 ? 0 : wins / g
}

function fmtPct(w: number | null, l: number | null): string {
  const wins = w ?? 0
  const losses = l ?? 0
  const g = wins + losses
  if (g === 0) return '—'
  return (wins / g).toFixed(3).replace(/^0/, '')
}

function fmtRecord(w: number | null, l: number | null): string {
  if (w == null && l == null) return '—'
  return `${w ?? 0}–${l ?? 0}`
}

const DIVISION_TABS = ['All', 'Div I', 'Div II', 'Div III', 'Div IV']
const DIV_MAP: Record<string, string> = {
  'Div I': 'I', 'Div II': 'II', 'Div III': 'III', 'Div IV': 'IV',
}

type SortCol = 'name' | 'division' | 'wins' | 'losses' | 'pct' | 'conf' | 'gp' | 'ties' | 'pf' | 'pa' | 'diff'

export default function TeamTable({ teams }: { teams: TeamIndexRow[] }) {
  const [activeDiv, setActiveDiv] = useState('All')
  const [sortCol, setSortCol] = useState<SortCol>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else {
      setSortCol(col)
      setSortDir(col === 'name' || col === 'division' ? 'asc' : 'desc')
    }
  }

  const filtered = useMemo(() => {
    if (activeDiv === 'All') return teams
    const divVal = DIV_MAP[activeDiv]
    return teams.filter(t => t.division === divVal)
  }, [teams, activeDiv])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string
    switch (sortCol) {
      case 'name':     av = a.name;     bv = b.name;     break
      case 'division': av = a.division; bv = b.division; break
      case 'wins':     av = a.overall_wins ?? -1;  bv = b.overall_wins ?? -1;  break
      case 'losses':   av = a.overall_losses ?? -1; bv = b.overall_losses ?? -1; break
      case 'ties':     av = a.overall_ties ?? -1;   bv = b.overall_ties ?? -1;   break
      case 'pct':      av = pct(a.overall_wins, a.overall_losses); bv = pct(b.overall_wins, b.overall_losses); break
      case 'conf':     av = a.conference_wins ?? -1; bv = b.conference_wins ?? -1; break
      case 'gp':       av = a.games_played ?? -1;   bv = b.games_played ?? -1;   break
      case 'pf':       av = a.points_for ?? -1;     bv = b.points_for ?? -1;     break
      case 'pa':       av = a.points_against ?? -1; bv = b.points_against ?? -1; break
      case 'diff':     av = (a.points_for ?? 0) - (a.points_against ?? 0); bv = (b.points_for ?? 0) - (b.points_against ?? 0); break
      default:         av = 0; bv = 0
    }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [filtered, sortCol, sortDir])

  const td = 'px-4 py-2.5 border-b border-[var(--border)]'

  function Th({ col, label, sticky }: { col: SortCol; label: string; sticky?: boolean }) {
    return (
      <th onClick={() => handleSort(col)}
        className={cn('px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] whitespace-nowrap cursor-pointer select-none text-left', sticky && 'sticky left-2 z-30 min-w-[200px]')}>
        <button className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5', sortCol === col ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>
          {label}
          {sortCol === col
            ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
            : <ChevronUp className="h-3 w-3 opacity-0" />}
        </button>
      </th>
    )
  }

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Division filter tabs */}
        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-0 flex items-center gap-0 border-b border-[var(--border)]">
          {DIVISION_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveDiv(tab)}
              className={cn(
                'px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                activeDiv === tab
                  ? 'border-[var(--accent,#033882)] text-[var(--txt)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
              )}
              style={activeDiv === tab ? { borderColor: ACCENT_COLOR } : undefined}
            >
              {tab}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-xs text-[var(--muted)] pb-2">{sorted.length} teams</span>
        </div>

        <div className="px-5 pb-5 flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)] mt-4 px-2">
            <table className="text-sm whitespace-nowrap border-separate" style={{ minWidth: '700px', width: '100%', borderSpacing: 0 }}>
              <thead className="sticky top-0 z-20 bg-[var(--surface)]">
                <tr>
                  <Th col="name" label="Team" sticky />
                  <Th col="division" label="Div" />
                  <Th col="gp" label="GP" />
                  <Th col="wins" label="W" />
                  <Th col="losses" label="L" />
                  <Th col="ties" label="T" />
                  <Th col="pct" label="PCT" />
                  <Th col="conf" label="Conf" />
                  <Th col="pf" label="PF" />
                  <Th col="pa" label="PA" />
                  <Th col="diff" label="DIFF" />
                </tr>
              </thead>
              <tbody>
                {sorted.map(t => (
                  <tr key={t.slug} className="group/row cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                    <td style={{ willChange: 'transform' }} className={cn(td, 'sticky left-2 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold text-[var(--txt)] transition-colors max-w-[200px]')}>
                      <Link href={`/team/${t.slug}`} className="hover:underline flex items-center gap-2 min-w-0">
                        {(() => { const logo = SCHOOL_LOGOS[t.slug.replace('-varsity-football', '')]; return logo ? <Image src={logo} alt="" width={20} height={20} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized /> : null })()}
                        <span className="truncate">{t.name}</span>
                      </Link>
                    </td>
                    <td className={cn(td, 'text-[var(--muted)]')}>
                      <div className="flex items-center gap-2">
                        {DIVISION_LOGOS[DIV_NUM[t.division]] && (
                          <Image src={DIVISION_LOGOS[DIV_NUM[t.division]]} alt="" width={20} height={20} className="shrink-0 object-contain" unoptimized />
                        )}
                        <span>Division {t.division}</span>
                      </div>
                    </td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{t.games_played ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--txt)] font-medium')}>{t.overall_wins ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{t.overall_losses ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{t.overall_ties ?? 0}</td>
                    <td className={cn(td, 'text-[var(--txt)]')}>{fmtPct(t.overall_wins, t.overall_losses)}</td>
                    <td className={cn(td, 'text-[var(--txt)]')}>{fmtRecord(t.conference_wins, t.conference_losses)}</td>
                    <td className={cn(td, 'text-[var(--txt)]')}>{t.points_for ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{t.points_against ?? '—'}</td>
                    <td className={cn(td, 'font-semibold', (t.points_for ?? 0) >= (t.points_against ?? 0) ? 'text-green-600' : 'text-red-500')}>
                      {t.points_for != null && t.points_against != null
                        ? `${(t.points_for - t.points_against) >= 0 ? '+' : ''}${t.points_for - t.points_against}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
