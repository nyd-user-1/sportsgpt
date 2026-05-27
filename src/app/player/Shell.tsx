'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  SectionHead,
  StickyControlBar,
  SearchInput,
  useSearchHotkey,
  SearchButtonGroup,
  Tablet,
  EmptyTablet,
  SortTh,
  MONO,
  tabletTd,
} from '@/components/editorial'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PlayerMagazineRow } from './page'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

type PosBucket = 'All' | 'QB' | 'RB' | 'WR' | 'Other'

const POS_LABEL: Record<PosBucket, string> = {
  All:   'All Positions',
  QB:    'Quarterbacks',
  RB:    'Rushers',
  WR:    'Receivers',
  Other: 'Other',
}

function bucketOf(raw: string | null): PosBucket {
  if (!raw) return 'Other'
  const p = raw.toUpperCase().trim()
  if (p.startsWith('QB') || p.includes('QUARTERBACK')) return 'QB'
  if (/(^|\b)(RB|HB|FB|TB)(\b|$)/.test(p) || p.includes('BACK')) return 'RB'
  if (/(^|\b)(WR|TE)(\b|$)/.test(p) || p.includes('RECEIVER') || p.includes('TIGHT')) return 'WR'
  return 'Other'
}

type SortCol =
  | 'rank' | 'name' | 'team' | 'position' | 'season' | 'gp'
  | 'total_yards' | 'pass_yards' | 'rush_yards' | 'recv_yards'
  | 'total_tds' | 'interceptions'

type ProdCol =
  | 'rank' | 'name' | 'team' | 'position' | 'gp'
  | 'ypg' | 'tds' | 'int' | 'tdRate' | 'prodIdx'

type SeasonFilter = number | 'all'

type AggRow = {
  slug: string
  name: string
  position: string | null
  bucket: PosBucket
  school_slug: string | null
  team_slug: string | null
  team_name: string | null
  season: number | null   // null when aggregated across seasons
  games_played: number | null
  pass_yards: number | null
  rush_yards: number | null
  recv_yards: number | null
  total_yards: number | null
  pass_tds: number | null
  rush_tds: number | null
  recv_tds: number | null
  total_tds: number | null
  interceptions: number | null
}

type ProdRow = AggRow & {
  ypg: number
  tdRate: number
  prodIdx: number
}

function sumN(a: number | null | undefined, b: number | null | undefined) {
  if (a == null && b == null) return null
  return (a ?? 0) + (b ?? 0)
}

function aggregateAcrossSeasons(rows: PlayerMagazineRow[]): AggRow[] {
  const by = new Map<string, AggRow>()
  for (const r of rows) {
    const cur = by.get(r.slug)
    if (!cur) {
      by.set(r.slug, {
        slug:         r.slug,
        name:         r.name,
        position:     r.position,
        bucket:       bucketOf(r.position),
        school_slug:  r.school_slug,
        team_slug:    r.team_slug,
        team_name:    r.team_name,
        season:       null,
        games_played: r.games_played,
        pass_yards:   r.pass_yards,
        rush_yards:   r.rush_yards,
        recv_yards:   r.recv_yards,
        total_yards:  r.total_yards,
        pass_tds:     r.pass_tds,
        rush_tds:     r.rush_tds,
        recv_tds:     r.recv_tds,
        total_tds:    r.total_tds,
        interceptions:r.interceptions,
      })
    } else {
      cur.games_played  = sumN(cur.games_played, r.games_played)
      cur.pass_yards    = sumN(cur.pass_yards,   r.pass_yards)
      cur.rush_yards    = sumN(cur.rush_yards,   r.rush_yards)
      cur.recv_yards    = sumN(cur.recv_yards,   r.recv_yards)
      cur.total_yards   = sumN(cur.total_yards,  r.total_yards)
      cur.pass_tds      = sumN(cur.pass_tds,     r.pass_tds)
      cur.rush_tds      = sumN(cur.rush_tds,     r.rush_tds)
      cur.recv_tds      = sumN(cur.recv_tds,     r.recv_tds)
      cur.total_tds     = sumN(cur.total_tds,    r.total_tds)
      cur.interceptions = sumN(cur.interceptions, r.interceptions)
    }
  }
  return [...by.values()]
}

function buildProdRows(rows: AggRow[]): ProdRow[] {
  const base = rows.map(r => {
    const gp  = r.games_played ?? 0
    const ty  = r.total_yards  ?? 0
    const tt  = r.total_tds    ?? 0
    const it  = r.interceptions ?? 0
    const ypg = gp > 0 ? ty / gp : 0
    const tdRate = gp > 0 ? tt / gp : 0
    return { row: r, ypg, tdRate, intCount: it }
  })

  const z = (vals: number[]) => {
    const m = vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
    const v = vals.reduce((a, b) => a + (b - m) ** 2, 0) / (vals.length || 1)
    const s = Math.sqrt(v) || 1
    return vals.map(x => (x - m) / s)
  }
  const zYPG = z(base.map(b => b.ypg))
  const zTDs = z(base.map(b => b.row.total_tds ?? 0))
  const zINT = z(base.map(b => b.intCount))   // INT subtracts from composite
  const composites = base.map((_, i) => (zYPG[i] + zTDs[i] - zINT[i]) / 3)
  const cMin = Math.min(...composites, 0)
  const cMax = Math.max(...composites, 0)
  const span = cMax - cMin || 1

  return base.map((b, i) => ({
    ...b.row,
    ypg:     b.ypg,
    tdRate:  b.tdRate,
    prodIdx: ((composites[i] - cMin) / span) * 100,
  }))
}

function fmt(v: number | null) {
  return v != null ? v.toLocaleString() : '—'
}
function fmt1(n: number) { return n.toFixed(1) }
function numVal(v: number | null) { return v ?? -1 }

export function PlayerMagazineShell({
  players,
  defaultSeason,
  availableSeasons,
}: {
  players: PlayerMagazineRow[]
  defaultSeason: number
  availableSeasons: readonly number[]
}) {
  const router = useRouter()
  const [activePos,      setActivePos]      = useState<PosBucket>('All')
  const [query,          setQuery]          = useState('')
  const [sortCol,        setSortCol]        = useState<SortCol>('rank')
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc'>('asc')
  const [prodSortCol,    setProdSortCol]    = useState<ProdCol>('rank')
  const [prodSortDir,    setProdSortDir]    = useState<'asc' | 'desc'>('asc')
  const [selectedSeason, setSelectedSeason] = useState<SeasonFilter>(defaultSeason)
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  const sortedSeasons = useMemo(
    () => [...availableSeasons].sort((a, b) => b - a),
    [availableSeasons],
  )
  const seasonOptions = useMemo<SeasonFilter[]>(
    () => ['all', ...sortedSeasons],
    [sortedSeasons],
  )
  function shiftSeason(delta: 1 | -1) {
    const idx = seasonOptions.indexOf(selectedSeason)
    const next = (idx + delta + seasonOptions.length) % seasonOptions.length
    setSelectedSeason(seasonOptions[next])
  }

  function handleRowClick(p: AggRow) {
    router.push(`/player/${p.slug}`)
  }

  function handleSort(c: string) {
    const col = c as SortCol
    if (sortCol === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortCol(col)
      setSortDir(col === 'name' || col === 'team' || col === 'position' || col === 'rank' ? 'asc' : 'desc')
    }
  }
  function handleProdSort(c: string) {
    const col = c as ProdCol
    if (prodSortCol === col) setProdSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setProdSortCol(col)
      const ascDefault = col === 'name' || col === 'team' || col === 'position' || col === 'rank' || col === 'int'
      setProdSortDir(ascDefault ? 'asc' : 'desc')
    }
  }

  // ── Aggregate / filter pipeline ─────────────────────────────────────────
  const aggregated = useMemo<AggRow[]>(() => {
    if (selectedSeason === 'all') {
      return aggregateAcrossSeasons(players)
    }
    return players
      .filter(p => p.season === selectedSeason)
      .map(p => ({
        slug:         p.slug,
        name:         p.name,
        position:     p.position,
        bucket:       bucketOf(p.position),
        school_slug:  p.school_slug,
        team_slug:    p.team_slug,
        team_name:    p.team_name,
        season:       p.season,
        games_played: p.games_played,
        pass_yards:   p.pass_yards,
        rush_yards:   p.rush_yards,
        recv_yards:   p.recv_yards,
        total_yards:  p.total_yards,
        pass_tds:     p.pass_tds,
        rush_tds:     p.rush_tds,
        recv_tds:     p.recv_tds,
        total_tds:    p.total_tds,
        interceptions:p.interceptions,
      }))
  }, [players, selectedSeason])

  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    return aggregated.filter(r => {
      if (activePos !== 'All' && r.bucket !== activePos) return false
      if (q) {
        const blob = `${r.name} ${r.team_name ?? ''} ${r.position ?? ''}`.toLowerCase()
        if (!blob.includes(q)) return false
      }
      return true
    })
  }, [aggregated, activePos, q])

  const sortedRows = useMemo(() => {
    const arr = [...filtered]
    if (sortCol === 'rank') {
      arr.sort((a, b) => numVal(b.total_yards) - numVal(a.total_yards) || a.name.localeCompare(b.name))
      if (sortDir === 'desc') arr.reverse()
      return arr
    }
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (sortCol) {
        case 'name':          av = a.name;                  bv = b.name;                  break
        case 'team':          av = a.team_name ?? '';       bv = b.team_name ?? '';       break
        case 'position':      av = a.position ?? '';        bv = b.position ?? '';        break
        case 'season':        av = a.season ?? 0;           bv = b.season ?? 0;           break
        case 'gp':            av = numVal(a.games_played);  bv = numVal(b.games_played);  break
        case 'total_yards':   av = numVal(a.total_yards);   bv = numVal(b.total_yards);   break
        case 'pass_yards':    av = numVal(a.pass_yards);    bv = numVal(b.pass_yards);    break
        case 'rush_yards':    av = numVal(a.rush_yards);    bv = numVal(b.rush_yards);    break
        case 'recv_yards':    av = numVal(a.recv_yards);    bv = numVal(b.recv_yards);    break
        case 'total_tds':     av = numVal(a.total_tds);     bv = numVal(b.total_tds);     break
        case 'interceptions': av = numVal(a.interceptions); bv = numVal(b.interceptions); break
        default:              av = 0;                       bv = 0
      }
      if (typeof av === 'string') return sortDir === 'asc'
        ? av.localeCompare(bv as string)
        : (bv as string).localeCompare(av)
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [filtered, sortCol, sortDir])

  const prodRows = useMemo(() => buildProdRows(filtered), [filtered])
  const sortedProd = useMemo(() => {
    const arr = [...prodRows]
    if (prodSortCol === 'rank') {
      arr.sort((a, b) => b.prodIdx - a.prodIdx)
      if (prodSortDir === 'desc') arr.reverse()
      return arr
    }
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (prodSortCol) {
        case 'name':     av = a.name;                  bv = b.name;                  break
        case 'team':     av = a.team_name ?? '';       bv = b.team_name ?? '';       break
        case 'position': av = a.position ?? '';        bv = b.position ?? '';        break
        case 'gp':       av = numVal(a.games_played);  bv = numVal(b.games_played);  break
        case 'ypg':      av = a.ypg;                   bv = b.ypg;                   break
        case 'tds':      av = numVal(a.total_tds);     bv = numVal(b.total_tds);     break
        case 'int':      av = numVal(a.interceptions); bv = numVal(b.interceptions); break
        case 'tdRate':   av = a.tdRate;                bv = b.tdRate;                break
        case 'prodIdx':  av = a.prodIdx;               bv = b.prodIdx;               break
        default:         av = 0;                       bv = 0
      }
      if (typeof av === 'string') return prodSortDir === 'asc'
        ? av.localeCompare(bv as string)
        : (bv as string).localeCompare(av)
      return prodSortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [prodRows, prodSortCol, prodSortDir])

  const seasonLabel = selectedSeason === 'all' ? 'All Seasons' : formatSeason(selectedSeason)
  const seasonMeta  = selectedSeason === 'all'
    ? `${availableSeasons.length} seasons combined`
    : `${formatSeason(selectedSeason)} season`

  const distinctPlayerCount = useMemo(
    () => new Set(players.map(p => p.slug)).size,
    [players],
  )

  return (
    <AppLayout paperMode>
    <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

      {/* ── Masthead ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
        <RevealFx delay={0} translateY={4}>
          <EditorialHead
            size="xl"
            eyebrow={`Section XI · Player Almanac · ${seasonLabel}`}
            subhead={
              <>
                Every passer, rusher, and receiver on file — measured by yard, by touchdown, and
                read like a yearbook of names.
              </>
            }
            meta={[
              `${distinctPlayerCount.toLocaleString()} players`,
              '52 programs',
              seasonMeta,
            ]}
          >
            Players
          </EditorialHead>
        </RevealFx>
      </div>

      {/* ── Sticky control bar: season nav + search ────────────────────────── */}
      <StickyControlBar>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
            style={SANS}
          >
            Season
          </span>
          {seasonOptions.length > 1 && (
            <button
              onClick={() => shiftSeason(-1)}
              aria-label="Previous season"
              className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <span
            className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
            style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
          >
            {seasonLabel}
          </span>
          {seasonOptions.length > 1 && (
            <button
              onClick={() => shiftSeason(1)}
              aria-label="Next season"
              className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <SearchInput
          value={query}
          onChange={setQuery}
          inputRef={searchRef}
          placeholder="Search players, teams, positions…"
        />

        <SearchButtonGroup />
      </StickyControlBar>

      {/* ── Roster Index ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-12" id="roster">
        <RevealFx delay={0.15} translateY={8}>
          <SectionHead
            title="Roster Index"
            blurb={
              activePos === 'All'
                ? 'Every player on file — yards, touchdowns, picks. Sort by any column.'
                : `${POS_LABEL[activePos]} — sort by any column.`
            }
            meta={<PositionPills active={activePos} onChange={setActivePos} />}
          />

          {sortedRows.length === 0 ? (
            <EmptyTablet
              label={q
                ? `No players match "${query}" in ${POS_LABEL[activePos]} for ${seasonLabel}.`
                : `No players recorded in ${POS_LABEL[activePos]} for ${seasonLabel}.`}
            />
          ) : (
            <Tablet>
              <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <SortTh col="rank"          label="#"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="pl-5 w-14" />
                      <SortTh col="name"          label="Player"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh col="team"          label="Team"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <SortTh col="position"      label="Pos"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-16" />
                      <SortTh col="total_yards"   label="Tot Yds"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-20" />
                      <SortTh col="pass_yards"    label="Pass"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-20" />
                      <SortTh col="rush_yards"    label="Rush"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-20" />
                      <SortTh col="recv_yards"    label="Rec"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-20" />
                      <SortTh col="total_tds"     label="TD"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-14" />
                      <SortTh col="interceptions" label="INT"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-14 pr-5" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((p, i) => (
                      <tr
                        key={selectedSeason === 'all' ? p.slug : `${p.slug}-${p.season}`}
                        onClick={() => handleRowClick(p)}
                        className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
                      >
                        <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
                          {String(i + 1).padStart(2, ' ')}.
                        </td>
                        <td className={tabletTd}>
                          <Link
                            href={`/player/${p.slug}`}
                            onClick={e => e.stopPropagation()}
                            className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] hover:underline underline-offset-4 decoration-[var(--paper-rule)] transition-colors text-[16px] leading-tight"
                            style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className={tabletTd}>
                          {p.team_slug && p.school_slug ? (
                            <Link
                              href={`/team/${p.team_slug}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-2 text-[var(--paper-muted)] hover:text-[var(--paper-strong)] transition-colors min-w-0"
                            >
                              {SCHOOL_LOGOS[p.school_slug] && (
                                <Image
                                  src={SCHOOL_LOGOS[p.school_slug]}
                                  alt=""
                                  width={18}
                                  height={18}
                                  className="h-[18px] w-[18px] object-contain shrink-0"
                                  unoptimized
                                />
                              )}
                              <span
                                className="truncate"
                                style={{ ...SERIF, fontStyle: 'italic', fontSize: 13.5 }}
                              >
                                {p.team_name ?? '—'}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-[var(--paper-faint)]">—</span>
                          )}
                        </td>
                        <td className={cn(tabletTd, 'text-[var(--paper-muted)]')} style={{ ...SANS, fontSize: 11.5, letterSpacing: '0.04em' }}>
                          {p.position ?? '—'}
                        </td>
                        <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                          {fmt(p.total_yards)}
                        </td>
                        <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                          {fmt(p.pass_yards)}
                        </td>
                        <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                          {fmt(p.rush_yards)}
                        </td>
                        <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                          {fmt(p.recv_yards)}
                        </td>
                        <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums')} style={MONO}>
                          {fmt(p.total_tds)}
                        </td>
                        <td className={cn(tabletTd, 'text-right pr-5 text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                          {fmt(p.interceptions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tablet>
          )}
        </RevealFx>

        {/* ── Production Index ──────────────────────────────────────────── */}
        <div id="production-index" className="mt-16">
          <RevealFx delay={0.22} translateY={8}>
            <SectionHead
              title="Production Index"
              blurb="Per-game output and a composite signature stat — yards-per-game and touchdowns minus interceptions, z-scored within the visible set."
              meta={<PositionPills active={activePos} onChange={setActivePos} />}
            />

            {sortedProd.length === 0 ? (
              <EmptyTablet
                label={q
                  ? `No players match "${query}" in ${POS_LABEL[activePos]} for ${seasonLabel}.`
                  : `No players recorded in ${POS_LABEL[activePos]} for ${seasonLabel}.`}
              />
            ) : (
              <Tablet>
                <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                  <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <SortTh col="rank"     label="#"      sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} className="pl-5 w-14" />
                        <SortTh col="name"     label="Player" sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} />
                        <SortTh col="team"     label="Team"   sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} />
                        <SortTh col="position" label="Pos"    sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} className="w-16" />
                        <SortTh col="gp"       label="GP"     sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} right className="w-14" />
                        <SortTh col="ypg"      label="Yds/G"  sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} right className="w-20" />
                        <SortTh col="tds"      label="TD"     sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} right className="w-14" />
                        <SortTh col="int"      label="INT"    sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} right className="w-14" />
                        <SortTh col="tdRate"   label="TD/G"   sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} right className="w-16" />
                        <SortTh col="prodIdx"  label="PROD"   sortCol={prodSortCol} sortDir={prodSortDir} onSort={handleProdSort} right className="w-20 pr-5" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProd.map((p, i) => (
                        <tr
                          key={selectedSeason === 'all' ? p.slug : `${p.slug}-${p.season}`}
                          onClick={() => handleRowClick(p)}
                          className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
                        >
                          <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
                            {String(i + 1).padStart(2, ' ')}.
                          </td>
                          <td className={tabletTd}>
                            <Link
                              href={`/player/${p.slug}`}
                              onClick={e => e.stopPropagation()}
                              className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] hover:underline underline-offset-4 decoration-[var(--paper-rule)] transition-colors text-[16px] leading-tight"
                              style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className={tabletTd}>
                            {p.team_slug && p.school_slug ? (
                              <Link
                                href={`/team/${p.team_slug}`}
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-2 text-[var(--paper-muted)] hover:text-[var(--paper-strong)] transition-colors min-w-0"
                              >
                                {SCHOOL_LOGOS[p.school_slug] && (
                                  <Image
                                    src={SCHOOL_LOGOS[p.school_slug]}
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] object-contain shrink-0"
                                    unoptimized
                                  />
                                )}
                                <span
                                  className="truncate"
                                  style={{ ...SERIF, fontStyle: 'italic', fontSize: 13.5 }}
                                >
                                  {p.team_name ?? '—'}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-[var(--paper-faint)]">—</span>
                            )}
                          </td>
                          <td className={cn(tabletTd, 'text-[var(--paper-muted)]')} style={{ ...SANS, fontSize: 11.5, letterSpacing: '0.04em' }}>
                            {p.position ?? '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {p.games_played ?? '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                            {p.ypg > 0 ? fmt1(p.ypg) : '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums')} style={MONO}>
                            {fmt(p.total_tds)}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {fmt(p.interceptions)}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {p.tdRate > 0 ? p.tdRate.toFixed(2) : '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right pr-5 tabular-nums font-medium text-[var(--paper-text)]')} style={MONO}>
                            {p.prodIdx.toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tablet>
            )}
          </RevealFx>
        </div>

        {/* ── Colophon ──────────────────────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
          <p
            className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
            style={{ ...SERIF, fontStyle: 'italic' }}
          >
            Career and season totals are drawn from Section XI roster sheets and Newsday box
            scores{selectedSeason === 'all'
              ? ''
              : ` for the ${formatSeason(selectedSeason)} season`}.
            Production Index z-scores yards-per-game, touchdowns, and interceptions across the
            visible set, then rescales the composite from 0 to 100 — useful for comparing
            volume to efficiency, not for ranking against other almanacs.
          </p>
        </div>
      </div>
    </div>
    </AppLayout>
  )
}

// ── Position pills — sit in the SectionHead meta slot ───────────────────────
function PositionPills({
  active,
  onChange,
}: {
  active: PosBucket
  onChange: (p: PosBucket) => void
}) {
  const opts: PosBucket[] = ['All', 'QB', 'RB', 'WR', 'Other']
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {opts.map(p => {
        const on = active === p
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] rounded-full border transition-colors',
              on
                ? 'border-[var(--paper-text)] bg-[var(--paper-text)] text-[var(--paper)]'
                : 'border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)]',
            )}
            style={SANS}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}
