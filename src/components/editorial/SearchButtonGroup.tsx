'use client'

import type { CSSProperties } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TABLET_RADIUS } from './PaperBridge'

/**
 * `[ ✨ AI │ ⌘ K ]` — joined two-cell pill matching the EditorialButtonGroup
 * pattern (hairline shared border, paper-rule frame, hover bg = paper-quiet,
 * 3px corners on the outer edges only). Left cell opens /chat; right cell
 * opens the command palette via the `?cmd=open` URL trick.
 */
export function SearchButtonGroup({ chatHref = '/chat' }: { chatHref?: string }) {
  const router   = useRouter()
  const pathname = usePathname()

  function openCmdK() {
    const p = new URLSearchParams(window.location.search)
    p.set('cmd', 'open')
    router.push(`${pathname}?${p}`, { scroll: false })
  }

  const cell =
    'inline-flex items-center justify-center h-9 w-[70px] border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors'
  const sans:  CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif', fontSize: 12 }
  const mono:  CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: 12 }
  const leftR:  CSSProperties = { borderTopLeftRadius:  TABLET_RADIUS, borderBottomLeftRadius:  TABLET_RADIUS }
  const rightR: CSSProperties = { borderTopRightRadius: TABLET_RADIUS, borderBottomRightRadius: TABLET_RADIUS }

  return (
    <div className="ml-auto inline-flex -space-x-px shrink-0">
      <button
        onClick={() => router.push(chatHref)}
        aria-label="Ask SportsGPT"
        className={cn(cell, 'gap-1.5')}
        style={{ ...sans, ...leftR }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI</span>
      </button>
      <button
        onClick={openCmdK}
        aria-label="Open command palette"
        className={cn(cell, 'gap-2')}
        style={{ ...mono, ...rightR }}
      >
        <span>⌘</span>
        <span>K</span>
      </button>
    </div>
  )
}
