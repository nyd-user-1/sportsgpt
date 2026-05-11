'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, List, LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(160deg,#1e40af 0%,#1e3a8a 100%)',
  'linear-gradient(160deg,#065f46 0%,#064e3b 100%)',
  'linear-gradient(160deg,#7c2d12 0%,#431407 100%)',
  'linear-gradient(160deg,#4c1d95 0%,#2e1065 100%)',
  'linear-gradient(160deg,#9f1239 0%,#881337 100%)',
  'linear-gradient(160deg,#0f766e 0%,#134e4a 100%)',
  'linear-gradient(160deg,#713f12 0%,#451a03 100%)',
  'linear-gradient(160deg,#1d4ed8 0%,#1e40af 100%)',
  'linear-gradient(160deg,#166534 0%,#14532d 100%)',
  'linear-gradient(160deg,#b91c1c 0%,#991b1b 100%)',
]

export type { TeamRow } from '@/lib/placeholder-data'
import type { TeamRow } from '@/lib/placeholder-data'

type SortCol = 'name' | 'school' | 'division' | 'city' | 'wins' | 'losses' | 'pct' | 'pf' | 'pa' | 'diff'

function pct(w: number, l: number) {
  const g = w + l
  return g === 0 ? 0 : w / g
}

function fmtPct(w: number, l: number) {
  return pct(w, l).toFixed(3).replace(/^0/, '')
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export default function TeamTable({ teams: initial, total: initialTotal }: { teams: TeamRow[]; total: number }) {
  const [view, setView]       = useState<'list' | 'grid'>('list')
  const [search, setSearch]   = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('wins')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'name' || col === 'school' || col === 'city' || col === 'division' ? 'asc' : 'desc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return initial.filter(t =>
      !q || t.name.toLowerCase().includes(q) || t.school.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) || t.division.toLowerCase().includes(q) || t.coach.toLowerCase().includes(q)
    )
  }, [initial, search])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string
    switch (sortCol) {
      case 'name':     av = a.name;           bv = b.name;           break
      case 'school':   av = a.school;         bv = b.school;         break
      case 'division': av = a.division;       bv = b.division;       break
      case 'city':     av = a.city;           bv = b.city;           break
      case 'wins':     av = a.wins;           bv = b.wins;           break
      case 'losses':   av = a.losses;         bv = b.losses;         break
      case 'pct':      av = pct(a.wins,a.losses); bv = pct(b.wins,b.losses); break
      case 'pf':       av = a.pf;             bv = b.pf;             break
      case 'pa':       av = a.pa;             bv = b.pa;             break
      case 'diff':     av = a.pf - a.pa;      bv = b.pf - b.pa;      break
    }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [filtered, sortCol, sortDir])

  const iconBtn  = 'h-8 w-8 flex items-center justify-center rounded-lg transition-colors'
  const activeBtn = 'bg-[var(--inp-bg)] text-[var(--txt)]'
  const mutedBtn  = 'text-[var(--muted)] hover:text-[var(--txt)]'
  const th = (col: SortCol, label: string, sticky = false) => (
    <th key={col}
      onClick={() => handleSort(col)}
      className={cn(
        'px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] whitespace-nowrap cursor-pointer select-none text-left',
        sticky && 'sticky left-0 z-30 min-w-[200px]',
      )}
    >
      <button className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 hover:text-[var(--txt)]',
        sortCol === col ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
      )}>
        {label}
        {sortCol === col
          ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          : <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-40" />}
      </button>
    </th>
  )
  const td = 'px-4 py-2.5 border-b border-[var(--border)]'

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-3 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--muted)] shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teams, schools, coaches..."
              className="flex-1 bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none"
            />
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setView('list')} className={cn(iconBtn, view === 'list' ? activeBtn : mutedBtn)}><List className="h-4 w-4" /></button>
            <button onClick={() => setView('grid')} className={cn(iconBtn, view === 'grid' ? activeBtn : mutedBtn)}><LayoutGrid className="h-4 w-4" /></button>
            <div className="flex-1" />
            <span className="text-xs text-[var(--muted)]">{sorted.length.toLocaleString()} of {initialTotal.toLocaleString()}</span>
          </div>
        </div>

        {view === 'list' && (
          <div className="px-5 pb-5 flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)]">
              <table className="text-sm whitespace-nowrap" style={{ minWidth: '1100px', width: '100%', borderSpacing: 0 }}>
                <thead className="sticky top-0 z-20 bg-[var(--surface)]">
                  <tr>
                    {th('name', 'Team', true)}
                    {th('division', 'Division')}
                    {th('city', 'City')}
                    {th('wins', 'W')}
                    {th('losses', 'L')}
                    {th('pct', 'PCT')}
                    {th('pf', 'PF')}
                    {th('pa', 'PA')}
                    {th('diff', '+/−')}
                    <th className="px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap text-left">Coach</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(t => {
                    const diff = t.pf - t.pa
                    return (
                      <tr key={t.id} className="group cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                        <td style={{ willChange: 'transform' }} className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover:bg-[var(--row-hover)] font-semibold text-[var(--txt)] transition-colors max-w-[200px] truncate')}>
                          <Link href={`/team/${toSlug(t.name)}`} className="hover:underline">{t.name}</Link>
                        </td>
                        <td className={cn(td, 'text-[var(--muted)]')}>Div. {t.division}</td>
                        <td className={cn(td, 'text-[var(--muted)]')}>{t.city}</td>
                        <td className={cn(td, 'text-[var(--txt)] font-medium')}>{t.wins}</td>
                        <td className={cn(td, 'text-[var(--muted)]')}>{t.losses}</td>
                        <td className={cn(td, 'text-[var(--txt)]')}>{fmtPct(t.wins, t.losses)}</td>
                        <td className={cn(td, 'text-[var(--txt)]')}>{t.pf}</td>
                        <td className={cn(td, 'text-[var(--txt)]')}>{t.pa}</td>
                        <td className={cn(td, diff >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium')}>
                          {diff >= 0 ? `+${diff}` : diff}
                        </td>
                        <td className={cn(td, 'text-[var(--muted)]')}>{t.coach}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'grid' && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pt-2 pb-8">
            <div className="grid grid-cols-5 gap-3">
              {sorted.map((t, i) => (
                <Link key={t.id} href={`/team/${toSlug(t.name)}`}
                  className="relative rounded-2xl overflow-hidden block"
                  style={{ background: GRADIENTS[i % GRADIENTS.length], aspectRatio: '3 / 4' }}>
                  <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                    {t.wins}–{t.losses}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
                    <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
                    <p className="text-xs text-white/70 mt-0.5">Div. {t.division} · {t.city}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
