'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { AppPanel } from '@/components/AppPanel'
import { RevealFx } from '@/components/RevealFx'
import { EditorialHead } from '@/components/editorial'
import { cn } from '@/lib/utils'
import { BOARD_THREADS, BOARD_TAGS, type BoardThread } from '@/lib/board-data'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono, ui-monospace), monospace' }

export function Board() {
  const [threads, setThreads]   = useState<BoardThread[]>(BOARD_THREADS)
  const [tag, setTag]           = useState<(typeof BOARD_TAGS)[number]>('All')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [composing, setComposing]   = useState(false)
  const [reply, setReply]       = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody]   = useState('')

  const selected = threads.find(t => t.id === selectedId) ?? null
  const visible = (tag === 'All' ? threads : threads.filter(t => t.tag === tag))
    .slice()
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))

  function addReply() {
    const body = reply.trim()
    if (!body || !selected) return
    setThreads(ts => ts.map(t => t.id === selected.id
      ? { ...t, replyCount: t.replyCount + 1, lastActivity: 'now', replies: [...t.replies, { id: Date.now(), author: 'You', initials: 'YOU', body, ago: 'now' }] }
      : t))
    setReply('')
  }

  function postThread() {
    const title = newTitle.trim()
    if (!title) return
    const t: BoardThread = {
      id: Date.now(), title, body: newBody.trim() || '—',
      author: 'You', initials: 'YOU', tag: tag === 'All' ? 'Game Day' : tag,
      ago: 'now', replyCount: 0, lastActivity: 'now', replies: [],
    }
    setThreads(ts => [t, ...ts])
    setNewTitle(''); setNewBody(''); setComposing(false)
    setSelectedId(t.id)
  }

  const panelOpen = selected != null || composing
  const closePanel = () => { setSelectedId(null); setComposing(false) }

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>
        <div className="mx-auto max-w-4xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-24">

          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow="Section XI · Discussion"
              subhead={<>Letters, hot takes, and game-day debate from the section. Pull up a chair in the press box.</>}
              meta={[
                <Link key="team" href="/team" className="hover:text-[var(--paper-strong)] transition-colors">Team</Link>,
                <Link key="leaderboard" href="/leaderboard" className="hover:text-[var(--paper-strong)] transition-colors">Leaderboard</Link>,
                <Link key="chat" href="/chat" className="hover:text-[var(--paper-strong)] transition-colors">Ask SportsGPT</Link>,
              ]}
            >
              The Press Box
            </EditorialHead>
          </RevealFx>

          <RevealFx delay={0.15} translateY={8}>
            {/* Filter row + new thread */}
            <div className="mt-10 flex items-center justify-between gap-4 border-b border-[var(--paper-rule)]">
              <div className="flex items-center overflow-x-auto no-scrollbar min-w-0">
                {BOARD_TAGS.map(tg => (
                  <button
                    key={tg}
                    onClick={() => setTag(tg)}
                    className={cn(
                      'px-4 py-3 text-[11px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors first:pl-0',
                      tag === tg ? 'border-[var(--paper-strong)] text-[var(--paper-strong)]' : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-text)]',
                    )}
                    style={SANS}
                  >
                    {tg}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setSelectedId(null); setComposing(true) }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--paper-rule)] text-[10px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                style={{ ...SANS, borderRadius: 2 }}
              >
                + Start a discussion
              </button>
            </div>

            {/* Threads */}
            <div className="mt-2 divide-y divide-[var(--paper-rule-soft)]">
              {visible.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setComposing(false); setSelectedId(t.id) }}
                  className="group w-full text-left flex items-start gap-4 py-5 hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] -mx-3 px-3 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      {t.pinned && (
                        <span className="text-[8px] uppercase tracking-[0.24em] text-[var(--paper-strong)] border border-[var(--paper-strong)] px-1.5 py-0.5" style={{ ...SANS, borderRadius: 2 }}>Pinned</span>
                      )}
                      <span className="text-[9px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>{t.tag}</span>
                    </div>
                    <p className="mt-1.5 text-[19px] leading-snug text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors" style={{ ...SERIF, fontWeight: 500 }}>
                      {t.title}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
                      {t.body}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--paper-faint)]" style={SANS}>
                      {t.author} · {t.ago} · last reply {t.lastActivity}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-[var(--paper-faint)] pt-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="text-[13px] tabular-nums" style={MONO}>{t.replyCount}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch] text-[12.5px] leading-[1.75] text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>
              The Press Box is a community discussion board for Section XI football. This is a design
              prototype — threads and replies are seeded and live only in your browser session until a
              <span style={MONO}> board_threads</span> / <span style={MONO}>board_posts</span> table is wired up with sign-in.
            </div>
          </RevealFx>
        </div>
      </div>

      {/* Thread / compose panel */}
      <AppPanel
        open={panelOpen}
        onClose={closePanel}
        title={composing ? 'Start a discussion' : 'Discussion'}
        footer={<span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>DISCUSSION PANEL</span>}
      >
        <div style={{ background: 'var(--paper)', color: 'var(--paper-text)' }}>
          {composing ? (
            <div className="px-5 py-5 space-y-4">
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
                onClick={postThread}
                disabled={!newTitle.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--paper-strong)] text-white text-[11px] uppercase tracking-[0.22em] disabled:opacity-30 hover:opacity-90 transition-opacity"
                style={{ ...SANS, borderRadius: 2 }}
              >
                Post <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : selected ? (
            <div>
              {/* Original post */}
              <div className="px-5 pt-5 pb-5 border-b border-[var(--paper-rule)]">
                <span className="text-[9px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>{selected.tag}</span>
                <p className="mt-1.5 text-[22px] leading-tight text-[var(--paper-text)]" style={{ ...SERIF, fontWeight: 500 }}>{selected.title}</p>
                <p className="mt-1 text-[11px] text-[var(--paper-faint)]" style={SANS}>{selected.author} · {selected.ago}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--paper-muted)]" style={SERIF}>{selected.body}</p>
              </div>

              {/* Replies */}
              <div className="px-5 py-4 space-y-4">
                {selected.replies.length === 0 ? (
                  <p className="text-[13px] text-[var(--paper-faint)] italic py-2" style={SERIF}>No replies yet — be the first.</p>
                ) : selected.replies.map(r => (
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

              {/* Reply composer */}
              <div className="sticky bottom-0 border-t border-[var(--paper-rule)] p-2.5 flex items-center gap-2" style={{ background: 'var(--paper-quiet)' }}>
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addReply() }}
                  placeholder="Add a reply…"
                  className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-[13.5px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] focus:outline-none"
                  style={SERIF}
                />
                <button
                  onClick={addReply}
                  disabled={!reply.trim()}
                  aria-label="Reply"
                  className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-[var(--paper-strong)] text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </AppPanel>
    </AppLayout>
  )
}
