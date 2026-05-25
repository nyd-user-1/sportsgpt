'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ThumbsUp, ThumbsDown, CalendarDays, BarChart2 } from 'lucide-react'
import Image from 'next/image'
import type { Message } from '@/hooks/useChat'
import type { TeamMeta } from '@/components/ChatSeasonsPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { MONO } from '@/components/editorial'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }

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
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="mt-4 mb-1 text-[15px] font-semibold text-[var(--paper-text)]" style={SERIF}>{children}</h4>
  ),
  h5: ({ children }: { children: React.ReactNode }) => (
    <h5 className="mt-3 mb-1 text-[14px] font-semibold text-[var(--paper-text)]" style={SERIF}>{children}</h5>
  ),
  h6: ({ children }: { children: React.ReactNode }) => (
    <h6 className="mt-3 mb-1 text-[13px] font-semibold text-[var(--paper-text)]" style={SERIF}>{children}</h6>
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
    <div className="my-5 border border-[var(--paper-rule)] overflow-x-auto" style={{ borderRadius: 3 }}>
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-[var(--paper-quiet)]">{children}</thead>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th
      className="text-left px-4 py-3 border-b border-[var(--paper-rule)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--paper-faint)] whitespace-nowrap"
      style={SANS}
    >
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td
      className="px-4 py-2.5 border-b border-[var(--paper-rule-soft)] text-[14px] text-[var(--paper-text)]"
      style={{ ...SANS, wordBreak: 'keep-all' }}
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
      className="rounded px-1.5 py-0.5 text-[13px] bg-[var(--paper-quiet)] text-[var(--paper-strong)]"
      style={MONO}
    >
      {children}
    </code>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-[var(--paper-muted)]">{children}</em>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-[var(--paper-strong)] hover:underline">{children}</a>
  ),
}

// Strip the ## Follow-ups section from rendered content so it doesn't duplicate the footer UI
function stripFollowUps(content: string): string {
  const idx = content.search(/\n#{1,3}\s+Follow-?[Uu]ps?\s*\n/i)
  return idx >= 0 ? content.slice(0, idx).trimEnd() : content
}

// Extract follow-up questions from the ## Follow-ups section
function extractFollowUps(content: string): string[] {
  const lines = content.split('\n')
  const followUps: string[] = []
  let inSection = false
  for (const line of lines) {
    const t = line.trim()
    if (/^#{1,3}\s+follow-?ups?/i.test(t)) { inSection = true; continue }
    if (inSection && /^[-*\d.]\s+.+\??$/.test(t)) {
      const q = t.replace(/^[-*\d.]+\s+/, '').replace(/\?*$/, '?')
      followUps.push(q)
    }
    if (inSection && t.startsWith('#') && !/follow/i.test(t)) break
  }
  return followUps.slice(0, 3)
}

interface Props {
  message: Message
  isStreaming?: boolean
  onSend?: (content: string) => void
  onOpenSeasons?: (teams: TeamMeta[]) => void
}

export function ChatMessage({ message, isStreaming, onSend, onOpenSeasons }: Props) {
  const isUser = message.role === 'user'
  const hasContent = message.content.length > 0

  // All hooks unconditionally at the top — rules of hooks
  const wipeRef         = useRef<HTMLDivElement>(null)
  const wipeRafRef      = useRef<number | null>(null)
  const wipeStartedRef  = useRef(false)
  const wipePRef        = useRef(-5)

  useEffect(() => {
    if (isUser || !isStreaming || !hasContent) return
    if (wipeStartedRef.current) return
    const el = wipeRef.current
    if (!el) return

    wipeStartedRef.current = true
    wipePRef.current = -5
    const RATE = 30
    let lastTime: number | null = null

    function tick(now: number) {
      if (lastTime === null) lastTime = now
      wipePRef.current = Math.min(wipePRef.current + ((now - lastTime) / 1000) * RATE, 110)
      lastTime = now
      const p = wipePRef.current
      el!.style.setProperty('--mp1', `${p - 2}%`)
      el!.style.setProperty('--mp2', `${p + 2}%`)
      el!.style.setProperty('--mp3', `${p + 8}%`)
      if (wipePRef.current < 110) wipeRafRef.current = requestAnimationFrame(tick)
    }
    wipeRafRef.current = requestAnimationFrame(tick)
    return () => { if (wipeRafRef.current) cancelAnimationFrame(wipeRafRef.current) }
  }, [isUser, isStreaming, hasContent])

  useEffect(() => {
    if (isUser || isStreaming) return
    wipeStartedRef.current = false
    if (wipeRafRef.current) { cancelAnimationFrame(wipeRafRef.current); wipeRafRef.current = null }
    const el = wipeRef.current
    if (!el) return
    const startP = wipePRef.current
    if (startP >= 110) { el.style.removeProperty('--mp1'); el.style.removeProperty('--mp2'); el.style.removeProperty('--mp3'); return }
    const t0 = performance.now()
    function fin(now: number) {
      const t = Math.min(1, (now - t0) / 800)
      const p = startP + (110 - startP) * t
      el!.style.setProperty('--mp1', `${p - 2}%`)
      el!.style.setProperty('--mp2', `${p + 2}%`)
      el!.style.setProperty('--mp3', `${p + 8}%`)
      if (t < 1) requestAnimationFrame(fin)
      else { el!.style.removeProperty('--mp1'); el!.style.removeProperty('--mp2'); el!.style.removeProperty('--mp3') }
    }
    requestAnimationFrame(fin)
  }, [isUser, isStreaming])

  // ── User bubble ───────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div
          className="max-w-[90%] md:max-w-[70%] border border-[var(--paper-rule)] bg-[var(--paper-quiet)] px-4 py-3"
          style={{ borderRadius: 3 }}
        >
          <p
            className="text-[17px] leading-relaxed text-[var(--paper-text)]"
            style={SERIF}
          >
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  // ── Assistant bubble ──────────────────────────────────────────────────────
  return (
    <div className="mb-6 max-w-[720px]">
      {isStreaming && !hasContent && (
        <div className="space-y-3 py-1">
          <div className="h-3 w-[88%] rounded-full bg-[var(--paper-quiet)] animate-pulse" />
          <div className="h-3 w-[75%] rounded-full bg-[var(--paper-quiet)] animate-pulse" />
          <div className="h-3 w-[82%] rounded-full bg-[var(--paper-quiet)] animate-pulse" />
        </div>
      )}

      {hasContent && (
        <div ref={wipeRef} className={`space-y-1 text-[17px]${isStreaming ? ' mask-wipe' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {stripFollowUps(message.content)}
          </ReactMarkdown>
        </div>
      )}

      {!isStreaming && hasContent && (
        <ChatFooter
          content={message.content}
          teams={message.meta?.teams ?? []}
          onSend={onSend}
          onOpenSeasons={onOpenSeasons}
        />
      )}
    </div>
  )
}

// ── ChatFooter ────────────────────────────────────────────────────────────────
function ChatFooter({
  content,
  teams,
  onSend,
  onOpenSeasons,
}: {
  content: string
  teams: TeamMeta[]
  onSend?: (content: string) => void
  onOpenSeasons?: (teams: TeamMeta[]) => void
}) {
  const [copied,   setCopied]   = useState(false)
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const followUps = extractFollowUps(content)
  const hasTeams  = teams.length > 0
  const firstLogo = hasTeams ? SCHOOL_LOGOS[teams[0].slug] : null

  const linkCls = 'text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)] hover:text-[var(--paper-muted)] transition-colors'

  return (
    <div className="mt-5 pt-4 border-t border-[var(--paper-rule-soft)]">

      {/* Action row — text links */}
      <div className="flex items-center gap-5">
        <button onClick={handleCopy} className={linkCls} style={SANS}>
          {copied ? 'Copied ✓' : 'Copy'}
        </button>

        <button className={linkCls} style={SANS}>
          <span className="inline-flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3" />
            Charts
          </span>
        </button>

        {hasTeams && onOpenSeasons && (
          <button onClick={() => onOpenSeasons(teams)} className={linkCls} style={SANS}>
            <span className="inline-flex items-center gap-1.5">
              {firstLogo
                ? <Image src={firstLogo} alt="" width={12} height={12} className="object-contain" unoptimized />
                : <CalendarDays className="h-3 w-3" />
              }
              Explore seasons
              {teams.length > 1 && (
                <span className="opacity-60">+{teams.length - 1}</span>
              )}
            </span>
          </button>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFeedback(f => f === 'good' ? null : 'good')}
            className={`transition-colors ${feedback === 'good' ? 'text-emerald-500' : 'text-[var(--paper-faint)] hover:text-[var(--paper-muted)]'}`}
            aria-label="Thumbs up"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setFeedback(f => f === 'bad' ? null : 'bad')}
            className={`transition-colors ${feedback === 'bad' ? 'text-red-500' : 'text-[var(--paper-faint)] hover:text-[var(--paper-muted)]'}`}
            aria-label="Thumbs down"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Follow-ups */}
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
  )
}
