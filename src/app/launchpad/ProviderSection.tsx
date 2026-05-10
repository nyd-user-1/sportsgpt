'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LAUNCHPAD_TABS, LAUNCHPAD_ITEMS } from '@/lib/launchpad-data'

const CARD_GRADIENTS = [
  ['#fca5a5', '#dc2626'], ['#22d3ee', '#0e7490'], ['#4ade80', '#15803d'],
  ['#fde047', '#b45309'], ['#34d399', '#065f46'], ['#60a5fa', '#1d4ed8'],
  ['#2dd4bf', '#0f766e'], ['#c084fc', '#7e22ce'], ['#fb923c', '#c2410c'],
  ['#f472b6', '#be185d'],
]

const PROVIDERS = LAUNCHPAD_ITEMS
const PROVIDER_TABS = LAUNCHPAD_TABS

export function ProviderSection() {
  const [activeTab, setActiveTab] = useState(0)
  const currentProviders = PROVIDERS[PROVIDER_TABS[activeTab]] ?? []

  if (PROVIDER_TABS.length === 0) {
    return <p className="text-sm text-[var(--muted)] py-8 text-center">No items yet — populate src/lib/launchpad-data.ts.</p>
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--surface)] -mx-4 px-4 flex items-center gap-1 border-b border-[var(--border)] mb-4">
        {PROVIDER_TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              activeTab === i
                ? 'border-blue-500 text-[var(--txt)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
            )}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
        {currentProviders.map((p, i) => {
          const [light, dark] = CARD_GRADIENTS[i % CARD_GRADIENTS.length]
          return (
            <Link key={`${p.name}-${i}`}
              href={`/county/${p.county.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
              style={{ background: `linear-gradient(135deg, ${light}, ${dark})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
                <span className="text-xs font-bold text-white">{PROVIDER_TABS[activeTab].split(' ').map(w => w[0]).join('')}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                <p className="text-sm font-bold text-white leading-snug">{p.name}</p>
                <p className="text-[10px] text-white/70">{p.county}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
