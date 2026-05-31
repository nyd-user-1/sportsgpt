'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ArrowRight, ArrowLeft, Compass } from 'lucide-react'

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
    title: 'Teams · Players · Leaderboard',
    body: 'Start here. Every program ranked by record, every player on file sortable by any column, and the top 25 of each season.',
    cluster: 'browse',
  },
  {
    kicker: 'Go deeper',
    title: 'Charts · Divisions · Schools',
    body: 'Records drawn as visual leaderboards, the four divisions standing-by-standing, and the academic record behind each program.',
    cluster: 'deeper',
  },
  {
    kicker: 'Explore',
    title: 'Games · Maps · Board',
    body: 'Box scores for every game, Suffolk County drawn by school identity, and The Press Box — the community discussion board.',
    cluster: 'explore',
  },
  {
    kicker: 'Ask & find',
    title: 'Chat · Search · Glossary',
    body: 'Ask SportsGPT anything, search the whole almanac as you type, or look up any stat or abbreviation in plain language.',
    cluster: 'ask',
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

export function HomeTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [beacon, setBeacon] = useState<{ x: number; y: number } | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setStep(0)
    setBeacon(null)
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

  // Drive the card highlight + beacon + Esc/arrow keys while open.
  useEffect(() => {
    if (!open) { setHighlight(null); setBeacon(null); return }
    const cluster = STEPS[step].cluster
    setHighlight(cluster)

    if (!cluster) {
      setBeacon(null)
    } else {
      const card = document.querySelector<HTMLElement>(`[data-tour="${cluster}"]`)
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Place the beacon at the card's top-right corner once the scroll settles.
      const place = () => {
        if (!card) return setBeacon(null)
        const r = card.getBoundingClientRect()
        setBeacon({ x: r.right - 14, y: r.top + 14 })
      }
      const t = setTimeout(place, 320)
      window.addEventListener('resize', place)
      window.addEventListener('scroll', place, true)
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close()
        else if (e.key === 'ArrowRight') setStep(s => Math.min(s + 1, STEPS.length - 1))
        else if (e.key === 'ArrowLeft') setStep(s => Math.max(s - 1, 0))
      }
      window.addEventListener('keydown', onKey)
      return () => {
        clearTimeout(t)
        window.removeEventListener('resize', place)
        window.removeEventListener('scroll', place, true)
        window.removeEventListener('keydown', onKey)
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') setStep(s => Math.min(s + 1, STEPS.length - 1))
      else if (e.key === 'ArrowLeft') setStep(s => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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

      <div
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:justify-end p-4 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label="Site tour"
      >
        {/* Soft scrim — click to dismiss, doesn't fully block the page so the
            highlighted cards stay readable behind it. */}
        <button
          aria-label="Close tour"
          onClick={close}
          className="absolute inset-0 bg-black/30"
          style={{ cursor: 'default' }}
        />

      {/* Stepped card */}
      <div
        className="relative w-full max-w-[380px] border border-[var(--paper-rule)] bg-[var(--paper)] shadow-xl overflow-hidden"
        style={{ borderRadius: 6 }}
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
