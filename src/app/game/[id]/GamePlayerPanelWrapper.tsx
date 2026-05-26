'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

const SANS = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function GamePlayerPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const match    = pathname.match(/^(\/game\/[^/]+)\/player\/(.+)$/)
  const gameBase   = match ? match[1] : null
  const playerSlug = match ? match[2] : null

  const footer = playerSlug ? (
    <div className="px-5 py-3.5 bg-[var(--paper)]">
      <span
        className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
        style={SANS}
      >
        Player Game Log
      </span>
    </div>
  ) : undefined

  return (
    <AppPanel
      open={!!playerSlug}
      onClose={() => gameBase && router.push(gameBase, { scroll: false })}
      title={playerSlug ? slugToName(playerSlug) : ''}
      detailHref={playerSlug ? `/player/${playerSlug}` : undefined}
      footer={footer}
    >
      {panel}
    </AppPanel>
  )
}
