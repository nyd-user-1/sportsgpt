'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

export function ChartsPlayerWrapper({ player }: { player: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  // Match /charts/[chartSlug]/[playerSlug] (two segments after /charts/)
  const match      = pathname.match(/^\/charts\/([^/]+)\/([^/]+)$/)
  const chartSlug  = match ? match[1] : null
  const playerSlug = match ? match[2] : null

  const title = playerSlug
    ? playerSlug.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')
    : ''

  return (
    <AppPanel
      open={!!playerSlug}
      onClose={() => router.push(`/charts/${chartSlug}`, { scroll: false })}
      title={title}
      detailHref={playerSlug ? `/player/${playerSlug}` : undefined}
      bodyClass="flex flex-col"
    >
      {player}
    </AppPanel>
  )
}
