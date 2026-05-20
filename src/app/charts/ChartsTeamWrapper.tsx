'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

export function ChartsTeamWrapper({ team }: { team: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  // Match /charts/[chartSlug]/team/[teamSlug]
  const match      = pathname.match(/^\/charts\/([^/]+)\/team\/([^/]+)$/)
  const chartSlug  = match ? match[1] : null
  const teamSlug   = match ? match[2] : null

  const title = teamSlug
    ? teamSlug.replace(/-varsity-football$/, '').split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')
    : ''

  return (
    <AppPanel
      open={!!teamSlug}
      onClose={() => router.push(`/charts/${chartSlug}`, { scroll: false })}
      title={title}
      detailHref={teamSlug ? `/team/${teamSlug}` : undefined}
      bodyClass="flex flex-col"
    >
      {team}
    </AppPanel>
  )
}
