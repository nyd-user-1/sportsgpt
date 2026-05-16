'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { MiniBarChart } from '@/components/MiniCharts'
import { PanelChart } from '@/components/PanelChart'
import { CHART_CONFIGS } from '@/lib/chart-configs'

// Thumbnail bar shapes only — proportional to real 2025-26 top values
const PREVIEW: Record<string, number[]> = {
  'season-records':          [11, 10, 9, 8, 7, 7, 6, 5, 4, 3, 2, 1, 0],
  'wins-by-school':          [28, 25, 24, 22, 20, 18, 16, 14, 12, 10, 8],
  'point-differential-leaders': [280, 240, 210, 185, 160, 135, 110, 85, 60, 35],
  'passing-yards-leaders':   [3337, 3102, 2885, 2663, 2556, 2540, 2380, 2367, 2362, 2277],
  'passing-tds-leaders':     [44, 43, 37, 34, 34, 34, 32, 29, 29, 29],
  'rushing-yards-leaders':   [1800, 1620, 1450, 1290, 1140, 1000, 870, 750, 640, 540],
  'rushing-tds-leaders':     [26, 23, 21, 18, 16, 14, 13, 11, 10, 9],
  'receiving-yards-leaders': [980, 860, 750, 650, 560, 480, 410, 350, 295, 245],
  'receiving-tds-leaders':   [14, 12, 11, 10, 9, 8, 7, 6, 5, 4],
  'total-tds-leaders':       [28, 25, 22, 19, 17, 15, 13, 12, 10, 9],
  'total-yards-leaders':     [3800, 3400, 3050, 2750, 2500, 2250, 2000, 1780, 1580, 1400],
  'total-points-leaders':    [168, 150, 132, 114, 102, 90, 78, 72, 66, 54],
}

export default function ChartsPage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  function openChart(slug: string) {
    setActiveSlug(slug)
    setPanelOpen(true)
  }

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CHART_CONFIGS.map(chart => {
            const data = PREVIEW[chart.slug] ?? [50, 60, 70, 80, 75, 65, 55]
            const isActive = chart.slug === activeSlug && panelOpen
            return (
              <button
                key={chart.slug}
                onClick={() => openChart(chart.slug)}
                className={`group flex flex-col rounded-xl border bg-[var(--surface)] overflow-hidden transition-all text-left ${
                  isActive
                    ? 'border-[#033882] shadow-md ring-1 ring-[#033882]/20'
                    : 'border-[var(--border)] hover:border-transparent hover:shadow-md'
                }`}
              >
                <div className="flex-1 min-h-0 h-28 sm:h-32">
                  <MiniBarChart color={chart.color} data={data} />
                </div>
                <div className="shrink-0 px-4 pt-2 pb-3">
                  <p className={`text-[13px] font-bold leading-snug transition-colors ${isActive ? 'text-[#033882]' : 'text-[var(--txt)] group-hover:text-sky-500'}`}>
                    {chart.title}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{chart.description}</p>
                  {isActive && <p className="text-[10px] font-semibold mt-1" style={{ color: '#033882' }}>Viewing →</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <PanelChart open={panelOpen} onClose={() => setPanelOpen(false)} activeSlug={activeSlug} />
    </AppLayout>
  )
}
