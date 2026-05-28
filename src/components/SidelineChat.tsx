'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function SidelineChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>(SEED)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [open, msgs])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function send() {
    const body = draft.trim()
    if (!body) return
    setMsgs(m => [...m, { id: Date.now(), author: 'You', initials: 'YOU', body, ago: 'now', you: true }])
    setDraft('')
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open the Sideline"
        className={cn(
          'group fixed bottom-5 right-5 z-[60] flex items-center gap-2.5 h-12 rounded-full border transition-all duration-300',
          'border-[var(--paper-rule)] bg-[var(--paper)] shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:border-[var(--paper-strong)]',
          open ? 'w-12 px-0 justify-center' : 'pl-4 pr-5',
        )}
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {open ? (
          <X className="h-5 w-5 text-[var(--paper-text)]" />
        ) : (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <MessageCircle className="h-[18px] w-[18px] text-[var(--paper-text)]" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--paper-text)]" style={SANS}>Sideline</span>
          </>
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-20 right-5 z-[59] w-[min(92vw,360px)] origin-bottom-right rounded-[6px] border border-[var(--paper-rule)] overflow-hidden transition-all duration-300',
          'shadow-[0_16px_50px_rgba(0,0,0,0.55)]',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none',
        )}
        style={{ background: 'var(--paper)' }}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-3 border-b border-[var(--paper-rule)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[9px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>Section XI · Live</span>
          </div>
          <p className="mt-1 text-[19px] leading-none text-[var(--paper-text)]" style={SERIF}>The Sideline</p>
          <p className="mt-1 text-[11px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>Talk ball with the section.</p>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="max-h-[46vh] overflow-y-auto no-scrollbar px-4 py-3 space-y-3.5">
          {msgs.map(m => (
            <div key={m.id} className={cn('flex items-start gap-2.5', m.you && 'flex-row-reverse text-right')}>
              <div
                className={cn(
                  'shrink-0 h-7 w-7 rounded-full border flex items-center justify-center text-[8px] tracking-wide',
                  m.you ? 'border-transparent bg-[var(--paper-strong)] text-white' : 'border-[var(--paper-rule)] bg-[var(--paper-quiet)] text-[var(--paper-muted)]',
                )}
                style={MONO}
              >
                {m.initials.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className={cn('flex items-baseline gap-2', m.you && 'flex-row-reverse')}>
                  <span className="text-[12px] text-[var(--paper-text)]" style={{ ...SERIF, fontWeight: 500 }}>{m.author}</span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--paper-faint)]" style={MONO}>{m.ago}</span>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--paper-muted)]" style={{ ...SERIF }}>{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--paper-rule)] p-2.5 flex items-center gap-2" style={{ background: 'var(--paper-quiet)' }}>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Say something…"
            className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-[13px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] focus:outline-none"
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
      </div>
    </>
  )
}
