'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'
import { getChartConfig } from '@/lib/chart-configs'

export function ChartsPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const match    = pathname.match(/^\/charts\/(.+)$/)
  const slug     = match ? match[1] : null
  const config   = slug ? getChartConfig(slug) : null

  return (
    <AppPanel
      open={!!slug}
      onClose={() => router.push('/charts', { scroll: false })}
      title={config?.title ?? ''}
      defaultExpanded
      bodyClass="flex flex-col"
    >
      {panel}
    </AppPanel>
  )
}
