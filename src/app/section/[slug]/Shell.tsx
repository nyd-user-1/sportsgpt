'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChartSpline, MessageCircle, FileUser, ArrowLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { AppPanel } from '@/components/AppPanel'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  EditorialButtonGroup,
  PAPER_BRIDGE,
  PlayerRankedList,
  SectionHead,
  StickyControlBar,
  ContentsNav,
  SearchInput,
  useSearchHotkey,
} from '@/components/editorial'
import { SCHOOL_LOGOS, DIVISION_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type DivisionSummary = {
  division: string
  team_count: number
  avg_win_pct: number | null
  player_count: number
  game_count: number
}

type RecentChamp = {
  season: number
  division: string
  team_slug: string
  team_name: string
  overall_wins: number | null
  overall_losses: number | null
}

type GameRow = {
  id: number
  game_date: string | null
  season: number
  home_team_slug: string
  away_team_slug: string
  home_score: number | null
  away_score: number | null
  home_name: string
  away_name: string
  home_school_slug: string | null
  away_school_slug: string | null
}

type LeaderRow = {
  player_slug: string
  player_name: string
  school_name: string
  school_slug: string | null
  pass_yards: number | null
  pass_tds: number | null
  season: number
}

type TeamRow = {
  slug: string
  name: string
  division: string
  school_slug: string | null
  overall_wins: number | null
  overall_losses: number | null
  conference_wins: number | null
  conference_losses: number | null
  season: number
}

// ── Constants ────────────────────────────────────────────────────────────────

const DIV_SLUGS: Record<string, string> = {
  I: 'division-i', II: 'division-ii', III: 'division-iii', IV: 'division-iv',
}
const DIV_ORDER = ['I', 'II', 'III', 'IV']

const SECTIONS = [
  { id: 'division-i'   as const, label: 'Division I'   },
  { id: 'division-ii'  as const, label: 'Division II'  },
  { id: 'division-iii' as const, label: 'Division III' },
  { id: 'division-iv'  as const, label: 'Division IV'  },
  { id: 'schedule'     as const, label: 'Season'       },
  { id: 'games'        as const, label: 'Games'        },
]

type SectionId = typeof SECTIONS[number]['id']

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const MONO  = { fontFamily: 'var(--font-mono, ui-monospace), monospace' } as const

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtSeasonLabel = (s: number | null) => s === null ? 'All-Time' : formatSeason(s)

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0; const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

function fmtGameDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ── All-Time aggregation ─────────────────────────────────────────────────────

function aggregateTeams(rows: TeamRow[]): TeamRow[] {
  const groups: Record<string, TeamRow[]> = {}
  for (const r of rows) { (groups[r.slug] ??= []).push(r) }
  return Object.values(groups)
    .map(rs => ({
      slug:              rs[0].slug,
      name:              rs[0].name,
      division:          rs[0].division,
      school_slug:       rs[0].school_slug,
      overall_wins:      rs.reduce((s, r) => s + (r.overall_wins    ?? 0), 0),
      overall_losses:    rs.reduce((s, r) => s + (r.overall_losses   ?? 0), 0),
      conference_wins:   rs.reduce((s, r) => s + (r.conference_wins  ?? 0), 0),
      conference_losses: rs.reduce((s, r) => s + (r.conference_losses ?? 0), 0),
      season:            0,
    }))
    .sort((a, b) => (b.overall_wins ?? 0) - (a.overall_wins ?? 0))
}

// ── Shell ────────────────────────────────────────────────────────────────────

export function SectionShell({
  divisionSummary,
  recentChamps: _recentChamps,
  allTeams,
  games,
  leaders: _leaders,
}: {
  divisionSummary: DivisionSummary[]
  recentChamps: RecentChamp[]
  allTeams: TeamRow[]
  games: GameRow[]
  leaders: LeaderRow[]
}) {
  const [chartsOpen,     setChartsOpen]    = useState(false)
  const [playersOpen,    setPlayersOpen]   = useState(false)
  const [chatOpen,       setChatOpen]      = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [query,          setQuery]          = useState('')
  const [activeSection,  setActiveSection]  = useState<SectionId>('division-i')

  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    'division-i': null, 'division-ii': null, 'division-iii': null, 'division-iv': null,
    'schedule': null, 'games': null,
  })
  const scheduleRef = useRef<HTMLDivElement>(null)
  const gamesRef    = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLInputElement>(null)

  // ── Season options (null = All-Time first) ───────────────────────────────
  const availableSeasons = useMemo(
    () => [...new Set(allTeams.map(t => t.season))].sort((a, b) => b - a),
    [allTeams]
  )
  const seasonOptions: (number | null)[] = useMemo(
    () => [null, ...availableSeasons],
    [availableSeasons]
  )
  const seasonOptIdx = seasonOptions.indexOf(selectedSeason)

  function shiftSeason(delta: 1 | -1) {
    const next = (seasonOptIdx + delta + seasonOptions.length) % seasonOptions.length
    setSelectedSeason(seasonOptions[next])
  }

  // ── Teams by division (season-filtered or all-time aggregated) ───────────
  const teamsByDiv = useMemo(() => {
    const result: Record<string, TeamRow[]> = {}
    for (const div of DIV_ORDER) {
      const divTeams = allTeams.filter(t => t.division === div)
      result[div] = selectedSeason === null
        ? aggregateTeams(divTeams)
        : divTeams.filter(t => t.season === selectedSeason)
    }
    return result
  }, [allTeams, selectedSeason])

  // ── Schedule: one card per (team × season) ───────────────────────────────
  // All-Time → every team/season pair. Specific season → all teams that season.
  const scheduleTeams = useMemo(() => {
    if (selectedSeason === null) {
      // All seasons: sort newest season first, then by wins within season
      return [...allTeams].sort(
        (a, b) => b.season - a.season || (b.overall_wins ?? 0) - (a.overall_wins ?? 0)
      )
    }
    const seen = new Set<string>()
    return allTeams
      .filter(t => t.season === selectedSeason && !seen.has(t.slug) && seen.add(t.slug))
      .sort((a, b) => (b.overall_wins ?? 0) - (a.overall_wins ?? 0))
  }, [allTeams, selectedSeason])

  // ── Games: all games all time, newest first ──────────────────────────────
  const allGamesSorted = useMemo(
    () => [...games].sort((a, b) =>
      b.season - a.season || (b.game_date ?? '').localeCompare(a.game_date ?? '')
    ),
    [games]
  )

  // ── Search ───────────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase()

  const matchedByDiv = useMemo(() => {
    const result: Record<string, TeamRow[]> = {}
    for (const div of DIV_ORDER) {
      result[div] = q
        ? (teamsByDiv[div] ?? []).filter(t => t.name.toLowerCase().includes(q))
        : (teamsByDiv[div] ?? [])
    }
    return result
  }, [teamsByDiv, q])

  const matchedSchedule = useMemo(
    () => q
      ? scheduleTeams.filter(t => t.name.toLowerCase().includes(q))
      : scheduleTeams,
    [scheduleTeams, q]
  )

  const matchedGames = useMemo(
    () => q
      ? allGamesSorted.filter(g =>
          g.home_name.toLowerCase().includes(q) || g.away_name.toLowerCase().includes(q))
      : allGamesSorted,
    [allGamesSorted, q]
  )

  const sectionCounts: Record<SectionId, number> = {
    'division-i':   matchedByDiv['I']?.length   ?? 0,
    'division-ii':  matchedByDiv['II']?.length  ?? 0,
    'division-iii': matchedByDiv['III']?.length ?? 0,
    'division-iv':  matchedByDiv['IV']?.length  ?? 0,
    'schedule':     matchedSchedule.length,
    'games':        matchedGames.length,
  }

  const totalRanked  = DIV_ORDER.reduce((s, d) => s + (teamsByDiv[d]?.length ?? 0), 0)
  const totalVisible = DIV_ORDER.reduce((s, d) => s + (matchedByDiv[d]?.length ?? 0), 0)
  const totalTeams   = useMemo(() => [...new Set(allTeams.map(t => t.slug))].length, [allTeams])

  // ── Scroll-spy ───────────────────────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveSection(visible[0].target.id as SectionId)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.4] }
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useSearchHotkey(searchRef, () => setQuery(''))

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <AppLayout>
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{ backgroundColor: 'var(--paper)' }}
        >

          {/* ── Masthead ──────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
            <EditorialHead
              size="xl"
              eyebrow="Section XI · Long Island"
              subhead="The complete record of Suffolk County high school football."
              meta={[
                `${totalTeams} teams`,
                '4 divisions',
                `${availableSeasons.length} seasons of record`,
              ]}
              rightSlot={
                <EditorialButtonGroup
                  buttons={[
                    { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen,  onClick: () => setChartsOpen(v => !v) },
                    { icon: FileUser,      tooltip: 'Players',       active: playersOpen, onClick: () => setPlayersOpen(v => !v) },
                    { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,    onClick: () => setChatOpen(v => !v) },
                  ]}
                />
              }
            >
              Section XI
            </EditorialHead>
          </div>

          {/* ── Division cards — hero position, 520px total height ── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-14">
            <RevealFx delay={0.1} translateY={8}>
              <div className="grid grid-cols-2 gap-4" style={{ height: 520 }}>
                {divisionSummary.map(d => {
                  const divNum = ({ I: 1, II: 2, III: 3, IV: 4 } as Record<string, number>)[d.division]
                  const logo   = divNum ? DIVISION_LOGOS[divNum] : undefined
                  const sectionId = DIV_SLUGS[d.division]
                  return (
                    <button
                      key={d.division}
                      onClick={() => {
                        document.getElementById(sectionId)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="group border border-[var(--paper-rule)] bg-[var(--paper)] flex flex-col justify-between px-8 py-8 hover:bg-[var(--paper-quiet)] transition-colors text-left w-full"
                      style={{ borderRadius: 3 }}
                    >
                      {logo && (
                        <Image
                          src={logo}
                          alt=""
                          width={52}
                          height={52}
                          className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                          unoptimized
                        />
                      )}
                      <div>
                        <p
                          className="text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors leading-tight mb-2"
                          style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}
                        >
                          Division {d.division}
                        </p>
                        <p
                          className="text-[13px] text-[var(--paper-muted)]"
                          style={{ ...SERIF, fontStyle: 'italic' }}
                        >
                          {d.team_count} teams
                        </p>
                        <p
                          className="mt-4 text-[13px] text-[var(--paper-strong)] font-medium tabular-nums"
                          style={MONO}
                        >
                          {(d.game_count + d.player_count).toLocaleString()} game and player records
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </RevealFx>
          </div>

          {/* ── Sticky control bar ────────────────────────────────── */}
          <StickyControlBar>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
                style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}
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

            <SearchInput
              value={query}
              onChange={setQuery}
              inputRef={searchRef}
              placeholder="Search teams & games…"
            />

            <div className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums hidden md:block">
              {q
                ? `${totalVisible} / ${totalRanked} ranked`
                : `${totalRanked} ranked entries`}
            </div>
          </StickyControlBar>

          {/* ── Body: sidebar + main ───────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

            <ContentsNav
              items={SECTIONS.map(s => ({ id: s.id, label: s.label, count: sectionCounts[s.id] }))}
              activeId={activeSection}
            />

            <main className="min-w-0">

              {/* ── Division I ─────────────────────────────────────── */}
              {(!q || matchedByDiv['I'].length > 0) && (
                <section
                  id="division-i"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['division-i'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Division I"
                    blurb={selectedSeason === null
                      ? 'All-time standings — Section XI\'s largest schools.'
                      : `${fmtSeasonLabel(selectedSeason)} standings — Section XI's largest schools.`}
                  />
                  <PlayerRankedList
                    query={q}
                    rows={(matchedByDiv['I']).map((t, i) => ({
                      rank:       i + 1,
                      slug:       t.slug,
                      name:       t.name.replace(/\s+Varsity\s+Football$/i, ''),
                      schoolSlug: t.school_slug ?? undefined,
                      school:     `Win pct ${fmtPct(t.overall_wins, t.overall_losses)}`,
                      primary:    `${t.overall_wins ?? 0}–${t.overall_losses ?? 0}`,
                      secondary:  (t.conference_wins != null || t.conference_losses != null)
                                    ? `${t.conference_wins ?? 0}–${t.conference_losses ?? 0} CONF`
                                    : undefined,
                      href:       `/team/${t.slug}`,
                    }))}
                    emptyLabel={q ? `No Division I teams match "${query}".` : 'No standings recorded.'}
                  />
                </section>
              )}

              {/* ── Division II ────────────────────────────────────── */}
              {(!q || matchedByDiv['II'].length > 0) && (
                <section
                  id="division-ii"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['division-ii'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Division II"
                    blurb={selectedSeason === null
                      ? 'All-time standings — the middle weight of Long Island football.'
                      : `${fmtSeasonLabel(selectedSeason)} standings — perennial contenders.`}
                  />
                  <PlayerRankedList
                    query={q}
                    rows={(matchedByDiv['II']).map((t, i) => ({
                      rank:       i + 1,
                      slug:       t.slug,
                      name:       t.name.replace(/\s+Varsity\s+Football$/i, ''),
                      schoolSlug: t.school_slug ?? undefined,
                      school:     `Win pct ${fmtPct(t.overall_wins, t.overall_losses)}`,
                      primary:    `${t.overall_wins ?? 0}–${t.overall_losses ?? 0}`,
                      secondary:  (t.conference_wins != null || t.conference_losses != null)
                                    ? `${t.conference_wins ?? 0}–${t.conference_losses ?? 0} CONF`
                                    : undefined,
                      href:       `/team/${t.slug}`,
                    }))}
                    emptyLabel={q ? `No Division II teams match "${query}".` : 'No standings recorded.'}
                  />
                </section>
              )}

              {/* ── Division III ───────────────────────────────────── */}
              {(!q || matchedByDiv['III'].length > 0) && (
                <section
                  id="division-iii"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['division-iii'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Division III"
                    blurb={selectedSeason === null
                      ? 'All-time standings — mid-size programs where small swings decide races.'
                      : `${fmtSeasonLabel(selectedSeason)} standings — where small swings decide.`}
                  />
                  <PlayerRankedList
                    query={q}
                    rows={(matchedByDiv['III']).map((t, i) => ({
                      rank:       i + 1,
                      slug:       t.slug,
                      name:       t.name.replace(/\s+Varsity\s+Football$/i, ''),
                      schoolSlug: t.school_slug ?? undefined,
                      school:     `Win pct ${fmtPct(t.overall_wins, t.overall_losses)}`,
                      primary:    `${t.overall_wins ?? 0}–${t.overall_losses ?? 0}`,
                      secondary:  (t.conference_wins != null || t.conference_losses != null)
                                    ? `${t.conference_wins ?? 0}–${t.conference_losses ?? 0} CONF`
                                    : undefined,
                      href:       `/team/${t.slug}`,
                    }))}
                    emptyLabel={q ? `No Division III teams match "${query}".` : 'No standings recorded.'}
                  />
                </section>
              )}

              {/* ── Division IV ────────────────────────────────────── */}
              {(!q || matchedByDiv['IV'].length > 0) && (
                <section
                  id="division-iv"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['division-iv'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Division IV"
                    blurb={selectedSeason === null
                      ? 'All-time standings — Section XI\'s smallest classification.'
                      : `${fmtSeasonLabel(selectedSeason)} standings — tight races, loud Fridays.`}
                  />
                  <PlayerRankedList
                    query={q}
                    rows={(matchedByDiv['IV']).map((t, i) => ({
                      rank:       i + 1,
                      slug:       t.slug,
                      name:       t.name.replace(/\s+Varsity\s+Football$/i, ''),
                      schoolSlug: t.school_slug ?? undefined,
                      school:     `Win pct ${fmtPct(t.overall_wins, t.overall_losses)}`,
                      primary:    `${t.overall_wins ?? 0}–${t.overall_losses ?? 0}`,
                      secondary:  (t.conference_wins != null || t.conference_losses != null)
                                    ? `${t.conference_wins ?? 0}–${t.conference_losses ?? 0} CONF`
                                    : undefined,
                      href:       `/team/${t.slug}`,
                    }))}
                    emptyLabel={q ? `No Division IV teams match "${query}".` : 'No standings recorded.'}
                  />
                </section>
              )}

              {/* ── Schedule: one card per team, selected season ────── */}
              {(!q || matchedSchedule.length > 0) && matchedSchedule.length > 0 && (
                <section
                  id="schedule"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['schedule'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Season"
                    blurb={selectedSeason === null
                      ? 'All seasons — one record per team per season, newest first.'
                      : `${fmtSeasonLabel(selectedSeason)} — one record per team, ranked by wins.`}
                    meta={
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => scheduleRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                          className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => scheduleRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                          className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    }
                  />
                  <div ref={scheduleRef} className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 pb-2">
                      {matchedSchedule.map(t => {
                        const logo = t.school_slug ? SCHOOL_LOGOS[t.school_slug] : undefined
                        return (
                          <Link
                            key={`${t.slug}-${t.season}`}
                            href={`/team/${t.slug}`}
                            className="shrink-0 w-[305px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 flex flex-col gap-2 hover:bg-[var(--paper-quiet)] transition-colors"
                            style={{ borderRadius: 3 }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {logo && (
                                <Image src={logo} alt="" width={20} height={20} className="shrink-0 object-contain" unoptimized />
                              )}
                              <span
                                className="text-[13.5px] text-[var(--paper-text)] truncate leading-snug"
                                style={{ ...SERIF, fontWeight: 500 }}
                              >
                                {t.name.replace(/\s+Varsity\s+Football$/i, '')}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-[15px] font-medium text-[var(--paper-strong)]"
                                style={MONO}
                              >
                                {t.overall_wins ?? 0}–{t.overall_losses ?? 0}
                              </span>
                              {(t.conference_wins != null || t.conference_losses != null) && (
                                <span className="text-[11px] text-[var(--paper-muted)]" style={MONO}>
                                  {t.conference_wins ?? 0}–{t.conference_losses ?? 0} CONF
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10.5px] text-[var(--paper-faint)]"
                                style={{ ...SERIF, fontStyle: 'italic' }}
                              >
                                Div. {t.division}
                              </span>
                              {t.season > 0 && (
                                <span
                                  className="text-[10.5px] text-[var(--paper-faint)]"
                                  style={MONO}
                                >
                                  {formatSeason(t.season)}
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Games: all games, all time ──────────────────────── */}
              {(!q || matchedGames.length > 0) && matchedGames.length > 0 && (
                <section
                  id="games"
                  ref={(el: HTMLElement | null) => { sectionRefs.current['games'] = el }}
                  className="mb-20 scroll-mt-24"
                >
                  <SectionHead
                    title="Games"
                    blurb={`All ${allGamesSorted.length.toLocaleString()} games on record — most recent first.`}
                    meta={
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => gamesRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                          className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => gamesRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                          className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    }
                  />
                  <div ref={gamesRef} className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-3 pb-2">
                      {matchedGames.map(g => {
                        const logo   = g.home_school_slug ? SCHOOL_LOGOS[g.home_school_slug] : undefined
                        const scored = g.home_score != null && g.away_score != null
                        return (
                          <Link
                            key={g.id}
                            href={`/game/${g.id}`}
                            className="shrink-0 w-[240px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 flex flex-col gap-1.5 hover:bg-[var(--paper-quiet)] transition-colors"
                            style={{ borderRadius: 3 }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {logo && (
                                <Image src={logo} alt="" width={18} height={18} className="shrink-0 object-contain" unoptimized />
                              )}
                              <span
                                className="text-[13.5px] text-[var(--paper-text)] truncate leading-snug"
                                style={{ ...SERIF, fontWeight: 500 }}
                              >
                                {g.home_name}
                              </span>
                            </div>
                            <p
                              className="text-[12px] text-[var(--paper-muted)] truncate"
                              style={{ ...SERIF, fontStyle: 'italic' }}
                            >
                              vs {g.away_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {scored ? (
                                <span
                                  className="text-[13px] font-medium text-[var(--paper-strong)]"
                                  style={MONO}
                                >
                                  {g.home_score}–{g.away_score}
                                </span>
                              ) : (
                                <span className="text-[12px] text-[var(--paper-muted)]" style={MONO}>
                                  {fmtGameDate(g.game_date)}
                                </span>
                              )}
                              <span className="text-[11px] text-[var(--paper-faint)]" style={MONO}>
                                {scored ? fmtGameDate(g.game_date) : formatSeason(g.season)}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Empty search state ─────────────────────────────── */}
              {q && totalVisible === 0 && matchedSchedule.length === 0 && matchedGames.length === 0 && (
                <div className="py-24 text-center">
                  <p
                    className="text-[var(--paper-muted)] text-lg"
                    style={{ ...SERIF, fontStyle: 'italic' }}
                  >
                    No teams or games match &ldquo;{query}&rdquo;.
                  </p>
                  <button
                    onClick={() => setQuery('')}
                    className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--paper-strong)] hover:underline underline-offset-4"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {/* ── Colophon ───────────────────────────────────────── */}
              <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
                <p
                  className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
                  style={{ ...SERIF, fontStyle: 'italic' }}
                >
                  Standings and game records are drawn from Section XI official results
                  and Newsday box scores. Nassau County opponents are excluded from
                  this almanac.
                </p>
              </div>

            </main>
          </div>
        </div>
      </AppLayout>

      <div style={PAPER_BRIDGE}>
        <PanelChart open={chartsOpen}  onClose={() => setChartsOpen(false)} />
        <AppPanel   open={playersOpen} onClose={() => setPlayersOpen(false)} title="Players" />
        <PanelChat  open={chatOpen}    onClose={() => setChatOpen(false)}    countyName="Section XI" />
      </div>
    </>
  )
}
