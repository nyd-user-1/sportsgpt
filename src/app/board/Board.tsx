'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  SectionHead,
  StickyControlBar,
  SearchInput,
  useSearchHotkey,
  SearchButtonGroup,
  Tablet,
  EmptyTablet,
} from '@/components/editorial'
import { cn } from '@/lib/utils'
import { BOARD_TAGS } from '@/lib/board-data'
import { useDiscussion } from '@/lib/discussion-store'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono, ui-monospace), monospace' }

export function Board() {
  // Threads + all panel interaction live in the shared discussion store, so a
  // thread opened here follows the reader across the rest of the app.
  const { threads, openThread, openCompose } = useDiscussion()
  const [tag, setTag]   = useState<(typeof BOARD_TAGS)[number]>('All')
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchHotkey(searchRef, () => setQuery(''))

  const q = query.trim().toLowerCase()
  const visible = threads
    .filter(t => tag === 'All' || t.tag === tag)
    .filter(t => scope === 'all' || t.author === 'You' || t.replies.some(r => r.author === 'You'))
    .filter(t => !q || `${t.title} ${t.body} ${t.author} ${t.tag}`.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))

  const threadCount = visible.length

  return (
    <AppLayout paperMode>
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>

        {/* ── Masthead ───────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
          <RevealFx delay={0} translateY={4}>
            <EditorialHead
              size="xl"
              eyebrow="Section XI · Discussion"
              subhead={<>Letters, hot takes, and game-day debate from the section. Pull up a chair in the press box.</>}
              meta={[
                <Link key="school"   href="/school"             className="hover:text-[var(--paper-strong)] transition-colors">School</Link>,
                <Link key="division" href="/division/division-i" className="hover:text-[var(--paper-strong)] transition-colors">Division</Link>,
                <Link key="team"     href="/team"               className="hover:text-[var(--paper-strong)] transition-colors">Team</Link>,
                <Link key="player"   href="/player"             className="hover:text-[var(--paper-strong)] transition-colors">Player</Link>,
              ]}
            >
              The Press Box
            </EditorialHead>
          </RevealFx>
        </div>

        {/* ── Sticky control bar: season nav (consistency) + search ──────── */}
        <StickyControlBar>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]" style={SANS}>
              Season
            </span>
            <button
              type="button"
              aria-label="Previous"
              className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span
              className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
              style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
            >
              All-Time
            </span>
            <button
              type="button"
              aria-label="Next"
              className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            inputRef={searchRef}
            placeholder="Search discussions…"
          />
          <SearchButtonGroup />
        </StickyControlBar>

        {/* ── Index: section head + category tabs + thread list ──────────── */}
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-12" id="discussions">
          <RevealFx delay={0.15} translateY={8} key={scope}>
            <SectionHead
              noRule
              eyebrow={`${threadCount} ${threadCount === 1 ? 'thread' : 'threads'}`}
              title={
                <span className="inline-flex items-center gap-4">
                  <span>{scope === 'all' ? 'Discussions' : 'My Discussions'}</span>
                  <button
                    onClick={() => setScope(s => (s === 'all' ? 'mine' : 'all'))}
                    aria-label={scope === 'all' ? 'Show my discussions' : 'Show all discussions'}
                    className="inline-flex items-center justify-center text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-colors duration-150"
                  >
                    <ArrowRight className="h-8 w-8" />
                  </button>
                </span>
              }
              blurb={scope === 'all'
                ? 'Open a thread to read and reply in the panel — newest activity first.'
                : 'Threads you started or replied to.'}
            />

            {/* Category tabs + new thread */}
            <div className="flex items-center justify-between gap-4 border-b border-[var(--paper-rule)]">
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
                onClick={() => openCompose()}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--paper-rule)] text-[10px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                style={{ ...SANS, borderRadius: 2 }}
              >
                + Start a discussion
              </button>
            </div>

            {/* Threads */}
            <div className="mt-6">
              {visible.length === 0 ? (
                <EmptyTablet
                  label={
                    scope === 'mine'
                      ? `You haven’t joined any discussions${tag === 'All' ? '' : ` in ${tag}`} yet.`
                      : q
                        ? `No discussions match “${query.trim()}”${tag === 'All' ? '' : ` in ${tag}`}.`
                        : `No discussions in ${tag} yet.`
                  }
                />
              ) : (
                <Tablet>
                  <div>
                    {visible.map(t => (
                      <button
                        key={t.id}
                        onClick={() => openThread(t.id)}
                        className="group w-full text-left flex items-start gap-4 px-5 py-5 border-t border-[var(--paper-rule-soft)] first:border-t-0 hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] transition-colors"
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
                </Tablet>
              )}
            </div>

            <div className="mt-16 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch] text-[12.5px] leading-[1.75] text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>
              The Press Box is a community discussion board for Section XI football. This is a design
              prototype — threads and replies are seeded and live only in your browser session until a
              <span style={MONO}> board_threads</span> / <span style={MONO}>board_posts</span> table is wired up with sign-in.
            </div>
          </RevealFx>
        </div>
      </div>
    </AppLayout>
  )
}
