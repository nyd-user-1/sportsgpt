'use client'

import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { ChartSpline, FileUser, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { CHART_CONFIGS, CHART_SLUGS_AZ } from '@/lib/chart-configs'
import { SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { RevealFx } from '@/components/RevealFx'
import { AppPanel } from '@/components/AppPanel'
import { PanelChart } from '@/components/PanelChart'
import { useDiscussion } from '@/lib/discussion-store'
import {
  EditorialHead, EditorialButtonGroup,
  SectionHead, StickyControlBar,
  SearchInput, useSearchHotkey, SearchButtonGroup,
  PAPER_BRIDGE,
} from '@/components/editorial'
import { cn } from '@/lib/utils'

// ── Style tokens ──────────────────────────────────────────────────────────────

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

// ── Taxonomy ──────────────────────────────────────────────────────────────────

type CategoryId = 'all' | 'team' | 'player' | 'game'

const CATEGORIES: { id: CategoryId; label: string; roman: string; blurb: string }[] = [
  { id: 'team',   label: 'Team & Season',     roman: 'I.',   blurb: 'Records measured against the team’s full season — wins, points, differentials.' },
  { id: 'player', label: 'Player & Position', roman: 'II.',  blurb: 'Leaderboards by individual stat line — passing, rushing, receiving, scoring.' },
  { id: 'game',   label: 'Game Records',      roman: 'III.', blurb: 'Single-game and short-window highs — top scoring games, blowouts, streaks.' },
]

const CHART_CATEGORY: Record<string, Exclude<CategoryId, 'all'>> = {
  'season-records': 'team', 'wins-by-school': 'team',
  'point-differential-leaders': 'team', 'home-away-record': 'team',
  'pf-pa': 'team', 'win-loss-division': 'team', 'strength-of-schedule': 'team',
  'win-percentage':  'team', 'rushing-yards-team': 'team', 'passing-yards-team': 'team', 'turnovers': 'team',
  'passing-yards-leaders': 'player', 'passing-tds-leaders': 'player',
  'rushing-yards-leaders': 'player', 'rushing-tds-leaders': 'player',
  'receiving-yards-leaders': 'player', 'receiving-tds-leaders': 'player',
  'total-tds-leaders': 'player', 'total-yards-leaders': 'player', 'total-points-leaders': 'player',
  'scoring-offense': 'game', 'scoring-defense': 'game',
  'top-scoring-games': 'game', 'biggest-blowouts': 'game',
  'single-game-rushing': 'game', 'single-game-passing': 'game',
  'winning-streaks': 'game', 'losing-streaks': 'game', 'points-by-quarter': 'game',
}

const FILTER_TABS: { id: CategoryId; label: string }[] = [
  { id: 'all',    label: 'All Charts' },
  { id: 'team',   label: 'Team' },
  { id: 'player', label: 'Player' },
  { id: 'game',   label: 'Game' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function schoolDisplay(slug: string): string {
  return slug.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}

// ── Almanac ───────────────────────────────────────────────────────────────────

export function ChartsAlmanac({ chartSchools }: { chartSchools: Record<string, string[]> }) {
  const router     = useRouter()
  const pathname   = usePathname()
  const match      = pathname.match(/^\/charts\/([^/]+)/)
  const activeSlug = match ? match[1] : null

  const [active, setActive] = useState<CategoryId>('all')
  const [query, setQuery]   = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  // Toolbar panels (mirrors team/division/player/game pattern)
  const [chartsOpen,  setChartsOpen]  = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const { open: discussionOpen, openPanel: openDiscussion, close: closeDiscussion, seen: discussionSeen } = useDiscussion()

  const q = query.trim().toLowerCase()

  // Filter the 28 charts by category + query
  const visibleCharts = useMemo(() => {
    return CHART_SLUGS_AZ.filter(slug => {
      const cat = CHART_CATEGORY[slug]
      if (active !== 'all' && cat !== active) return false
      if (!q) return true
      const cfg = CHART_CONFIGS.find(c => c.slug === slug)
      const title = cfg?.title?.toLowerCase() ?? ''
      return title.includes(q) || slug.includes(q)
    })
  }, [active, q])

  const visibleSet = useMemo(() => new Set(visibleCharts), [visibleCharts])

  // Group by category for the chapter sections
  const chapters = useMemo(() => {
    return CATEGORIES.map(cat => ({
      ...cat,
      charts: visibleCharts.filter(s => CHART_CATEGORY[s] === cat.id),
    })).filter(c => c.charts.length > 0)
  }, [visibleCharts])

  return (
    <>
    <div
      className="flex-1 overflow-y-auto no-scrollbar"
      style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}
    >
      {/* ── Masthead ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
        <RevealFx delay={0} translateY={4}>
          <EditorialHead
            size="xl"
            eyebrow="Section XI · Almanac · 2025-26 Edition"
            subhead={
              <>
                Twenty-eight ways to read the record book — team, player, and game.
              </>
            }
            meta={[
              `${CHART_SLUGS_AZ.length} charts`,
              `${CATEGORIES.length} chapters`,
              'all-time totals',
            ]}
            rightSlot={
              <EditorialButtonGroup
                prevHref={`/charts/${CHART_SLUGS_AZ[CHART_SLUGS_AZ.length - 1]}`}
                nextHref={`/charts/${CHART_SLUGS_AZ[0]}`}
                prevLabel="Last chart"
                nextLabel="First chart"
                buttons={[
                  { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen,  onClick: () => setChartsOpen(v => !v) },
                  { icon: FileUser,      tooltip: 'Players',       active: playersOpen, onClick: () => setPlayersOpen(v => !v) },
                  { icon: MessageCircle, tooltip: 'The Sideline', dot: !discussionSeen, active: discussionOpen, onClick: () => discussionOpen ? closeDiscussion() : openDiscussion() },
                ]}
              />
            }
          >
            Charts
          </EditorialHead>
        </RevealFx>
      </div>

      {/* ── Sticky control bar ─────────────────────────────────── */}
      <StickyControlBar>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
            Charts
          </span>
          {FILTER_TABS.length > 1 && (
            <button
              onClick={() => {
                const idx = FILTER_TABS.findIndex(t => t.id === active)
                const prev = (idx - 1 + FILTER_TABS.length) % FILTER_TABS.length
                setActive(FILTER_TABS[prev].id)
              }}
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
            {FILTER_TABS.find(t => t.id === active)?.label ?? 'All Charts'}
          </span>
          {FILTER_TABS.length > 1 && (
            <button
              onClick={() => {
                const idx = FILTER_TABS.findIndex(t => t.id === active)
                const next = (idx + 1) % FILTER_TABS.length
                setActive(FILTER_TABS[next].id)
              }}
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
          placeholder="Search charts…"
        />

        <SearchButtonGroup />
      </StickyControlBar>

      {/* ── Chapters ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24">

        {chapters.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[15px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
              No charts match &ldquo;{query}&rdquo;.
            </p>
          </div>
        )}

        {chapters.map((chapter, i) => (
          <RevealFx key={chapter.id} delay={0.05 + i * 0.1} translateY={8} className="mb-20 last:mb-0">
            <SectionHead
              title={chapter.label}
              eyebrow={chapter.roman}
              blurb={chapter.blurb}
              meta={
                <span
                  className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)] tabular-nums"
                  style={SANS}
                >
                  {chapter.charts.length} {chapter.charts.length === 1 ? 'chart' : 'charts'}
                </span>
              }
            />

            <div
              data-charts-grid
              className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            >
              {chapter.charts.map((slug, idx) => {
                const config = CHART_CONFIGS.find(c => c.slug === slug)
                if (!config) return null
                const isActive = slug === activeSlug && visibleSet.has(slug)

                // Cycle through the top 3 schools, preferring those with photos
                const candidates  = chartSchools[slug] ?? ['floyd']
                const withPhotos  = candidates.filter(s => (TEAM_PHOTOS[s]?.length ?? 0) > 0)
                const pool        = withPhotos.length > 0 ? withPhotos : candidates
                const schoolSlug  = pool[idx % pool.length]
                const schoolPhotos = TEAM_PHOTOS[schoolSlug] ?? []
                const photo       = schoolPhotos[idx % Math.max(1, schoolPhotos.length)] ?? null
                const logoUrl     = SCHOOL_LOGOS[schoolSlug] ?? null
                const leaderName  = schoolDisplay(schoolSlug)

                return (
                  <button
                    key={slug}
                    onClick={() => router.push(`/charts/${slug}`, { scroll: false })}
                    className={cn(
                      'group/card flex flex-col text-left transition-all',
                    )}
                  >
                    {/* Matted photo frame */}
                    <div
                      className={cn(
                        'w-full border bg-[var(--paper-quiet)] transition-colors',
                        isActive
                          ? 'border-[var(--paper-strong)]'
                          : 'border-[var(--paper-rule)] group-hover/card:border-[var(--paper-strong)]',
                      )}
                      style={{ padding: 6, borderRadius: 3 }}
                    >
                      <div
                        className="relative w-full overflow-hidden bg-[var(--paper-quiet)]"
                        style={{ height: 140, borderRadius: 1 }}
                      >
                        {photo ? (
                          <Image
                            src={photo}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover object-top transition-[filter] duration-300 group-hover/card:brightness-110"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full" />
                        )}
                        {logoUrl && (
                          <div
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden"
                          >
                            <Image
                              src={logoUrl}
                              alt=""
                              width={20}
                              height={20}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title + leader meta */}
                    <div className="px-1 pt-3">
                      <p
                        className={cn(
                          'leading-snug transition-colors',
                          isActive ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-text)] group-hover/card:text-[var(--paper-strong)]',
                        )}
                        style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
                      >
                        {config.title}
                      </p>
                      <p
                        className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] truncate"
                        style={MONO}
                      >
                        ─ {leaderName}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </RevealFx>
        ))}

        {/* Colophon */}
        <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
          <p
            className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
            style={{ ...SERIF, fontStyle: 'italic' }}
          >
            Twenty-eight stat indices drawn from Section XI official results and Newsday
            box scores. Each tile leads to a sortable detail panel — click through to
            cycle players and teams within a chart, or use arrow keys to walk the grid.
          </p>
        </div>
      </div>
    </div>

    <div style={PAPER_BRIDGE}>
      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <AppPanel open={playersOpen} onClose={() => setPlayersOpen(false)} title="Players" />
    </div>
    </>
  )
}
