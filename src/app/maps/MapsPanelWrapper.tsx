'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'

export function MapsPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const match    = pathname.match(/^\/maps\/(.+)$/)
  const slug     = match ? match[1] : null

  const title = slug
    ? slug.replace(/-varsity-football$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : ''

  return (
    <AppPanel
      open={!!slug}
      onClose={() => router.push('/maps', { scroll: false })}
      title={title}
      defaultExpanded
    >
      {panel}
    </AppPanel>
  )
}
