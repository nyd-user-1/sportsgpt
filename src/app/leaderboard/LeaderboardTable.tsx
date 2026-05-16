'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Check, ChevronUp, ChevronDown, Info, ArrowUpRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn, formatSeason } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { GLOSSARY_TERMS } from '@/lib/glossary-terms'

// Build a lookup map from glossary term id → {definition, name}
const GLOSSARY_MAP = Object.fromEntries(GLOSSARY_TERMS.map(t => [t.id, t]))

// Map PassCol → glossary id for tooltip lookup
const PASS_COL_GLOSSARY: Partial<Record<string, string>> = {
  pass_yards:    'pass-yds',
  attempts:      'att-pass',
  completions:   'comp',
  comp_pct:      'comp-pct',
  pass_tds:      'pass-td',
  interceptions: 'int',
  ypa:           'ypa',
  ypc:           'ypc',
  td_rate:       'td-rate',
  int_rate:      'int-rate',
  td_int_ratio:  'td-int',
  yva:           'yva',
  cmd_score:     'cmd',
  gbi_score:     'gbi',
  ies_score:     'ies',
}

const SEASONS = [2025, 2024, 2023, 2022, 2021, 2020]

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
              <span className="font-semibold text-[var(--txt)]">{formatSeason(s)}</span>
              {selected === s && <Check className="h-4 w-4" style={{ color: ACCENT_COLOR }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type SortDir = 'asc' | 'desc'
type PassCol = 'player_name' | 'school_name' | 'season' | 'pass_yards' | 'attempts' | 'completions' | 'comp_pct' | 'pass_tds' | 'interceptions' | 'ypa' | 'ypc' | 'td_rate' | 'int_rate' | 'td_int_ratio' | 'yva' | 'cmd_score' | 'gbi_score' | 'ies_score'
type RushCol = 'player_name' | 'school_name' | 'season' | 'rush_yards' | 'rush_attempts' | 'ypc' | 'rush_tds'
type RecvCol = 'player_name' | 'school_name' | 'season' | 'recv_yards' | 'receptions' | 'ypr' | 'recv_tds'

type Passer = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  completions: number | null; attempts: number | null
  pass_yards: number | null; pass_tds: number | null
  interceptions: number | null; season: number
  comp_pct: number | null; ypa: number | null; ypc: number | null
  td_rate: number | null; int_rate: number | null; td_int_ratio: number | null
  yva: number | null; cmd_score: number | null; gbi_score: number | null; ies_score: number | null
}
type Rusher = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  rush_attempts: number | null; rush_yards: number | null
  rush_tds: number | null; season: number
}
type Receiver = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  receptions: number | null; recv_yards: number | null
  recv_tds: number | null; season: number
}
type StatTab = 'Passing' | 'Rushing' | 'Receiving'

function Th({ label, active, dir, onClick, right, className, style, glossaryId }: {
  label: string; active: boolean; dir: SortDir; onClick: () => void
  right?: boolean; className?: string; style?: React.CSSProperties; glossaryId?: string
}) {
  const term = glossaryId ? GLOSSARY_MAP[glossaryId] : undefined
  return (
    <th
      style={style}
      className={cn(
        'px-3 py-3 bg-gray-100 border-b border-[var(--border)] whitespace-nowrap cursor-pointer select-none',
        right ? 'text-right' : 'text-left',
        className
      )}
    >
      <div className={cn('relative inline-block group/th', right && 'text-right')} style={{ textAlign: right ? 'right' : 'left' }}>
        <button
          onClick={onClick}
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-black/5',
            active ? 'text-[var(--txt)]' : 'text-[var(--muted)]'
          )}>
          {label}
          {active
            ? (dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
            : <ChevronUp className="h-3 w-3 opacity-0" />}
        </button>
        {term && (
          <div className={cn(
            'pointer-events-none group-hover/th:pointer-events-auto absolute top-full z-50 mt-2 hidden group-hover/th:block w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl text-left normal-case tracking-normal whitespace-normal overflow-hidden',
            right ? 'right-0' : 'left-0'
          )}>
            <div className="px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--txt)] mb-1.5">{term.name}</p>
              <p className="text-[12px] text-[var(--muted)] leading-relaxed font-normal">{term.definition}</p>
            </div>
            <Link href={`/glossary#${glossaryId}`} onClick={e => e.stopPropagation()}
              className="pointer-events-auto flex items-center justify-between gap-2 border-t border-[var(--border)] px-3.5 py-2.5 text-[11px] font-medium hover:bg-[var(--inp-bg)] transition-colors"
              style={{ color: ACCENT_COLOR }}>
              <span className="inline-flex items-center gap-1.5"><Info className="h-3 w-3" />Learn more</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </th>
  )
}

export default function LeaderboardTable({
  passers, rushers, receivers,
}: {
  passers: Passer[]; rushers: Rusher[]; receivers: Receiver[]
}) {
  const [statTab, setStatTab] = useState<StatTab>('Passing')
  const [season, setSeason]   = useState<number | null>(null)

  const [passCol, setPassCol] = useState<PassCol>('pass_yards')
  const [passDir, setPassDir] = useState<SortDir>('desc')
  const [rushCol, setRushCol] = useState<RushCol>('rush_yards')
  const [rushDir, setRushDir] = useState<SortDir>('desc')
  const [recvCol, setRecvCol] = useState<RecvCol>('recv_yards')
  const [recvDir, setRecvDir] = useState<SortDir>('desc')

  const td  = 'px-3 py-2.5 border-b border-[var(--border)] text-sm'
  const tdR = td + ' text-right text-[var(--txt)]'

  const statTabs: StatTab[] = ['Passing', 'Rushing', 'Receiving']

  function makeSort<C extends string>(col: C, setCol: (c: C) => void, dir: SortDir, setDir: (d: SortDir) => void) {
    return (c: C) => {
      if (col === c) setDir(dir === 'asc' ? 'desc' : 'asc')
      else { setCol(c); setDir('desc') }
    }
  }

  const handlePassSort = makeSort(passCol, setPassCol, passDir, setPassDir)
  const handleRushSort = makeSort(rushCol, setRushCol, rushDir, setRushDir)
  const handleRecvSort = makeSort(recvCol, setRecvCol, recvDir, setRecvDir)

  const filteredPassers   = season ? passers.filter(p => p.season === season) : passers
  const filteredRushers   = season ? rushers.filter(p => p.season === season) : rushers
  const filteredReceivers = season ? receivers.filter(p => p.season === season) : receivers

  const sortedPassers = useMemo(() => [...filteredPassers].sort((a, b) => {
    const av = (a[passCol as keyof Passer] ?? '') as number | string
    const bv = (b[passCol as keyof Passer] ?? '') as number | string
    if (typeof av === 'string') return passDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return passDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [filteredPassers, passCol, passDir])

  const sortedRushers = useMemo(() => [...filteredRushers].sort((a, b) => {
    let av: number | string, bv: number | string
    if (rushCol === 'ypc') {
      av = a.rush_attempts ? (a.rush_yards ?? 0) / a.rush_attempts : 0
      bv = b.rush_attempts ? (b.rush_yards ?? 0) / b.rush_attempts : 0
    } else {
      av = (a[rushCol as keyof Rusher] ?? '') as number | string
      bv = (b[rushCol as keyof Rusher] ?? '') as number | string
    }
    if (typeof av === 'string') return rushDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return rushDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [filteredRushers, rushCol, rushDir])

  const sortedReceivers = useMemo(() => [...filteredReceivers].sort((a, b) => {
    let av: number | string, bv: number | string
    if (recvCol === 'ypr') {
      av = a.receptions ? (a.recv_yards ?? 0) / a.receptions : 0
      bv = b.receptions ? (b.recv_yards ?? 0) / b.receptions : 0
    } else {
      av = (a[recvCol as keyof Receiver] ?? '') as number | string
      bv = (b[recvCol as keyof Receiver] ?? '') as number | string
    }
    if (typeof av === 'string') return recvDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
    return recvDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  }), [filteredReceivers, recvCol, recvDir])

  function PTh({ col, label, right, className, style }: { col: PassCol; label: string; right?: boolean; className?: string; style?: React.CSSProperties }) {
    return <Th label={label} active={passCol === col} dir={passDir} onClick={() => handlePassSort(col)} right={right} className={className} style={style} glossaryId={PASS_COL_GLOSSARY[col]} />
  }
  function RTh({ col, label, right, className }: { col: RushCol; label: string; right?: boolean; className?: string }) {
    return <Th label={label} active={rushCol === col} dir={rushDir} onClick={() => handleRushSort(col)} right={right} className={className} />
  }
  function VTh({ col, label, right, className }: { col: RecvCol; label: string; right?: boolean; className?: string }) {
    return <Th label={label} active={recvCol === col} dir={recvDir} onClick={() => handleRecvSort(col)} right={right} className={className} />
  }

  const playerCls = 'sticky left-0 z-30 min-w-[160px]'

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Stat type tabs + season filter */}
        <div className="shrink-0 bg-[var(--surface)] px-5 pt-4 pb-0 border-b-2 transition-colors"
          style={{ borderBottomColor: ACCENT_COLOR }}>
          <div className="flex items-center gap-2">
            {statTabs.map(t => (
              <button key={t} onClick={() => setStatTab(t)}
                className={cn(
                  'px-5 py-3 text-sm font-semibold transition-colors',
                  statTab === t ? 'text-[var(--txt)]' : 'text-[var(--muted)] hover:text-[var(--txt)]',
                )}>
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

            {/* Passing */}
            {statTab === 'Passing' && (
              <table className="text-sm border-separate" style={{ borderSpacing: 0, minWidth: '1320px' }}>
                <thead className="sticky top-0 z-20">
                  {/* Group header row */}
                  <tr>
                    <th colSpan={3} className="bg-gray-100 border-b border-[var(--border)]" />
                    <th colSpan={6} className="px-3 py-1 bg-gray-100 border-b border-[var(--border)] text-left">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--muted)]">Standard</span>
                    </th>
                    <th colSpan={6} className="px-3 py-1 bg-gray-50 border-b border-l border-[var(--border)] text-left">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--muted)]">Foundational QB</span>
                    </th>
                    <th colSpan={3} className="px-3 py-1 border-b border-l border-[var(--border)] text-left" style={{ background: '#f0f4ff' }}>
                      <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: ACCENT_COLOR }}>Advanced QB</span>
                    </th>
                  </tr>
                  {/* Column header row */}
                  <tr>
                    <PTh col="player_name"   label="Player"  className={cn(playerCls, 'min-w-[160px]')} />
                    <PTh col="school_name"   label="Team"    className="min-w-[150px]" />
                    <PTh col="season"        label="Season"  className="w-[70px]" />
                    <PTh col="pass_yards"    label="YDS"     right className="w-[65px]" />
                    <PTh col="attempts"      label="ATT"     right className="w-[55px]" />
                    <PTh col="completions"   label="COMP"    right className="w-[60px]" />
                    <PTh col="comp_pct"      label="COMP%"   right className="w-[65px]" />
                    <PTh col="pass_tds"      label="TD"      right className="w-[50px]" />
                    <PTh col="interceptions" label="INT"     right className="w-[50px]" />
                    <PTh col="ypa"           label="YPA"     right className="w-[55px] border-l border-[var(--border)] bg-gray-50" />
                    <PTh col="ypc"           label="YPC"     right className="w-[55px] bg-gray-50" />
                    <PTh col="td_rate"       label="TD%"     right className="w-[60px] bg-gray-50" />
                    <PTh col="int_rate"      label="INT%"    right className="w-[60px] bg-gray-50" />
                    <PTh col="td_int_ratio"  label="TD:INT"  right className="w-[65px] bg-gray-50" />
                    <PTh col="yva"           label="YVA"     right className="w-[70px] bg-gray-50" />
                    <PTh col="cmd_score"     label="CMD"     right className="w-[60px] border-l border-[var(--border)]" style={{ background: '#f0f4ff' }} />
                    <PTh col="gbi_score"     label="GBI"     right className="w-[60px]" style={{ background: '#f0f4ff' }} />
                    <PTh col="ies_score"     label="IES"     right className="w-[60px]" style={{ background: '#f0f4ff' }} />
                  </tr>
                </thead>
                <tbody>
                  {sortedPassers.map((p, i) => (
                    <tr key={p.player_slug + i} className="group/row hover:bg-[var(--inp-bg)] transition-colors">
                      <td className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold truncate transition-colors min-w-[160px]')}>
                        <Link href={`/player/${p.player_slug}`} className="hover:underline text-[var(--txt)]">{p.player_name}</Link>
                      </td>
                      <td className={cn(td, 'text-[var(--muted)] min-w-[150px]')}>
                        <div className="flex items-center gap-2 min-w-0">
                          {SCHOOL_LOGOS[p.school_slug] && (
                            <Image src={SCHOOL_LOGOS[p.school_slug]} alt="" width={20} height={20} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                          )}
                          <span className="truncate">{p.school_name}</span>
                        </div>
                      </td>
                      <td className={cn(td, 'text-[var(--muted)] w-[70px]')}>{formatSeason(p.season)}</td>
                      <td className={cn(tdR, 'font-bold w-[65px]')} style={{ color: ACCENT_COLOR }}>{p.pass_yards ?? '—'}</td>
                      <td className={cn(tdR, 'w-[55px]')}>{p.attempts ?? '—'}</td>
                      <td className={cn(tdR, 'w-[60px]')}>{p.completions ?? '—'}</td>
                      <td className={cn(tdR, 'w-[65px]')}>{p.comp_pct != null ? Number(p.comp_pct).toFixed(1) + '%' : '—'}</td>
                      <td className={cn(tdR, 'w-[50px]')}>{p.pass_tds ?? '—'}</td>
                      <td className={cn(tdR, 'w-[50px]')}>{p.interceptions ?? '—'}</td>
                      <td className={cn(tdR, 'w-[55px] border-l border-[var(--border)] bg-gray-50/60')}>{p.ypa != null ? Number(p.ypa).toFixed(1) : '—'}</td>
                      <td className={cn(tdR, 'w-[55px] bg-gray-50/60')}>{p.ypc != null ? Number(p.ypc).toFixed(1) : '—'}</td>
                      <td className={cn(tdR, 'w-[60px] bg-gray-50/60')}>{p.td_rate != null ? Number(p.td_rate).toFixed(1) + '%' : '—'}</td>
                      <td className={cn(tdR, 'w-[60px] bg-gray-50/60')}>{p.int_rate != null ? Number(p.int_rate).toFixed(1) + '%' : '—'}</td>
                      <td className={cn(tdR, 'w-[65px] bg-gray-50/60')}>{p.td_int_ratio != null ? Number(p.td_int_ratio).toFixed(1) : '—'}</td>
                      <td className={cn(tdR, 'w-[70px] bg-gray-50/60')}>{p.yva != null ? (Number(p.yva) > 0 ? '+' : '') + Number(p.yva).toFixed(0) : '—'}</td>
                      <td className={cn(tdR, 'w-[60px] border-l border-[var(--border)] font-semibold')} style={{ background: '#f0f4ff', color: ACCENT_COLOR }}>{p.cmd_score != null ? Number(p.cmd_score).toFixed(2) : '—'}</td>
                      <td className={cn(tdR, 'w-[60px]')} style={{ background: '#f0f4ff' }}>{p.gbi_score != null ? Number(p.gbi_score).toFixed(1) : '—'}</td>
                      <td className={cn(tdR, 'w-[60px]')} style={{ background: '#f0f4ff' }}>{p.ies_score != null ? Number(p.ies_score).toFixed(1) : '—'}</td>
                    </tr>
                  ))}
                  {sortedPassers.length === 0 && (
                    <tr><td colSpan={18} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No passing data{season ? ` for ${formatSeason(season)}` : ''}</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Rushing: Player, Team, Season, YDS, ATT, YPC, TDs */}
            {statTab === 'Rushing' && (
              <table className="text-sm w-full table-fixed border-separate" style={{ borderSpacing: 0 }}>
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '23%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead className="sticky top-0 z-20">
                  <tr>
                    <RTh col="player_name"   label="Player" className={playerCls} />
                    <RTh col="school_name"   label="Team" />
                    <RTh col="season"        label="Season" />
                    <RTh col="rush_yards"    label="YDS"  right />
                    <RTh col="rush_attempts" label="ATT"  right />
                    <RTh col="ypc"           label="YPC"  right />
                    <RTh col="rush_tds"      label="TDs"  right />
                  </tr>
                </thead>
                <tbody>
                  {sortedRushers.map((p, i) => {
                    const ypc = (p.rush_attempts && p.rush_yards != null && p.rush_attempts > 0)
                      ? (p.rush_yards / p.rush_attempts).toFixed(1) : '—'
                    return (
                      <tr key={p.player_slug + i} className="group/row hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                        <td className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold truncate transition-colors')}>
                          <Link href={`/player/${p.player_slug}`} className="hover:underline text-[var(--txt)]">{p.player_name}</Link>
                        </td>
                        <td className={cn(td, 'text-[var(--muted)]')}>
                          <div className="flex items-center gap-2 min-w-0">
                            {SCHOOL_LOGOS[p.school_slug] && (
                              <Image src={SCHOOL_LOGOS[p.school_slug]} alt="" width={20} height={20} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                            )}
                            <span className="truncate">{p.school_name}</span>
                          </div>
                        </td>
                        <td className={cn(td, 'text-[var(--muted)]')}>{formatSeason(p.season)}</td>
                        <td className={tdR + ' font-bold'} style={{ color: ACCENT_COLOR }}>{p.rush_yards ?? '—'}</td>
                        <td className={tdR}>{p.rush_attempts ?? '—'}</td>
                        <td className={tdR}>{ypc}</td>
                        <td className={tdR}>{p.rush_tds ?? '—'}</td>
                      </tr>
                    )
                  })}
                  {sortedRushers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No rushing data{season ? ` for ${formatSeason(season)}` : ''}</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Receiving: Player, Team, Season, YDS, REC, YPR, TD */}
            {statTab === 'Receiving' && (
              <table className="text-sm w-full table-fixed border-separate" style={{ borderSpacing: 0 }}>
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '23%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead className="sticky top-0 z-20">
                  <tr>
                    <VTh col="player_name" label="Player" className={playerCls} />
                    <VTh col="school_name" label="Team" />
                    <VTh col="season"      label="Season" />
                    <VTh col="recv_yards"  label="YDS"  right />
                    <VTh col="receptions"  label="REC"  right />
                    <VTh col="ypr"         label="YPR"  right />
                    <VTh col="recv_tds"    label="TD"   right />
                  </tr>
                </thead>
                <tbody>
                  {sortedReceivers.map((p, i) => {
                    const ypr = (p.receptions && p.recv_yards != null && p.receptions > 0)
                      ? (p.recv_yards / p.receptions).toFixed(1) : '—'
                    return (
                      <tr key={p.player_slug + i} className="group/row hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                        <td className={cn(td, 'sticky left-0 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold truncate transition-colors')}>
                          <Link href={`/player/${p.player_slug}`} className="hover:underline text-[var(--txt)]">{p.player_name}</Link>
                        </td>
                        <td className={cn(td, 'text-[var(--muted)]')}>
                          <div className="flex items-center gap-2 min-w-0">
                            {SCHOOL_LOGOS[p.school_slug] && (
                              <Image src={SCHOOL_LOGOS[p.school_slug]} alt="" width={20} height={20} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                            )}
                            <span className="truncate">{p.school_name}</span>
                          </div>
                        </td>
                        <td className={cn(td, 'text-[var(--muted)]')}>{formatSeason(p.season)}</td>
                        <td className={tdR + ' font-bold'} style={{ color: ACCENT_COLOR }}>{p.recv_yards ?? '—'}</td>
                        <td className={tdR}>{p.receptions ?? '—'}</td>
                        <td className={tdR}>{ypr}</td>
                        <td className={tdR}>{p.recv_tds ?? '—'}</td>
                      </tr>
                    )
                  })}
                  {sortedReceivers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No receiving data{season ? ` for ${formatSeason(season)}` : ''}</td></tr>
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
