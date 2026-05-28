'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { EditorialHead } from '@/components/editorial'
import { ChatInput, type ChatInputHandle, type ChatModelId, DEFAULT_MODEL } from '@/components/ChatInput'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatSeasonsPanel, type TeamMeta } from '@/components/ChatSeasonsPanel'
import { useChat } from '@/hooks/useChat'
import { PAPER_BRIDGE } from '@/components/editorial'
import { SCHOOL_LOGOS, DIVISION_LOGOS } from '@/lib/team-images'
import { ArrowDown, ArrowUpRight, Rocket, BarChart2, Users, Building2, School, ListOrdered } from 'lucide-react'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px 180px',
  opacity: 0.035,
  mixBlendMode: 'overlay' as const,
}

// Suggested briefings — each opens with a logo (school slug or division number)
// and sends the prompt on click.
type Briefing = { prompt: string; teaser: string; schoolSlug?: string; divisionNum?: number }
const BRIEFINGS: Briefing[] = [
  { teaser: 'Division I rushing leaders, 2025-26', prompt: 'Who led Division I in rushing yards this 2025-26 season?', divisionNum: 1 },
  { teaser: 'Division II passing leaders, 2025-26', prompt: 'Who led Division II in passing yards this 2025-26 season?', divisionNum: 2 },
  { teaser: "Floyd's 5-season trend", prompt: "How has William Floyd's record trended over the past 5 seasons?", schoolSlug: 'floyd' },
  { teaser: "Ward Melville's top playmakers", prompt: "Who are Ward Melville's top offensive playmakers in the 2025-26 season?", schoolSlug: 'ward-melville' },
  { teaser: 'Division III standings & hot teams', prompt: 'Show me the current Division III standings and the hottest teams.', divisionNum: 3 },
  { teaser: "Sachem East's record & playoff history", prompt: "What is Sachem East's season-by-season record and playoff history?", schoolSlug: 'sachem-east' },
  { teaser: 'Division IV longest winning streaks', prompt: 'Which Division IV teams have the longest winning streaks?', divisionNum: 4 },
  { teaser: "Longwood's top playmakers, 2025-26", prompt: "Tell me about Longwood's top offensive playmakers this 2025-26 season.", schoolSlug: 'longwood' },
]

const JUMP_NAV = [
  { key: 'j-launchpad', label: 'Launchpad', href: '/launchpad', Icon: Rocket },
  { key: 'j-charts',    label: 'Charts',    href: '/charts',    Icon: BarChart2 },
  { key: 'j-players',   label: 'Players',   href: '/player',    Icon: Users },
  { key: 'j-teams',     label: 'Teams',     href: '/team',      Icon: Building2 },
  { key: 'j-schools',   label: 'Schools',   href: '/school',    Icon: School },
  { key: 'j-board',     label: 'Leaderboard', href: '/leaderboard', Icon: ListOrdered },
]

function GroupHead({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--paper-rule)] pb-2 mb-4">
      <h2 className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>{label}</h2>
      {count != null && <span className="text-[11px] tabular-nums text-[var(--paper-faint)]" style={MONO}>{count}</span>}
    </div>
  )
}

export default function Chat3Page() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat()
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(DEFAULT_MODEL)
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)
  const isNearBottomRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const lastUserMsgRef = useRef<HTMLDivElement>(null)

  const [panelTeams, setPanelTeams] = useState<TeamMeta[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const openSeasons = useCallback((teams: TeamMeta[]) => { setPanelTeams(teams); setPanelOpen(true) }, [])

  const hasMessages = messages.length > 0

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

  // ── Landing (no messages) — editorial "Briefing" index ───────────────────
  if (!hasMessages) {
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
                    Ask anything about Long Island football — standings, stat leaders,
                    matchups, a team&rsquo;s history. SportsGPT reads the record and answers
                    in plain English.
                  </>
                }
              >
                Ask SportsGPT
              </EditorialHead>
            </RevealFx>

            {/* Hero input */}
            <RevealFx delay={0.12} translateY={8}>
              <div className="mt-9 sm:mt-10">
                <ChatInput
                  ref={chatInputRef}
                  onSend={(msg, model) => sendMessage(msg, model)}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
                <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>
                  Press Enter to ask · Shift+Enter for a new line
                </p>
              </div>
            </RevealFx>
          </div>

          {/* Body */}
          <div className="mx-auto max-w-5xl px-6 sm:px-10 md:px-14 pb-24 space-y-12">

            {/* Suggested briefings */}
            <RevealFx delay={0.16} translateY={8}>
              <section>
                <GroupHead label="Try asking" count={BRIEFINGS.length} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BRIEFINGS.map((b, i) => {
                    const logo = b.schoolSlug ? SCHOOL_LOGOS[b.schoolSlug] : (b.divisionNum ? DIVISION_LOGOS[b.divisionNum] : undefined)
                    return (
                      <button
                        key={i}
                        onClick={() => sendMessage(b.prompt, selectedModel)}
                        className="group/row flex items-center gap-3 px-4 py-3 text-left border border-[var(--paper-rule)] hover:bg-[var(--paper-quiet)] hover:border-[var(--paper-text)] transition-colors"
                        style={{ borderRadius: 2 }}
                      >
                        <div className="w-9 h-9 shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]">
                          {logo
                            ? <Image src={logo} alt="" width={26} height={26} className="object-contain" unoptimized />
                            : <BarChart2 className="h-4 w-4 text-[var(--paper-faint)]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}>
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

            {/* Jump to */}
            <RevealFx delay={0.22} translateY={8}>
              <section>
                <GroupHead label="Or jump to" count={JUMP_NAV.length} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {JUMP_NAV.map(({ key, label, href, Icon }) => (
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
        </div>
      </AppLayout>
    )
  }

  // ── Active conversation (same as /chat) ──────────────────────────────────
  return (
    <AppLayout paperMode>
      <div className="fixed inset-0 pointer-events-none z-[999]" style={GRAIN_STYLE} />
      <div className="flex flex-1 flex-col overflow-hidden" style={PAPER_BRIDGE}>
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
