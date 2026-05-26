'use client'

import { useRouter, usePathname } from 'next/navigation'

/**
 * Sticky-bar trigger for the global command palette (Cmd+K).
 * Hairline pill with `Search` label and ⌘ K kbd.
 * Replaces the right-side counter chip in every sticky search toolbar.
 */
export function CmdKButton({ label = 'Search' }: { label?: string }) {
  const router   = useRouter()
  const pathname = usePathname()

  function open() {
    const p = new URLSearchParams(window.location.search)
    p.set('cmd', 'open')
    router.push(`${pathname}?${p}`, { scroll: false })
  }

  return (
    <button
      onClick={open}
      aria-label={label}
      className="-ml-[9px] inline-flex items-center justify-center gap-2 w-[70px] h-[30px] text-[12px] text-[var(--paper-muted)] border border-[var(--paper-rule)] bg-[var(--paper-quiet)] hover:text-[var(--paper-strong)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-all shrink-0"
      style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', borderRadius: 3 }}
    >
      <span>⌘</span>
      <span>K</span>
    </button>
  )
}
