import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The shared editorial sticky control bar — sits beneath the masthead/hero,
 * sticks to the top of the scroll container, blurred paper background with
 * paper-rule top/bottom borders. Wrap children (season selector, SearchInput,
 * count meta, etc.) and they'll lay out in a wrapping flex row.
 */
export function StickyControlBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className="sticky top-0 z-20 border-y border-[var(--paper-rule)]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--paper) 88%, transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className={cn('mx-auto max-w-6xl px-6 sm:px-10 md:px-14 py-3 flex items-center gap-x-6 gap-y-3 flex-wrap', className)}>
        {children}
      </div>
    </div>
  )
}
