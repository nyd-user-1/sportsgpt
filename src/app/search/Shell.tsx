'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowUpRight, Users, Building2, School, BarChart2, Swords, Clock, Rocket, MessageCircle, CalendarDays } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { EditorialHead } from '@/components/editorial'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'
import {
  buildResults,
  applyClickBoost,
  dominantPlayer,
  playerSlugFromKey,
  type SearchData,
  type ClickBoostMap,
  type Result,
  type ResultType,
  type GroupedResults,
} from '@/lib/search'
import { logSearchClick } from '@/lib/search-click'
import { PlayerHubCard, buildPlayerHub } from '@/components/PlayerHubCard'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

// ── Recents (shared key with the ⌘K palette so activity travels) ─────────────
type RecentEntry = { key: string; displayName: string; subtitle?: string; href: string; schoolSlug?: string; logoUrl?: string; type: ResultType }
const RECENTS_KEY = 'sportsgpt-recents'
const MAX_RECENTS = 5
function loadRecents(): RecentEntry[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(r: RecentEntry) {
  const prev = loadRecents().filter(x => x.key !== r.key)
  localStorage.setItem(RECENTS_KEY, JSON.stringify([r, ...prev].slice(0, MAX_RECENTS)))
}

const QUICK_NAV = [
  { key: 'q-launchpad', label: 'Launchpad',   href: '/launchpad', Icon: Rocket        },
  { key: 'q-chat',      label: 'Ask SportsGPT', href: '/chat',    Icon: MessageCircle },
  { key: 'q-charts',    label: 'Charts',      href: '/charts',    Icon: BarChart2     },
  { key: 'q-players',   label: 'Players',     href: '/player',    Icon: Users         },
  { key: 'q-teams',     label: 'Teams',       href: '/team',      Icon: Building2     },
  { key: 'q-schools',   label: 'Schools',     href: '/school',    Icon: School        },
]

// ── Category metadata for grouped rendering ──────────────────────────────────
type CategoryKey = keyof GroupedResults
// Stable order for the scope pills (muscle memory — does NOT reorder per query).
const CATEGORY_ORDER: CategoryKey[] = ['teams', 'players', 'schools', 'games', 'seasons', 'divisions', 'charts']
const CATEGORY_LABEL: Record<CategoryKey, string> = {
  teams: 'Teams', players: 'Players', schools: 'Schools', games: 'Games', seasons: 'Seasons', divisions: 'Divisions', charts: 'Charts',
}
const TYPE_ICON: Record<ResultType, typeof Users> = {
  player: Users, team: Building2, school: School, game: Swords, chart: BarChart2, season: CalendarDays,
}

// Per-category caps so a broad query doesn't render thousands of rows.
const CAPS: Record<CategoryKey, number> = {
  teams: 24, players: 60, schools: 24, games: 30, seasons: 5, divisions: 4, charts: 12,
}

// Best (lowest) score in a category — used to order the rendered sections by
// relevance so e.g. Players outranks Teams when the query is a player name.
function bestScore(rows: Result[]): number {
  return rows.length ? rows[0].score : Infinity
}

function ResultCard({ r, onPick }: { r: Result; onPick: (r: Result) => void }) {
  const logo = r.logoUrl ?? (r.schoolSlug ? SCHOOL_LOGOS[r.schoolSlug] : undefined)
  const Icon = TYPE_ICON[r.type]
  return (
    <Link
      href={r.href}
      onClick={() => onPick(r)}
      className="group/row flex items-center gap-3 px-4 py-3 border border-[var(--paper-rule)] bg-transparent hover:bg-[var(--paper-quiet)] hover:border-[var(--paper-text)] transition-colors"
      style={{ borderRadius: 2 }}
    >
      <div className="w-9 h-9 shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]">
        {logo
          ? <Image src={logo} alt="" width={26} height={26} className="object-contain" unoptimized />
          : <Icon className="h-4 w-4 text-[var(--paper-faint)]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {r.displayName}
        </p>
        {r.subtitle && (
          <p className="truncate text-[11.5px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
            {r.subtitle}
          </p>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-[var(--paper-faint)] shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity" />
    </Link>
  )
}

// Ruled section header with a mono count, echoing the almanac chapter style.
function GroupHead({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--paper-rule)] pb-2 mb-4">
      <h2 className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
        {label}
      </h2>
      <span className="text-[11px] tabular-nums text-[var(--paper-faint)]" style={MONO}>
        {count.toLocaleString()}
      </span>
    </div>
  )
}

export function SearchShell({
  data,
  boost,
  initialQuery,
  browseTeams,
  browseGames,
}: {
  data: SearchData
  boost?: ClickBoostMap
  initialQuery: string
  browseTeams: SearchData['teams']
  browseGames: SearchData['games']
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [scope, setScope] = useState<CategoryKey | 'all'>('all')
  const [recents, setRecents] = useState<RecentEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setRecents(loadRecents()) }, [])
  useEffect(() => { inputRef.current?.focus() }, [])

  // Keep the URL shareable as the user types (replace, no history spam).
  const syncUrl = useCallback((q: string) => {
    const p = new URLSearchParams()
    if (q.trim()) p.set('q', q.trim())
    const qs = p.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }, [router])

  function updateQuery(q: string) {
    setQuery(q)
    syncUrl(q)
  }

  const grouped = useMemo(() => {
    const base = buildResults(data, query)
    return boost ? applyClickBoost(base, query, boost) : base
  }, [data, query, boost])

  const totalResults = useMemo(
    () => CATEGORY_ORDER.reduce((n, k) => n + grouped[k].length, 0),
    [grouped],
  )

  const hasQuery = query.trim().length > 0

  function pick(r: Result) {
    saveRecent({ key: r.key, displayName: r.displayName, subtitle: r.subtitle, href: r.href, schoolSlug: r.schoolSlug, logoUrl: r.logoUrl, type: r.type })
  }
  // Picking a result FROM the live query results — also teach the ranking. Used
  // only by the body result cards and the hub (not recents / browse / quick-nav).
  function pickResult(r: Result) {
    logSearchClick(query, r)
    pick(r)
  }
  function go(r: Result) { pickResult(r); router.push(r.href) }

  // When one player clearly dominates the query, show a hub card (their team,
  // school, recent team games) above the results — only on the "All" scope.
  const hubPlayer = useMemo(() => dominantPlayer(grouped.players, grouped.teams[0]?.score), [grouped.players, grouped.teams])
  const hub = useMemo(() => (hubPlayer ? buildPlayerHub(hubPlayer, data) : null), [hubPlayer, data])
  const hubSlug = hubPlayer ? playerSlugFromKey(hubPlayer.key) : null
  const showHub = !!hub && (!!hub.team || !!hub.school || hub.games.length > 0) && scope === 'all'

  // Categories with results, honoring the scope filter — ordered by best match
  // so the most relevant category (e.g. Players for a player name) renders first.
  const visibleCategories = CATEGORY_ORDER
    .filter(k => grouped[k].length > 0 && (scope === 'all' || scope === k))
    .sort((a, b) => bestScore(grouped[a]) - bestScore(grouped[b]))

  // When the hub is shown, drop the hub player from the Players section (it's
  // already the card header) so it isn't listed twice.
  function rowsFor(k: CategoryKey): Result[] {
    if (showHub && k === 'players' && hubSlug) {
      return grouped.players.filter(r => playerSlugFromKey(r.key) !== hubSlug)
    }
    return grouped[k]
  }

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

        {/* ── Masthead ─────────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-8">
          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow="Section XI · The Index"
              subhead={
                <>
                  Every player, team, school, and game in one place. Type a name, a
                  matchup (&ldquo;Floyd vs Ward Melville&rdquo;), or a division — typos welcome.
                </>
              }
            >
              Search
            </EditorialHead>
          </RevealFx>

          {/* Hero search field — the page's primary input */}
          <RevealFx delay={0.12} translateY={8}>
            <div className="mt-9 sm:mt-10">
              <label className="group/field relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--paper-faint)] group-focus-within/field:text-[var(--paper-text)] transition-colors" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => updateQuery(e.target.value)}
                  placeholder="Search players, teams, schools, games…"
                  className="w-full pl-12 pr-12 py-4 sm:py-5 bg-transparent border-b-2 border-[var(--paper-rule)] focus:outline-none focus:border-[var(--paper-text)] placeholder:text-[var(--paper-faint)] text-[var(--paper-text)] transition-colors"
                  style={{ ...SERIF, fontSize: 'clamp(1.25rem, 2.6vw, 1.75rem)', fontWeight: 400 }}
                />
                {query && (
                  <button
                    onClick={() => { updateQuery(''); inputRef.current?.focus() }}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>

              {hasQuery && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>
                  {totalResults > 0
                    ? <>{totalResults.toLocaleString()} result{totalResults === 1 ? '' : 's'} for <span className="text-[var(--paper-text)]">&ldquo;{query.trim()}&rdquo;</span></>
                    : <>No matches for <span className="text-[var(--paper-text)]">&ldquo;{query.trim()}&rdquo;</span></>}
                </p>
              )}
            </div>
          </RevealFx>

          {/* Category scope filter — only when there are results to scope */}
          {hasQuery && totalResults > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <ScopePill label="All" count={totalResults} active={scope === 'all'} onClick={() => setScope('all')} />
              {CATEGORY_ORDER.filter(k => grouped[k].length > 0).map(k => (
                <ScopePill
                  key={k}
                  label={CATEGORY_LABEL[k]}
                  count={grouped[k].length}
                  active={scope === k}
                  onClick={() => setScope(k)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-6 sm:px-10 md:px-14 pb-24">
          {hasQuery
            ? (totalResults > 0
                ? (
                  <div className="space-y-12">
                    {showHub && hub && (
                      <RevealFx delay={0.03} translateY={8}>
                        <PlayerHubCard hub={hub} onActPlayer={go} onAct={go} />
                      </RevealFx>
                    )}
                    {visibleCategories.map(k => {
                      const rows = rowsFor(k)
                      if (rows.length === 0) return null
                      return (
                      <RevealFx key={k} delay={0.05} translateY={8}>
                        <section>
                          <GroupHead label={CATEGORY_LABEL[k]} count={rows.length} />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {rows.slice(0, CAPS[k]).map(r => (
                              <ResultCard key={r.key} r={r} onPick={pickResult} />
                            ))}
                          </div>
                          {rows.length > CAPS[k] && (
                            <p className="mt-3 text-[11px] text-[var(--paper-faint)]" style={SANS}>
                              + {(rows.length - CAPS[k]).toLocaleString()} more — refine your search to narrow.
                            </p>
                          )}
                        </section>
                      </RevealFx>
                      )
                    })}
                  </div>
                )
                : <NoResults query={query.trim()} />)
            : (
              <EmptyState
                recents={recents}
                browseTeams={browseTeams}
                browseGames={browseGames}
                onPick={pick}
                onClearRecents={() => { localStorage.removeItem(RECENTS_KEY); setRecents([]) }}
              />
            )}
        </div>
      </div>
    </AppLayout>
  )
}

function ScopePill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] rounded-full border transition-colors ${active
        ? 'border-[var(--paper-text)] bg-[var(--paper-text)] text-[var(--paper)]'
        : 'border-[var(--paper-rule)] text-[var(--paper-muted)] hover:border-[var(--paper-text)] hover:text-[var(--paper-text)]'
      }`}
      style={SANS}
    >
      {label}
      <span className="tabular-nums opacity-70" style={MONO}>{count}</span>
    </button>
  )
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="border-t border-[var(--paper-rule)] pt-12 text-center">
      <p className="text-[var(--paper-text)]" style={{ ...SERIF, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400 }}>
        Nothing found for &ldquo;{query}&rdquo;.
      </p>
      <p className="mt-3 text-sm text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
        Try a player&rsquo;s last name, a school, or a matchup like &ldquo;Floyd vs Sayville.&rdquo;
      </p>
    </div>
  )
}

// ── Empty state: magazine "table of contents" ───────────────────────────────
function EmptyState({
  recents,
  browseTeams,
  browseGames,
  onPick,
  onClearRecents,
}: {
  recents: RecentEntry[]
  browseTeams: SearchData['teams']
  browseGames: SearchData['games']
  onPick: (r: Result) => void
  onClearRecents: () => void
}) {
  return (
    <div className="space-y-12">
      {/* Quick nav */}
      <RevealFx delay={0.05} translateY={8}>
        <section>
          <GroupHead label="Jump to" count={QUICK_NAV.length} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {QUICK_NAV.map(({ key, label, href, Icon }) => (
              <Link
                key={key}
                href={href}
                className="group/nav flex items-center gap-3 px-4 py-3.5 border border-[var(--paper-rule)] hover:bg-[var(--paper-quiet)] hover:border-[var(--paper-text)] transition-colors"
                style={{ borderRadius: 2 }}
              >
                <Icon className="h-4 w-4 text-[var(--paper-faint)] group-hover/nav:text-[var(--paper-text)] transition-colors shrink-0" />
                <span
                  className="text-[var(--paper-text)] group-hover/nav:text-[var(--paper-strong)] transition-colors"
                  style={{ ...SERIF, fontSize: 15, fontWeight: 500 }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </RevealFx>

      {/* Recents */}
      {recents.length > 0 && (
        <RevealFx delay={0.1} translateY={8}>
          <section>
            <div className="flex items-baseline justify-between gap-4 border-b border-[var(--paper-rule)] pb-2 mb-4">
              <h2 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
                <Clock className="h-3 w-3" /> Recent
              </h2>
              <button
                onClick={onClearRecents}
                className="text-[10px] uppercase tracking-[0.2em] text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
                style={SANS}
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recents.map(r => (
                <ResultCard
                  key={r.key}
                  r={{ ...r, name: r.displayName, score: 0 }}
                  onPick={onPick}
                />
              ))}
            </div>
          </section>
        </RevealFx>
      )}

      {/* Browse teams */}
      <RevealFx delay={0.15} translateY={8}>
        <section>
          <GroupHead label="Browse teams" count={browseTeams.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {browseTeams.map(t => {
              const display = t.name.replace(/\s+Varsity\s+Football$/i, '')
              return (
                <ResultCard
                  key={t.slug}
                  r={{
                    key: `team-${t.slug}`, type: 'team', name: display, displayName: display,
                    subtitle: `Division ${t.division}`, href: `/team/${t.slug}`, schoolSlug: t.school_slug, score: 0,
                  }}
                  onPick={onPick}
                />
              )
            })}
          </div>
        </section>
      </RevealFx>

      {/* Recent games */}
      {browseGames.length > 0 && (
        <RevealFx delay={0.2} translateY={8}>
          <section>
            <GroupHead label="Recent games" count={browseGames.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {browseGames.map(g => {
                const matchup = `${g.home_name} vs ${g.away_name}`
                const display = g.home_score != null && g.away_score != null
                  ? `${g.home_name} ${g.home_score}, ${g.away_name} ${g.away_score}`
                  : matchup
                return (
                  <ResultCard
                    key={`game-${g.id}`}
                    r={{
                      key: `game-${g.id}`, type: 'game', name: matchup, displayName: display,
                      subtitle: formatSeason(g.season), href: `/game/${g.id}`, schoolSlug: g.home_school ?? undefined, score: 0,
                    }}
                    onPick={onPick}
                  />
                )
              })}
            </div>
          </section>
        </RevealFx>
      )}
    </div>
  )
}
