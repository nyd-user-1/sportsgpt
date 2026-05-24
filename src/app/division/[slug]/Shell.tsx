'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ChartSpline, Map, MessageCircle, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { RevealFx } from '@/components/RevealFx'
import { cn } from '@/lib/utils'
import { CURRENT_SEASON } from '@/lib/app-config'
import {
  EditorialHead,
  EditorialButtonGroup,
  HeroStrip,
  MetaToggle,
  PAPER_BRIDGE,
  PlayerRankedList,
  SectionHead,
  Tablet,
  EmptyTablet,
  MONO,
  tabletTh,
  tabletTd,
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

const fmtSeason = (y: number) => `${y}–${String(y + 1).slice(2)}`

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0
  const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

// Standings keeps its original behavior — short preview, expand to all.
const STANDINGS_PREVIEW = 3
// Player sections standardize at top 5 / top 10 regardless of how many exist.
const PLAYERS_PREVIEW   = 5
const PLAYERS_EXPANDED  = 10

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
  const [chartsOpen, setChartsOpen] = useState(false)
  const [mapsOpen,   setMapsOpen]   = useState(false)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [seasonIdx,  setSeasonIdx]  = useState(0)
  const [query,      setQuery]      = useState('')

  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    standings: false, passing: false, rushing: false, receiving: false,
  })
  const toggle = (s: SectionId) => setExpanded(prev => ({ ...prev, [s]: !prev[s] }))

  const [activeSection, setActiveSection] = useState<SectionId>('standings')
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    standings: null, passing: null, rushing: null, receiving: null,
  })
  const searchRef = useRef<HTMLInputElement>(null)

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

  const availableSeasons  = useMemo(
    () => [...new Set(standings.map(s => s.season).filter(Boolean) as number[])].sort((a, b) => b - a),
    [standings]
  )
  const selectedSeason    = availableSeasons[seasonIdx] ?? CURRENT_SEASON
  const filteredStandings = standings.filter(s => s.season === selectedSeason)
  const seasonPassers     = topPassers
    .filter(p => p.season === selectedSeason)
    .sort((a, b) => (b.pass_yards ?? 0) - (a.pass_yards ?? 0))
  const seasonRushers     = topRushers
    .filter(p => p.season === selectedSeason)
    .sort((a, b) => (b.rush_yards ?? 0) - (a.rush_yards ?? 0))
  const seasonReceivers   = topReceivers
    .filter(p => p.season === selectedSeason)
    .sort((a, b) => (b.recv_yards ?? 0) - (a.recv_yards ?? 0))

  // Apply search filter (matches team name in standings, player name in leader sections).
  const q = query.trim().toLowerCase()
  const matchedStandings = q
    ? filteredStandings.filter(t => t.name.toLowerCase().includes(q))
    : filteredStandings
  const matchedPassers = q
    ? seasonPassers.filter(p => p.player_name.toLowerCase().includes(q))
    : seasonPassers
  const matchedRushers = q
    ? seasonRushers.filter(p => p.player_name.toLowerCase().includes(q))
    : seasonRushers
  const matchedReceivers = q
    ? seasonReceivers.filter(p => p.player_name.toLowerCase().includes(q))
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

  function capStandings(rows: StandingRow[], isExpanded: boolean) {
    if (q) return rows // search bypasses cap
    return isExpanded ? rows : rows.slice(0, STANDINGS_PREVIEW)
  }
  function capPlayers<T>(rows: T[], isExpanded: boolean) {
    if (q) return rows
    return isExpanded ? rows.slice(0, PLAYERS_EXPANDED) : rows.slice(0, PLAYERS_PREVIEW)
  }

  function metaSlotFor(sectionId: SectionId): React.ReactNode {
    if (q) return null // hide toggle while searching
    const total      = sectionTotals[sectionId]
    const isExpanded = expanded[sectionId]
    if (sectionId === 'standings') {
      if (total <= STANDINGS_PREVIEW) return null
      return (
        <MetaToggle
          label={isExpanded ? 'Show fewer' : `Show all ${total} teams`}
          expanded={isExpanded}
          onClick={() => toggle('standings')}
        />
      )
    }
    if (total <= PLAYERS_PREVIEW) return null
    return (
      <MetaToggle
        label={isExpanded ? 'Show Top 5' : 'Show Top 10'}
        expanded={isExpanded}
        onClick={() => toggle(sectionId)}
      />
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
                fmtSeason(selectedSeason),
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
              {availableSeasons.length > 1 && (
                <button
                  onClick={() => setSeasonIdx(i => (i - 1 + availableSeasons.length) % availableSeasons.length)}
                  aria-label="Previous season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <span
                className="text-[var(--paper-text)] tabular-nums min-w-[5rem] text-center"
                style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
              >
                {fmtSeason(selectedSeason)}
              </span>
              {availableSeasons.length > 1 && (
                <button
                  onClick={() => setSeasonIdx(i => (i + 1) % availableSeasons.length)}
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

              {/* Section: Standings */}
              <section
                id="standings"
                ref={(el: HTMLElement | null) => { sectionRefs.current.standings = el }}
                className="mb-20 scroll-mt-24 first:mt-0"
              >
                <SectionHead
                  title="Standings"
                  blurb="The order of finish, by overall record."
                  meta={metaSlotFor('standings')}
                />
                {matchedStandings.length === 0 ? (
                  <EmptyTablet label={q ? `No teams match “${query}”.` : `No standings recorded for ${fmtSeason(selectedSeason)}.`} />
                ) : (
                  <StandingsTablet rows={capStandings(matchedStandings, expanded.standings)} />
                )}
              </section>

              {/* Section: Passing */}
              <section
                id="passing"
                ref={(el: HTMLElement | null) => { sectionRefs.current.passing = el }}
                className="mb-20 scroll-mt-24"
              >
                <SectionHead
                  title="Passing"
                  blurb="Quarterbacks, ranked by yards thrown."
                  meta={metaSlotFor('passing')}
                />
                <PlayerRankedList
                  rows={capPlayers(matchedPassers, expanded.passing).map((p, i) => ({
                    rank:       i + 1,
                    slug:       p.player_slug,
                    name:       p.player_name,
                    school:     p.school_name,
                    schoolSlug: p.school_slug,
                    primary:    p.pass_yards != null ? `${p.pass_yards.toLocaleString()} YDS` : '— YDS',
                    secondary:  p.pass_tds   != null ? `${p.pass_tds} TD` : '— TD',
                  }))}
                  emptyLabel={q ? `No passers match “${query}”.` : `No passing leaders recorded for ${fmtSeason(selectedSeason)}.`}
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
                  meta={metaSlotFor('rushing')}
                />
                <PlayerRankedList
                  rows={capPlayers(matchedRushers, expanded.rushing).map((p, i) => ({
                    rank:       i + 1,
                    slug:       p.player_slug,
                    name:       p.player_name,
                    school:     p.school_name,
                    schoolSlug: p.school_slug,
                    primary:    p.rush_yards != null ? `${p.rush_yards.toLocaleString()} YDS` : '— YDS',
                    secondary:  p.rush_tds   != null ? `${p.rush_tds} TD` : '— TD',
                  }))}
                  emptyLabel={q ? `No rushers match “${query}”.` : `No rushing leaders recorded for ${fmtSeason(selectedSeason)}.`}
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
                  meta={metaSlotFor('receiving')}
                />
                <PlayerRankedList
                  rows={capPlayers(matchedReceivers, expanded.receiving).map((p, i) => ({
                    rank:       i + 1,
                    slug:       p.player_slug,
                    name:       p.player_name,
                    school:     p.school_name,
                    schoolSlug: p.school_slug,
                    primary:    p.recv_yards != null ? `${p.recv_yards.toLocaleString()} YDS` : '— YDS',
                    secondary:  p.recv_tds   != null ? `${p.recv_tds} TD` : '— TD',
                  }))}
                  emptyLabel={q ? `No receivers match “${query}”.` : `No receiving leaders recorded for ${fmtSeason(selectedSeason)}.`}
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

// ──────────────────────────────────────────────────────────────────────────────
// Standings tablet — page-specific table on the shared Tablet wrapper.
// ──────────────────────────────────────────────────────────────────────────────
function StandingsTablet({ rows }: { rows: StandingRow[] }) {
  const router = useRouter()

  return (
    <Tablet>
      <table className="w-full">
        <thead>
          <tr>
            <th className={tabletTh('text-left w-14 pl-5')}>#</th>
            <th className={tabletTh('text-left')}>Team</th>
            <th className={tabletTh('text-right w-14')}>W</th>
            <th className={tabletTh('text-right w-14')}>L</th>
            <th className={tabletTh('text-right w-20')}>PCT</th>
            <th className={tabletTh('text-right w-20 pr-5')}>Conf</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr
              key={t.slug}
              onClick={() => router.push(`/team/${t.slug}`)}
              className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
            >
              <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
                {String(i + 1).padStart(2, ' ')}.
              </td>
              <td className={tabletTd}>
                <Link
                  href={`/team/${t.slug}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors"
                >
                  {t.school_slug && SCHOOL_LOGOS[t.school_slug] && (
                    <Image
                      src={SCHOOL_LOGOS[t.school_slug]}
                      alt=""
                      width={22}
                      height={22}
                      className="shrink-0 h-[22px] w-[22px] object-contain"
                      unoptimized
                    />
                  )}
                  <span
                    className="text-[16px] leading-tight"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 500, letterSpacing: '-0.005em' }}
                  >
                    {t.name.replace(/\s+Varsity\s+Football$/i, '')}
                  </span>
                </Link>
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
              <td className={cn(tabletTd, 'text-right pr-5 text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                {(t.conference_wins != null || t.conference_losses != null)
                  ? `${t.conference_wins ?? 0}–${t.conference_losses ?? 0}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tablet>
  )
}

