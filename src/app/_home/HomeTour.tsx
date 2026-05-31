'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ArrowRight, ArrowLeft, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

const STORAGE_KEY = 'sportsgpt-tour-seen'

type Step = {
  kicker: string
  title: string
  body: string
  /** data-tour value of the cards this step highlights; null = no highlight (welcome). */
  cluster: string | null
}

const STEPS: Step[] = [
  {
    kicker: 'Welcome',
    title: 'The Suffolk football almanac',
    body: 'Five seasons of Section XI football — every team, player, game, and stat, ranked and sorted like a yearbook. Here’s how to find your way around.',
    cluster: null,
  },
  {
    kicker: 'Browse the record',
    title: 'Teams · Players · Games',
    body: 'Start here. Every program ranked by record, every player on file, and every game with its box score.',
    cluster: 'row1',
  },
  {
    kicker: 'Go deeper',
    title: 'Divisions · Schools · Leaderboard',
    body: 'The four divisions standing-by-standing, the academic record behind each program, and the top 25 of every season.',
    cluster: 'row2',
  },
  {
    kicker: 'The Big Board',
    title: 'Talk Section XI',
    body: 'A community discussion board for Suffolk football — rankings, game-day debate, history, and recruiting, tagged and threaded.',
    cluster: 'board',
  },
  {
    kicker: 'Charts',
    title: 'A table of figures',
    body: 'Team, season, player, and game records drawn as readable visual leaderboards — the almanac at a glance.',
    cluster: 'charts',
  },
  {
    kicker: 'Maps',
    title: 'The county, by program',
    body: 'Suffolk County drawn by school identity — every district colored by its program; click through to any team.',
    cluster: 'maps',
  },
  {
    kicker: 'Chat',
    title: 'Ask SportsGPT',
    body: 'Ask anything about Section XI — leaders, matchups, and season history, answered straight from the record.',
    cluster: 'chat',
  },
  {
    kicker: 'Search',
    title: 'Find anything',
    body: 'One search across the whole almanac — teams, players, schools, games, and seasons, ranked as you type.',
    cluster: 'search',
  },
  {
    kicker: 'Glossary',
    title: 'Every term, defined',
    body: 'Every stat and abbreviation on the site explained in plain language — from YPC to point differential.',
    cluster: 'glossary',
  },
]

/** Apply / clear the highlight ring + dim on the cards for a given cluster. */
function setHighlight(cluster: string | null) {
  const all = document.querySelectorAll<HTMLElement>('[data-tour]')
  all.forEach(el => {
    if (cluster && el.dataset.tour === cluster) {
      el.classList.add('tour-on')
      el.classList.remove('tour-off')
    } else if (cluster) {
      el.classList.add('tour-off')
      el.classList.remove('tour-on')
    } else {
      el.classList.remove('tour-on', 'tour-off')
    }
  })
}

const CARD_W = 380   // dialog card width (max-w-[380px])
const CARD_H = 210   // approx dialog card height for clamping
const MARGIN = 16    // viewport edge margin

export function HomeTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [beacon, setBeacon] = useState<{ x: number; y: number } | null>(null)
  // Tour card position. null → use the welcome fallback (top-right, under the trigger).
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setStep(0)
    setBeacon(null)
    setCardPos(null)
    setHighlight(null)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
  }, [])

  // Auto-open once for first-time visitors.
  useEffect(() => {
    let seen = '1'
    try { seen = localStorage.getItem(STORAGE_KEY) ?? '' } catch { /* ignore */ }
    if (!seen) {
      // small delay so the page's reveal animation settles first
      const t = setTimeout(() => setOpen(true), 700)
      return () => clearTimeout(t)
    }
  }, [])

  // A custom event lets the masthead "Take the tour" button (server-rendered)
  // open the tour without importing this client component.
  useEffect(() => {
    const onStart = () => { setStep(0); setOpen(true) }
    window.addEventListener('sportsgpt:start-tour', onStart)
    return () => window.removeEventListener('sportsgpt:start-tour', onStart)
  }, [])

  // Drive the card highlight + beacon + card position + Esc/arrow keys.
  useEffect(() => {
    if (!open) { setHighlight(null); setBeacon(null); setCardPos(null); return }
    const cluster = STEPS[step].cluster
    setHighlight(cluster)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') setStep(s => Math.min(s + 1, STEPS.length - 1))
      else if (e.key === 'ArrowLeft') setStep(s => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)

    // Welcome step: no target → fixed top-right under the trigger (cardPos = null).
    if (!cluster) {
      setBeacon(null)
      setCardPos(null)
      return () => window.removeEventListener('keydown', onKey)
    }

    const cards = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${cluster}"]`))
    cards[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Compute beacon (first card) + card position (union rect of all targets),
    // re-running on scroll/resize. One clamp rule keeps the card on-screen.
    const place = () => {
      if (!cards.length) { setBeacon(null); setCardPos(null); return }
      const rects = cards.map(c => c.getBoundingClientRect())
      const left   = Math.min(...rects.map(r => r.left))
      const right   = Math.max(...rects.map(r => r.right))
      const top     = Math.min(...rects.map(r => r.top))

      // Beacon: top-right corner of the first card.
      const f = rects[0]
      setBeacon({ x: f.right - 14, y: f.top + 14 })

      // Mobile: skip anchored positioning — the card renders as a bottom sheet.
      const vw = window.innerWidth, vh = window.innerHeight
      if (vw < 640) { setCardPos(null); return }

      // Card: anchor above-and-right of the union rect's top-right, then clamp.
      let cl = right - CARD_W * 0.45        // overlap the rightmost card a touch
      let ct = top - CARD_H - 12            // float above the row
      cl = Math.max(MARGIN, Math.min(cl, vw - CARD_W - MARGIN))
      ct = Math.max(MARGIN, Math.min(ct, vh - CARD_H - MARGIN))
      // Avoid the dead-left feel on a wide row — never left of the union midpoint.
      cl = Math.max(cl, Math.min((left + right) / 2, vw - CARD_W - MARGIN))
      setCardPos({ left: cl, top: ct })
    }

    const t = setTimeout(place, 320)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, step, close])

  if (!open) return null

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1
  const isFirst = step === 0

  return (
    <>
      {/* Blinking beacon — points at the highlighted card cluster. Rendered
          above the scrim so it stays bright over the dimmed page. */}
      {beacon && (
        <span
          className="tour-beacon"
          aria-hidden
          style={{ left: beacon.x, top: beacon.y, width: 12, height: 12 }}
        />
      )}

      <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Site tour">
        {/* Soft scrim — click to dismiss, doesn't fully block the page so the
            highlighted cards stay readable behind it. */}
        <button
          aria-label="Close tour"
          onClick={close}
          className="absolute inset-0 bg-black/30"
          style={{ cursor: 'default' }}
        />

      {/* Stepped card.
          - Mobile: always a bottom sheet (left/right/bottom pinned via classes).
          - Desktop welcome (no cardPos): top-right under the trigger.
          - Desktop cluster steps: anchored at the computed cardPos near the row.
          Inline top/left only set on desktop (place() nulls cardPos < 640px),
          so the max-sm bottom-sheet classes win on mobile. */}
      <div
        className={cn(
          'absolute border border-[var(--paper-rule)] bg-[var(--paper)] shadow-xl overflow-hidden',
          'max-sm:left-4 max-sm:right-4 max-sm:bottom-4 max-sm:top-auto',
          'sm:w-full sm:max-w-[380px]',
          !cardPos && 'sm:top-[88px] sm:right-8',
        )}
        style={cardPos ? { borderRadius: 6, top: cardPos.top, left: cardPos.left } : { borderRadius: 6 }}
      >
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
              {s.kicker}
            </p>
            <button
              onClick={close}
              aria-label="Close tour"
              className="-mr-1 -mt-0.5 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2
            className="mt-3 text-[var(--paper-text)] leading-tight"
            style={{ ...SERIF, fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}
          >
            {s.title}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.6] text-[var(--paper-muted)]" style={SANS}>
            {s.body}
          </p>
        </div>

        {/* Footer: progress dots + nav */}
        <div className="flex items-center justify-between border-t border-[var(--paper-rule)] px-6 py-3.5">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="block h-1.5 w-1.5 rounded-full transition-colors"
                style={{ background: i === step ? 'var(--paper-strong)' : 'var(--paper-rule)' }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {!isFirst && (
              <button
                onClick={() => setStep(s => Math.max(s - 1, 0))}
                className="flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 text-[12px] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
                style={SANS}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={close}
                className="flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px] font-medium text-[var(--paper)] transition-opacity hover:opacity-90"
                style={{ ...SANS, background: 'var(--paper-strong)' }}
              >
                Start exploring
              </button>
            ) : (
              <button
                onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))}
                className="flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[12px] font-medium text-[var(--paper)] transition-opacity hover:opacity-90"
                style={{ ...SANS, background: 'var(--paper-strong)' }}
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

/** Quiet masthead trigger — dispatches the custom event HomeTour listens for. */
export function TourTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event('sportsgpt:start-tour'))}
      className="inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--paper-rule)] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:border-[var(--paper-strong)] transition-colors"
      style={SANS}
    >
      <Compass className="h-3.5 w-3.5" /> Take the tour
    </button>
  )
}
