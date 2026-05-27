'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const SANS = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

export type DivisionKey = 'All' | 'I' | 'II' | 'III' | 'IV'

const TABS: { key: DivisionKey; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'I',   label: 'Division I' },
  { key: 'II',  label: 'Division II' },
  { key: 'III', label: 'Division III' },
  { key: 'IV',  label: 'Division IV' },
]

/**
 * Launchpad-style underline tab bar for filtering by Section XI division.
 * Sits between a SectionHead (with `noRule`) and a Tablet. Optional
 * `rightSlot` renders on the far right of the tab row, inline with the tabs.
 */
export function DivisionTabs({
  active,
  onChange,
  rightSlot,
}: {
  active: DivisionKey
  onChange: (d: DivisionKey) => void
  rightSlot?: ReactNode
}) {
  return (
    <div className="mb-7 flex items-center border-b border-[var(--paper-rule)]">
      {TABS.map(({ key, label }) => {
        const on = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'px-4 py-3 text-[11px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors first:pl-0',
              on
                ? 'border-[var(--paper-strong)] text-[var(--paper-strong)]'
                : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-text)]',
            )}
            style={SANS}
          >
            {label}
          </button>
        )
      })}
      {rightSlot && <div className="ml-auto pr-1">{rightSlot}</div>}
    </div>
  )
}
