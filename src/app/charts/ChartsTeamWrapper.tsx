'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

export function ChartsTeamWrapper({ team }: { team: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const match     = pathname.match(/^\/charts\/([^/]+)\/team\/([^/]+)$/)
  const chartSlug = match ? match[1] : null
  const teamSlug  = match ? match[2] : null

  const title = teamSlug
    ? teamSlug.replace(/-varsity-football$/, '').split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')
    : ''

  const [prevSlug, setPrevSlug] = useState<string | null>(null)
  const [nextSlug, setNextSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!chartSlug || !teamSlug) { setPrevSlug(null); setNextSlug(null); return }
    const stored = sessionStorage.getItem(`chart-teams-${chartSlug}`)
    if (!stored) return
    const slugs: string[] = JSON.parse(stored)
    const idx = slugs.indexOf(teamSlug)
    setPrevSlug(idx > 0 ? slugs[idx - 1] : null)
    setNextSlug(idx < slugs.length - 1 ? slugs[idx + 1] : null)
  }, [chartSlug, teamSlug])

  return (
    <AppPanel
      open={!!teamSlug}
      onClose={() => router.push(`/charts/${chartSlug}`, { scroll: false })}
      title={title}
      detailHref={teamSlug ? `/team/${teamSlug}` : undefined}
      prevHref={chartSlug && prevSlug ? `/charts/${chartSlug}/team/${prevSlug}` : undefined}
      nextHref={chartSlug && nextSlug ? `/charts/${chartSlug}/team/${nextSlug}` : undefined}
      bodyClass="flex flex-col"
    >
      {team}
    </AppPanel>
  )
}
