'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

/**
 * Sticky-bar trigger for the AI chat. Mirrors `CmdKButton` styling —
 * hairline pill with Sparkles icon and "AI" label. Sits next to the
 * Cmd-K button on the right side of every editorial sticky toolbar.
 */
export function AIButton({ href = '/chat' }: { href?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(href)}
      aria-label="Ask SportsGPT"
      className="ml-auto inline-flex items-center justify-center gap-1.5 w-[70px] h-[30px] text-[12px] text-[var(--paper-muted)] border border-[var(--paper-rule)] bg-[var(--paper-quiet)] hover:text-[var(--paper-strong)] hover:shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-all shrink-0"
      style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', borderRadius: 3 }}
    >
      <Sparkles className="h-3 w-3" />
      <span>AI</span>
    </button>
  )
}
