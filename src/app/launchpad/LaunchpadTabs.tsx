'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = ['All', 'Division I', 'Division II', 'Division III', 'Division IV', 'Division V']

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
    <div className="flex items-center gap-0 border-b border-[var(--border)]">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => handleTab(tab)}
          className={cn(
            'px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
            activeTab === tab
              ? 'border-[#033882] text-[var(--txt)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
