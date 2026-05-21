'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

export function LaunchpadPlayerWrapper({ player }: { player: React.ReactNode }) {
  const pathname     = usePathname()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const match      = pathname.match(/^\/player\/(.+)$/)
  const playerSlug = match ? match[1] : null

  const name  = searchParams.get('name')
  const title = name || (playerSlug ? 'Player' : '')

  return (
    <AppPanel
      open={!!playerSlug}
      onClose={() => router.back()}
      title={title}
      detailHref={playerSlug ? `/player/${playerSlug}` : undefined}
      bodyClass="flex flex-col"
    >
      {player}
    </AppPanel>
  )
}
