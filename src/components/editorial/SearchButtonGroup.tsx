'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TABLET_RADIUS } from './PaperBridge'

const BLOB = 'https://tmdolblsg0vd3laa.public.blob.vercel-storage.com/gallery/logos/ai'

const MODELS = [
  { key: 'anthropic', label: 'Anthropic', logo: `${BLOB}/anthropic-icon.webp` },
  { key: 'openai',    label: 'OpenAI',    logo: `${BLOB}/openai-logo.avif`    },
  { key: 'gemini',    label: 'Google',    logo: `${BLOB}/gemini-icon-bw.webp` },
] as const

/**
 * Five-cell joined pill matching EditorialButtonGroup. First cell is the
 * Lucide search icon — opens the command palette via `?cmd=open`. Cells
 * 2-5 are model-provider logos (Anthropic, OpenAI, Google, Grok) rendered
 * as placeholders — no click handlers wired yet.
 */
export function SearchButtonGroup() {
  const router   = useRouter()
  const pathname = usePathname()

  function openCmdK() {
    const p = new URLSearchParams(window.location.search)
    p.set('cmd', 'open')
    router.push(`${pathname}?${p}`, { scroll: false })
  }

  const cell =
    'inline-flex items-center justify-center h-9 w-9 border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors'
  const leftR:  CSSProperties = { borderTopLeftRadius:  TABLET_RADIUS, borderBottomLeftRadius:  TABLET_RADIUS }
  const rightR: CSSProperties = { borderTopRightRadius: TABLET_RADIUS, borderBottomRightRadius: TABLET_RADIUS }

  return (
    <div className="ml-auto inline-flex -space-x-px shrink-0">
      <button
        onClick={openCmdK}
        aria-label="Open command palette"
        className={cn(cell)}
        style={leftR}
      >
        <Search className="h-4 w-4" />
      </button>
      {MODELS.map((m, i) => {
        const isLast = i === MODELS.length - 1
        return (
          <button
            key={m.key}
            type="button"
            aria-label={m.label}
            className={cell}
            style={isLast ? rightR : undefined}
          >
            <Image
              src={m.logo}
              alt=""
              width={16}
              height={16}
              className="object-contain opacity-70 dark:invert"
              unoptimized
            />
          </button>
        )
      })}
    </div>
  )
}
