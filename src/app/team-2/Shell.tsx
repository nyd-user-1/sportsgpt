'use client'

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ChartSpline, FileUser, MessageCircle } from 'lucide-react'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  EditorialButtonGroup,
  SectionHead,
  StickyControlBar,
  SearchInput,
  useSearchHotkey,
  Tablet,
  EmptyTablet,
  SortTh,
  MONO,
  tabletTd,
} from '@/components/editorial'
import { ChatSeasonsPanel, type TeamMeta } from '@/components/ChatSeasonsPanel'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TeamMagazineRow } from './page'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

const DIV_LABEL: Record<string, string> = {
  All: 'All Divisions',
  I:   'Division I',
  II:  'Division II',
  III: 'Division III',
  IV:  'Division IV',
}

const DIV_DOT_COUNT: Record<'All' | 'I' | 'II' | 'III' | 'IV', number> = {
  All: 5, I: 1, II: 2, III: 3, IV: 4,
}

function DivisionDots({ active }: { active: 'All' | 'I' | 'II' | 'III' | 'IV' }) {
  const solid = DIV_DOT_COUNT[active]
  return (
    <span
      role="img"
      aria-label={DIV_LABEL[active]}
      className="inline-flex items-center align-middle text-[var(--paper-strong)]"
      style={{ gap: 4 }}
    >
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          aria-hidden
          className="block rounded-full bg-current"
          style={{ width: 5, height: 5, opacity: n <= solid ? 1 : 0.18 }}
        />
      ))}
    </span>
  )
}

type SortCol =
  | 'rank' | 'name' | 'division' | 'season'
  | 'gp' | 'wins' | 'losses' | 'ties'
  | 'pct' | 'conf' | 'pf' | 'pa' | 'diff'

type OffCol =
  | 'rank' | 'name' | 'division'
  | 'gp' | 'ppg' | 'passYpg' | 'rushYpg' | 'ypg'
  | 'tds' | 'ypp' | 'mov' | 'offIdx'

type SeasonFilter = number | 'all'

type OffRow = TeamMagazineRow & {
  ppg: number; passYpg: number; rushYpg: number; ypg: number
  tds: number; ypp: number; mov: number; offIdx: number
}

const stripSuffix = (n: string) => n.replace(/\s+Varsity\s+Football$/i, '')

function pct(w: number | null, l: number | null) {
  const ww = w ?? 0, ll = l ?? 0, g = ww + ll
  return g === 0 ? 0 : ww / g
}
function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0, ll = l ?? 0, g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}
function fmtRecord(w: number | null, l: number | null) {
  if (w == null && l == null) return '—'
  return `${w ?? 0}–${l ?? 0}`
}
function diffOf(t: TeamMagazineRow) {
  return (t.points_for ?? 0) - (t.points_against ?? 0)
}

// ── Offensive Index helpers ───────────────────────────────────────────────────

function offBase(t: TeamMagazineRow) {
  const gp     = t.games_played ?? 0
  const pf     = t.points_for ?? 0
  const pa     = t.points_against ?? 0
  const pass   = t.pass_yds ?? 0
  const rush   = t.rush_yds ?? 0
  const tds    = (t.pass_tds ?? 0) + (t.rush_tds ?? 0)
  const tot    = pass + rush
  const ppg    = gp > 0 ? pf  / gp : 0
  const passYpg= gp > 0 ? pass / gp : 0
  const rushYpg= gp > 0 ? rush / gp : 0
  const ypg    = gp > 0 ? tot  / gp : 0
  const ypp    = pf > 0 ? tot  / pf : 0
  const mov    = gp > 0 ? (pf - pa) / gp : 0
  return { ppg, passYpg, rushYpg, ypg, tds, ypp, mov }
}

function buildOffRows(rows: TeamMagazineRow[]): OffRow[] {
  const base = rows.map(r => ({ row: r, ...offBase(r) }))
  // Off Idx: equal-weight z-score blend of PPG, YPG, MoV — rescaled 0–100 within the visible set
  const z = (vals: number[]) => {
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length || 1)
    const std = Math.sqrt(variance) || 1
    return vals.map(v => (v - mean) / std)
  }
  const zPPG = z(base.map(b => b.ppg))
  const zYPG = z(base.map(b => b.ypg))
  const zMoV = z(base.map(b => b.mov))
  const composites = base.map((_, i) => (zPPG[i] + zYPG[i] + zMoV[i]) / 3)
  const cMin = Math.min(...composites, 0)
  const cMax = Math.max(...composites, 0)
  const span = cMax - cMin || 1
  return base.map((b, i) => ({
    ...b.row,
    ppg: b.ppg, passYpg: b.passYpg, rushYpg: b.rushYpg, ypg: b.ypg,
    tds: b.tds, ypp: b.ypp, mov: b.mov,
    offIdx: ((composites[i] - cMin) / span) * 100,
  }))
}

function fmt1(n: number) { return n.toFixed(1) }
function fmtSign(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(1) }

export function TeamMagazineShell({
  teams,
  defaultSeason,
  availableSeasons,
}: {
  teams: TeamMagazineRow[]
  defaultSeason: number
  availableSeasons: readonly number[]
}) {
  const [activeDiv,      setActiveDiv]      = useState<'All' | 'I' | 'II' | 'III' | 'IV'>('All')
  const [query,          setQuery]          = useState('')
  const [sortCol,        setSortCol]        = useState<SortCol>('rank')
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc'>('asc')
  const [offSortCol,     setOffSortCol]     = useState<OffCol>('rank')
  const [offSortDir,     setOffSortDir]     = useState<'asc' | 'desc'>('asc')
  const [selectedSeason, setSelectedSeason] = useState<SeasonFilter>(defaultSeason)
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  // Seasons panel state
  const [panelTeam,   setPanelTeam]   = useState<TeamMeta | null>(null)
  const [panelSeason, setPanelSeason] = useState<number | null>(null)

  // Toolbar panel state
  const [chartsOpen,  setChartsOpen]  = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const [chatOpen,    setChatOpen]    = useState(false)

  // Season nav — sort newest first, prepend 'all', wrap around
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

  function handleRowClick(t: TeamMagazineRow) {
    if (!t.school_slug) return
    setPanelTeam({ slug: t.school_slug, name: t.name })
    setPanelSeason(selectedSeason === 'all' ? null : selectedSeason)
  }

  function handleSort(c: string) {
    const col = c as SortCol
    if (sortCol === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortCol(col)
      setSortDir(col === 'name' || col === 'division' || col === 'rank' ? 'asc' : 'desc')
    }
  }

  function handleOffSort(c: string) {
    const col = c as OffCol
    if (offSortCol === col) setOffSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setOffSortCol(col)
      // ypp lower is better → default asc; everything else default desc
      const ascDefault = col === 'name' || col === 'division' || col === 'rank' || col === 'ypp'
      setOffSortDir(ascDefault ? 'asc' : 'desc')
    }
  }

  const distinctTeamCount = useMemo(
    () => new Set(teams.map(t => t.slug)).size,
    [teams],
  )

  // ── Filter teams: selected season + division + search ───────────────────
  const q = query.trim().toLowerCase()

  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      if (selectedSeason !== 'all' && t.season !== selectedSeason) return false
      if (activeDiv !== 'All' && t.division !== activeDiv) return false
      if (q && !stripSuffix(t.name).toLowerCase().includes(q)) return false
      return true
    })
  }, [teams, selectedSeason, activeDiv, q])

  const sortedTeams = useMemo(() => {
    const arr = [...filteredTeams]
    if (sortCol === 'rank') {
      arr.sort((a, b) => {
        // When showing all seasons, group by season newest-first
        if (selectedSeason === 'all') {
          const sd = b.season - a.season
          if (sd !== 0) return sd
        }
        const dv = a.division.localeCompare(b.division)
        if (dv !== 0) return dv
        const wd = (b.overall_wins ?? -1) - (a.overall_wins ?? -1)
        if (wd !== 0) return wd
        return a.name.localeCompare(b.name)
      })
      if (sortDir === 'desc') arr.reverse()
      return arr
    }
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (sortCol) {
        case 'name':     av = a.name;                       bv = b.name;                       break
        case 'division': av = a.division;                   bv = b.division;                   break
        case 'season':   av = a.season;                     bv = b.season;                     break
        case 'gp':       av = a.games_played    ?? -1;      bv = b.games_played    ?? -1;      break
        case 'wins':     av = a.overall_wins    ?? -1;      bv = b.overall_wins    ?? -1;      break
        case 'losses':   av = a.overall_losses  ?? -1;      bv = b.overall_losses  ?? -1;      break
        case 'ties':     av = a.overall_ties    ?? -1;      bv = b.overall_ties    ?? -1;      break
        case 'pct':      av = pct(a.overall_wins, a.overall_losses); bv = pct(b.overall_wins, b.overall_losses); break
        case 'conf':     av = a.conference_wins ?? -1;      bv = b.conference_wins ?? -1;      break
        case 'pf':       av = a.points_for      ?? -1;      bv = b.points_for      ?? -1;      break
        case 'pa':       av = a.points_against  ?? -1;      bv = b.points_against  ?? -1;      break
        case 'diff':     av = diffOf(a);                    bv = diffOf(b);                    break
        default:         av = 0;                            bv = 0
      }
      if (typeof av === 'string') return sortDir === 'asc'
        ? av.localeCompare(bv as string)
        : (bv as string).localeCompare(av)
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [filteredTeams, sortCol, sortDir, selectedSeason])

  const seasonLabel = selectedSeason === 'all' ? 'All Seasons' : formatSeason(selectedSeason)
  const seasonMeta  = selectedSeason === 'all' ? `${availableSeasons.length} seasons` : `${formatSeason(selectedSeason)} season`

  // ── Offensive Index — derived rows + sort ───────────────────────────────
  const offRows = useMemo(() => buildOffRows(filteredTeams), [filteredTeams])
  const sortedOffRows = useMemo(() => {
    const arr = [...offRows]
    if (offSortCol === 'rank') {
      arr.sort((a, b) => b.offIdx - a.offIdx)
      if (offSortDir === 'desc') arr.reverse()
      return arr
    }
    arr.sort((a, b) => {
      let av: number | string, bv: number | string
      switch (offSortCol) {
        case 'name':     av = a.name;     bv = b.name;     break
        case 'division': av = a.division; bv = b.division; break
        case 'gp':       av = a.games_played ?? -1; bv = b.games_played ?? -1; break
        case 'ppg':      av = a.ppg;      bv = b.ppg;      break
        case 'passYpg':  av = a.passYpg;  bv = b.passYpg;  break
        case 'rushYpg':  av = a.rushYpg;  bv = b.rushYpg;  break
        case 'ypg':      av = a.ypg;      bv = b.ypg;      break
        case 'tds':      av = a.tds;      bv = b.tds;      break
        case 'ypp':      av = a.ypp;      bv = b.ypp;      break
        case 'mov':      av = a.mov;      bv = b.mov;      break
        case 'offIdx':   av = a.offIdx;   bv = b.offIdx;   break
        default:         av = 0;          bv = 0
      }
      if (typeof av === 'string') return offSortDir === 'asc'
        ? av.localeCompare(bv as string)
        : (bv as string).localeCompare(av)
      return offSortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return arr
  }, [offRows, offSortCol, offSortDir])

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

        {/* ── Masthead ───────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow={`Section XI · Annual Report · ${seasonLabel}`}
              subhead={
                <>
                  Fifty-two programs, four divisions, one Suffolk County football almanac —
                  ranked, sorted, and read like a yearbook.
                </>
              }
              meta={[
                `${distinctTeamCount} teams`,
                '4 divisions',
                seasonMeta,
              ]}
            >
              Teams
            </EditorialHead>
          </RevealFx>
        </div>

        {/* ── Sticky control bar: season nav + search ────────────────────── */}
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
                aria-label="Previous"
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
                aria-label="Next"
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
            placeholder="Search opponents & players…"
          />

          <div className="ml-auto">
            <EditorialButtonGroup
              buttons={[
                { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen,  onClick: () => setChartsOpen(v => !v) },
                { icon: FileUser,      tooltip: 'Players',       active: playersOpen, onClick: () => setPlayersOpen(v => !v) },
                { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,    onClick: () => setChatOpen(v => !v) },
              ]}
            />
          </div>
        </StickyControlBar>

        {/* ── Standings Index — full sortable table ──────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-12" id="standings">
          <RevealFx delay={0.15} translateY={8}>
            <SectionHead
              title="Standings Index"
              eyebrow={<DivisionDots active={activeDiv} />}
              blurb={
                activeDiv === 'All'
                  ? 'Every team on file — sort by any column.'
                  : `${DIV_LABEL[activeDiv]} — sort by any column.`
              }
              meta={<DivisionPills active={activeDiv} onChange={setActiveDiv} />}
            />

            {sortedTeams.length === 0 ? (
              <EmptyTablet
                label={q
                  ? `No teams match “${query}” in ${DIV_LABEL[activeDiv]} for ${seasonLabel}.`
                  : `No teams recorded in ${DIV_LABEL[activeDiv]} for ${seasonLabel}.`}
              />
            ) : (
              <Tablet>
                <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                  <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <SortTh col="rank"     label="#"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="pl-5 w-14" />
                        {selectedSeason === 'all' && (
                          <SortTh col="season" label="Season" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} className="w-24" />
                        )}
                        <SortTh col="name"     label="Team"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                        <SortTh col="gp"       label="GP"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-14" glossaryId="gp" />
                        <SortTh col="wins"     label="W"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-14" glossaryId="w" />
                        <SortTh col="losses"   label="L"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-14" glossaryId="l" />
                        <SortTh col="pct"      label="PCT"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-20" glossaryId="pct" />
                        <SortTh col="conf"     label="Conf"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-24" glossaryId="conf" />
                        <SortTh col="pf"       label="PF"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-16" glossaryId="pf" />
                        <SortTh col="pa"       label="PA"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-16" glossaryId="pa" />
                        <SortTh col="diff"     label="Diff"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} right className="w-20 pr-5" glossaryId="diff" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTeams.map((t, i) => {
                        const d = diffOf(t)
                        const hasDiff = t.points_for != null && t.points_against != null
                        return (
                          <tr
                            key={`${t.slug}-${t.season}`}
                            onClick={() => handleRowClick(t)}
                            className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
                          >
                            <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
                              {String(i + 1).padStart(2, ' ')}.
                            </td>
                            {selectedSeason === 'all' && (
                              <td className={cn(tabletTd, 'text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                                {formatSeason(t.season)}
                              </td>
                            )}
                            <td className={tabletTd}>
                              <div className="flex items-center gap-3 text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors min-w-0">
                                {t.school_slug && SCHOOL_LOGOS[t.school_slug] && (
                                  <Link
                                    href={`/team/${t.slug}`}
                                    onClick={e => e.stopPropagation()}
                                    aria-label={`${stripSuffix(t.name)} team page`}
                                    className="shrink-0"
                                  >
                                    <Image
                                      src={SCHOOL_LOGOS[t.school_slug]}
                                      alt=""
                                      width={24}
                                      height={24}
                                      className="h-[24px] w-[24px] object-contain"
                                      unoptimized
                                    />
                                  </Link>
                                )}
                                <Link
                                  href={`/team/${t.slug}`}
                                  onClick={e => e.stopPropagation()}
                                  className="text-[16px] leading-tight truncate hover:underline underline-offset-4 decoration-[var(--paper-rule)]"
                                  style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
                                >
                                  {stripSuffix(t.name)}
                                </Link>
                              </div>
                            </td>
                            <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                              {t.games_played ?? '—'}
                            </td>
                            <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                              {t.overall_wins ?? '—'}
                            </td>
                            <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                              {t.overall_losses ?? '—'}
                            </td>
                            <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums')} style={MONO}>
                              {fmtPct(t.overall_wins, t.overall_losses)}
                            </td>
                            <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                              {fmtRecord(t.conference_wins, t.conference_losses)}
                            </td>
                            <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums')} style={MONO}>
                              {t.points_for ?? '—'}
                            </td>
                            <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                              {t.points_against ?? '—'}
                            </td>
                            <td
                              className={cn(tabletTd, 'text-right pr-5 tabular-nums font-medium')}
                              style={MONO}
                            >
                              {hasDiff ? (
                                <span className={cn(
                                  d > 0 && 'text-[var(--paper-text)]',
                                  d < 0 && 'text-[var(--paper-muted)]',
                                  d === 0 && 'text-[var(--paper-faint)]',
                                )}>
                                  {d >= 0 ? `+${d}` : d}
                                </span>
                              ) : (
                                <span className="text-[var(--paper-faint)]">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Tablet>
            )}
          </RevealFx>

          {/* ── Offensive Index ───────────────────────────────────────── */}
          <div id="offensive-index" className="mt-16">
          <RevealFx delay={0.22} translateY={8}>
            <SectionHead
              title="Offensive Index"
              eyebrow={<DivisionDots active={activeDiv} />}
              blurb="Per-game KPIs and a composite signature stat — sort by any column."
              meta={<DivisionPills active={activeDiv} onChange={setActiveDiv} />}
            />

            {sortedOffRows.length === 0 ? (
              <EmptyTablet
                label={q
                  ? `No teams match “${query}” in ${DIV_LABEL[activeDiv]} for ${seasonLabel}.`
                  : `No teams recorded in ${DIV_LABEL[activeDiv]} for ${seasonLabel}.`}
              />
            ) : (
              <Tablet>
                <div className="overflow-x-auto [&_thead_th]:!bg-transparent">
                  <table className="w-full text-sm" style={{ borderSpacing: 0 }}>
                    <thead>
                      <tr>
                        <SortTh col="rank"    label="#"        sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} className="pl-5 w-14" />
                        <SortTh col="name"    label="Team"     sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} />
                        <SortTh col="gp"      label="GP"       sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-14" />
                        <SortTh col="ppg"     label="PPG"      sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-16" />
                        <SortTh col="passYpg" label="PYPG"     sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-20" />
                        <SortTh col="rushYpg" label="RYPG"     sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-20" />
                        <SortTh col="ypg"     label="YPG"      sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-20" />
                        <SortTh col="tds"     label="TDs"      sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-16" />
                        <SortTh col="ypp"     label="YPP"      sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-16" />
                        <SortTh col="mov"     label="MoV"      sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-16" />
                        <SortTh col="offIdx"  label="OFF"      sortCol={offSortCol} sortDir={offSortDir} onSort={handleOffSort} right className="w-20 pr-5" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOffRows.map((t, i) => (
                        <tr
                          key={`${t.slug}-${t.season}`}
                          onClick={() => handleRowClick(t)}
                          className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
                        >
                          <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
                            {String(i + 1).padStart(2, ' ')}.
                          </td>
                          <td className={tabletTd}>
                            <div className="flex items-center gap-3 text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors min-w-0">
                              {t.school_slug && SCHOOL_LOGOS[t.school_slug] && (
                                <Link
                                  href={`/team/${t.slug}`}
                                  onClick={e => e.stopPropagation()}
                                  aria-label={`${stripSuffix(t.name)} team page`}
                                  className="shrink-0"
                                >
                                  <Image
                                    src={SCHOOL_LOGOS[t.school_slug]}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="h-[24px] w-[24px] object-contain"
                                    unoptimized
                                  />
                                </Link>
                              )}
                              <Link
                                href={`/team/${t.slug}`}
                                onClick={e => e.stopPropagation()}
                                className="text-[16px] leading-tight truncate hover:underline underline-offset-4 decoration-[var(--paper-rule)]"
                                style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
                              >
                                {stripSuffix(t.name)}
                              </Link>
                            </div>
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {t.games_played ?? '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                            {fmt1(t.ppg)}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {fmt1(t.passYpg)}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {fmt1(t.rushYpg)}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums')} style={MONO}>
                            {fmt1(t.ypg)}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums')} style={MONO}>
                            {t.tds}
                          </td>
                          <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                            {t.ypp > 0 ? fmt1(t.ypp) : '—'}
                          </td>
                          <td className={cn(tabletTd, 'text-right tabular-nums')} style={MONO}>
                            <span className={cn(
                              t.mov > 0 && 'text-emerald-500',
                              t.mov < 0 && 'text-rose-500',
                              t.mov === 0 && 'text-[var(--paper-faint)]',
                            )}>
                              {fmtSign(t.mov)}
                            </span>
                          </td>
                          <td className={cn(tabletTd, 'text-right pr-5 tabular-nums font-medium text-[var(--paper-text)]')} style={MONO}>
                            {t.offIdx.toFixed(0)}
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

          {/* ── Colophon ──────────────────────────────────────────────── */}
          <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
            <p
              className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
              style={{ ...SERIF, fontStyle: 'italic' }}
            >
              Standings and point totals are drawn from Section XI official results and
              Newsday box scores{selectedSeason === 'all' ? '' : ` for the ${formatSeason(selectedSeason)} season`}. Nassau
              County opponents are excluded from this almanac; ties are counted in the
              differential calculation but treated as no-decision for win percentage.
            </p>
          </div>
        </div>

        <ChatSeasonsPanel
          open={panelTeam != null}
          onClose={() => setPanelTeam(null)}
          teams={panelTeam ? [panelTeam] : []}
          initialSeason={panelSeason}
        />
        <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
        <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)} countyName="Section XI Teams" />
      </div>
  )
}

// ── Division pills — sits in the Standings Index section-head meta slot ─────
function DivisionPills({
  active,
  onChange,
}: {
  active: 'All' | 'I' | 'II' | 'III' | 'IV'
  onChange: (d: 'All' | 'I' | 'II' | 'III' | 'IV') => void
}) {
  const opts = ['All', 'I', 'II', 'III', 'IV'] as const
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {opts.map(d => {
        const on = active === d
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={cn(
              'px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] rounded-full border transition-colors',
              on
                ? 'border-[var(--paper-text)] bg-[var(--paper-text)] text-[var(--paper)]'
                : 'border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)]',
            )}
            style={SANS}
          >
            {d === 'All' ? 'All' : `Div ${d}`}
          </button>
        )
      })}
    </div>
  )
}
