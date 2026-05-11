'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, List, LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(160deg,#1e3a8a 0%,#1e40af 100%)',
  'linear-gradient(160deg,#14532d 0%,#166534 100%)',
  'linear-gradient(160deg,#7c2d12 0%,#9a3412 100%)',
  'linear-gradient(160deg,#581c87 0%,#6b21a8 100%)',
  'linear-gradient(160deg,#881337 0%,#9f1239 100%)',
  'linear-gradient(160deg,#134e4a 0%,#0f766e 100%)',
  'linear-gradient(160deg,#713f12 0%,#92400e 100%)',
  'linear-gradient(160deg,#1e40af 0%,#1d4ed8 100%)',
  'linear-gradient(160deg,#064e3b 0%,#065f46 100%)',
  'linear-gradient(160deg,#991b1b 0%,#b91c1c 100%)',
]

export type SchoolRow = {
  id: number
  name: string
  city: string
  county: string
  section: string
  division: string
  enrollment: number
  teams: number
  wins: number
  losses: number
}

function fmtPct(w: number, l: number) {
  const g = w + l
  if (g === 0) return '—'
  return (w / g).toFixed(3).replace(/^0/, '')
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

type SortCol = 'name' | 'city' | 'division' | 'enrollment' | 'teams' | 'wins' | 'losses' | 'pct'

export default function SchoolTable({ schools: initial, total: initialTotal }: { schools: SchoolRow[]; total: number }) {
  const [view, setView]       = useState<'list' | 'grid'>('list')
  const [search, setSearch]   = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'name' || col === 'city' || col === 'division' ? 'asc' : 'desc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return initial.filter(s => !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.division.toLowerCase().includes(q))
  }, [initial, search])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: number | string, bv: number | string
    switch (sortCol) {
      case 'name':       av = a.name;       bv = b.name;       break
      case 'city':       av = a.city;       bv = b.city;       break
      case 'division':   av = a.division;   bv = b.division;   break
      case 'enrollment': av = a.enrollment; bv = b.enrollment; break
      case 'teams':      av = a.teams;      bv = b.teams;      break
      case 'wins':       av = a.wins;       bv = b.wins;       break
      case 'losses':     av = a.losses;     bv = b.losses;     break
      case 'pct': {
        av = (a.wins + a.losses) === 0 ? 0 : a.wins / (a.wins + a.losses)
        bv = (b.wins + b.losses) === 0 ? 0 : b.wins / (b.wins + b.losses)
        break
      }
    }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [filtered, sortCol, sortDir])

  const iconBtn   = 'h-8 w-8 flex items-center justify-center rounded-lg transition-colors'
  const activeBtn = 'bg-[var(--inp-bg)] text-[var(--txt)]'
  const mutedBtn  = 'text-[var(--muted)] hover:text-[var(--txt)]'
  const td        = 'px-4 py-2.5 border-b border-[var(--border)]'

  function Th({ col, label, sticky }: { col: SortCol; label: string; sticky?: boolean }) {
    return (
      <th onClick={() => handleSort(col)}
        className={cn('px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] whitespace-nowrap cursor-pointer select-none', sticky && 'sticky left-0 z-30 text-left min-w-[200px]')}>
        <button className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5', sortCol === col ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>
          {label}
          {sortCol === col ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronUp className="h-3 w-3 opacity-0" />}
        </button>
      </th>
    )
  }

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-3 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--muted)] shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search schools, cities..."
              className="flex-1 bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none" />
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
              <table className="text-sm whitespace-nowrap" style={{ minWidth: '900px', width: '100%', borderSpacing: 0 }}>
                <thead className="sticky top-0 z-20 bg-[var(--surface)]">
                  <tr>
                    <Th col="name" label="School" sticky />
                    <Th col="city" label="City" />
                    <Th col="division" label="Division" />
                    <Th col="enrollment" label="Enrollment" />
                    <Th col="teams" label="Teams" />
                    <Th col="wins" label="W" />
                    <Th col="losses" label="L" />
                    <Th col="pct" label="Win%" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(s => (
                    <tr key={s.id} className="group cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                      <td style={{ willChange: 'transform' }} className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover:bg-[var(--row-hover)] font-semibold text-[var(--txt)] transition-colors max-w-[200px] truncate')}>
                        <Link href={`/school/${toSlug(s.name)}`} className="hover:underline">{s.name}</Link>
                      </td>
                      <td className={cn(td, 'text-[var(--muted)]')}>{s.city}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>Div. {s.division}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{s.enrollment.toLocaleString()}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{s.teams}</td>
                      <td className={cn(td, 'text-[var(--txt)] font-medium')}>{s.wins}</td>
                      <td className={cn(td, 'text-[var(--muted)]')}>{s.losses}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmtPct(s.wins, s.losses)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'grid' && (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pt-2 pb-8">
            <div className="grid grid-cols-5 gap-3">
              {sorted.map((s, i) => (
                <Link key={s.id} href={`/school/${toSlug(s.name)}`}
                  className="relative rounded-2xl overflow-hidden block"
                  style={{ background: GRADIENTS[i % GRADIENTS.length], aspectRatio: '3 / 4' }}>
                  <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                    Div. {s.division}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
                    <p className="text-sm font-bold text-white leading-tight">{s.name}</p>
                    <p className="text-xs text-white/70 mt-0.5">{s.city} · {s.enrollment.toLocaleString()} students</p>
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
