'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const SANS: React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }

const TABS: { label: string; key: string }[] = [
  { label: 'All',          key: 'All' },
  { label: 'Division I',   key: 'Division I' },
  { label: 'Division II',  key: 'Division II' },
  { label: 'Division III', key: 'Division III' },
  { label: 'Division IV',  key: 'Division IV' },
]

export function LaunchpadTabs() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const activeTab    = searchParams.get('div') ?? 'All'

  function handleTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'All') params.delete('div')
    else params.set('div', tab)
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
      <span
        className="hidden sm:inline pr-1 text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
        style={SANS}
      >
        Launchpad
      </span>
    </div>
  )
}
