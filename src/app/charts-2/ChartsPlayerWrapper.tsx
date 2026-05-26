'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

export function ChartsPlayerWrapper({ player }: { player: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const match      = pathname.match(/^\/charts-2\/([^/]+)\/([^/]+)$/)
  const chartSlug  = match ? match[1] : null
  const playerSlug = match ? match[2] : null

  const title = playerSlug
    ? playerSlug.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')
    : ''

  const [prevSlug, setPrevSlug] = useState<string | null>(null)
  const [nextSlug, setNextSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!chartSlug || !playerSlug) { setPrevSlug(null); setNextSlug(null); return }
    const stored = sessionStorage.getItem(`chart-players-${chartSlug}`)
    if (!stored) return
    const slugs: string[] = JSON.parse(stored)
    const idx = slugs.indexOf(playerSlug)
    setPrevSlug(idx > 0 ? slugs[idx - 1] : null)
    setNextSlug(idx < slugs.length - 1 ? slugs[idx + 1] : null)
  }, [chartSlug, playerSlug])

  return (
    <AppPanel
      open={!!playerSlug}
      onClose={() => router.push(`/charts-2/${chartSlug}`, { scroll: false })}
      title={title}
      detailHref={playerSlug ? `/player/${playerSlug}` : undefined}
      prevHref={chartSlug && prevSlug ? `/charts-2/${chartSlug}/${prevSlug}` : undefined}
      nextHref={chartSlug && nextSlug ? `/charts-2/${chartSlug}/${nextSlug}` : undefined}
      bodyClass="flex flex-col"
    >
      {player}
    </AppPanel>
  )
}
