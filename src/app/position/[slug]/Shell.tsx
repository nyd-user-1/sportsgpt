'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ChartSpline, Map as MapIcon, MessageCircle, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PLAYER_PHOTOS, SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { RevealFx } from '@/components/RevealFx'
import { cn, formatSeason } from '@/lib/utils'
import { POSITIONS, type PositionConfig } from '@/lib/positions'
import {
  EditorialHead,
  EditorialButtonGroup,
  HeroStrip,
  PAPER_BRIDGE,
  PlayerRankedList,
  SectionHead,
  Tablet,
  EmptyTablet,
  MONO,
  TABLET_RADIUS,
  tabletTh,
  tabletTd,
  StickyControlBar,
  ContentsNav,
  SearchInput,
  useSearchHotkey,
  SearchButtonGroup,
} from '@/components/editorial'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
type PlayerRow = {
  slug: string
  name: string
  position: string | null
  school_slug: string | null
  school_name: string | null
  division: string | null
}

type StatRow = {
  player_slug: string
  season: number
  pass_yards: number | null
  pass_tds: number | null
  attempts: number | null
  completions: number | null
  interceptions: number | null
  rush_yards: number | null
  rush_tds: number | null
  rush_attempts: number | null
  recv_yards: number | null
  recv_tds: number | null
  receptions: number | null
  points: number | null
  total_tds: number | null
  fg: number | null
  pat: number | null
  games_played: number | null
}

type MetricChapter = {
  id: string
  label: string
  blurb: string
  qualifies: (s: StatRow) => boolean
  rankBy: (s: StatRow) => number
  formatPrimary:   (s: StatRow) => string
  formatSecondary?: (s: StatRow) => string
}

// ──────────────────────────────────────────────────────────────────────────────
// Page constants
// ──────────────────────────────────────────────────────────────────────────────
const COMP_PCT_MIN_ATT = 50

const POSITION_BLURB: Record<string, string> = {
  qb: 'Quarterbacks of Section XI — the position that takes the snap.',
  rb: 'Section XI ball carriers — snap to snap, yard by yard.',
  wr: 'The outside receivers of Section XI football.',
  te: 'Hybrid pass catchers, lined up off the formation.',
  ol: 'The offensive line — names only; no stat will reach this column.',
  dl: 'Front-seven pass rush — sacks first, fumbles second.',
  lb: 'The second level — coverage, tackling, and the box.',
  db: 'Coverage out of the backfield — interceptions first.',
  k:  'The special-teams scoring leaders.',
}

const num = (v: number | null | undefined) =>
  v == null || v === 0 ? '—' : v.toLocaleString()

// ──────────────────────────────────────────────────────────────────────────────
// Metric chapters per position
// ──────────────────────────────────────────────────────────────────────────────
const CHAPTERS: Record<string, MetricChapter[]> = {
  qb: [
    {
      id: 'yds', label: 'Passing Yards', blurb: 'Total yards thrown.',
      qualifies: s => (s.pass_yards ?? 0) > 0,
      rankBy:    s => s.pass_yards ?? 0,
      formatPrimary:   s => `${num(s.pass_yards)} YDS`,
      formatSecondary: s => `${num(s.pass_tds)} TD`,
    },
    {
      id: 'att', label: 'Attempts', blurb: 'Pass attempts thrown.',
      qualifies: s => (s.attempts ?? 0) > 0,
      rankBy:    s => s.attempts ?? 0,
      formatPrimary:   s => `${num(s.attempts)} ATT`,
      formatSecondary: s => `${num(s.completions)} CMP`,
    },
    {
      id: 'cmp', label: 'Completions', blurb: 'Pass attempts completed.',
      qualifies: s => (s.completions ?? 0) > 0,
      rankBy:    s => s.completions ?? 0,
      formatPrimary:   s => `${num(s.completions)} CMP`,
      formatSecondary: s => `${num(s.attempts)} ATT`,
    },
    {
      id: 'pct', label: 'Completion %', blurb: `Minimum ${COMP_PCT_MIN_ATT} attempts to qualify.`,
      qualifies: s => (s.attempts ?? 0) >= COMP_PCT_MIN_ATT && (s.completions ?? 0) > 0,
      rankBy:    s => (s.completions ?? 0) / (s.attempts ?? 1),
      formatPrimary:   s => `${(((s.completions ?? 0) / (s.attempts ?? 1)) * 100).toFixed(1)}%`,
      formatSecondary: s => `${s.completions ?? 0} / ${s.attempts ?? 0}`,
    },
    {
      id: 'td', label: 'Touchdowns', blurb: 'Touchdown passes thrown.',
      qualifies: s => (s.pass_tds ?? 0) > 0,
      rankBy:    s => s.pass_tds ?? 0,
      formatPrimary:   s => `${num(s.pass_tds)} TD`,
      formatSecondary: s => `${num(s.pass_yards)} YDS`,
    },
    {
      id: 'int', label: 'Interceptions', blurb: 'Pass attempts intercepted.',
      qualifies: s => (s.interceptions ?? 0) > 0,
      rankBy:    s => s.interceptions ?? 0,
      formatPrimary:   s => `${num(s.interceptions)} INT`,
      formatSecondary: s => `${num(s.attempts)} ATT`,
    },
  ],
  rb: [
    {
      id: 'yds', label: 'Rushing Yards', blurb: 'Total yards gained on the ground.',
      qualifies: s => (s.rush_yards ?? 0) > 0,
      rankBy:    s => s.rush_yards ?? 0,
      formatPrimary:   s => `${num(s.rush_yards)} YDS`,
      formatSecondary: s => `${num(s.rush_tds)} TD`,
    },
    {
      id: 'att', label: 'Attempts', blurb: 'Rushing attempts taken.',
      qualifies: s => (s.rush_attempts ?? 0) > 0,
      rankBy:    s => s.rush_attempts ?? 0,
      formatPrimary:   s => `${num(s.rush_attempts)} ATT`,
      formatSecondary: s => `${num(s.rush_yards)} YDS`,
    },
    {
      id: 'td', label: 'Touchdowns', blurb: 'Rushing touchdowns scored.',
      qualifies: s => (s.rush_tds ?? 0) > 0,
      rankBy:    s => s.rush_tds ?? 0,
      formatPrimary:   s => `${num(s.rush_tds)} TD`,
      formatSecondary: s => `${num(s.rush_yards)} YDS`,
    },
  ],
  wr: [
    {
      id: 'rec', label: 'Receptions', blurb: 'Passes caught.',
      qualifies: s => (s.receptions ?? 0) > 0,
      rankBy:    s => s.receptions ?? 0,
      formatPrimary:   s => `${num(s.receptions)} REC`,
      formatSecondary: s => `${num(s.recv_yards)} YDS`,
    },
    {
      id: 'yds', label: 'Receiving Yards', blurb: 'Total yards gained on receptions.',
      qualifies: s => (s.recv_yards ?? 0) > 0,
      rankBy:    s => s.recv_yards ?? 0,
      formatPrimary:   s => `${num(s.recv_yards)} YDS`,
      formatSecondary: s => `${num(s.recv_tds)} TD`,
    },
    {
      id: 'td', label: 'Touchdowns', blurb: 'Receiving touchdowns scored.',
      qualifies: s => (s.recv_tds ?? 0) > 0,
      rankBy:    s => s.recv_tds ?? 0,
      formatPrimary:   s => `${num(s.recv_tds)} TD`,
      formatSecondary: s => `${num(s.recv_yards)} YDS`,
    },
  ],
  // TE uses the same receiving chapters as WR.
  get te() { return this.wr },
  dl: [
    {
      id: 'sk', label: 'Sacks', blurb: 'Quarterback sacks recorded.',
      qualifies: s => (s.rush_yards ?? 0) > 0,
      rankBy:    s => s.rush_yards ?? 0,
      formatPrimary:   s => `${num(s.rush_yards)} SK`,
      formatSecondary: s => `${num(s.interceptions)} INT`,
    },
    {
      id: 'fum', label: 'Fumbles', blurb: 'Fumbles forced or recovered.',
      qualifies: s => (s.rush_attempts ?? 0) > 0,
      rankBy:    s => s.rush_attempts ?? 0,
      formatPrimary:   s => `${num(s.rush_attempts)} FUM`,
      formatSecondary: s => `${num(s.rush_yards)} SK`,
    },
    {
      id: 'int', label: 'Interceptions', blurb: 'Passes intercepted.',
      qualifies: s => (s.interceptions ?? 0) > 0,
      rankBy:    s => s.interceptions ?? 0,
      formatPrimary:   s => `${num(s.interceptions)} INT`,
      formatSecondary: s => `${num(s.rush_yards)} SK`,
    },
  ],
  get lb() { return this.dl },
  db: [
    {
      id: 'int', label: 'Interceptions', blurb: 'Passes intercepted.',
      qualifies: s => (s.interceptions ?? 0) > 0,
      rankBy:    s => s.interceptions ?? 0,
      formatPrimary:   s => `${num(s.interceptions)} INT`,
      formatSecondary: s => `${num(s.rush_yards)} SK`,
    },
    {
      id: 'sk', label: 'Sacks', blurb: 'Quarterback sacks recorded.',
      qualifies: s => (s.rush_yards ?? 0) > 0,
      rankBy:    s => s.rush_yards ?? 0,
      formatPrimary:   s => `${num(s.rush_yards)} SK`,
      formatSecondary: s => `${num(s.interceptions)} INT`,
    },
    {
      id: 'fum', label: 'Fumbles', blurb: 'Fumbles forced or recovered.',
      qualifies: s => (s.rush_attempts ?? 0) > 0,
      rankBy:    s => s.rush_attempts ?? 0,
      formatPrimary:   s => `${num(s.rush_attempts)} FUM`,
      formatSecondary: s => `${num(s.interceptions)} INT`,
    },
  ],
  k: [
    {
      id: 'pts', label: 'Points', blurb: 'Total points scored.',
      qualifies: s => (s.points ?? 0) > 0,
      rankBy:    s => s.points ?? 0,
      formatPrimary:   s => `${num(s.points)} PTS`,
      formatSecondary: s => `${num(s.fg)} FG`,
    },
    {
      id: 'td', label: 'Touchdowns', blurb: 'Touchdowns scored (any source).',
      qualifies: s => (s.total_tds ?? 0) > 0,
      rankBy:    s => s.total_tds ?? 0,
      formatPrimary:   s => `${num(s.total_tds)} TD`,
      formatSecondary: s => `${num(s.points)} PTS`,
    },
    {
      id: 'fg', label: 'Field Goals', blurb: 'Field goals made.',
      qualifies: s => (s.fg ?? 0) > 0,
      rankBy:    s => s.fg ?? 0,
      formatPrimary:   s => `${num(s.fg)} FG`,
      formatSecondary: s => `${num(s.points)} PTS`,
    },
    {
      id: 'pat', label: 'Extra Points', blurb: 'Point-after-touchdown kicks made.',
      qualifies: s => (s.pat ?? 0) > 0,
      rankBy:    s => s.pat ?? 0,
      formatPrimary:   s => `${num(s.pat)} PAT`,
      formatSecondary: s => `${num(s.points)} PTS`,
    },
  ],
}

// ──────────────────────────────────────────────────────────────────────────────
// Stat helpers
// ──────────────────────────────────────────────────────────────────────────────
function sumStat(rows: StatRow[], key: keyof StatRow): number | null {
  const total = rows.reduce((acc, r) => acc + ((r[key] as number | null) ?? 0), 0)
  return total > 0 ? total : null
}

function aggregateStats(rows: StatRow[]): StatRow {
  return {
    player_slug:   rows[0]?.player_slug ?? '',
    season:        -1,
    pass_yards:    sumStat(rows, 'pass_yards'),
    pass_tds:      sumStat(rows, 'pass_tds'),
    attempts:      sumStat(rows, 'attempts'),
    completions:   sumStat(rows, 'completions'),
    interceptions: sumStat(rows, 'interceptions'),
    rush_yards:    sumStat(rows, 'rush_yards'),
    rush_tds:      sumStat(rows, 'rush_tds'),
    rush_attempts: sumStat(rows, 'rush_attempts'),
    recv_yards:    sumStat(rows, 'recv_yards'),
    recv_tds:      sumStat(rows, 'recv_tds'),
    receptions:    sumStat(rows, 'receptions'),
    points:        sumStat(rows, 'points'),
    total_tds:     sumStat(rows, 'total_tds'),
    fg:            sumStat(rows, 'fg'),
    pat:           sumStat(rows, 'pat'),
    games_played:  sumStat(rows, 'games_played'),
  }
}

const fmtSeasonLabel = (season: number | null) =>
  season === null ? 'All-Time' : formatSeason(season)

// ──────────────────────────────────────────────────────────────────────────────
// Main shell
// ──────────────────────────────────────────────────────────────────────────────
export function PositionShell({
  config,
  players,
  stats,
}: {
  config: PositionConfig
  players: PlayerRow[]
  stats: StatRow[]
}) {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [query,          setQuery]          = useState('')
  const [chartsOpen,     setChartsOpen]     = useState(false)
  const [mapsOpen,       setMapsOpen]       = useState(false)
  const [chatOpen,       setChatOpen]       = useState(false)
  const [activeChapter,  setActiveChapter]  = useState<string>('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const searchRef   = useRef<HTMLInputElement>(null)

  const posIdx  = POSITIONS.findIndex(p => p.slug === config.slug)
  const nPos    = POSITIONS.length
  const prevPos = POSITIONS[(posIdx - 1 + nPos) % nPos]
  const nextPos = POSITIONS[(posIdx + 1) % nPos]

  const availableSeasons = useMemo(
    () => [...new Set(stats.map(s => s.season))].sort((a, b) => b - a),
    [stats]
  )
  const seasonOptions: (number | null)[] = useMemo(
    () => [null, ...availableSeasons],
    [availableSeasons]
  )
  const seasonIdx = seasonOptions.findIndex(s => s === selectedSeason)
  function shiftSeason(delta: 1 | -1) {
    if (seasonOptions.length === 0) return
    const next = (seasonIdx + delta + seasonOptions.length) % seasonOptions.length
    setSelectedSeason(seasonOptions[next])
  }

  const playerMap = useMemo(() => {
    const m = new Map<string, PlayerRow>()
    for (const p of players) m.set(p.slug, p)
    return m
  }, [players])

  // For the selected season — or aggregated career — return one StatRow per player.
  const playerStatMap = useMemo(() => {
    const m = new Map<string, StatRow>()
    if (selectedSeason === null) {
      const byPlayer = new Map<string, StatRow[]>()
      for (const s of stats) {
        const list = byPlayer.get(s.player_slug) ?? []
        list.push(s)
        byPlayer.set(s.player_slug, list)
      }
      for (const [slug, rows] of byPlayer) m.set(slug, aggregateStats(rows))
    } else {
      for (const s of stats) {
        if (s.season === selectedSeason) m.set(s.player_slug, s)
      }
    }
    return m
  }, [stats, selectedSeason])

  const chapters: MetricChapter[] = config.statType ? (CHAPTERS[config.slug] ?? []) : []

  // For each chapter: full ranked list, then search-filtered visible list.
  type RankedEntry = { rank: number; player: PlayerRow; stat: StatRow }
  const chapterData = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out: { id: string; chapter: MetricChapter; totalCount: number; rows: RankedEntry[] }[] = []
    for (const chapter of chapters) {
      const ranked: RankedEntry[] = [...playerStatMap.entries()]
        .filter(([slug, s]) => chapter.qualifies(s) && playerMap.has(slug))
        .sort((a, b) => chapter.rankBy(b[1]) - chapter.rankBy(a[1]))
        .map(([slug, s], i) => ({
          rank: i + 1,
          player: playerMap.get(slug)!,
          stat: s,
        }))
      const totalCount = ranked.length
      const rows = q
        ? ranked.filter(r =>
            r.player.name.toLowerCase().includes(q) ||
            (r.player.school_name ?? '').toLowerCase().includes(q)
          )
        : ranked
      out.push({ id: chapter.id, chapter, totalCount, rows })
    }
    return out
  }, [chapters, playerStatMap, playerMap, query])

  const totalVisible = useMemo(
    () => chapterData.reduce((acc, c) => acc + c.rows.length, 0),
    [chapterData]
  )
  const totalRanked = useMemo(
    () => chapterData.reduce((acc, c) => acc + c.totalCount, 0),
    [chapterData]
  )

  // Set initial active chapter once chapter data exists.
  useEffect(() => {
    if (!activeChapter && chapterData.length > 0) setActiveChapter(chapterData[0].id)
  }, [activeChapter, chapterData])

  // Scroll-spy across visible chapters.
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveChapter(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.4] }
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [chapterData])

  useSearchHotkey(searchRef, () => setQuery(''))

  // Hero slides — top players from the first chapter, NOT query-filtered so the
  // slider stays stable while the user is searching.
  const slidePlayers = useMemo(() => {
    if (chapters.length === 0) return players.slice(0, 8)
    return [...playerStatMap.entries()]
      .filter(([slug, s]) => chapters[0].qualifies(s) && playerMap.has(slug))
      .sort((a, b) => chapters[0].rankBy(b[1]) - chapters[0].rankBy(a[1]))
      .slice(0, 8)
      .map(([slug]) => playerMap.get(slug)!)
  }, [chapters, playerStatMap, playerMap, players])

  const slides = useMemo(() => {
    const seen = new Set<string>()
    return slidePlayers
      .map(p => PLAYER_PHOTOS[p.slug] ?? (p.school_slug ? TEAM_PHOTOS[p.school_slug]?.[0] : null))
      .filter((s): s is string => {
        if (!s || seen.has(s)) return false
        seen.add(s)
        return true
      })
      .slice(0, 6)
  }, [slidePlayers])

  const mobileHeader = (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-tight">{config.fullName}</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight">Section XI Football</p>
      </div>
    </div>
  )

  // Roster-only positions (OL) take a different, simpler layout.
  const isRosterOnly = !config.statType

  return (
    <>
      <AppLayout mobileHeader={mobileHeader}>
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{ backgroundColor: 'var(--paper)' }}
        >
          {/* ── Masthead ──────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
            <EditorialHead
              size="xl"
              eyebrow="Section XI · Long Island"
              subhead={POSITION_BLURB[config.slug]}
              meta={[
                `${players.length} ${players.length === 1 ? 'player' : 'players'}`,
                `${availableSeasons.length} seasons of record`,
                fmtSeasonLabel(selectedSeason),
              ]}
              rightSlot={
                <EditorialButtonGroup
                  prevHref={`/position/${prevPos.slug}`}
                  nextHref={`/position/${nextPos.slug}`}
                  prevLabel={prevPos.fullName}
                  nextLabel={nextPos.fullName}
                  buttons={[
                    { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen, onClick: () => setChartsOpen(v => !v) },
                    { icon: MapIcon,       tooltip: 'Map',           active: mapsOpen,   onClick: () => setMapsOpen(v => !v) },
                    { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,   onClick: () => setChatOpen(v => !v) },
                  ]}
                />
              }
            >
              {config.fullName}
            </EditorialHead>
          </div>

          {/* ── Hero photo strip ──────────────────────────────── */}
          {slides.length > 0 && (
            <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-14">
              <RevealFx delay={0.1} translateY={8}>
                <HeroStrip slides={slides} />
              </RevealFx>
            </div>
          )}

          {/* ── Sticky control bar ──────────────────────────── */}
          <StickyControlBar>
            {config.statType && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">Season</span>
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
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
                >
                  {fmtSeasonLabel(selectedSeason)}
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
            )}

            {!isRosterOnly && (
              <SearchInput
                value={query}
                onChange={setQuery}
                inputRef={searchRef}
                placeholder="Search players…"
              />
            )}

            <SearchButtonGroup />
          </StickyControlBar>

          {/* ── Body ────────────────────────────────────────── */}
          {isRosterOnly ? (
            // OL — simpler single-column roster.
            <div className="mx-auto max-w-5xl px-6 sm:px-10 md:px-14 pt-14 pb-24">
              <section className="mb-8 scroll-mt-24">
                <SectionHead
                  title="Roster"
                  blurb="Offensive linemen across Section XI football."
                />
                {players.length === 0 ? (
                  <EmptyTablet label="No players listed." />
                ) : (
                  <Tablet>
                    <RosterTable players={players} />
                  </Tablet>
                )}
              </section>
              <Colophon />
            </div>
          ) : (
            <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

              {/* Chapter sidebar */}
              <ContentsNav
                label="Metrics"
                items={chapterData.map(c => ({ id: c.id, label: c.chapter.label, count: c.rows.length }))}
                activeId={activeChapter}
              />

              {/* Main content */}
              <main className="min-w-0">
                {chapterData.map((c, i) => {
                  if (c.rows.length === 0 && query) return null
                  return (
                    <section
                      key={c.id}
                      id={c.id}
                      ref={(el: HTMLElement | null) => { sectionRefs.current[c.id] = el }}
                      className="mb-20 scroll-mt-24 first:mt-0"
                    >
                      <SectionHead
                        title={c.chapter.label}
                        blurb={c.chapter.blurb}
                        meta={
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] tabular-nums">
                            {query && c.rows.length !== c.totalCount
                              ? `${c.rows.length} / ${c.totalCount}`
                              : `${c.totalCount} ${c.totalCount === 1 ? 'player' : 'players'}`}
                          </span>
                        }
                        eyebrow={`Chapter ${i + 1}`}
                      />
                      {c.rows.length === 0 ? (
                        <p
                          className="py-10 text-center text-sm text-[var(--paper-muted)]"
                          style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                        >
                          No players match.
                        </p>
                      ) : (
                        <PlayerRankedList
                          query={query}
                          rows={c.rows.map(r => ({
                            slug: r.player.slug,
                            name: r.player.name,
                            school: r.player.school_name ?? '—',
                            schoolSlug: r.player.school_slug ?? undefined,
                            rank: r.rank,
                            primary: c.chapter.formatPrimary(r.stat),
                            secondary: c.chapter.formatSecondary?.(r.stat),
                          }))}
                        />
                      )}
                    </section>
                  )
                })}

                {query && totalVisible === 0 && (
                  <div className="py-24 text-center">
                    <p
                      className="text-[var(--paper-muted)] text-lg"
                      style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                    >
                      No players match &ldquo;{query}&rdquo;.
                    </p>
                    <button
                      onClick={() => setQuery('')}
                      className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--paper-strong)] hover:underline underline-offset-4"
                    >
                      Clear search
                    </button>
                  </div>
                )}

                <Colophon />
              </main>
            </div>
          )}
        </div>
      </AppLayout>

      <div style={PAPER_BRIDGE}>
        <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
        <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
        <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={config.fullName} />
      </div>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Colophon
// ──────────────────────────────────────────────────────────────────────────────
function Colophon() {
  return (
    <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
      <p
        className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
        style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
      >
        Rankings are drawn from Section XI official records and Newsday box scores.
        Players are matched to a position when their listed role contains the
        canonical token. Completion % requires a minimum of {COMP_PCT_MIN_ATT} attempts
        to qualify. Nassau County opponents are excluded from this almanac.
      </p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// OL roster table — page-specific table on the shared Tablet wrapper.
// ──────────────────────────────────────────────────────────────────────────────
function RosterTable({ players }: { players: PlayerRow[] }) {
  const router = useRouter()
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className={tabletTh('text-left w-12 pl-5')}>#</th>
          <th className={tabletTh('text-left')}>Player</th>
          <th className={cn(tabletTh('text-center w-14'), 'hidden sm:table-cell')}>Div</th>
          <th className={tabletTh('text-left w-24 pr-5 hidden sm:table-cell')}>Position</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p, i) => (
          <tr
            key={p.slug}
            onClick={() => router.push(`/player/${p.slug}`)}
            className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
            style={{ borderRadius: TABLET_RADIUS }}
          >
            <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
              {String(i + 1).padStart(2, ' ')}.
            </td>
            <td className={tabletTd}>
              <Link
                href={`/player/${p.slug}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-3 text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors min-w-0"
              >
                {p.school_slug && SCHOOL_LOGOS[p.school_slug] && (
                  <Image
                    src={SCHOOL_LOGOS[p.school_slug]} alt=""
                    width={22} height={22}
                    className="shrink-0 h-[22px] w-[22px] object-contain"
                    unoptimized
                  />
                )}
                <div className="min-w-0">
                  <p
                    className="leading-tight truncate"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em' }}
                  >
                    {p.name}
                  </p>
                  <p
                    className="mt-0.5 text-[12px] text-[var(--paper-muted)] truncate"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                  >
                    {p.school_name ?? '—'}
                  </p>
                </div>
              </Link>
            </td>
            <td className={cn(tabletTd, 'text-center text-[var(--paper-muted)] tabular-nums hidden sm:table-cell')} style={MONO}>
              {p.division ? `D${p.division}` : '—'}
            </td>
            <td className={cn(tabletTd, 'text-[var(--paper-muted)] pr-5 hidden sm:table-cell')} style={MONO}>
              {p.position ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
