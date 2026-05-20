'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'
import { getChartConfig } from '@/lib/chart-configs'

export function ChartsPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  // Match /charts/[slug] or /charts/[slug]/[playerSlug]
  const match       = pathname.match(/^\/charts\/([^/]+)(?:\/(.+))?$/)
  const chartSlug   = match ? match[1] : null
  const hasSecondary = !!(match?.[2])  // player or team open → collapse chart to 1/3
  const config      = chartSlug ? getChartConfig(chartSlug) : null

  return (
    <AppPanel
      open={!!chartSlug}
      onClose={() => router.push('/charts', { scroll: false })}
      title={config?.title ?? ''}
      defaultExpanded={!hasSecondary}
      bodyClass="flex flex-col"
      detailHref={chartSlug ? `/chart/${chartSlug}` : undefined}
    >
      {panel}
    </AppPanel>
  )
}
