'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import type { SchoolIndexRow } from './page'

const DIVISION_TABS = ['All', 'Div I', 'Div II', 'Div III', 'Div IV']
const DIV_MAP: Record<string, string> = {
  'Div I': 'I', 'Div II': 'II', 'Div III': 'III', 'Div IV': 'IV',
}

function fmtPct(w: number, l: number): string {
  const g = w + l
  if (g === 0) return '—'
  return (w / g).toFixed(3).replace(/^0/, '')
}

type SortCol = 'name' | 'division' | 'enrollment' | 'wins' | 'losses'

export default function SchoolTable({ schools }: { schools: SchoolIndexRow[] }) {
  const [activeDiv, setActiveDiv] = useState('All')
  const [sortCol, setSortCol]     = useState<SortCol>('name')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else {
      setSortCol(col)
      setSortDir(col === 'name' || col === 'division' ? 'asc' : 'desc')
    }
  }

  const filtered = useMemo(() => {
    if (activeDiv === 'All') return schools
    const divVal = DIV_MAP[activeDiv]
    return schools.filter(s => s.division === divVal)
  }, [schools, activeDiv])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string
    switch (sortCol) {
      case 'name':       av = a.name;       bv = b.name;       break
      case 'division':   av = a.division;   bv = b.division;   break
      case 'enrollment': av = a.enrollment ?? 0; bv = b.enrollment ?? 0; break
      case 'wins':       av = a.wins_2024;  bv = b.wins_2024;  break
      case 'losses':     av = a.losses_2024; bv = b.losses_2024; break
      default:           av = 0; bv = 0
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
                  ? 'text-[var(--txt)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
              )}
              style={activeDiv === tab ? { borderColor: ACCENT_COLOR, borderBottomWidth: '2px' } : undefined}
            >
              {tab}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-xs text-[var(--muted)] pb-2">{sorted.length} schools</span>
        </div>

        <div className="px-5 pb-5 flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)] mt-4 px-2">
            <table className="text-sm whitespace-nowrap border-separate" style={{ minWidth: '700px', width: '100%', borderSpacing: 0 }}>
              <thead className="sticky top-0 z-20 bg-[var(--surface)]">
                <tr>
                  <Th col="name" label="School" sticky />
                  <Th col="division" label="Div" />
                  <Th col="enrollment" label="Enrollment" />
                  <Th col="wins" label="2024 W" />
                  <Th col="losses" label="2024 L" />
                  <th className="px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] whitespace-nowrap text-left">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Win%</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.slug} className="group cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                    <td style={{ willChange: 'transform' }} className={cn(td, 'sticky left-2 z-[1] bg-[var(--surface)] group-hover:bg-[var(--inp-bg)] group-hover:rounded-l-md font-semibold text-[var(--txt)] transition-colors max-w-[200px] truncate')}>
                      <Link href={`/school/${s.slug}`} className="hover:underline">{s.name}</Link>
                    </td>
                    <td className={cn(td, 'text-[var(--muted)]')}>Div. {s.division}</td>
                    <td className={cn(td, 'text-[var(--txt)]')}>{s.enrollment != null ? s.enrollment.toLocaleString() : '—'}</td>
                    <td className={cn(td, 'text-[var(--txt)] font-medium')}>{s.wins_2024}</td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{s.losses_2024}</td>
                    <td className={cn(td, 'text-[var(--txt)] group-hover:rounded-r-md')}>{fmtPct(s.wins_2024, s.losses_2024)}</td>
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
