'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, ArrowUpRight, Users, Building2, School, BarChart2, Swords, Rocket, MessageCircle, ListOrdered, ArrowDown, CalendarDays } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { EditorialHead, PAPER_BRIDGE } from '@/components/editorial'
import { ChatInput, type ChatModelId, DEFAULT_MODEL } from '@/components/ChatInput'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatSeasonsPanel, type TeamMeta } from '@/components/ChatSeasonsPanel'
import { useChat } from '@/hooks/useChat'
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

const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px 180px',
  opacity: 0.035,
  mixBlendMode: 'overlay' as const,
}

// Build a natural-language prompt from a clicked result, tailored by type.
function promptFor(r: Result): string {
  switch (r.type) {
    case 'team':   return `Tell me about ${r.displayName}'s 2025-26 season — record, standing, and how they've trended.`
    case 'player': {
      const pos = r.subtitle?.split(' · ')[0]
      const lead = pos ? `${r.displayName}, the ${pos}` : r.displayName
      return `Break down ${lead}'s stats and season production.`
    }
    case 'school': return `Profile ${r.displayName} — enrollment, academics, and the football program.`
    case 'game':   return `Recap this game: ${r.name}. Who were the standout performers?`
    case 'chart':  return `Walk me through the ${r.displayName} leaders and what the numbers say.`
    case 'season': return `Recap the ${r.displayName.replace(/ Season$/, '')} Section XI season — the top teams, biggest games, and standout players.`
    default:       return `Show me the ${r.displayName} standings and statistical leaders.`
  }
}

const QUICK_NAV = [
  { key: 'q-launchpad', label: 'Launchpad', href: '/launchpad', Icon: Rocket },
  { key: 'q-charts',    label: 'Charts',    href: '/charts',    Icon: BarChart2 },
  { key: 'q-players',   label: 'Players',   href: '/player',    Icon: Users },
  { key: 'q-teams',     label: 'Teams',     href: '/team',      Icon: Building2 },
  { key: 'q-schools',   label: 'Schools',   href: '/school',    Icon: School },
  { key: 'q-board',     label: 'Leaderboard', href: '/leaderboard', Icon: ListOrdered },
]

// Starter briefings for the empty state — each sends a prompt on click.
type Briefing = { teaser: string; prompt: string; schoolSlug?: string }
const BRIEFINGS: Briefing[] = [
  { teaser: 'Who led Division I in rushing?', prompt: 'Who led Division I in rushing yards this 2025-26 season?' },
  { teaser: 'Best QBs this season', prompt: 'Who are the top quarterbacks in Section XI this 2025-26 season?' },
  { teaser: "Floyd's 5-season trend", prompt: "How has William Floyd's record trended over the past 5 seasons?", schoolSlug: 'floyd' },
  { teaser: 'Hottest teams right now', prompt: 'Which Section XI teams are on the longest winning streaks right now?' },
  { teaser: "Longwood's top playmakers", prompt: "Tell me about Longwood's top offensive playmakers this 2025-26 season.", schoolSlug: 'longwood' },
  { teaser: 'Closest games of 2025-26', prompt: 'What were the closest or most dramatic games of the 2025-26 season?' },
]

type CategoryKey = keyof GroupedResults
const CATEGORY_ORDER: CategoryKey[] = ['teams', 'players', 'schools', 'games', 'seasons', 'divisions', 'charts']
const CATEGORY_LABEL: Record<CategoryKey, string> = {
  teams: 'Teams', players: 'Players', schools: 'Schools', games: 'Games', seasons: 'Seasons', divisions: 'Divisions', charts: 'Charts',
}
const TYPE_ICON: Record<ResultType, typeof Users> = {
  player: Users, team: Building2, school: School, game: Swords, chart: BarChart2, season: CalendarDays,
}
const CAPS: Record<CategoryKey, number> = {
  teams: 24, players: 60, schools: 24, games: 30, seasons: 5, divisions: 4, charts: 12,
}

// Best (lowest) score in a category — orders rendered sections by relevance.
function bestScore(rows: Result[]): number {
  return rows.length ? rows[0].score : Infinity
}

// A clickable result that, instead of navigating, fires a chat prompt.
function PromptCard({ r, onPick }: { r: Result; onPick: (r: Result) => void }) {
  const logo = r.logoUrl ?? (r.schoolSlug ? SCHOOL_LOGOS[r.schoolSlug] : undefined)
  const Icon = TYPE_ICON[r.type]
  return (
    <button
      onClick={() => onPick(r)}
      className="group/row w-full flex items-center gap-3 px-4 py-3 text-left border border-[var(--paper-rule)] bg-transparent hover:bg-[var(--paper-quiet)] hover:border-[var(--paper-text)] transition-colors"
      style={{ borderRadius: 2 }}
    >
      <div className="w-9 h-9 shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]">
        {logo
          ? <Image src={logo} alt="" width={26} height={26} className="object-contain" unoptimized />
          : <Icon className="h-4 w-4 text-[var(--paper-faint)]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}>
          {r.displayName}
        </p>
        {r.subtitle && (
          <p className="truncate text-[11.5px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
            {r.subtitle}
          </p>
        )}
      </div>
      <MessageCircle className="h-4 w-4 text-[var(--paper-faint)] shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity" />
    </button>
  )
}

function GroupHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--paper-rule)] pb-2 mb-4">
      <h2 className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>{label}</h2>
      {count != null && <span className="text-[11px] tabular-nums text-[var(--paper-faint)]" style={MONO}>{count.toLocaleString()}</span>}
    </div>
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

export function Chat3Shell({ data, boost, browseTeams }: { data: SearchData; boost?: ClickBoostMap; browseTeams: SearchData['teams'] }) {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat()
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(DEFAULT_MODEL)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<CategoryKey | 'all'>('all')

  const scrollRef = useRef<HTMLDivElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const isNearBottomRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const lastUserMsgRef = useRef<HTMLDivElement>(null)

  const [panelTeams, setPanelTeams] = useState<TeamMeta[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const openSeasons = useCallback((teams: TeamMeta[]) => { setPanelTeams(teams); setPanelOpen(true) }, [])

  const hasMessages = messages.length > 0

  useEffect(() => { if (!hasMessages) heroInputRef.current?.focus() }, [hasMessages])

  // Conversation scroll behavior (mirrors /chat)
  useEffect(() => { if (isStreaming) isNearBottomRef.current = false }, [isStreaming])
  useEffect(() => {
    if (messages.length < 3) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== 'user') return
    const el = scrollRef.current
    const msgEl = lastUserMsgRef.current
    if (!el || !msgEl) return
    const msgRect = msgEl.getBoundingClientRect()
    const containerRect = el.getBoundingClientRect()
    const targetScrollTop = el.scrollTop + (msgRect.top - containerRect.top) - el.clientHeight * 0.33
    el.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
  }, [messages])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight
      setShowScrollBtn(false)
    } else {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
      if (!nearBottom) setShowScrollBtn(true)
    }
  }, [messages])
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
    isNearBottomRef.current = nearBottom
    setShowScrollBtn(!nearBottom)
  }, [])

  const grouped = useMemo(() => {
    const base = buildResults(data, query)
    return boost ? applyClickBoost(base, query, boost) : base
  }, [data, query, boost])
  const totalResults = useMemo(
    () => CATEGORY_ORDER.reduce((n, k) => n + grouped[k].length, 0),
    [grouped],
  )
  const hasQuery = query.trim().length > 0

  // When one player dominates the query, show a hub card; its team/school/games
  // become prompts too (consistent with the prompt-picker model).
  const hubPlayer = useMemo(() => dominantPlayer(grouped.players, grouped.teams[0]?.score), [grouped.players, grouped.teams])
  const hub = useMemo(() => (hubPlayer ? buildPlayerHub(hubPlayer, data) : null), [hubPlayer, data])
  const hubSlug = hubPlayer ? playerSlugFromKey(hubPlayer.key) : null
  const showHub = !!hub && (!!hub.team || !!hub.school || hub.games.length > 0) && scope === 'all'

  const visibleCategories = CATEGORY_ORDER
    .filter(k => grouped[k].length > 0 && (scope === 'all' || scope === k))
    .sort((a, b) => bestScore(grouped[a]) - bestScore(grouped[b]))

  function rowsFor(k: CategoryKey): Result[] {
    if (showHub && k === 'players' && hubSlug) {
      return grouped.players.filter(r => playerSlugFromKey(r.key) !== hubSlug)
    }
    return grouped[k]
  }

  // Send a result's tailored prompt; the page transitions to chat. Used by the
  // empty-state browse cards (no live query → nothing to learn).
  const sendPrompt = useCallback((r: Result) => {
    sendMessage(promptFor(r), selectedModel)
  }, [sendMessage, selectedModel])

  // Click a live result → also log the pick so ranking learns the query→result.
  const pickResult = useCallback((r: Result) => {
    logSearchClick(query, r)
    sendPrompt(r)
  }, [query, sendPrompt])

  // ── Conversation phase: "Chat" collapses to top, line beneath, thread below ──
  if (hasMessages) {
    return (
      <AppLayout paperMode>
        <div className="fixed inset-0 pointer-events-none z-[999]" style={GRAIN_STYLE} />
        <div className="flex flex-1 flex-col overflow-hidden" style={PAPER_BRIDGE}>

          {/* Collapsed masthead — "Chat" at top, rule beneath */}
          <div className="shrink-0 border-b border-[var(--paper-rule)] px-6 sm:px-10 pt-5 pb-3">
            <div className="mx-auto max-w-3xl">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[var(--paper-faint)] mb-0.5" style={SANS}>
                Section XI · The Briefing
              </p>
              <h1 className="text-[var(--paper-text)] leading-none" style={{ ...SERIF, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 500, letterSpacing: '-0.02em' }}>
                Chat
              </h1>
            </div>
          </div>

          {/* Thread */}
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-4">
              {messages.map((msg, i) => {
                const isLastUser = msg.role === 'user' && i === messages.length - 1
                return (
                  <div key={msg.id} ref={isLastUser ? lastUserMsgRef : undefined}>
                    <ChatMessage
                      message={msg}
                      isStreaming={isStreaming && msg.role === 'assistant' && i === messages.length - 1}
                      onSend={(content) => sendMessage(content, selectedModel)}
                      onOpenSeasons={openSeasons}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Input pinned bottom */}
          <div className="shrink-0 relative">
            {showScrollBtn && (
              <div className="absolute bottom-full left-0 right-0 flex justify-center pb-4 pointer-events-none z-50">
                <button
                  onClick={() => {
                    const el = scrollRef.current
                    if (!el) return
                    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
                    isNearBottomRef.current = true
                    setShowScrollBtn(false)
                  }}
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper)] border border-[var(--paper-rule)] shadow-lg hover:shadow-xl transition-shadow"
                >
                  <ArrowDown className="h-4 w-4 text-[var(--paper-muted)]" />
                </button>
              </div>
            )}
            <div className="px-4 py-3 border-t border-[var(--paper-rule)]" style={{ background: 'var(--paper)' }}>
              <div className="mx-auto max-w-3xl">
                <ChatInput
                  onSend={(msg, model) => sendMessage(msg, model)}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </div>
            </div>
          </div>
        </div>

        <ChatSeasonsPanel open={panelOpen} onClose={() => setPanelOpen(false)} teams={panelTeams} />
      </AppLayout>
    )
  }

  // ── Browse phase: search-style picker ────────────────────────────────────
  return (
    <AppLayout paperMode>
      <div className="fixed inset-0 pointer-events-none z-[999]" style={GRAIN_STYLE} />
      <div className="flex-1 overflow-y-auto no-scrollbar" style={PAPER_BRIDGE}>

        {/* Masthead */}
        <div className="mx-auto max-w-5xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-8">
          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow="Section XI · The Briefing"
              subhead={
                <>
                  Type a team, player, school, or game — then pick one to start the
                  conversation. SportsGPT reads the record and answers in plain English.
                </>
              }
            >
              Chat
            </EditorialHead>
          </RevealFx>

          {/* Hero input — filters as you type */}
          <RevealFx delay={0.12} translateY={8}>
            <div className="mt-9 sm:mt-10">
              <label className="group/field relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--paper-faint)] group-focus-within/field:text-[var(--paper-text)] transition-colors" />
                <input
                  ref={heroInputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setScope('all') }}
                  placeholder="Ask about a team, player, school, or game…"
                  className="w-full pl-12 pr-12 py-4 sm:py-5 bg-transparent border-b-2 border-[var(--paper-rule)] focus:outline-none focus:border-[var(--paper-text)] placeholder:text-[var(--paper-faint)] text-[var(--paper-text)] transition-colors"
                  style={{ ...SERIF, fontSize: 'clamp(1.25rem, 2.6vw, 1.75rem)', fontWeight: 400 }}
                />
                {query && (
                  <button
                    onClick={() => { setQuery(''); heroInputRef.current?.focus() }}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>

              {hasQuery && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>
                  {totalResults > 0
                    ? <>{totalResults.toLocaleString()} result{totalResults === 1 ? '' : 's'} — pick one to ask</>
                    : <>No matches for <span className="text-[var(--paper-text)]">&ldquo;{query.trim()}&rdquo;</span></>}
                </p>
              )}
            </div>
          </RevealFx>

          {/* Scope pills */}
          {hasQuery && totalResults > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <ScopePill label="All" count={totalResults} active={scope === 'all'} onClick={() => setScope('all')} />
              {CATEGORY_ORDER.filter(k => grouped[k].length > 0).map(k => (
                <ScopePill key={k} label={CATEGORY_LABEL[k]} count={grouped[k].length} active={scope === k} onClick={() => setScope(k)} />
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="mx-auto max-w-5xl px-6 sm:px-10 md:px-14 pb-24">
          {hasQuery
            ? (totalResults > 0
                ? (
                  <div className="space-y-12">
                    {showHub && hub && (
                      <RevealFx delay={0.03} translateY={8}>
                        <PlayerHubCard hub={hub} onActPlayer={pickResult} onAct={pickResult} />
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
                              <PromptCard key={r.key} r={r} onPick={pickResult} />
                            ))}
                          </div>
                          {rows.length > CAPS[k] && (
                            <p className="mt-3 text-[11px] text-[var(--paper-faint)]" style={SANS}>
                              + {(rows.length - CAPS[k]).toLocaleString()} more — refine to narrow.
                            </p>
                          )}
                        </section>
                      </RevealFx>
                      )
                    })}
                  </div>
                )
                : (
                  <div className="border-t border-[var(--paper-rule)] pt-12 text-center">
                    <p className="text-[var(--paper-text)]" style={{ ...SERIF, fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400 }}>
                      Nothing matches &ldquo;{query.trim()}.&rdquo;
                    </p>
                    <p className="mt-3 text-sm text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
                      Try a school, a player&rsquo;s name, or just ask your question in the box above.
                    </p>
                  </div>
                ))
            : (
              <div className="space-y-12">
                {/* Briefings */}
                <RevealFx delay={0.16} translateY={8}>
                  <section>
                    <GroupHead label="Try asking" count={BRIEFINGS.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {BRIEFINGS.map((b, i) => {
                        const logo = b.schoolSlug ? SCHOOL_LOGOS[b.schoolSlug] : undefined
                        return (
                          <button
                            key={i}
                            onClick={() => sendMessage(b.prompt, selectedModel)}
                            className="group/row flex items-center gap-3 px-4 py-3 text-left border border-[var(--paper-rule)] hover:bg-[var(--paper-quiet)] hover:border-[var(--paper-text)] transition-colors"
                            style={{ borderRadius: 2 }}
                          >
                            <div className="w-9 h-9 shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]">
                              {logo ? <Image src={logo} alt="" width={26} height={26} className="object-contain" unoptimized /> : <MessageCircle className="h-4 w-4 text-[var(--paper-faint)]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontSize: 15, fontWeight: 500 }}>
                                {b.teaser}
                              </p>
                              <p className="truncate text-[11.5px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
                                {b.prompt}
                              </p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-[var(--paper-faint)] shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                          </button>
                        )
                      })}
                    </div>
                  </section>
                </RevealFx>

                {/* Browse teams as prompts */}
                <RevealFx delay={0.2} translateY={8}>
                  <section>
                    <GroupHead label="Browse teams" count={browseTeams.length} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {browseTeams.map(t => {
                        const display = t.name.replace(/\s+Varsity\s+Football$/i, '')
                        return (
                          <PromptCard
                            key={t.slug}
                            r={{ key: `team-${t.slug}`, type: 'team', name: display, displayName: display, subtitle: `Division ${t.division}`, href: `/team/${t.slug}`, schoolSlug: t.school_slug, score: 0 }}
                            onPick={sendPrompt}
                          />
                        )
                      })}
                    </div>
                  </section>
                </RevealFx>

                {/* Jump to */}
                <RevealFx delay={0.24} translateY={8}>
                  <section>
                    <GroupHead label="Or jump to" count={QUICK_NAV.length} />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {QUICK_NAV.map(({ key, label, href, Icon }) => (
                        <Link
                          key={key}
                          href={href}
                          className="group/nav flex items-center gap-3 px-4 py-3.5 border border-[var(--paper-rule)] hover:bg-[var(--paper-quiet)] hover:border-[var(--paper-text)] transition-colors"
                          style={{ borderRadius: 2 }}
                        >
                          <Icon className="h-4 w-4 text-[var(--paper-faint)] group-hover/nav:text-[var(--paper-text)] transition-colors shrink-0" />
                          <span className="text-[var(--paper-text)] group-hover/nav:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontSize: 15, fontWeight: 500 }}>
                            {label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                </RevealFx>
              </div>
            )}
        </div>
      </div>

      <ChatSeasonsPanel open={panelOpen} onClose={() => setPanelOpen(false)} teams={panelTeams} />
    </AppLayout>
  )
}
