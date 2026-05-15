'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import { SCHOOL_LOGOS } from '@/lib/team-images'

type PlayerRow = {
  slug: string; name: string; school_slug: string | null; team_slug: string | null
  team_name: string | null; position: string | null
  total_yards: number | null; pass_yards: number | null; rush_yards: number | null
  recv_yards: number | null; total_tds: number | null; interceptions: number | null
}

type SortCol = 'name' | 'team' | 'position' | 'total_yards' | 'pass_yards' | 'rush_yards' | 'recv_yards' | 'total_tds' | 'interceptions'

function fmt(v: number | null) {
  return v != null ? v.toLocaleString() : '—'
}

function numVal(v: number | null) { return v ?? -1 }

export default function PlayerIndexTable({ players }: { players: PlayerRow[] }) {
  const [query,   setQuery]   = useState('')
  const [sortCol, setSortCol] = useState<SortCol>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir(col === 'name' || col === 'team' || col === 'position' ? 'asc' : 'desc') }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return q
      ? players.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.team_name ?? '').toLowerCase().includes(q) ||
          (p.position ?? '').toLowerCase().includes(q)
        )
      : players
  }, [players, query])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let av: string | number, bv: string | number
    switch (sortCol) {
      case 'name':         av = a.name;              bv = b.name;              break
      case 'team':         av = a.team_name ?? '';   bv = b.team_name ?? '';   break
      case 'position':     av = a.position ?? '';    bv = b.position ?? '';    break
      case 'total_yards':  av = numVal(a.total_yards);  bv = numVal(b.total_yards);  break
      case 'pass_yards':   av = numVal(a.pass_yards);   bv = numVal(b.pass_yards);   break
      case 'rush_yards':   av = numVal(a.rush_yards);   bv = numVal(b.rush_yards);   break
      case 'recv_yards':   av = numVal(a.recv_yards);   bv = numVal(b.recv_yards);   break
      case 'total_tds':    av = numVal(a.total_tds);    bv = numVal(b.total_tds);    break
      case 'interceptions':av = numVal(a.interceptions);bv = numVal(b.interceptions);break
      default: av = 0; bv = 0
    }
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [filtered, sortCol, sortDir])

  const td  = 'px-4 py-2.5 border-b border-[var(--border)] text-sm'
  const thBase = 'px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] whitespace-nowrap cursor-pointer select-none'
  const tdR = td + ' text-right text-[var(--txt)]'

  function Th({ col, label, right, sticky, minW }: { col: SortCol; label: string; right?: boolean; sticky?: boolean; minW?: string }) {
    const active = sortCol === col
    return (
      <th onClick={() => handleSort(col)}
        className={cn(thBase, right ? 'text-right' : 'text-left', sticky && 'sticky z-30', sticky === true && 'left-[48px]')}
        style={minW ? { minWidth: minW } : undefined}>
        <button className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5',
          active ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
          right && 'ml-auto'
        )}>
          {label}
          {active
            ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
            : <ChevronUp className="h-3 w-3 opacity-0" />}
        </button>
      </th>
    )
  }

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Search bar */}
        <div className="shrink-0 px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search players, teams, positions..."
              className="flex-1 bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none"
            />
            <span className="text-xs text-[var(--muted)]">{sorted.length} of {players.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-5">
          <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)] px-2">
            <table className="text-sm whitespace-nowrap w-full border-separate" style={{ borderSpacing: 0 }}>
              <thead className="sticky top-0 z-20 bg-[var(--surface)]">
                <tr>
                  <th className={cn(thBase, 'sticky left-2 z-30 min-w-[40px] text-left')}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] px-1.5">#</span>
                  </th>
                  <Th col="name"         label="Player"   sticky minW="180px" />
                  <Th col="team"         label="Team" />
                  <Th col="position"     label="Pos" />
                  <Th col="total_yards"  label="Tot Yds"  right />
                  <Th col="pass_yards"   label="Pass Yds" right />
                  <Th col="rush_yards"   label="Rush Yds" right />
                  <Th col="recv_yards"   label="Rec Yds"  right />
                  <Th col="total_tds"    label="TD"       right />
                  <Th col="interceptions"label="INT"      right />
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.slug} className="group/row hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                    <td className={cn(td, 'sticky left-2 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                    <td className={cn(td, 'sticky left-[48px] z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold transition-colors')}>
                      <Link href={`/player/${p.slug}`} className="hover:underline text-[var(--txt)]">{p.name}</Link>
                    </td>
                    <td className={cn(td, 'text-[var(--muted)]')}>
                      {p.team_slug ? (
                        <Link href={`/team/${p.team_slug}`} className="flex items-center gap-2 hover:underline text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
                          {p.school_slug && SCHOOL_LOGOS[p.school_slug] && (
                            <Image src={SCHOOL_LOGOS[p.school_slug]} alt="" width={18} height={18} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                          )}
                          <span>{p.team_name ?? '—'}</span>
                        </Link>
                      ) : (
                        <span>{p.team_name ?? '—'}</span>
                      )}
                    </td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{p.position ?? '—'}</td>
                    <td className={cn(tdR, 'font-bold')} style={p.total_yards ? { color: ACCENT_COLOR } : undefined}>{fmt(p.total_yards)}</td>
                    <td className={tdR}>{fmt(p.pass_yards)}</td>
                    <td className={tdR}>{fmt(p.rush_yards)}</td>
                    <td className={tdR}>{fmt(p.recv_yards)}</td>
                    <td className={tdR}>{fmt(p.total_tds)}</td>
                    <td className={tdR}>{fmt(p.interceptions)}</td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No players found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
