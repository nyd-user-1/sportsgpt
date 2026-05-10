'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  if (n == null || n === 0) return '—'
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export type ZipRow = {
  zip_code: string
  city: string
  county: string
  provider_count: number
  total_capacity: number
  infant_capacity: number
  toddler_capacity: number
  preschool_capacity: number
  school_age_capacity: number
}

type ColKey = 'city' | 'county' | 'providers' | 'total' | 'infant' | 'toddler' | 'preschool' | 'schoolAge'
interface ColDef { key: ColKey; header: string; tooltip: string }

const COLS: ColDef[] = [
  { key: 'city',      header: 'CITY',       tooltip: 'Primary city associated with this ZIP code.' },
  { key: 'county',    header: 'COUNTY',     tooltip: 'County in which this ZIP code is located.' },
  { key: 'providers', header: 'PROVIDERS',  tooltip: 'Number of OCFS-regulated childcare facilities with this ZIP code.' },
  { key: 'total',     header: 'TOTAL SEATS',tooltip: 'Sum of all licensed childcare capacity across facilities in this ZIP code.' },
  { key: 'infant',    header: 'INFANT',     tooltip: 'Sum of licensed infant capacity (birth–18 months) across facilities in this ZIP code.' },
  { key: 'toddler',   header: 'TODDLER',    tooltip: 'Sum of licensed toddler capacity (18 months–3 years) across facilities in this ZIP code.' },
  { key: 'preschool', header: 'PRESCHOOL',  tooltip: 'Sum of licensed preschool capacity across facilities in this ZIP code.' },
  { key: 'schoolAge', header: 'SCHOOL AGE', tooltip: 'Sum of licensed school-age capacity across facilities in this ZIP code.' },
]

function ColHeader({ col, active, dir, onSort }: { col: ColDef; active: boolean; dir: 'asc' | 'desc'; onSort: () => void }) {
  return (
    <th className="px-3 py-4 bg-[var(--surface)] border-b border-[var(--border)] whitespace-nowrap">
      <div className="relative group/col inline-block">
        <button onClick={onSort} className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 hover:text-[var(--txt)]',
          active ? 'text-[var(--txt)]' : 'text-[var(--muted)]',
        )}>
          {col.header}
          {active ? (dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronUp className="h-3 w-3 opacity-0 group-hover/col:opacity-40" />}
        </button>
        <div className="pointer-events-none group-hover/col:pointer-events-auto absolute top-full left-0 z-50 mt-2 hidden group-hover/col:block w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl text-left overflow-hidden normal-case tracking-normal whitespace-normal">
          <div className="px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--txt)] mb-1.5">{col.header}</p>
            <p className="text-[12px] text-[var(--muted)] leading-relaxed">{col.tooltip}</p>
          </div>
          <Link href="/glossary" onClick={e => e.stopPropagation()} className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3.5 py-2.5 text-[11px] font-medium text-sky-500 hover:bg-[var(--inp-bg)] transition-colors">
            <span className="inline-flex items-center gap-1.5"><Info className="h-3 w-3" />Learn more</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </th>
  )
}

function getVal(row: ZipRow, key: ColKey): number | string {
  switch (key) {
    case 'city':      return row.city
    case 'county':    return row.county
    case 'providers': return row.provider_count
    case 'total':     return row.total_capacity
    case 'infant':    return row.infant_capacity
    case 'toddler':   return row.toddler_capacity
    case 'preschool': return row.preschool_capacity
    case 'schoolAge': return row.school_age_capacity
  }
}

export default function ZipTable({ zips: initial, total: initialTotal }: { zips: ZipRow[]; total: number }) {
  const router = useRouter()
  const [view, setView]     = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<'zip' | ColKey>('zip')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [zips, setZips]       = useState(initial)
  const [total, setTotal]     = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchZips = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      const res  = await fetch(`/api/zips?${params}`)
      const json = await res.json()
      setZips(json.data)
      setTotal(json.total)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchZips(search), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, fetchZips])

  function handleSort(col: 'zip' | ColKey) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sorted = useMemo(() => [...zips].sort((a, b) => {
    const av = sortCol === 'zip' ? a.zip_code : getVal(a, sortCol)
    const bv = sortCol === 'zip' ? b.zip_code : getVal(b, sortCol)
    if (typeof av === 'string') { const c = av.localeCompare(bv as string); return sortDir === 'asc' ? c : -c }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [zips, sortCol, sortDir])

  const iconBtn = 'h-8 w-8 flex items-center justify-center rounded-lg transition-colors'
  const activeBtn = 'bg-[var(--inp-bg)] text-[var(--txt)]'
  const mutedBtn  = 'text-[var(--muted)] hover:text-[var(--txt)]'
  const td = 'px-4 py-2.5 border-b border-[var(--border)]'

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-3 flex flex-col gap-3">
          <div className={cn('flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3', loading && 'opacity-60')}>
            <Search className="h-4 w-4 text-[var(--muted)] shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ZIP codes, cities, counties..."
              className="flex-1 bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none" />
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setView('list')} className={cn(iconBtn, view === 'list' ? activeBtn : mutedBtn)}><List className="h-4 w-4" /></button>
            <button onClick={() => setView('grid')} className={cn(iconBtn, view === 'grid' ? activeBtn : mutedBtn)}><LayoutGrid className="h-4 w-4" /></button>
            <div className="flex-1" />
            <span className="text-xs text-[var(--muted)]">{loading ? 'Searching…' : `${sorted.length.toLocaleString()} of ${total.toLocaleString()}`}</span>
          </div>
        </div>

        {view === 'list' && (
          <div className="px-5 pb-5 flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)]">
              <table className="text-sm whitespace-nowrap" style={{ minWidth: '1200px', width: '100%', borderSpacing: 0 }}>
                <thead className="sticky top-0 z-20 bg-[var(--surface)]">
                  <tr>
                    <th onClick={() => handleSort('zip')} style={{ willChange: 'transform' }}
                      className="px-4 py-4 text-left sticky left-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] cursor-pointer select-none min-w-[120px]">
                      <button className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5 hover:text-[var(--txt)]',
                        sortCol === 'zip' ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>
                        ZIP CODE
                        {sortCol === 'zip' ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronUp className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    {COLS.map(col => <ColHeader key={col.key} col={col} active={sortCol === col.key} dir={sortDir} onSort={() => handleSort(col.key)} />)}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(z => (
                    <tr key={z.zip_code} onClick={() => router.push(`/zip/${z.zip_code}`)}
                      className="group cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
                      <td style={{ willChange: 'transform' }} className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover:bg-[var(--row-hover)] font-semibold text-[var(--txt)] transition-colors')}>
                        {z.zip_code}
                      </td>
                      <td className={cn(td, 'text-[var(--muted)]')}>{z.city}</td>
                      <td className={cn(td, 'text-[var(--muted)]')}>{z.county}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(z.provider_count)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(z.total_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(z.infant_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(z.toddler_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(z.preschool_capacity)}</td>
                      <td className={cn(td, 'text-[var(--txt)]')}>{fmt(z.school_age_capacity)}</td>
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
              {sorted.map((z, i) => (
                <Link key={z.zip_code} href={`/zip/${z.zip_code}`} className="relative rounded-2xl overflow-hidden block"
                  style={{ background: GRADIENTS[i % GRADIENTS.length], aspectRatio: '3 / 4' }}>
                  <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                    {fmt(z.total_capacity)} seats
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/30 to-transparent">
                    <p className="text-sm font-bold text-white leading-tight">{z.zip_code}</p>
                    <p className="text-xs text-white/70 mt-0.5">{z.city}, NY</p>
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
