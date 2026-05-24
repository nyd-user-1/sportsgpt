import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TABLET_RADIUS } from './PaperBridge'

/** Inline style for any mono-font run (formulas, numerics, rank tokens, kbd). */
export const MONO: CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

/**
 * Bordered tablet — paper-rule border + paper-quiet fill + 3px corners.
 * Used to wrap any data surface (standings, roster, formula).
 */
export function Tablet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('border border-[var(--paper-rule)] bg-[var(--paper-quiet)] overflow-hidden', className)}
      style={{ borderRadius: TABLET_RADIUS }}
    >
      {children}
    </div>
  )
}

/** Empty-state variant of Tablet — same frame, italic serif message inside. */
export function EmptyTablet({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div
      className={cn('border border-[var(--paper-rule)] bg-[var(--paper-quiet)] px-6 py-10 text-center', className)}
      style={{ borderRadius: TABLET_RADIUS }}
    >
      <p
        className="text-sm text-[var(--paper-muted)]"
        style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
      >
        {label}
      </p>
    </div>
  )
}

/** Header-cell styling for tablet tables. Use as `className={tabletTh('text-right w-14')}`. */
export function tabletTh(extra = '') {
  return cn(
    'px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] whitespace-nowrap',
    extra
  )
}

/** Body-cell base class for tablet tables. */
export const tabletTd = 'px-3 py-3 text-[14px] align-middle'
