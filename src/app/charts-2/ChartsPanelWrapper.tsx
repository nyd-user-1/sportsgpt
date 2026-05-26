'use client'

import { useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'
import { CHART_SLUGS_AZ, getChartConfig } from '@/lib/chart-configs'

const CHART_SLUGS = CHART_SLUGS_AZ

function getColCount(): number {
  const grid = document.querySelector('[data-charts-grid]')
  if (!grid) return 1
  return getComputedStyle(grid).gridTemplateColumns.split(' ').length
}

export function ChartsPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const match        = pathname.match(/^\/charts-2\/([^/]+)(?:\/(.+))?$/)
  const chartSlug    = match ? match[1] : null
  const hasSecondary = !!(match?.[2])
  const config       = chartSlug ? getChartConfig(chartSlug) : null

  const idx      = chartSlug ? CHART_SLUGS.indexOf(chartSlug) : -1
  const prevSlug = idx > 0                      ? CHART_SLUGS[idx - 1] : CHART_SLUGS[CHART_SLUGS.length - 1]
  const nextSlug = idx < CHART_SLUGS.length - 1 ? CHART_SLUGS[idx + 1] : CHART_SLUGS[0]

  const navigate = useCallback((targetIdx: number) => {
    const clamped = (targetIdx + CHART_SLUGS.length) % CHART_SLUGS.length
    router.push(`/charts-2/${CHART_SLUGS[clamped]}`, { scroll: false })
  }, [router])

  useEffect(() => {
    if (idx < 0) return
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight') { e.preventDefault(); navigate(idx + 1) }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); navigate(idx - 1) }
      if (e.key === 'ArrowDown')  { e.preventDefault(); navigate(idx + getColCount()) }
      if (e.key === 'ArrowUp')    { e.preventDefault(); navigate(idx - getColCount()) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, navigate])

  return (
    <AppPanel
      open={!!chartSlug}
      onClose={() => router.push('/charts-2', { scroll: false })}
      title={config?.title ?? ''}
      defaultExpanded={!hasSecondary}
      bodyClass="flex flex-col"
      detailHref={chartSlug ? `/chart/${chartSlug}` : undefined}
      prevHref={chartSlug ? `/charts-2/${prevSlug}` : undefined}
      nextHref={chartSlug ? `/charts-2/${nextSlug}` : undefined}
    >
      {panel}
    </AppPanel>
  )
}
