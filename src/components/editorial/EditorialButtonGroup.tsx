'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TABLET_RADIUS } from './PaperBridge'

export type EditorialBtn = {
  icon: LucideIcon
  tooltip: string
  active?: boolean
  onClick: () => void
}

/**
 * Grouped pill of `‹ prev | …buttons… | next ›` with paper-palette styling,
 * hairline borders, and 3px corners. Italic-serif tooltips. Mirrors the shared
 * ButtonGroup pattern from the rest of the app but in the editorial voice.
 */
export function EditorialButtonGroup({
  prevHref,
  nextHref,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  buttons,
}: {
  prevHref: string
  nextHref: string
  prevLabel?: string
  nextLabel?: string
  buttons: EditorialBtn[]
}) {
  const cell =
    'inline-flex items-center justify-center h-9 w-9 border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors'
  const activeCell = 'text-[var(--paper-strong)] bg-[var(--paper-quiet)]'
  const tip =
    'absolute left-1/2 -translate-x-1/2 -top-9 px-2 py-1 rounded bg-[var(--paper-text)] text-[var(--paper)] text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  const tipStyle: CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }
  const leftRadius:  CSSProperties = { borderTopLeftRadius:  TABLET_RADIUS, borderBottomLeftRadius:  TABLET_RADIUS }
  const rightRadius: CSSProperties = { borderTopRightRadius: TABLET_RADIUS, borderBottomRightRadius: TABLET_RADIUS }

  return (
    <div className="hidden sm:flex items-center shrink-0">
      <div className="inline-flex -space-x-px">
        <div className="relative group">
          <Link href={prevHref} className={cell} style={leftRadius}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className={tip} style={tipStyle}>{prevLabel}</span>
        </div>
        {buttons.map((b, i) => {
          const Icon = b.icon
          return (
            <div key={i} className="relative group">
              <button onClick={b.onClick} className={cn(cell, b.active && activeCell)} aria-label={b.tooltip}>
                <Icon className="h-4 w-4" />
              </button>
              <span className={tip} style={tipStyle}>{b.tooltip}</span>
            </div>
          )
        })}
        <div className="relative group">
          <Link href={nextHref} className={cell} style={rightRadius}>
            <ChevronRight className="h-4 w-4" />
          </Link>
          <span className={tip} style={tipStyle}>{nextLabel}</span>
        </div>
      </div>
    </div>
  )
}
