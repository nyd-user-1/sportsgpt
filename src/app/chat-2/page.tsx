'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import {
  ArrowUp, Square, ChevronDown, Check,
  ThumbsUp, ThumbsDown, ArrowDown, CalendarDays,
} from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { CHAT_MODELS, type ChatModelId, DEFAULT_MODEL } from '@/components/ChatInput'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { APP_TAGLINE } from '@/lib/app-config'
import { useChat, type Message } from '@/hooks/useChat'
import { PAPER_BRIDGE, MONO } from '@/components/editorial'
import { ChatSeasonsPanel, type TeamMeta } from '@/components/ChatSeasonsPanel'

/* ── Shared type constants ───────────────────────────────────────────────── */
const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }

/* ── Grain overlay — subtle SVG noise, classic editorial depth ───────────── */
const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px 180px',
  opacity: 0.035,
  mixBlendMode: 'overlay' as const,
}

/* ── Dateline — newspaper header above thread ────────────────────────────── */
function Dateline() {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const d = new Date()
    const day = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
    setLabel(`${day}, ${date}`)
  }, [])
  if (!label) return null
  return (
    <div className="flex items-center gap-4 mb-12">
      <div className="flex-1 border-t border-[var(--paper-rule)]" />
      <span
        className="shrink-0 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
        style={SANS}
      >
        {label}
      </span>
      <div className="flex-1 border-t border-[var(--paper-rule)]" />
    </div>
  )
}
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }

const STARTERS = [
  'Who led Division I in rushing yards this season?',
  "How has William Floyd's record trended over 5 seasons?",
  'Best single-game passing performances in 2024-25?',
  'Which teams have the longest all-time winning streaks?',
  'Top receivers across all of Section XI history?',
]

/* ── Markdown helpers ────────────────────────────────────────────────────── */
function stripFollowUps(content: string): string {
  const idx = content.search(/\n#{1,3}\s+Follow-?[Uu]ps?\s*\n/i)
  return idx >= 0 ? content.slice(0, idx).trimEnd() : content
}

function extractFollowUps(content: string): string[] {
  const lines = content.split('\n')
  const followUps: string[] = []
  let inSection = false
  for (const line of lines) {
    const t = line.trim()
    if (/^#{1,3}\s+follow-?ups?/i.test(t)) { inSection = true; continue }
    if (inSection && /^[-*\d.]\s+.+\??$/.test(t)) {
      followUps.push(t.replace(/^[-*\d.]+\s+/, '').replace(/\?*$/, '?'))
    }
    if (inSection && t.startsWith('#') && !/follow/i.test(t)) break
  }
  return followUps.slice(0, 3)
}

/* ── Editorial markdown renderer ─────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdComponents: any = {
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4 text-[var(--paper-text)] leading-[1.85]" style={{ ...SERIF, fontSize: 17 }}>
      {children}
    </p>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-[var(--paper-text)]">{children}</strong>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mt-8 mb-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-faint)] shrink-0" style={SANS}>
        {children}
      </span>
      <div className="flex-1 border-t border-[var(--paper-rule)]" />
    </div>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mt-7 mb-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-faint)] shrink-0" style={SANS}>
        {children}
      </span>
      <div className="flex-1 border-t border-[var(--paper-rule)]" />
    </div>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-3 mt-6 mb-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-faint)] shrink-0" style={SANS}>
        {children}
      </span>
      <div className="flex-1 border-t border-[var(--paper-rule-soft)]" />
    </div>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-4 space-y-1.5">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1.5">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="leading-relaxed text-[var(--paper-text)]" style={{ ...SERIF, fontSize: 17 }}>
      {children}
    </li>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-5 border border-[var(--paper-rule)] overflow-hidden" style={{ borderRadius: 10 }}>
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-[var(--paper-quiet)]">{children}</thead>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th
      className="text-left px-4 py-3 border-b border-[var(--paper-rule)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)]"
      style={SANS}
    >
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td
      className="px-4 py-2.5 border-b border-[var(--paper-rule-soft)] text-[14px] text-[var(--paper-text)]"
      style={SANS}
    >
      {children}
    </td>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="border-b border-[var(--paper-rule-soft)] last:border-0">{children}</tr>
  ),
  hr: () => <div className="my-4 border-t border-[var(--paper-rule-soft)]" />,
  code: ({ children }: { children: React.ReactNode }) => (
    <code
      className="rounded px-1.5 py-0.5 text-[13px] bg-[var(--paper-quiet)] text-[#033882]"
      style={MONO}
    >
      {children}
    </code>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-[var(--paper-muted)]">{children}</em>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-[#033882] hover:underline">{children}</a>
  ),
}

/* ── ChatInput2 — the typewriter ─────────────────────────────────────────── */
function ChatInput2({
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  onModelChange,
  showEyebrow = false,
  placeholder = 'Ask about teams, players, matchups…',
}: {
  onSend?: (msg: string, model: ChatModelId) => void
  onStop?: () => void
  isStreaming?: boolean
  selectedModel: ChatModelId
  onModelChange: (m: ChatModelId) => void
  showEyebrow?: boolean
  placeholder?: string
}) {
  const [input, setInput]     = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef     = useRef<HTMLDivElement>(null)

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  // Close model menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleSubmit = () => {
    const t = input.trim()
    if (!t || isStreaming) return
    onSend?.(t, selectedModel)
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) ?? CHAT_MODELS[0]

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Optional "ASK" eyebrow */}
      {showEyebrow && (
        <span
          className="shrink-0 pt-[5px] text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
          style={SANS}
        >
          Ask
        </span>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className="flex-1 resize-none bg-transparent text-[17px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] outline-none leading-relaxed"
        style={{ ...SERIF, minHeight: '28px' }}
      />

      {/* Model selector + send */}
      <div className="shrink-0 flex items-center gap-2.5 pt-[3px]">
        {/* Model — text dropdown */}
        <div className="relative" ref={menuRef}>
          {menuOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 w-52 bg-[var(--paper)] border border-[var(--paper-rule)] shadow-2xl overflow-hidden py-1 z-50"
              style={{ borderRadius: 12 }}
            >
              {CHAT_MODELS.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m.id); setMenuOpen(false) }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--paper-quiet)] ${i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}`}
                >
                  <img src={m.logo} alt={m.provider} width={16} height={16} className="rounded-sm object-contain shrink-0" />
                  <span className="flex-1 text-left text-[13px] text-[var(--paper-text)]" style={SANS}>
                    {m.label}
                  </span>
                  {m.id === selectedModel && <Check className="h-3 w-3 text-[#033882] shrink-0" />}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-1 text-[11px] text-[var(--paper-faint)] hover:text-[var(--paper-muted)] transition-colors"
            style={MONO}
          >
            {currentModel.label}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Send / Stop */}
        <button
          onClick={isStreaming ? onStop : handleSubmit}
          disabled={!isStreaming && !input.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-20"
          style={{ background: isStreaming ? '#dc2626' : '#033882', color: '#fff' }}
        >
          {isStreaming
            ? <Square className="h-3.5 w-3.5" fill="currentColor" />
            : <ArrowUp className="h-3.5 w-3.5" />
          }
        </button>
      </div>
    </div>
  )
}

/* ── User message ────────────────────────────────────────────────────────── */
function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end mb-10">
      <div className="max-w-[62%] flex items-start gap-3">
        {/* Q. prefix — newspaper Q&A convention */}
        <span
          className="shrink-0 mt-[4px] text-[var(--paper-faint)]"
          style={{ ...MONO, fontSize: 11, letterSpacing: '0.05em' }}
        >
          Q.
        </span>
        <div className="pl-4 border-l-2 border-[#033882]">
          <p className="text-[18px] leading-[1.75] text-[var(--paper-text)]" style={SERIF}>
            {content}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Assistant message ───────────────────────────────────────────────────── */
function AssistantMessage({
  message,
  isStreaming,
  onSend,
  onOpenSeasons,
}: {
  message: Message
  isStreaming?: boolean
  onSend?: (content: string) => void
  onOpenSeasons?: (teams: TeamMeta[]) => void
}) {
  const hasContent  = message.content.length > 0
  const followUps   = useMemo(() => extractFollowUps(message.content), [message.content])
  const [copied,    setCopied]   = useState(false)
  const [feedback,  setFeedback] = useState<'good' | 'bad' | null>(null)

  const teams    = message.meta?.teams ?? []
  const firstLogo = teams.length > 0 ? SCHOOL_LOGOS[teams[0].slug as keyof typeof SCHOOL_LOGOS] : null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-12">
      {/* Streaming: blinking cursor */}
      {isStreaming && !hasContent && (
        <p className="text-[18px] text-[var(--paper-faint)]" style={SERIF}>
          <span className="inline-block animate-pulse">|</span>
        </p>
      )}

      {/* Prose content */}
      {hasContent && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {stripFollowUps(message.content)}
        </ReactMarkdown>
      )}

      {/* Footer — only when done */}
      {!isStreaming && hasContent && (
        <div className="mt-5 pt-4 border-t border-[var(--paper-rule-soft)]">

          {/* Action row — text links */}
          <div className="flex items-center gap-5">
            <button
              onClick={handleCopy}
              className="text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] hover:text-[var(--paper-muted)] transition-colors"
              style={SANS}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>

            {teams.length > 0 && onOpenSeasons && (
              <button
                onClick={() => onOpenSeasons(teams as TeamMeta[])}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] hover:text-[var(--paper-muted)] transition-colors"
                style={SANS}
              >
                {firstLogo
                  ? <Image src={firstLogo} alt="" width={12} height={12} className="object-contain" unoptimized />
                  : <CalendarDays className="h-3 w-3" />
                }
                Explore seasons
                {teams.length > 1 && (
                  <span className="opacity-60">+{teams.length - 1}</span>
                )}
              </button>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setFeedback(f => f === 'good' ? null : 'good')}
                className={`transition-colors ${feedback === 'good' ? 'text-emerald-500' : 'text-[var(--paper-faint)] hover:text-[var(--paper-muted)]'}`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setFeedback(f => f === 'bad' ? null : 'bad')}
                className={`transition-colors ${feedback === 'bad' ? 'text-red-500' : 'text-[var(--paper-faint)] hover:text-[var(--paper-muted)]'}`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Follow-up questions — editorial serif link list */}
          {followUps.length > 0 && onSend && (
            <div className="mt-6">
              <p
                className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)] mb-3"
                style={SANS}
              >
                Follow-ups
              </p>
              <div>
                {followUps.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(q)}
                    className="group flex w-full items-start gap-4 py-3 px-4 -mx-4 border-t border-[var(--paper-rule-soft)] text-left transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]"
                    style={{ borderRadius: 3 }}
                  >
                    <span
                      className="shrink-0 mt-[2px] text-[var(--paper-faint)] group-hover:text-[var(--paper-strong)] transition-colors"
                      style={{ ...MONO, fontSize: 11 }}
                    >
                      ↳
                    </span>
                    <span
                      className="text-[var(--paper-muted)] group-hover:text-[var(--paper-strong)] transition-colors leading-relaxed"
                      style={{ ...SERIF, fontSize: 15, fontStyle: 'italic' }}
                    >
                      {q}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Chat2Page() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat()
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(DEFAULT_MODEL)
  const scrollRef           = useRef<HTMLDivElement>(null)
  const isNearBottomRef     = useRef(true)
  const lastUserMsgRef      = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const [panelTeams, setPanelTeams] = useState<TeamMeta[]>([])
  const [panelOpen,  setPanelOpen]  = useState(false)
  const openSeasons = useCallback((teams: TeamMeta[]) => {
    setPanelTeams(teams); setPanelOpen(true)
  }, [])

  const hasMessages = messages.length > 0

  // Pause auto-scroll while streaming so user stays at their question
  useEffect(() => {
    if (isStreaming) isNearBottomRef.current = false
  }, [isStreaming])

  // Scroll user's question to 1/3 from top on follow-up sends
  useEffect(() => {
    if (messages.length < 3) return
    const last = messages[messages.length - 1]
    if (last.role !== 'user') return
    const el  = scrollRef.current
    const msg = lastUserMsgRef.current
    if (!el || !msg) return
    const target = el.scrollTop + (msg.getBoundingClientRect().top - el.getBoundingClientRect().top) - el.clientHeight * 0.33
    el.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [messages])

  // Auto-scroll when near bottom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight
      setShowScrollBtn(false)
    } else {
      if (el.scrollTop + el.clientHeight < el.scrollHeight - 80) setShowScrollBtn(true)
    }
  }, [messages])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const near = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
    isNearBottomRef.current = near
    setShowScrollBtn(!near)
  }, [])

  /* ── Empty state ──────────────────────────────────────────────────────── */
  if (!hasMessages) {
    return (
      <AppLayout paperMode>
        {/* Grain overlay */}
        <div className="fixed inset-0 pointer-events-none z-[999]" style={GRAIN_STYLE} />
        <div className="flex-1 overflow-y-auto" style={PAPER_BRIDGE}>
          <div className="flex flex-col justify-center min-h-full px-6 sm:px-12 md:px-20">
            <div className="max-w-[620px] w-full mx-auto py-20">

              {/* Eyebrow */}
              <p
                className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)] mb-10"
                style={SANS}
              >
                Section XI · Football
              </p>

              {/* Display headline */}
              <h1
                style={{
                  fontFamily: 'var(--font-display), Georgia, serif',
                  fontSize: 'clamp(44px, 6vw, 72px)',
                  fontWeight: 300,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.04,
                  color: 'var(--paper-text)',
                }}
              >
                What do you<br />
                want to{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300 }}>know?</em>
              </h1>

              {/* Tagline */}
              <p
                className="mt-5 text-[var(--paper-muted)]"
                style={{ ...SERIF, fontSize: 16, fontStyle: 'italic', lineHeight: 1.6 }}
              >
                {APP_TAGLINE}
              </p>

              {/* Typewriter input — bracketed by ruled lines */}
              <div className="mt-14">
                <div className="border-t border-[var(--paper-rule)]">
                  <ChatInput2
                    onSend={(msg, model) => sendMessage(msg, model)}
                    onStop={stopStreaming}
                    isStreaming={isStreaming}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    showEyebrow
                    placeholder="Ask about teams, players, seasons, matchups…"
                  />
                </div>
                <div className="border-t border-[var(--paper-rule)]" />
              </div>

              {/* Suggested prompts */}
              <div className="mt-12">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)] mb-4"
                  style={SANS}
                >
                  Suggested
                </p>
                <div>
                  {STARTERS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q, selectedModel)}
                      className="group flex w-full items-start gap-4 py-3.5 px-4 -mx-4 border-t border-[var(--paper-rule-soft)] text-left transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]"
                      style={{ borderRadius: 3 }}
                    >
                      <span
                        className="shrink-0 mt-[2px] text-[var(--paper-faint)] group-hover:text-[var(--paper-strong)] transition-colors"
                        style={{ ...MONO, fontSize: 11 }}
                      >
                        ↳
                      </span>
                      <span
                        className="text-[var(--paper-muted)] group-hover:text-[var(--paper-strong)] transition-colors leading-relaxed"
                        style={{ ...SERIF, fontSize: 16, fontStyle: 'italic' }}
                      >
                        {q}
                      </span>
                    </button>
                  ))}
                  <div className="border-t border-[var(--paper-rule-soft)]" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  /* ── Active state — message thread ───────────────────────────────────── */
  return (
    <AppLayout paperMode>
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[999]" style={GRAIN_STYLE} />
      <div className="flex flex-1 flex-col overflow-hidden" style={PAPER_BRIDGE}>

        {/* Scrollable message thread */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-[660px] px-6 sm:px-8 pt-16 pb-8">
            <Dateline />
            {messages.map((msg, i) => {
              const isLastUser = msg.role === 'user' && i === messages.length - 1
              return (
                <div key={msg.id} ref={isLastUser ? lastUserMsgRef : undefined}>
                  {msg.role === 'user'
                    ? <UserMessage content={msg.content} />
                    : (
                      <AssistantMessage
                        message={msg}
                        isStreaming={isStreaming && i === messages.length - 1}
                        onSend={content => sendMessage(content, selectedModel)}
                        onOpenSeasons={openSeasons}
                      />
                    )
                  }
                </div>
              )
            })}
          </div>
        </div>

        {/* Scroll-to-bottom button + input footer */}
        <div className="shrink-0 relative">
          {showScrollBtn && (
            <div className="absolute bottom-full left-0 right-0 flex justify-center pb-3 pointer-events-none z-50">
              <button
                onClick={() => {
                  const el = scrollRef.current
                  if (!el) return
                  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
                  isNearBottomRef.current = true
                  setShowScrollBtn(false)
                }}
                className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-[var(--paper)] border border-[var(--paper-rule)] shadow-lg transition-shadow hover:shadow-xl"
              >
                <ArrowDown className="h-4 w-4 text-[var(--paper-muted)]" />
              </button>
            </div>
          )}

          {/* Ruled-line input footer */}
          <div
            className="border-t border-[var(--paper-rule)] px-6 sm:px-12 md:px-20"
            style={{ background: 'var(--paper)' }}
          >
            <div className="mx-auto max-w-[620px]">
              <ChatInput2
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

      {/* Seasons drill-down panel */}
      <ChatSeasonsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        teams={panelTeams}
      />
    </AppLayout>
  )
}
