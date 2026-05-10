'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, List, LayoutGrid, ChevronUp, ChevronDown, ArrowUpRight, Info } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(160deg,#f5c118 0%,#92700a 100%)',
  'linear-gradient(160deg,#f08040 0%,#8b3800 100%)',
  'linear-gradient(160deg,#b87af8 0%,#6221a8 100%)',
  'linear-gradient(160deg,#f0d040 0%,#a16000 100%)',
  'linear-gradient(160deg,#f07080 0%,#9f1030 100%)',
  'linear-gradient(160deg,#30c0f0 0%,#0260a0 100%)',
  'linear-gradient(160deg,#f09090 0%,#be1030 100%)',
  'linear-gradient(160deg,#f08055 0%,#9a3010 100%)',
  'linear-gradient(160deg,#80b8f8 0%,#1d38c0 100%)',
  'linear-gradient(160deg,#f8de60 0%,#c07000 100%)',
]

function fmt(n: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtCost(n: number | null) {
  if (n == null) return '—'
  return `$${Math.round(n)}/wk`
}

function fmtCostMo(n: number | null) {
  if (n == null) return '—'
  return `$${Math.round(n * 4.33).toLocaleString()}/mo`
}

function fmtCostYr(n: number | null) {
  if (n == null) return '—'
  const yr = Math.round(n * 52)
  return yr >= 1000 ? `$${(yr / 1000).toFixed(1)}K/yr` : `$${yr}/yr`
}

function fmtIncome(n: number | null) {
  if (n == null) return '—'
  return `$${Math.round(n / 1000)}K`
}

function toSlug(county: string) {
  return county.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export type CountyRow = {
  county: string
  provider_count: number
  total_capacity: number
  infant_capacity: number
  toddler_capacity: number
  preschool_capacity: number
  school_age_capacity: number
  mcinfant: number | null
  mctoddler: number | null
  mcpreschool: number | null
  mhi: number | null
}

type ColKey = 'providers' | 'total' | 'infant' | 'toddler' | 'preschool'
            | 'schoolAge' | 'seatsPerProvider'
            | 'mcinfant' | 'mcinfantMo' | 'mcinfantYr'
            | 'mctoddler' | 'mcpreschool' | 'mhi'

interface ColDef { key: ColKey; header: string; tooltip: string }

const COLS: ColDef[] = [
  { key: 'providers',        header: 'PROVIDERS',      tooltip: 'Number of OCFS-regulated childcare facilities in the county.' },
  { key: 'total',            header: 'TOTAL SEATS',    tooltip: 'Sum of all licensed childcare capacity across facilities.' },
  { key: 'infant',           header: 'INFANT',         tooltip: 'Sum of licensed infant capacity (birth–18 months) across facilities.' },
  { key: 'toddler',          header: 'TODDLER',        tooltip: 'Sum of licensed toddler capacity (18 months–3 years) across facilities.' },
  { key: 'preschool',        header: 'PRESCHOOL',      tooltip: 'Sum of licensed preschool capacity across facilities.' },
  { key: 'schoolAge',        header: 'SCHOOL AGE',     tooltip: 'Sum of licensed school-age capacity across facilities.' },
  { key: 'seatsPerProvider', header: 'SEATS/PROVIDER', tooltip: 'Average seats per licensed facility (total seats ÷ providers). High values indicate large centers; low values indicate small home-based programs.' },
  { key: 'mcinfant',         header: 'MED. INFANT/WK', tooltip: 'Median weekly center-based infant care cost (DOL NDCP, 2022).' },
  { key: 'mcinfantMo',       header: 'MED. INFANT/MO', tooltip: 'Median monthly center-based infant care cost (weekly × 4.33, DOL NDCP, 2022).' },
  { key: 'mcinfantYr',       header: 'MED. INFANT/YR', tooltip: 'Median annual center-based infant care cost (weekly × 52, DOL NDCP, 2022).' },
  { key: 'mctoddler',        header: 'MED. TODDLER',   tooltip: 'Median weekly center-based toddler care cost (DOL NDCP, 2022).' },
  { key: 'mcpreschool',      header: 'MED. PRESCHOOL', tooltip: 'Median weekly center-based preschool cost (DOL NDCP, 2022).' },
  { key: 'mhi',              header: 'MED. INCOME',    tooltip: 'Median household income (DOL NDCP, 2022).' },
]

function ColHeader({ col, active, dir, onSort }: {
  col: ColDef; active: boolean; dir: 'asc' | 'desc'; onSort: () => void
}) {
  return (
    <th className="px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] whitespace-nowrap">
      <div className="relative group/col inline-block">
        <button
          onClick={onSort}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 hover:text-[var(--txt)]',
            active ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
          )}
        >
          {col.header}
          {active
            ? dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
            : <ChevronUp className="h-3 w-3 opacity-0 group-hover/col:opacity-40" />}
        </button>
        <div className="pointer-events-none group-hover/col:pointer-events-auto absolute top-full left-0 z-50 mt-2 hidden group-hover/col:block w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl text-left overflow-hidden normal-case tracking-normal whitespace-normal">
          <div className="px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--txt)] mb-1.5">{col.header}</p>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed font-normal">{col.tooltip}</p>
          </div>
          <Link href="/glossary" onClick={e => e.stopPropagation()}
            className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3.5 py-2.5 text-[11px] font-medium text-sky-500 hover:bg-[var(--inp-bg)] transition-colors">
            <span className="inline-flex items-center gap-1.5"><Info className="h-3 w-3" />Learn more</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </th>
  )
}

function getVal(row: CountyRow, key: ColKey): number {
  switch (key) {
    case 'providers':        return row.provider_count
    case 'total':            return row.total_capacity
    case 'infant':           return row.infant_capacity
    case 'toddler':          return row.toddler_capacity
    case 'preschool':        return row.preschool_capacity
    case 'schoolAge':        return row.school_age_capacity
    case 'seatsPerProvider': return row.provider_count > 0 ? row.total_capacity / row.provider_count : 0
    case 'mcinfant':         return row.mcinfant ?? 0
    case 'mcinfantMo':       return row.mcinfant != null ? row.mcinfant * 4.33 : 0
    case 'mcinfantYr':       return row.mcinfant != null ? row.mcinfant * 52 : 0
    case 'mctoddler':        return row.mctoddler ?? 0
    case 'mcpreschool':      return row.mcpreschool ?? 0
    case 'mhi':              return row.mhi ?? 0
  }
}

export default function CountyTable({ counties }: { counties: CountyRow[] }) {
  const router = useRouter()
  const [view, setView]       = useState<'list' | 'grid'>('list')
  const [search, setSearch]   = useState('')
  const [sortCol, setSortCol] = useState<'county' | ColKey>('county')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(col: 'county' | ColKey) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const rows = counties.filter(c => !q || c.county.toLowerCase().includes(q))
    return [...rows].sort((a, b) => {
      if (sortCol === 'county') {
        const cmp = a.county.localeCompare(b.county)
        return sortDir === 'asc' ? cmp : -cmp
      }
      const av = getVal(a, sortCol), bv = getVal(b, sortCol)
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [search, sortCol, sortDir, counties])

  const iconBtn = 'h-8 w-8 flex items-center justify-center rounded-lg transition-colors'
  const activeBtn = 'bg-[var(--inp-bg)] text-[var(--txt)]'
  const mutedBtn  = 'text-[var(--muted)] hover:text-[var(--txt)]'
  const td = 'px-4 py-2.5 border-b border-[var(--border)]'

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-3 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--muted)] shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search counties..."
              className="flex-1 bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none" />
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setView('list')} className={cn(iconBtn, view === 'list' ? activeBtn : mutedBtn)}><List className="h-4 w-4" /></button>
            <button onClick={() => setView('grid')} className={cn(iconBtn, view === 'grid' ? activeBtn : mutedBtn)}><LayoutGrid className="h-4 w-4" /></button>
            <div className="flex-1" />
            <span className="text-xs text-[var(--muted)]">{filtered.length} of {counties.length}</span>
          </div>
        </div>

        {view === 'list' && (
          <div className="px-5 pb-5 flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)]">
              <table className="text-sm whitespace-nowrap" style={{ minWidth: '1600px', width: '100%', borderSpacing: 0 }}>
                <thead className="sticky top-0 z-20 bg-[var(--surface)]">
                  <tr>
                    <th onClick={() => handleSort('county')} style={{ willChange: 'transform' }}
                      className="px-4 py-4 text-left sticky left-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] cursor-pointer select-none min-w-[200px]">
                      <button className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 hover:text-[var(--txt)]',
                        sortCol === 'county' ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>
                        COUNTY
                        {sortCol === 'county'
                          ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          : <ChevronUp className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    <th className="px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] px-1.5 py-0.5">STATE</span>
                    </th>
                    {COLS.map(col => (
                      <ColHeader key={col.key} col={col} active={sortCol === col.key} dir={sortDir} onSort={() => handleSort(col.key)} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.county} onClick={() => router.push(`/county/${toSlug(c.county)}`)}
                      className="group/row cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                      <td style={{ willChange: 'transform' }}
                        className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold text-[var(--txt)] transition-colors')}>
                        {c.county} County
                      </td>
                      <td className={cn(td, 'text-[var(--muted)]')}>NY</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(c.provider_count)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(c.total_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(c.infant_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(c.toddler_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(c.preschool_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(c.school_age_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>
                        {c.provider_count > 0 ? Math.round(c.total_capacity / c.provider_count) : '—'}
                      </td>
                      <td className={cn(td, 'text-sky-500 font-medium')}>{fmtCost(c.mcinfant)}</td>
                      <td className={cn(td, 'text-sky-500 font-medium')}>{fmtCostMo(c.mcinfant)}</td>
                      <td className={cn(td, 'text-sky-500 font-medium')}>{fmtCostYr(c.mcinfant)}</td>
                      <td className={cn(td, 'text-sky-500 font-medium')}>{fmtCost(c.mctoddler)}</td>
                      <td className={cn(td, 'text-sky-500 font-medium')}>{fmtCost(c.mcpreschool)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmtIncome(c.mhi)}</td>
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
              {filtered.map((c, i) => (
                <Link key={c.county} href={`/county/${toSlug(c.county)}`}
                  className="relative rounded-2xl overflow-hidden block"
                  style={{ background: GRADIENTS[i % GRADIENTS.length], aspectRatio: '3 / 4' }}>
                  <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                    {fmt(c.total_capacity)} seats
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/30 to-transparent">
                    <p className="text-sm font-bold text-white leading-tight">{c.county} County</p>
                    <p className="text-xs text-white/70 mt-0.5">NY · {fmt(c.provider_count)} providers</p>
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
