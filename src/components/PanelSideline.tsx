'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppPanel } from './AppPanel'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono, ui-monospace), monospace' }

type Msg = { id: number; author: string; initials: string; body: string; ago: string; you?: boolean }

// Seeded community chatter — design prototype (not yet persisted to a backend).
const SEED: Msg[] = [
  { id: 1, author: 'Coach Petrucci', initials: 'CP', body: 'Sayville’s D-IV run was unreal — 12–0 and a +272 differential. Nobody touched them.', ago: '2h' },
  { id: 2, author: 'LI Gridiron',    initials: 'LG', body: 'Floyd vs Ward Melville is the game of the year. Two 10-win teams, +213 and +294.', ago: '1h' },
  { id: 3, author: 'mike_sec11',     initials: 'MS', body: 'Anyone got the Hills West – Longwood final? Box score isn’t up yet.', ago: '37m' },
  { id: 4, author: 'Patriots22',     initials: 'P2', body: 'Hot take: Sachem North is the most underrated team in Division I right now.', ago: '12m' },
]

export function PanelSideline({ open, onClose, page }: { open: boolean; onClose: () => void; page: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(SEED)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [open, msgs])

  function send() {
    const body = draft.trim()
    if (!body) return
    setMsgs(m => [...m, { id: Date.now(), author: 'You', initials: 'YOU', body, ago: 'now', you: true }])
    setDraft('')
  }

  const title = (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Sideline: {page}
    </span>
  )

  const footer = (
    <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--paper-quiet)' }}>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') send() }}
        placeholder="Say something…"
        className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-[14px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] focus:outline-none"
        style={SERIF}
      />
      <button
        onClick={send}
        disabled={!draft.trim()}
        aria-label="Send"
        className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-[var(--paper-strong)] text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <AppPanel open={open} onClose={onClose} title={title} footer={footer}>
      {/* Editorial intro — live message count + per-page board label */}
      <div className="px-5 pt-4 pb-3 border-b border-[var(--paper-rule-soft)]">
        <p className="text-[9px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
          {msgs.length} {msgs.length === 1 ? 'message' : 'messages'} in chat
        </p>
        <p className="mt-1 text-[12px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
          {page} page discussion board.
        </p>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="px-5 py-4 space-y-4">
        {msgs.map(m => (
          <div key={m.id} className={cn('flex items-start gap-3', m.you && 'flex-row-reverse text-right')}>
            <div
              className={cn(
                'shrink-0 h-8 w-8 rounded-full border flex items-center justify-center text-[9px] tracking-wide',
                m.you
                  ? 'border-transparent bg-[var(--paper-strong)] text-white'
                  : 'border-[var(--paper-rule)] bg-[var(--paper-quiet)] text-[var(--paper-muted)]',
              )}
              style={MONO}
            >
              {m.initials.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className={cn('flex items-baseline gap-2', m.you && 'flex-row-reverse')}>
                <span className="text-[13px] text-[var(--paper-text)]" style={{ ...SERIF, fontWeight: 500 }}>{m.author}</span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--paper-faint)]" style={MONO}>{m.ago}</span>
              </div>
              <p className="mt-0.5 text-[14px] leading-snug text-[var(--paper-muted)]" style={SERIF}>{m.body}</p>
            </div>
          </div>
        ))}
      </div>
    </AppPanel>
  )
}
