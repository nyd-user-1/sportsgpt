'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ChartSpline, Map, MessageCircle, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  EditorialButtonGroup,
  HeroStrip,
  PAPER_BRIDGE,
  PlayerRankedList,
  SectionHead,
  StickyControlBar,
  ContentsNav,
  SearchInput,
  useSearchHotkey,
} from '@/components/editorial'

type StandingRow = {
  slug: string
  name: string
  school_slug: string | null
  overall_wins: number | null
  overall_losses: number | null
  overall_ties: number | null
  conference_wins: number | null
  conference_losses: number | null
  season: number | null
}

type TopPlayer = {
  player_slug: string
  player_name: string
  school_name: string
  school_slug?: string
  pass_yards?: number | null
  pass_tds?: number | null
  completions?: number | null
  attempts?: number | null
  rush_yards?: number | null
  rush_tds?: number | null
  recv_yards?: number | null
  recv_tds?: number | null
  receptions?: number | null
  season: number
}

const DIV_ORDER = ['division-i', 'division-ii', 'division-iii', 'division-iv']

const DIVISION_BLURB: Record<string, string> = {
  'I':   'Section XI’s largest schools — the marquee class of Long Island football.',
  'II':  'The middle weight — perennial contenders and the closest weekly margins.',
  'III': 'Mid-size programs, where small swings decide the standings.',
  'IV':  'Section XI’s smallest classification — tight races, loud Friday nights.',
}

const SECTIONS = [
  { id: 'standings', label: 'Standings' },
  { id: 'passing',   label: 'Passing' },
  { id: 'rushing',   label: 'Rushing' },
  { id: 'receiving', label: 'Receiving' },
] as const

type SectionId = typeof SECTIONS[number]['id']

const fmtSeason      = (y: number) => `${y}–${String(y + 1).slice(2)}`
const fmtSeasonLabel = (s: number | null) => s === null ? 'All-Time' : fmtSeason(s)

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0
  const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

// ── All-Time aggregation helpers ─────────────────────────────────────────────

function sumN(rows: StandingRow[], key: keyof StandingRow): number {
  return rows.reduce((s, r) => s + ((r[key] as number | null) ?? 0), 0)
}
function sumP(rows: TopPlayer[], key: keyof TopPlayer): number | null {
  const vals = rows.map(r => r[key] as number | null).filter(v => v != null) as number[]
  return vals.length ? vals.reduce((s, v) => s + v, 0) : null
}

function aggregateStandings(rows: StandingRow[]): StandingRow[] {
  const groups: Record<string, StandingRow[]> = {}
  for (const r of rows) { (groups[r.slug] ??= []).push(r) }
  return Object.values(groups)
    .map(rs => ({
      slug:              rs[0].slug,
      name:              rs[0].name,
      school_slug:       rs[0].school_slug,
      overall_wins:      sumN(rs, 'overall_wins'),
      overall_losses:    sumN(rs, 'overall_losses'),
      overall_ties:      sumN(rs, 'overall_ties'),
      conference_wins:   sumN(rs, 'conference_wins'),
      conference_losses: sumN(rs, 'conference_losses'),
      season:            null,
    }))
    .sort((a, b) => (b.overall_wins ?? 0) - (a.overall_wins ?? 0))
}

function aggregatePlayers(rows: TopPlayer[]): TopPlayer[] {
  const groups: Record<string, TopPlayer[]> = {}
  for (const r of rows) { (groups[r.player_slug] ??= []).push(r) }
  return Object.values(groups).map(rs => ({
    player_slug: rs[0].player_slug,
    player_name: rs[0].player_name,
    school_name: rs[0].school_name,
    school_slug: rs[0].school_slug,
    season:      0,
    pass_yards:  sumP(rs, 'pass_yards'),
    pass_tds:    sumP(rs, 'pass_tds'),
    completions: sumP(rs, 'completions'),
    attempts:    sumP(rs, 'attempts'),
    rush_yards:  sumP(rs, 'rush_yards'),
    rush_tds:    sumP(rs, 'rush_tds'),
    recv_yards:  sumP(rs, 'recv_yards'),
    recv_tds:    sumP(rs, 'recv_tds'),
    receptions:  sumP(rs, 'receptions'),
  }))
}

export function DivisionShell({
  divSlug,
  division,
  standings,
  topPassers,
  topRushers,
  topReceivers,
}: {
  divSlug: string
  division: string
  standings: StandingRow[]
  topPassers: TopPlayer[]
  topRushers: TopPlayer[]
  topReceivers: TopPlayer[]
}) {
  const [chartsOpen,      setChartsOpen]      = useState(false)
  const [mapsOpen,        setMapsOpen]        = useState(false)
  const [chatOpen,        setChatOpen]        = useState(false)
  const [selectedSeason,  setSelectedSeason]  = useState<number | null>(null)
  const [query,           setQuery]           = useState('')

  const [activeSection, setActiveSection] = useState<SectionId>('standings')
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    standings: null, passing: null, rushing: null, receiving: null,
  })
  const searchRef = useRef<HTMLInputElement>(null)

  // Hero slides: use all teams with photos — not affected by season or search.
  const slides = useMemo(() => {
    const seen = new Set<string>()
    return standings
      .filter(s => {
        const slug = s.school_slug
        if (!slug || seen.has(slug) || !TEAM_PHOTOS[slug]?.[0]) return false
        seen.add(slug)
        return true
      })
      .map(s => TEAM_PHOTOS[s.school_slug!]![0])
      .slice(0, 6)
  }, [standings])

  const availableSeasons = useMemo(
    () => [...new Set(standings.map(s => s.season).filter(Boolean) as number[])].sort((a, b) => b - a),
    [standings]
  )
  // null = All-Time is first
  const seasonOptions: (number | null)[] = useMemo(() => [null, ...availableSeasons], [availableSeasons])
  const seasonOptIdx = seasonOptions.indexOf(selectedSeason)
  function shiftSeason(delta: 1 | -1) {
    const next = (seasonOptIdx + delta + seasonOptions.length) % seasonOptions.length
    setSelectedSeason(seasonOptions[next])
  }

  // Season-filtered (or all-time aggregated) data.
  const filteredStandings = useMemo(() =>
    selectedSeason === null
      ? aggregateStandings(standings)
      : standings.filter(s => s.season === selectedSeason),
    [standings, selectedSeason]
  )
  const seasonPassers = useMemo(() => {
    const base = selectedSeason === null ? aggregatePlayers(topPassers) : topPassers.filter(p => p.season === selectedSeason)
    return base.sort((a, b) => (b.pass_yards ?? 0) - (a.pass_yards ?? 0))
  }, [topPassers, selectedSeason])
  const seasonRushers = useMemo(() => {
    const base = selectedSeason === null ? aggregatePlayers(topRushers) : topRushers.filter(p => p.season === selectedSeason)
    return base.sort((a, b) => (b.rush_yards ?? 0) - (a.rush_yards ?? 0))
  }, [topRushers, selectedSeason])
  const seasonReceivers = useMemo(() => {
    const base = selectedSeason === null ? aggregatePlayers(topReceivers) : topReceivers.filter(p => p.season === selectedSeason)
    return base.sort((a, b) => (b.recv_yards ?? 0) - (a.recv_yards ?? 0))
  }, [topReceivers, selectedSeason])

  // Search: team name for standings; player name OR school name for player sections.
  const q = query.trim().toLowerCase()
  const matchedStandings = q
    ? filteredStandings.filter(t => t.name.toLowerCase().includes(q))
    : filteredStandings
  const matchedPassers = q
    ? seasonPassers.filter(p =>
        p.player_name.toLowerCase().includes(q) || p.school_name.toLowerCase().includes(q))
    : seasonPassers
  const matchedRushers = q
    ? seasonRushers.filter(p =>
        p.player_name.toLowerCase().includes(q) || p.school_name.toLowerCase().includes(q))
    : seasonRushers
  const matchedReceivers = q
    ? seasonReceivers.filter(p =>
        p.player_name.toLowerCase().includes(q) || p.school_name.toLowerCase().includes(q))
    : seasonReceivers

  const sectionCounts: Record<SectionId, number> = {
    standings: matchedStandings.length,
    passing:   matchedPassers.length,
    rushing:   matchedRushers.length,
    receiving: matchedReceivers.length,
  }
  const sectionTotals: Record<SectionId, number> = {
    standings: filteredStandings.length,
    passing:   seasonPassers.length,
    rushing:   seasonRushers.length,
    receiving: seasonReceivers.length,
  }
  const totalVisible = sectionCounts.standings + sectionCounts.passing + sectionCounts.rushing + sectionCounts.receiving
  const totalRanked  = sectionTotals.standings + sectionTotals.passing + sectionTotals.rushing + sectionTotals.receiving

  const curIdx  = DIV_ORDER.indexOf(divSlug)
  const n       = DIV_ORDER.length
  const prevDiv = DIV_ORDER[(curIdx - 1 + n) % n]
  const nextDiv = DIV_ORDER[(curIdx + 1) % n]

  function metaCount(id: SectionId, noun: 'team' | 'player'): React.ReactNode {
    const visible = sectionCounts[id]
    const total   = sectionTotals[id]
    if (total === 0) return null
    return (
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] tabular-nums">
        {q && visible !== total
          ? `${visible} / ${total}`
          : `${total} ${total === 1 ? noun : `${noun}s`}`}
      </span>
    )
  }

  // Scroll-spy across sections.
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
              subhead={DIVISION_BLURB[division]}
              meta={[
                `${filteredStandings.length} teams`,
                `${availableSeasons.length} seasons of record`,
                fmtSeasonLabel(selectedSeason),
              ]}
              rightSlot={
                <EditorialButtonGroup
                  prevHref={`/division/${prevDiv}`}
                  nextHref={`/division/${nextDiv}`}
                  prevLabel="Previous division"
                  nextLabel="Next division"
                  buttons={[
                    { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen, onClick: () => setChartsOpen(v => !v) },
                    { icon: Map,           tooltip: 'Map',           active: mapsOpen,   onClick: () => setMapsOpen(v => !v) },
                    { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,   onClick: () => setChatOpen(v => !v) },
                  ]}
                />
              }
            >
              Division {division}
            </EditorialHead>
          </div>

          {/* ── Hero photo strip ──────────────────────────────────── */}
          {slides.length > 0 && (
            <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-14">
              <RevealFx delay={0.1} translateY={8}>
                <HeroStrip slides={slides} />
              </RevealFx>
            </div>
          )}

          {/* ── Sticky control bar ────────────────────────────────── */}
          <StickyControlBar>
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

            <SearchInput
              value={query}
              onChange={setQuery}
              inputRef={searchRef}
              placeholder="Search teams & players…"
            />

            <div className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums hidden md:block">
              {q
                ? `${totalVisible} / ${totalRanked} ranked`
                : `${totalRanked} ranked entries`}
            </div>
          </StickyControlBar>

          {/* ── Body: sidebar + content ────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

            {/* Chapter sidebar */}
            <ContentsNav
              items={SECTIONS.map(s => ({ id: s.id, label: s.label, count: sectionCounts[s.id] }))}
              activeId={activeSection}
            />

            <main className="min-w-0">

              {/* Section: Standings — hidden when searching by player name (no team match) */}
              {(!q || matchedStandings.length > 0) && <section
                id="standings"
                ref={(el: HTMLElement | null) => { sectionRefs.current.standings = el }}
                className="mb-20 scroll-mt-24 first:mt-0"
              >
                <SectionHead
                  title="Standings"
                  blurb="The order of finish, by overall record."
                  meta={metaCount('standings', 'team')}
                />
                <PlayerRankedList
                  query={q}
                  rows={matchedStandings.map((t, i) => ({
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
                  emptyLabel={q
                    ? `No teams match "${query}".`
                    : 'No standings recorded.'}
                />
              </section>}

              {/* Section: Passing */}
              <section
                id="passing"
                ref={(el: HTMLElement | null) => { sectionRefs.current.passing = el }}
                className="mb-20 scroll-mt-24"
              >
                <SectionHead
                  title="Passing"
                  blurb="Quarterbacks, ranked by yards thrown."
                  meta={metaCount('passing', 'player')}
                />
                <PlayerRankedList
                  query={q}
                  rows={matchedPassers.map((p, i) => ({
                    rank:       i + 1,
                    slug:       p.player_slug,
                    name:       p.player_name,
                    school:     p.school_name,
                    schoolSlug: p.school_slug,
                    primary:    p.pass_yards != null ? `${p.pass_yards.toLocaleString()} YDS` : '— YDS',
                    secondary:  p.pass_tds   != null ? `${p.pass_tds} TD` : '— TD',
                  }))}
                  emptyLabel={q ? `No passers match "${query}".` : 'No passing leaders recorded.'}
                />
              </section>

              {/* Section: Rushing */}
              <section
                id="rushing"
                ref={(el: HTMLElement | null) => { sectionRefs.current.rushing = el }}
                className="mb-20 scroll-mt-24"
              >
                <SectionHead
                  title="Rushing"
                  blurb="Ball carriers, ranked by yards gained."
                  meta={metaCount('rushing', 'player')}
                />
                <PlayerRankedList
                  query={q}
                  rows={matchedRushers.map((p, i) => ({
                    rank:       i + 1,
                    slug:       p.player_slug,
                    name:       p.player_name,
                    school:     p.school_name,
                    schoolSlug: p.school_slug,
                    primary:    p.rush_yards != null ? `${p.rush_yards.toLocaleString()} YDS` : '— YDS',
                    secondary:  p.rush_tds   != null ? `${p.rush_tds} TD` : '— TD',
                  }))}
                  emptyLabel={q ? `No rushers match "${query}".` : 'No rushing leaders recorded.'}
                />
              </section>

              {/* Section: Receiving */}
              <section
                id="receiving"
                ref={(el: HTMLElement | null) => { sectionRefs.current.receiving = el }}
                className="mb-8 scroll-mt-24"
              >
                <SectionHead
                  title="Receiving"
                  blurb="Pass catchers, ranked by yards gained."
                  meta={metaCount('receiving', 'player')}
                />
                <PlayerRankedList
                  query={q}
                  rows={matchedReceivers.map((p, i) => ({
                    rank:       i + 1,
                    slug:       p.player_slug,
                    name:       p.player_name,
                    school:     p.school_name,
                    schoolSlug: p.school_slug,
                    primary:    p.recv_yards != null ? `${p.recv_yards.toLocaleString()} YDS` : '— YDS',
                    secondary:  p.recv_tds   != null ? `${p.recv_tds} TD` : '— TD',
                  }))}
                  emptyLabel={q ? `No receivers match "${query}".` : 'No receiving leaders recorded.'}
                />
              </section>

              {q && totalVisible === 0 && (
                <div className="py-24 text-center">
                  <p
                    className="text-[var(--paper-muted)] text-lg"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                  >
                    No teams or players match &ldquo;{query}&rdquo;.
                  </p>
                  <button
                    onClick={() => setQuery('')}
                    className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--paper-strong)] hover:underline underline-offset-4"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {/* Colophon */}
              <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
                <p
                  className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                >
                  Standings, passing, rushing, and receiving totals are drawn from
                  Section XI official records and Newsday box scores. Nassau County
                  opponents are excluded from this almanac.
                </p>
              </div>

            </main>
          </div>
        </div>
      </AppLayout>

      <div style={PAPER_BRIDGE}>
        <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
        <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
        <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={`Division ${division}`} />
      </div>
    </>
  )
}


