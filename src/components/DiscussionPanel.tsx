'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDiscussion } from '@/lib/discussion-store'
import { BOARD_TAGS } from '@/lib/board-data'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono, ui-monospace), monospace' }

const CATEGORIES = BOARD_TAGS.filter(t => t !== 'All')

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
    </span>
  )
}

/**
 * The persistent, app-wide discussion drawer. Mounted once in the root layout
 * (inside DiscussionProvider) so it survives navigation — a thread you open
 * follows you from page to page. Categories → Threads → Discussion (+ Compose),
 * navigated with a viewStack (mirrors the /chat ChatSeasonsPanel pattern).
 */
export function DiscussionPanel() {
  const {
    open, close, current, canGoBack, push, pop,
    threads, addReply, postThread,
  } = useDiscussion()

  const [reply, setReply] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newCat, setNewCat] = useState<string>(CATEGORIES[0])

  const activeThread = current.type === 'discussion'
    ? threads.find(t => t.id === current.threadId) ?? null
    : null

  const headerTitle =
    current.type === 'threads'    ? current.category
    : current.type === 'discussion' ? (activeThread?.title ?? 'Discussion')
    : current.type === 'compose'  ? 'Start a discussion'
    : 'The Sideline'

  function sendReply() {
    if (!activeThread || !reply.trim()) return
    addReply(activeThread.id, reply)
    setReply('')
  }

  function submitThread() {
    if (!newTitle.trim()) return
    postThread({ title: newTitle, body: newBody, category: newCat })
    setNewTitle(''); setNewBody('')
  }

  return (
    <div
      className={cn(
        'fixed z-[60] inset-y-0 right-0 w-full sm:inset-y-[18px] sm:right-[18px] sm:left-auto sm:w-[423px] transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full sm:translate-x-[calc(100%+18px)] pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div className="h-full flex flex-col bg-[var(--paper)] overflow-hidden border-l border-[var(--paper-rule)] sm:border sm:border-[var(--paper-rule)] sm:rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.18)]">

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--paper-rule)] px-5 py-4 shrink-0">
          {canGoBack ? (
            <button
              onClick={pop}
              aria-label="Back"
              className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="shrink-0 pl-1"><LiveDot /></span>
          )}
          <span
            className="flex-1 min-w-0 truncate text-[var(--paper-text)]"
            style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
          >
            {headerTitle}
          </span>
          <button
            onClick={close}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* ── Categories ─────────────────────────────────────────── */}
          {current.type === 'categories' && (
            <div>
              <div className="px-5 pt-4 pb-3 border-b border-[var(--paper-rule-soft)]">
                <p className="text-[9px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>Section XI · Live</p>
                <p className="mt-1 text-[12px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>Pick a category and pull up a chair.</p>
              </div>
              {CATEGORIES.map(cat => {
                const count = threads.filter(t => t.tag === cat).length
                return (
                  <button
                    key={cat}
                    onClick={() => push({ type: 'threads', category: cat })}
                    className="group w-full flex items-center gap-3 px-5 py-4 border-b border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] transition-colors text-left"
                  >
                    <span className="flex-1 text-[16px] text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontWeight: 500 }}>{cat}</span>
                    <span className="text-[11px] tabular-nums text-[var(--paper-faint)]" style={MONO}>{count}</span>
                    <ChevronRight className="h-4 w-4 text-[var(--paper-faint)]" />
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Threads in category ────────────────────────────────── */}
          {current.type === 'threads' && (() => {
            const list = threads
              .filter(t => t.tag === current.category)
              .slice()
              .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
            if (list.length === 0) {
              return <p className="px-5 py-8 text-[13px] text-[var(--paper-faint)] italic" style={SERIF}>No discussions in {current.category} yet.</p>
            }
            return (
              <div>
                {list.map(t => (
                  <button
                    key={t.id}
                    onClick={() => push({ type: 'discussion', threadId: t.id })}
                    className="group w-full text-left flex items-start gap-3 px-5 py-4 border-b border-[var(--paper-rule-soft)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      {t.pinned && (
                        <span className="text-[8px] uppercase tracking-[0.24em] text-[var(--paper-strong)] border border-[var(--paper-strong)] px-1.5 py-0.5" style={{ ...SANS, borderRadius: 2 }}>Pinned</span>
                      )}
                      <p className="mt-1 text-[16px] leading-snug text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontWeight: 500 }}>{t.title}</p>
                      <p className="mt-0.5 text-[12px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>{t.body}</p>
                      <p className="mt-1.5 text-[10px] text-[var(--paper-faint)]" style={SANS}>{t.author} · {t.ago} · last reply {t.lastActivity}</p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-[var(--paper-faint)] pt-1" style={MONO}>{t.replyCount}</span>
                  </button>
                ))}
              </div>
            )
          })()}

          {/* ── Discussion ─────────────────────────────────────────── */}
          {current.type === 'discussion' && (activeThread ? (
            <div>
              <div className="px-5 pt-5 pb-5 border-b border-[var(--paper-rule)]">
                <span className="text-[9px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>{activeThread.tag}</span>
                <p className="mt-1.5 text-[21px] leading-tight text-[var(--paper-text)]" style={{ ...SERIF, fontWeight: 500 }}>{activeThread.title}</p>
                <p className="mt-1 text-[11px] text-[var(--paper-faint)]" style={SANS}>{activeThread.author} · {activeThread.ago}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--paper-muted)]" style={SERIF}>{activeThread.body}</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                {activeThread.replies.length === 0 ? (
                  <p className="text-[13px] text-[var(--paper-faint)] italic py-2" style={SERIF}>No replies yet — be the first.</p>
                ) : activeThread.replies.map(r => (
                  <div key={r.id} className="flex items-start gap-3">
                    <div className="shrink-0 h-7 w-7 rounded-full border border-[var(--paper-rule)] bg-[var(--paper-quiet)] flex items-center justify-center text-[8px] text-[var(--paper-muted)]" style={MONO}>
                      {r.initials.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] text-[var(--paper-text)]" style={{ ...SERIF, fontWeight: 500 }}>{r.author}</span>
                        <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--paper-faint)]" style={MONO}>{r.ago}</span>
                      </div>
                      <p className="mt-0.5 text-[13.5px] leading-snug text-[var(--paper-muted)]" style={SERIF}>{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="px-5 py-8 text-[13px] text-[var(--paper-faint)] italic" style={SERIF}>This discussion is no longer available.</p>
          ))}

          {/* ── Compose ────────────────────────────────────────────── */}
          {current.type === 'compose' && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCat(cat)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] border transition-colors',
                      newCat === cat
                        ? 'border-[var(--paper-strong)] text-[var(--paper-strong)] bg-[var(--paper-quiet)]'
                        : 'border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)]',
                    )}
                    style={{ ...SANS, borderRadius: 2 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Discussion title…"
                className="w-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-3 py-2.5 text-[16px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] focus:outline-none focus:border-[var(--paper-strong)]"
                style={{ ...SERIF, borderRadius: 3 }}
              />
              <textarea
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                placeholder="Say your piece…"
                rows={5}
                className="w-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] px-3 py-2.5 text-[14px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] focus:outline-none focus:border-[var(--paper-strong)] resize-none"
                style={{ ...SERIF, borderRadius: 3 }}
              />
              <button
                onClick={submitThread}
                disabled={!newTitle.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--paper-strong)] text-white text-[11px] uppercase tracking-[0.22em] disabled:opacity-30 hover:opacity-90 transition-opacity"
                style={{ ...SANS, borderRadius: 2 }}
              >
                Post <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer — reply composer (discussion view only) */}
        {current.type === 'discussion' && activeThread && (
          <div className="shrink-0 border-t border-[var(--paper-rule)] p-2.5 flex items-center gap-2" style={{ background: 'var(--paper-quiet)' }}>
            <input
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendReply() }}
              placeholder="Add a reply…"
              className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-[13.5px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] focus:outline-none"
              style={SERIF}
            />
            <button
              onClick={sendReply}
              disabled={!reply.trim()}
              aria-label="Reply"
              className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-[var(--paper-strong)] text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
