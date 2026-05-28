'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const SANS: React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }

const TABS: { label: string; key: string }[] = [
  { label: 'All',          key: 'All' },
  { label: 'Division I',   key: 'Division I' },
  { label: 'Division II',  key: 'Division II' },
  { label: 'Division III', key: 'Division III' },
  { label: 'Division IV',  key: 'Division IV' },
]

// Views the deck cycles through (room for more slides later).
const VIEWS: { key: string; label: string }[] = [
  { key: 'launchpad', label: 'Launchpad' },
  { key: 'honeycomb', label: 'Honeycomb' },
]

export function LaunchpadTabs() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeTab    = searchParams.get('div') ?? 'All'

  const viewKey  = searchParams.get('view') === 'honeycomb' ? 'honeycomb' : 'launchpad'
  const viewIdx  = Math.max(0, VIEWS.findIndex(v => v.key === viewKey))

  function handleTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'All') params.delete('div')
    else params.set('div', tab)
    const qs = params.toString()
    router.push(`/launchpad${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  function cycleView(dir: 1 | -1) {
    const next = VIEWS[(viewIdx + dir + VIEWS.length) % VIEWS.length]
    const params = new URLSearchParams(searchParams.toString())
    if (next.key === 'launchpad') params.delete('view')
    else params.set('view', next.key)
    const qs = params.toString()
    router.push(`/launchpad${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--paper-rule)]">
      <div className="flex items-center overflow-x-auto no-scrollbar min-w-0">
        {TABS.map(({ label, key }) => {
          const on = activeTab === key
          return (
            <button
              key={key}
              onClick={() => handleTab(key)}
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
      </div>

      {/* View cycle — Launchpad ‹ › Honeycomb */}
      <div className="hidden sm:flex items-center gap-1.5 pr-1 shrink-0">
        <button
          onClick={() => cycleView(-1)}
          aria-label="Previous view"
          className="p-0.5 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span
          className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-strong)] min-w-[5.5rem] text-center"
          style={SANS}
        >
          {VIEWS[viewIdx].label}
        </span>
        <button
          onClick={() => cycleView(1)}
          aria-label="Next view"
          className="p-0.5 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
