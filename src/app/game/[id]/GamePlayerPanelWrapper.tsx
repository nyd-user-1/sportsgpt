'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function GamePlayerPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const match    = pathname.match(/^(\/game\/[^/]+)\/player\/(.+)$/)
  const gameBase = match ? match[1] : null
  const playerSlug = match ? match[2] : null

  return (
    <AppPanel
      open={!!playerSlug}
      onClose={() => gameBase && router.push(gameBase, { scroll: false })}
      title={playerSlug ? slugToName(playerSlug) : ''}
    >
      {panel}
    </AppPanel>
  )
}
