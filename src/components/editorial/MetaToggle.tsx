'use client'

import { ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Expand / collapse toggle styled as editorial meta. Sits in a SectionHead's
 * meta slot, mirrors the "Show all 14 teams / Show fewer" pattern from the
 * division Shell.
 */
export function MetaToggle({
  label,
  expanded,
  onClick,
}: {
  label: string
  expanded: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:underline underline-offset-4 tabular-nums"
    >
      {label}
      {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
    </button>
  )
}
