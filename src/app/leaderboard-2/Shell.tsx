'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { PanelPlayer, type AnyPlayerRow } from '@/components/PanelPlayer'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  DivisionTabs,
  type DivisionKey,
} from '@/components/editorial'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason, cn } from '@/lib/utils'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }

// ── Types (mirrors legacy) ───────────────────────────────────────────────────

type Passer = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  completions: number | null; attempts: number | null
  pass_yards: number | null; pass_tds: number | null
  interceptions: number | null; season: number
  comp_pct: number | null; ypa: number | null; ypc: number | null
  td_rate: number | null; int_rate: number | null; td_int_ratio: number | null
  yva: number | null; cmd_score: number | null; gbi_score: number | null; ies_score: number | null
  division: string | null
}
type Rusher = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  rush_attempts: number | null; rush_yards: number | null
  rush_tds: number | null; games_played: number | null; yards_per_game: number | null
  season: number
  division: string | null
}
type Receiver = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  receptions: number | null; recv_yards: number | null
  recv_tds: number | null; season: number
  division: string | null
}
type StatTab = 'Passing' | 'Rushing' | 'Receiving'

type SortDir = 'asc' | 'desc'

type PassCol = 'rank' | 'player_name' | 'school_name' | 'season' | 'pass_yards' | 'attempts' | 'completions' | 'comp_pct' | 'pass_tds' | 'interceptions' | 'ypa' | 'td_rate' | 'int_rate' | 'td_int_ratio' | 'cmd_score' | 'gbi_score' | 'ies_score'
type RushCol = 'rank' | 'player_name' | 'school_name' | 'season' | 'rush_yards' | 'rush_attempts' | 'ypc' | 'rush_tds' | 'ypg' | 'td_pct'
type RecvCol = 'rank' | 'player_name' | 'school_name' | 'season' | 'recv_yards' | 'receptions' | 'ypr' | 'recv_tds'

// ── Helpers ──────────────────────────────────────────────────────────────────

const stripSuffix = (n: string) => n.replace(/\s+Varsity\s+Football$/i, '')
function fmt(v: number | null | undefined) { return v != null ? Number(v).toLocaleString() : '—' }
function fmt1(v: number | null | undefined) { return v != null ? Number(v).toFixed(1) : '—' }
function fmtPct(v: number | null | undefined) {
  if (v == null) return '—'
  const n = Number(v)
  return (n < 1 ? n * 100 : n).toFixed(1) + '%'
}
function numVal(v: number | null | undefined) { return v ?? -1 }

// ── Shell ────────────────────────────────────────────────────────────────────

export function LeaderboardYearbook({
  passers,
  rushers,
  receivers,
  availableSeasons,
}: {
  passers: Passer[]
  rushers: Rusher[]
  receivers: Receiver[]
  availableSeasons: number[]
}) {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const urlTab = searchParams.get('tab') as StatTab | null
  const [statTab, setStatTab] = useState<StatTab>(
    (urlTab === 'Rushing' || urlTab === 'Receiving') ? urlTab : 'Passing'
  )
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all')
  const [versusMode,     setVersusMode]     = useState(false)
  const [query,          setQuery]          = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<AnyPlayerRow | null>(null)
  const [activeDiv,      setActiveDiv]      = useState<DivisionKey>('All')

  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  // Sort state per tab
  const [passCol, setPassCol] = useState<PassCol>('pass_yards')
  const [passDir, setPassDir] = useState<SortDir>('desc')
  const [rushCol, setRushCol] = useState<RushCol>('rush_yards')
  const [rushDir, setRushDir] = useState<SortDir>('desc')
  const [recvCol, setRecvCol] = useState<RecvCol>('recv_yards')
  const [recvDir, setRecvDir] = useState<SortDir>('desc')

  // Compare URL params (versus mode reads/writes these)
  const compareAKey = searchParams.get('a')
  const compareBKey = searchParams.get('b')

  // Season nav (← →)
  const seasonOptions: (number | 'all')[] = useMemo(
    () => ['all', ...availableSeasons],
    [availableSeasons],
  )
  function shiftSeason(delta: 1 | -1) {
    const idx = seasonOptions.indexOf(selectedSeason)
    const next = (idx + delta + seasonOptions.length) % seasonOptions.length
    setSelectedSeason(seasonOptions[next])
  }
  const seasonLabel = selectedSeason === 'all' ? 'All-Time' : formatSeason(selectedSeason)

  // Tab change clears versus + selection, preserves URL tab param
  function handleTabChange(tab: StatTab) {
    setStatTab(tab)
    setSelectedPlayer(null)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('a'); params.delete('b')
    router.replace(`/leaderboard-2?${params.toString()}`, { scroll: false })
  }

  function toggleVersus() {
    if (versusMode) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('a'); params.delete('b')
      router.replace(`/leaderboard-2?${params.toString()}`, { scroll: false })
    } else {
      setSelectedPlayer(null)
    }
    setVersusMode(v => !v)
  }

  function handleAssign(rowKey: string) {
    const params = new URLSearchParams(searchParams.toString())
    const curA = params.get('a')
    const curB = params.get('b')
    if (curA === rowKey) {
      params.delete('a')
      if (curB) { params.set('a', curB); params.delete('b') }
    } else if (curB === rowKey) {
      params.delete('b')
    } else if (!curA) {
      params.set('a', rowKey); params.set('tab', statTab)
    } else if (!curB) {
      params.set('b', rowKey); params.set('tab', statTab)
    } else {
      params.set('a', curB); params.set('b', rowKey); params.set('tab', statTab)
    }
    router.replace(`/leaderboard-2?${params.toString()}`, { scroll: false })
  }

  function handleRowClick(p: Passer | Rusher | Receiver) {
    if (versusMode) return
    const key = `${p.player_slug}__${p.season}`
    const curKey = selectedPlayer ? `${selectedPlayer.player_slug}__${selectedPlayer.season}` : null
    setSelectedPlayer(curKey === key ? null : p as AnyPlayerRow)
  }

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase()

  function matchPlayer(p: { player_name: string; school_name: string; season: number; division: string | null }) {
    if (selectedSeason !== 'all' && p.season !== selectedSeason) return false
    if (activeDiv !== 'All' && p.division !== activeDiv) return false
    if (!q) return true
    return (
      p.player_name.toLowerCase().includes(q) ||
      stripSuffix(p.school_name).toLowerCase().includes(q)
    )
  }

  const filteredPassers   = useMemo(() => passers.filter(matchPlayer),   [passers,   selectedSeason, activeDiv, q])
  const filteredRushers   = useMemo(() => rushers.filter(matchPlayer),   [rushers,   selectedSeason, activeDiv, q])
  const filteredReceivers = useMemo(() => receivers.filter(matchPlayer), [receivers, selectedSeason, activeDiv, q])

  function handlePassSort(c: string) {
    const col = c as PassCol
    if (passCol === col) setPassDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setPassCol(col); setPassDir(col === 'player_name' || col === 'school_name' || col === 'rank' ? 'asc' : 'desc') }
  }
  function handleRushSort(c: string) {
    const col = c as RushCol
    if (rushCol === col) setRushDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setRushCol(col); setRushDir(col === 'player_name' || col === 'school_name' || col === 'rank' ? 'asc' : 'desc') }
  }
  function handleRecvSort(c: string) {
    const col = c as RecvCol
    if (recvCol === col) setRecvDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setRecvCol(col); setRecvDir(col === 'player_name' || col === 'school_name' || col === 'rank' ? 'asc' : 'desc') }
  }

  const sortedPassers = useMemo(() => {
    const arr = [...filteredPassers]
    if (passCol === 'rank') return arr
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (passCol) {
        case 'player_name': av = a.player_name;            bv = b.player_name; break
        case 'school_name': av = stripSuffix(a.school_name); bv = stripSuffix(b.school_name); break
        case 'season':      av = a.season; bv = b.season; break
        default:
          av = numVal((a as unknown as Record<string, number | null>)[passCol])
          bv = numVal((b as unknown as Record<string, number | null>)[passCol])
      }
      if (typeof av === 'string') return passDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return passDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [filteredPassers, passCol, passDir])

  const sortedRushers = useMemo(() => {
    const arr = [...filteredRushers]
    if (rushCol === 'rank') return arr
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      if (rushCol === 'ypc') {
        av = a.rush_attempts ? (a.rush_yards ?? 0) / a.rush_attempts : 0
        bv = b.rush_attempts ? (b.rush_yards ?? 0) / b.rush_attempts : 0
      } else if (rushCol === 'ypg') {
        av = a.yards_per_game != null ? Number(a.yards_per_game) : 0
        bv = b.yards_per_game != null ? Number(b.yards_per_game) : 0
      } else if (rushCol === 'td_pct') {
        av = a.rush_attempts ? (a.rush_tds ?? 0) / a.rush_attempts * 100 : 0
        bv = b.rush_attempts ? (b.rush_tds ?? 0) / b.rush_attempts * 100 : 0
      } else if (rushCol === 'player_name') {
        av = a.player_name; bv = b.player_name
      } else if (rushCol === 'school_name') {
        av = stripSuffix(a.school_name); bv = stripSuffix(b.school_name)
      } else if (rushCol === 'season') {
        av = a.season; bv = b.season
      } else {
        av = numVal((a as unknown as Record<string, number | null>)[rushCol])
        bv = numVal((b as unknown as Record<string, number | null>)[rushCol])
      }
      if (typeof av === 'string') return rushDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return rushDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [filteredRushers, rushCol, rushDir])

  const sortedReceivers = useMemo(() => {
    const arr = [...filteredReceivers]
    if (recvCol === 'rank') return arr
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      if (recvCol === 'ypr') {
        av = a.receptions ? (a.recv_yards ?? 0) / a.receptions : 0
        bv = b.receptions ? (b.recv_yards ?? 0) / b.receptions : 0
      } else if (recvCol === 'player_name') {
        av = a.player_name; bv = b.player_name
      } else if (recvCol === 'school_name') {
        av = stripSuffix(a.school_name); bv = stripSuffix(b.school_name)
      } else if (recvCol === 'season') {
        av = a.season; bv = b.season
      } else {
        av = numVal((a as unknown as Record<string, number | null>)[recvCol])
        bv = numVal((b as unknown as Record<string, number | null>)[recvCol])
      }
      if (typeof av === 'string') return recvDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return recvDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [filteredReceivers, recvCol, recvDir])

  // ── Arrow-key player nav (non-versus only) ──────────────────────────────
  useEffect(() => {
    if (versusMode || !selectedPlayer) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const list: (Passer | Rusher | Receiver)[] = statTab === 'Passing'
        ? sortedPassers
        : statTab === 'Rushing' ? sortedRushers : sortedReceivers
      const curKey = `${selectedPlayer!.player_slug}__${selectedPlayer!.season}`
      const idx = list.findIndex(p => `${p.player_slug}__${p.season}` === curKey)
      if (idx === -1) return
      const next = e.key === 'ArrowDown' ? Math.min(idx + 1, list.length - 1) : Math.max(idx - 1, 0)
      if (next !== idx) setSelectedPlayer(list[next] as AnyPlayerRow)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [versusMode, selectedPlayer, statTab, sortedPassers, sortedRushers, sortedReceivers])

  // ── Counts for masthead meta ─────────────────────────────────────────────

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

        {/* ── Masthead ───────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow={`Section XI · The Yearbook · ${seasonLabel}`}
              subhead={
                <>
                  The class of every year — measured by yard, by touchdown, and by
                  signature stat. Top 25 per season, then sorted however you like.
                </>
              }
              meta={[
                <Link key="division" href="/division/division-i" className="hover:text-[var(--paper-strong)] transition-colors">Division</Link>,
                <Link key="team"     href="/team"               className="hover:text-[var(--paper-strong)] transition-colors">Team</Link>,
                <Link key="player"   href="/player"             className="hover:text-[var(--paper-strong)] transition-colors">Player</Link>,
              ]}
            >
              Leaderboard
            </EditorialHead>
          </RevealFx>
        </div>

        {/* ── Sticky control bar ─────────────────────────────────────── */}
        <StickyControlBar>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>Season</span>
            {seasonOptions.length > 1 && (
              <button onClick={() => shiftSeason(-1)} aria-label="Previous season"
                className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
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
              <button onClick={() => shiftSeason(1)} aria-label="Next season"
                className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors">
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            inputRef={searchRef}
            placeholder="Search players & teams…"
          />

          <SearchButtonGroup />
        </StickyControlBar>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24">

          <main className="min-w-0">
          <RevealFx delay={0.15} translateY={8}>
            <SectionHead
              noRule
              title={
                <span className="inline-flex items-center gap-4">
                  <span>{
                    statTab === 'Passing'   ? 'Passing Leaderboard'
                    : statTab === 'Rushing' ? 'Rushing Leaderboard'
                    : 'Receiving Leaderboard'
                  }</span>
                  <button
                    onClick={() => {
                      const order: StatTab[] = ['Passing', 'Rushing', 'Receiving']
                      const next = order[(order.indexOf(statTab) + 1) % order.length]
                      handleTabChange(next)
                    }}
                    aria-label="Next leaderboard"
                    className="inline-flex items-center justify-center text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-colors duration-150"
                  >
                    <ArrowRight className="h-8 w-8" />
                  </button>
                </span>
              }
            />

            <DivisionTabs
              active={activeDiv}
              onChange={setActiveDiv}
              rightSlot={
                <div className="flex items-center gap-2.5">
                  <Label
                    htmlFor="versus-switch"
                    className={cn(
                      'cursor-pointer select-none transition-colors',
                      versusMode ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-muted)] hover:text-[var(--paper-text)]',
                    )}
                    style={{ ...SERIF, fontStyle: 'italic', fontSize: 15 }}
                  >
                    Vs.
                  </Label>
                  <Switch
                    id="versus-switch"
                    checked={versusMode}
                    onCheckedChange={toggleVersus}
                    className={cn(
                      'border border-[var(--paper-rule)]',
                      'data-[state=unchecked]:bg-[var(--paper-quiet)]',
                      'data-[state=checked]:!bg-[var(--paper-strong)]',
                      '[&_span]:bg-[var(--paper-text)] [&_span]:shadow-none',
                      'data-[state=checked]:[&_span]:bg-[var(--paper)]',
                    )}
                  />
                </div>
              }
            />

            {statTab === 'Passing' && (
              <PassingTablet
                rows={sortedPassers}
                sortCol={passCol}
                sortDir={passDir}
                onSort={handlePassSort}
                onRowClick={handleRowClick}
                onAssign={handleAssign}
                selectedPlayer={selectedPlayer}
                versusMode={versusMode}
                compareAKey={compareAKey}
                compareBKey={compareBKey}
              />
            )}

            {statTab === 'Rushing' && (
              <RushingTablet
                rows={sortedRushers}
                sortCol={rushCol}
                sortDir={rushDir}
                onSort={handleRushSort}
                onRowClick={handleRowClick}
                onAssign={handleAssign}
                selectedPlayer={selectedPlayer}
                versusMode={versusMode}
                compareAKey={compareAKey}
                compareBKey={compareBKey}
              />
            )}

            {statTab === 'Receiving' && (
              <ReceivingTablet
                rows={sortedReceivers}
                sortCol={recvCol}
                sortDir={recvDir}
                onSort={handleRecvSort}
                onRowClick={handleRowClick}
                onAssign={handleAssign}
                selectedPlayer={selectedPlayer}
                versusMode={versusMode}
                compareAKey={compareAKey}
                compareBKey={compareBKey}
              />
            )}
          </RevealFx>

          {/* ── Colophon ─────────────────────────────────────────── */}
          <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
            <p
              className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
              style={{ ...SERIF, fontStyle: 'italic' }}
            >
              Leaders are drawn from Section XI roster sheets and Newsday box scores —
              top 25 per stat type per season. Foundational QB metrics (YPA, YPC, TD%,
              INT%, TD:INT, YVA) and Advanced QB scores (CMD, GBI, IES) are computed
              from the same source data; hover the column headers for definitions, or
              read the methodology in the <Link href="/glossary" className="text-[var(--paper-strong)] hover:underline underline-offset-4">glossary</Link>.
              Versus mode opens a side-by-side breakdown of any two selected leaders.
            </p>
          </div>
          </main>
        </div>

        {/* ── Player panel (non-versus row click) ──────────────────── */}
        <PanelPlayer
          player={selectedPlayer}
          statTab={statTab}
          onClose={() => setSelectedPlayer(null)}
        />
      </div>
    </AppLayout>
  )
}

// ── Shared player cell — rank + logo + Name/School stacked ─────────────────

type SharedRowProps<R extends { player_slug: string; player_name: string; school_slug: string; school_name: string; season: number }> = {
  rows: R[]
  onRowClick: (r: R) => void
  onAssign: (rowKey: string) => void
  selectedPlayer: AnyPlayerRow | null
  versusMode: boolean
  compareAKey: string | null
  compareBKey: string | null
}

function RankCell({ rank }: { rank: number }) {
  return (
    <td className={cn(tabletTd, 'pl-5 tabular-nums w-14 text-[var(--paper-faint)]')} style={MONO}>
      {rank}.
    </td>
  )
}

function PlayerNameCell({
  slug, name, versusMode, isA, isB, hasA, onAssign,
}: {
  slug: string
  name: string
  versusMode: boolean
  isA: boolean
  isB: boolean
  hasA: boolean
  onAssign: () => void
}) {
  const active = isA || isB
  const chipLabel = isA ? 'Player 1' : isB ? 'Player 2' : (hasA ? 'Player 2' : 'Player 1')
  const isSlot2 = isB || (!isA && hasA)
  return (
    <td className={tabletTd}>
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href={`/player/${slug}`}
          onClick={e => e.stopPropagation()}
          className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] hover:underline transition-colors text-[15px] leading-tight whitespace-nowrap"
          style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {name}
        </Link>
        {versusMode && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onAssign() }}
            className={cn(
              'shrink-0 ml-auto px-3 py-0.5 rounded-full text-[10px] uppercase tracking-[0.18em] border transition-all',
              active
                ? 'opacity-100 text-[var(--paper)]'
                : 'opacity-0 group-hover/row:opacity-100',
            )}
            style={
              active
                ? { background: isSlot2 ? '#b91c1c' : 'var(--paper-strong)', borderColor: 'transparent' }
                : { color: isSlot2 ? '#dc2626' : 'var(--paper-strong)', borderColor: isSlot2 ? '#dc2626' : 'var(--paper-strong)' }
            }
            aria-label={isA ? 'Remove Player 1' : isB ? 'Remove Player 2' : `Assign as ${chipLabel}`}
          >
            {chipLabel}
          </button>
        )}
      </div>
    </td>
  )
}

function TeamCell({ schoolSlug, schoolName }: { schoolSlug: string; schoolName: string }) {
  const logo = SCHOOL_LOGOS[schoolSlug]
  return (
    <td className={tabletTd}>
      <Link
        href={`/team/${schoolSlug}-varsity-football`}
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-2 text-[var(--paper-muted)] hover:text-[var(--paper-strong)] hover:underline transition-colors min-w-0"
      >
        {logo && (
          <Image src={logo} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain shrink-0" unoptimized />
        )}
        <span className="truncate" style={{ ...SERIF, fontStyle: 'italic', fontSize: 13.5 }}>{stripSuffix(schoolName)}</span>
      </Link>
    </td>
  )
}

// ── Passing Tablet ──────────────────────────────────────────────────────────

function PassingTablet({
  rows, sortCol, sortDir, onSort, onRowClick, onAssign, selectedPlayer, versusMode, compareAKey, compareBKey,
}: SharedRowProps<Passer> & { sortCol: PassCol; sortDir: SortDir; onSort: (c: string) => void }) {
  if (rows.length === 0) return <EmptyTablet label="No passing leaders for this filter." />

  return (
    <Tablet>
      <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="border-b border-[var(--paper-rule)]">
              <th colSpan={4} className="pl-5 pr-3 pt-3 pb-1.5 text-left" />
              <th colSpan={6} className="px-3 pt-3 pb-1.5 text-left">
                <span className="text-[9px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>Standard</span>
              </th>
              <th colSpan={4} className="px-3 pt-3 pb-1.5 text-left border-l border-[var(--paper-rule-soft)]">
                <span className="text-[9px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>Foundational QB</span>
              </th>
              <th colSpan={3} className="px-3 pr-5 pt-3 pb-1.5 text-left border-l border-[var(--paper-rule-soft)]">
                <span className="text-[9px] uppercase tracking-[0.24em] text-[var(--paper-strong)]" style={SANS}>Advanced QB</span>
              </th>
            </tr>
            <tr>
              <SortTh col="rank"         label="#"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="pl-5 w-14" />
              <SortTh col="player_name"  label="Player" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortTh col="school_name"  label="Team"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortTh col="season"       label="Season" sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="w-24" />
              <SortTh col="pass_yards"   label="YDS"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-16" glossaryId="pass-yds" />
              <SortTh col="attempts"     label="ATT"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" glossaryId="att-pass" />
              <SortTh col="completions"  label="CMP"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" glossaryId="comp" />
              <SortTh col="comp_pct"     label="CMP%"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-16" glossaryId="comp-pct" />
              <SortTh col="pass_tds"     label="TD"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-12" glossaryId="pass-td" />
              <SortTh col="interceptions" label="INT"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-12" glossaryId="int" />
              <SortTh col="ypa"          label="YPA"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14 border-l border-[var(--paper-rule-soft)]" glossaryId="ypa" />
              <SortTh col="td_rate"      label="TD%"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" glossaryId="td-rate" />
              <SortTh col="int_rate"     label="INT%"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" glossaryId="int-rate" />
              <SortTh col="td_int_ratio" label="TD:INT" sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-16" glossaryId="td-int" />
              <SortTh col="cmd_score"    label="CMD"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14 border-l border-[var(--paper-rule-soft)]" glossaryId="cmd" />
              <SortTh col="gbi_score"    label="GBI"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" glossaryId="gbi" />
              <SortTh col="ies_score"    label="IES"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14 pr-5" glossaryId="ies" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const rowKey  = `${p.player_slug}__${p.season}`
              const isA     = compareAKey === rowKey
              const isB     = compareBKey === rowKey
              const onPanel = selectedPlayer && `${selectedPlayer.player_slug}__${selectedPlayer.season}` === rowKey
              return (
                <PassingRow
                  key={rowKey}
                  rank={i + 1}
                  p={p}
                  onClick={() => onRowClick(p)}
                  active={!!onPanel}
                  versusMode={versusMode}
                  isA={isA}
                  isB={isB}
                  hasA={!!compareAKey}
                  onAssign={() => onAssign(rowKey)}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </Tablet>
  )
}

function PassingRow({ rank, p, onClick, active, versusMode, isA, isB, hasA, onAssign }: {
  rank: number; p: Passer; onClick: () => void
  active: boolean; versusMode: boolean
  isA: boolean; isB: boolean; hasA: boolean; onAssign: () => void
}) {
  const compareActive = isA || isB
  return (
    <tr
      onClick={onClick}
      className={cn(
        'group/row border-t border-[var(--paper-rule-soft)] transition-colors',
        !versusMode && 'cursor-pointer',
        active
          ? 'bg-[color:color-mix(in_srgb,var(--paper-strong)_10%,transparent)]'
          : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
        compareActive && 'bg-[color:color-mix(in_srgb,var(--paper-strong)_12%,transparent)]',
      )}
    >
      <RankCell rank={rank} />
      <PlayerNameCell slug={p.player_slug} name={p.player_name} versusMode={versusMode} isA={isA} isB={isB} hasA={hasA} onAssign={onAssign} />
      <TeamCell schoolSlug={p.school_slug} schoolName={p.school_name} />
      <td className={cn(tabletTd, 'tabular-nums text-[var(--paper-muted)] whitespace-nowrap')} style={MONO}>{formatSeason(p.season)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums font-medium text-[var(--paper-text)]')} style={MONO}>{fmt(p.pass_yards)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{fmt(p.attempts)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{fmt(p.completions)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{fmtPct(p.comp_pct)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{fmt(p.pass_tds)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{fmt(p.interceptions)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)] border-l border-[var(--paper-rule-soft)]')} style={MONO}>{fmt1(p.ypa)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{fmtPct(p.td_rate)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{fmtPct(p.int_rate)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{fmt1(p.td_int_ratio)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-strong)] border-l border-[var(--paper-rule-soft)]')} style={MONO}>{fmt1(p.cmd_score)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-strong)]')} style={MONO}>{fmt1(p.gbi_score)}</td>
      <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-strong)] pr-5')} style={MONO}>{fmt1(p.ies_score)}</td>
    </tr>
  )
}

// ── Rushing Tablet ─────────────────────────────────────────────────────────

function RushingTablet({
  rows, sortCol, sortDir, onSort, onRowClick, onAssign, selectedPlayer, versusMode, compareAKey, compareBKey,
}: SharedRowProps<Rusher> & { sortCol: RushCol; sortDir: SortDir; onSort: (c: string) => void }) {
  if (rows.length === 0) return <EmptyTablet label="No rushing leaders for this filter." />

  return (
    <Tablet>
      <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              <SortTh col="rank"          label="#"      sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="pl-5 w-14" />
              <SortTh col="player_name"   label="Player" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortTh col="school_name"   label="Team"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortTh col="season"        label="Season" sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="w-24" />
              <SortTh col="rush_yards"    label="YDS"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-16" />
              <SortTh col="rush_attempts" label="ATT"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" />
              <SortTh col="ypc"           label="YPC"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" />
              <SortTh col="rush_tds"      label="TD"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-12" />
              <SortTh col="ypg"           label="YPG"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" />
              <SortTh col="td_pct"        label="TD%"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14 pr-5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const rowKey = `${p.player_slug}__${p.season}`
              const isA = compareAKey === rowKey
              const isB = compareBKey === rowKey
              const compareActive = isA || isB
              const active = !!selectedPlayer && `${selectedPlayer.player_slug}__${selectedPlayer.season}` === rowKey
              const ypc = p.rush_attempts ? (p.rush_yards ?? 0) / p.rush_attempts : null
              const tdPct = p.rush_attempts ? (p.rush_tds ?? 0) / p.rush_attempts : null
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick(p)}
                  className={cn(
                    'group/row border-t border-[var(--paper-rule-soft)] transition-colors',
                    !versusMode && 'cursor-pointer',
                    active
                      ? 'bg-[color:color-mix(in_srgb,var(--paper-strong)_10%,transparent)]'
                      : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
                    compareActive && 'bg-[color:color-mix(in_srgb,var(--paper-strong)_12%,transparent)]',
                  )}
                >
                  <RankCell rank={i + 1} />
                  <PlayerNameCell slug={p.player_slug} name={p.player_name} versusMode={versusMode} isA={isA} isB={isB} hasA={!!compareAKey} onAssign={() => onAssign(rowKey)} />
                  <TeamCell schoolSlug={p.school_slug} schoolName={p.school_name} />
                  <td className={cn(tabletTd, 'tabular-nums text-[var(--paper-muted)] whitespace-nowrap')} style={MONO}>{formatSeason(p.season)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums font-medium text-[var(--paper-text)]')} style={MONO}>{fmt(p.rush_yards)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{fmt(p.rush_attempts)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{fmt1(ypc)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{fmt(p.rush_tds)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{fmt1(p.yards_per_game)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)] pr-5')} style={MONO}>{fmtPct(tdPct)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Tablet>
  )
}

// ── Receiving Tablet ───────────────────────────────────────────────────────

function ReceivingTablet({
  rows, sortCol, sortDir, onSort, onRowClick, onAssign, selectedPlayer, versusMode, compareAKey, compareBKey,
}: SharedRowProps<Receiver> & { sortCol: RecvCol; sortDir: SortDir; onSort: (c: string) => void }) {
  if (rows.length === 0) return <EmptyTablet label="No receiving leaders for this filter." />

  return (
    <Tablet>
      <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
        <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
          <thead>
            <tr>
              <SortTh col="rank"        label="#"      sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="pl-5 w-14" />
              <SortTh col="player_name" label="Player" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortTh col="school_name" label="Team"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <SortTh col="season"      label="Season" sortCol={sortCol} sortDir={sortDir} onSort={onSort} className="w-24" />
              <SortTh col="recv_yards"  label="YDS"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-16" />
              <SortTh col="receptions"  label="REC"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" />
              <SortTh col="ypr"         label="YPR"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-14" />
              <SortTh col="recv_tds"    label="TD"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} right className="w-12 pr-5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const rowKey = `${p.player_slug}__${p.season}`
              const isA = compareAKey === rowKey
              const isB = compareBKey === rowKey
              const compareActive = isA || isB
              const active = !!selectedPlayer && `${selectedPlayer.player_slug}__${selectedPlayer.season}` === rowKey
              const ypr = p.receptions ? (p.recv_yards ?? 0) / p.receptions : null
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick(p)}
                  className={cn(
                    'group/row border-t border-[var(--paper-rule-soft)] transition-colors',
                    !versusMode && 'cursor-pointer',
                    active
                      ? 'bg-[color:color-mix(in_srgb,var(--paper-strong)_10%,transparent)]'
                      : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]',
                    compareActive && 'bg-[color:color-mix(in_srgb,var(--paper-strong)_12%,transparent)]',
                  )}
                >
                  <RankCell rank={i + 1} />
                  <PlayerNameCell slug={p.player_slug} name={p.player_name} versusMode={versusMode} isA={isA} isB={isB} hasA={!!compareAKey} onAssign={() => onAssign(rowKey)} />
                  <TeamCell schoolSlug={p.school_slug} schoolName={p.school_name} />
                  <td className={cn(tabletTd, 'tabular-nums text-[var(--paper-muted)] whitespace-nowrap')} style={MONO}>{formatSeason(p.season)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums font-medium text-[var(--paper-text)]')} style={MONO}>{fmt(p.recv_yards)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-muted)]')} style={MONO}>{fmt(p.receptions)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)]')} style={MONO}>{fmt1(ypr)}</td>
                  <td className={cn(tabletTd, 'text-right tabular-nums text-[var(--paper-text)] pr-5')} style={MONO}>{fmt(p.recv_tds)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Tablet>
  )
}
