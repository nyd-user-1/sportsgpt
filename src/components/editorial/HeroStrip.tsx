'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TABLET_RADIUS } from './PaperBridge'

/**
 * Matted hero photo carousel — color photos inside the editorial tablet frame
 * (paper-rule border + paper-quiet bg + 3px corners + configurable inner padding).
 * Self-contained state: tracks active slide and auto-advances.
 *
 * Render nothing if `slides` is empty.
 */
export function HeroStrip({
  slides,
  height = 520,
  padding = 8,
  intervalMs = 4000,
}: {
  slides: string[]
  /** Outer frame height in px (default 520). Inner photo area = height - padding * 2. */
  height?: number
  /** Matte padding between border and photo (default 8). */
  padding?: number
  /** Auto-advance interval in ms (default 4000). Set to 0 to disable. */
  intervalMs?: number
}) {
  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => {
    if (slides.length < 2 || intervalMs <= 0) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), intervalMs)
    return () => clearInterval(t)
  }, [slides.length, intervalMs])

  if (slides.length === 0) return null

  return (
    <div
      className="w-full border border-[var(--paper-rule)] bg-[var(--paper-quiet)]"
      style={{ padding, borderRadius: TABLET_RADIUS }}
    >
      <div
        className="relative overflow-hidden w-full"
        style={{ height: height - padding * 2, borderRadius: 1 }}
      >
        {slides.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === slideIdx ? 1 : 0 }}
          >
            <Image src={src} alt="" fill className="object-cover object-top" unoptimized />
          </div>
        ))}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => setSlideIdx(i => (i - 1 + slides.length) % slides.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border border-white/30 bg-black/25 hover:bg-black/45 flex items-center justify-center text-white/95 transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSlideIdx(i => (i + 1) % slides.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border border-white/30 bg-black/25 hover:bg-black/45 flex items-center justify-center text-white/95 transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Photo ${i + 1}`}
                  className="h-1.5 rounded-full bg-white transition-all duration-500 ease-in-out"
                  style={{ width: i === slideIdx ? 24 : 8, opacity: i === slideIdx ? 0.95 : 0.55 }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
