'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'
import { GameDetailFooter } from '@/components/PanelGame'

export function LaunchpadGameWrapper({ game }: { game: React.ReactNode }) {
  const pathname     = usePathname()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const match  = pathname.match(/^\/game\/(\d+)$/)
  const gameId = match ? match[1] : null

  const h = searchParams.get('h') // home team name
  const v = searchParams.get('v') // away team name
  const title = v && h ? `${v} at ${h}` : gameId ? 'Game Detail' : ''

  return (
    <AppPanel
      open={!!gameId}
      onClose={() => router.back()}
      title={title}
      detailHref={gameId ? `/game/${gameId}` : undefined}
      bodyClass="flex flex-col"
      footer={gameId ? <GameDetailFooter /> : undefined}
    >
      {game}
    </AppPanel>
  )
}
