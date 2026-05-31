import Link from 'next/link'
import {
  Building2, User, ListOrdered, LayoutDashboard, LayoutGrid, School, CalendarDays,
  Map as MapIcon, MessagesSquare, MessageCircle, Search, BookOpen, ArrowRight,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { EditorialHead, PAPER_BRIDGE } from '@/components/editorial'
import { Colophon } from '@/app/_home/Colophon'
import { HomeTour, TourTrigger } from '@/app/_home/HomeTour'
import { sql } from '@/lib/db'
import { CURRENT_SEASON, AVAILABLE_SEASONS } from '@/lib/season'
import { CHART_SLUGS_AZ } from '@/lib/chart-configs'
import { GLOSSARY_TERMS } from '@/lib/glossary-terms'
import { BOARD_THREADS } from '@/lib/board-data'
import { formatSeason } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

type Counts = {
  teams: number
  players: number
  games: number
  schools: number
  updatedAt: string
}

/** Lightweight count query — the hub only needs headline numbers, not the
 *  full home-data payload (lead plate, standings, leaders, recent games). */
async function loadCounts(): Promise<Counts> {
  const [row] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM teams   WHERE level = 'Varsity')                       AS teams,
      (SELECT COUNT(*)::int FROM players)                                                AS players,
      (SELECT COUNT(*)::int FROM games   WHERE home_score IS NOT NULL
                                           AND away_score IS NOT NULL)                   AS games,
      (SELECT COUNT(*)::int FROM schools)                                                AS schools,
      (SELECT MAX(game_date) FROM games)                                                 AS updated_at
  ` as { teams: number; players: number; games: number; schools: number; updated_at: string }[]
  return {
    teams: row.teams,
    players: row.players,
    games: row.games,
    schools: row.schools,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}

type HubCard = {
  href: string
  numeral: string
  title: string
  body: string
  stat: string
  icon: React.ReactNode
  /** Tour key on each card (NOT positional) — survives card reordering.
   *  Grouped rows share a key (row1/row2); singled-out cards get unique keys. */
  tour: string
}

function buildCards(c: Counts): HubCard[] {
  const fmt = (n: number) => n.toLocaleString()
  return [
    // ── Row 1 (grouped: row1) ──────────────────────────────────────────
    {
      href: '/team',
      numeral: 'I',
      title: 'Teams',
      body: 'Every program ranked by record — wins, losses, point differential, and conference standing.',
      stat: `${fmt(c.teams)} programs · 4 divisions`,
      icon: <Building2 className="h-5 w-5" />,
      tour: 'row1',
    },
    {
      href: '/player',
      numeral: 'II',
      title: 'Players',
      body: 'Every passer, rusher, and receiver on file — measured by yard, by touchdown, sortable by any column.',
      stat: `${fmt(c.players)} players on file`,
      icon: <User className="h-5 w-5" />,
      tour: 'row1',
    },
    {
      href: '/section/section-xi#games',
      numeral: 'III',
      title: 'Games',
      body: 'Every game on record — box scores, quarter-by-quarter scoring, and the player lines behind each result.',
      stat: `${fmt(c.games)} games`,
      icon: <CalendarDays className="h-5 w-5" />,
      tour: 'row1',
    },
    // ── Row 2 (Divisions + Leaderboard each get their own tour step;
    //          Schools is not toured) ─────────────────────────────────────
    {
      href: '/division/division-i',
      numeral: 'IV',
      title: 'Divisions',
      body: 'Division I through IV — standings, season carousels, and the programs that define each tier.',
      stat: '4 divisions',
      icon: <LayoutGrid className="h-5 w-5" />,
      tour: 'divisions',
    },
    {
      href: '/school',
      numeral: 'V',
      title: 'Schools',
      body: 'The academic record behind the football — enrollment, graduation, Report Card, and demographics.',
      stat: `${fmt(c.schools)} schools`,
      icon: <School className="h-5 w-5" />,
      tour: 'schools',
    },
    {
      href: '/leaderboard',
      numeral: 'VI',
      title: 'Leaderboard',
      body: 'The class of every year — top 25 per season by passing, rushing, and receiving, with head-to-head Versus.',
      stat: `${AVAILABLE_SEASONS.length} seasons · top 25`,
      icon: <ListOrdered className="h-5 w-5" />,
      tour: 'leaderboard',
    },
    // ── Row 3 (each card its own tour step) ────────────────────────────
    {
      href: '/board',
      numeral: 'VII',
      title: 'Board',
      body: 'The Big Board — a community discussion board for Section XI football, tagged and threaded.',
      stat: `${BOARD_THREADS.length} threads`,
      icon: <MessagesSquare className="h-5 w-5" />,
      tour: 'board',
    },
    {
      href: '/charts',
      numeral: 'VIII',
      title: 'Charts',
      body: 'A table of figures — team, season, player, and game records drawn as readable visual leaderboards.',
      stat: `${CHART_SLUGS_AZ.length} charts`,
      icon: <LayoutDashboard className="h-5 w-5" />,
      tour: 'charts',
    },
    {
      href: '/maps',
      numeral: 'IX',
      title: 'Maps',
      body: 'Suffolk County drawn by school identity — every district colored by its program, click through to the team.',
      stat: `${fmt(c.schools)} programs mapped`,
      icon: <MapIcon className="h-5 w-5" />,
      tour: 'maps',
    },
    // ── Row 4 (each card its own tour step) ────────────────────────────
    {
      href: '/chat',
      numeral: 'X',
      title: 'Chat',
      body: 'Ask SportsGPT anything about Section XI — leaders, matchups, and season history, answered from the record.',
      stat: 'Ask anything',
      icon: <MessageCircle className="h-5 w-5" />,
      tour: 'chat',
    },
    {
      href: '/search',
      numeral: 'XI',
      title: 'Search',
      body: 'One search across the whole almanac — teams, players, schools, games, and seasons, ranked as you type.',
      stat: 'Across the almanac',
      icon: <Search className="h-5 w-5" />,
      tour: 'search',
    },
    {
      href: '/glossary',
      numeral: 'XII',
      title: 'Glossary',
      body: 'Every stat and abbreviation on the site, defined — from YPC to point differential, in plain language.',
      stat: `${GLOSSARY_TERMS.length} terms defined`,
      icon: <BookOpen className="h-5 w-5" />,
      tour: 'glossary',
    },
  ]
}

export default async function HomePage() {
  const counts = await loadCounts()
  const cards = buildCards(counts)
  const seasonLabel = formatSeason(CURRENT_SEASON)

  return (
    <AppLayout paperMode>
      <main
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-20">

          {/* Masthead */}
          <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <EditorialHead
              size="xl"
              eyebrow={`Section XI · Long Island · ${seasonLabel} Edition`}
              rightSlot={<TourTrigger />}
              subhead={
                <>
                  The complete Suffolk County football almanac —{' '}
                  <span style={{ color: 'var(--paper-strong)' }}>ranked, sorted, and read like a yearbook.</span>
                </>
              }
            >
              SportsGPT
            </EditorialHead>
          </RevealFx>

          {/* Wayfinding card grid */}
          <RevealFx delay={0.12} translateY={8}>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(card => (
                <Link
                  key={card.href}
                  href={card.href}
                  data-tour={card.tour}
                  className="group flex flex-col justify-between border border-[var(--paper-rule)] bg-[var(--paper)] px-7 py-7 hover:bg-[var(--paper-quiet)] transition-colors"
                  style={{ borderRadius: 3, minHeight: 220 }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[12px] tracking-[0.22em] text-[var(--paper-faint)]" style={SERIF}>
                      {card.numeral}
                    </span>
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--paper-strong)]"
                      style={{ background: 'color-mix(in srgb, var(--paper-strong) 12%, transparent)' }}
                    >
                      {card.icon}
                    </span>
                  </div>

                  <div>
                    <h2
                      className="text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors leading-tight"
                      style={{ ...SERIF, fontSize: 23, fontWeight: 600, letterSpacing: '-0.01em' }}
                    >
                      {card.title}
                    </h2>
                    <p className="mt-2 text-[13.5px] leading-[1.55] text-[var(--paper-muted)]" style={SANS}>
                      {card.body}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--paper-strong)] tabular-nums" style={MONO}>
                        {card.stat}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[var(--paper-strong)] transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </RevealFx>
        </div>

        <Colophon updatedAt={counts.updatedAt} />
      </main>

      <HomeTour />
    </AppLayout>
  )
}
