'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartTooltipShell } from './ChartTooltip'
import { Chart } from '@/components/Chart'
import { type ChartConfig } from '@/components/ui/chart'
import { type SeasonBars } from './SportsBarChartInteractive'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

const ACCENT = '#033882'
const MEDIAN_COLOR = '#94a3b8'

interface TooltipPayload {
  color?: string
  value?: number
  dataKey?: string
  payload?: { name: string; points: number; median: number; logoUrl?: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <ChartTooltipShell minWidth={160}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {item.logoUrl && (
          <img src={item.logoUrl} alt="" width={20} height={20} style={{ objectFit: 'contain', flexShrink: 0 }} />
        )}
        <span style={{ fontWeight: 700, color: 'var(--paper-text)' }}>{item.name}</span>
      </div>
      <p style={{ color: ACCENT }}><span style={{ fontWeight: 600 }}>{item.points}</span> pts</p>
      <p style={{ color: MEDIAN_COLOR }}>Median: {item.median}</p>
    </ChartTooltipShell>
  )
}

interface Props {
  seasons: SeasonBars[]
  valueLabel?: string
}

function calcMedian(vals: number[]): number {
  if (!vals.length) return 0
  const sorted = [...vals].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
}

export function SportsAreaGradient({ seasons, valueLabel = 'Points' }: Props) {
  const [activeSeason, setActiveSeason] = React.useState(seasons[0]?.season ?? '')

  React.useEffect(() => {
    function handler(e: Event) {
      const season = (e as CustomEvent<string>).detail
      if (seasons.find(s => s.season === season)) setActiveSeason(season)
    }
    window.addEventListener(SEASON_CHANGE_EVENT, handler)
    return () => window.removeEventListener(SEASON_CHANGE_EVENT, handler)
  }, [seasons])

  const current = seasons.find(s => s.season === activeSeason) ?? seasons[0]
  const bars = current?.bars ?? []
  const medianVal = calcMedian(bars.map(b => b.value))

  const chartData = bars.map((b, i) => ({
    rank: i + 1,
    name: b.name,
    points: b.value,
    median: medianVal,
    logoUrl: b.logoUrl,
  }))

  const chartConfig: ChartConfig = {
    points: { label: valueLabel, color: ACCENT },
    median: { label: 'Median', color: MEDIAN_COLOR },
  }

  return (
    <Chart config={chartConfig}>
      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ACCENT}       stopOpacity={0.8} />
                <stop offset="95%" stopColor={ACCENT}       stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillMedian" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={MEDIAN_COLOR} stopOpacity={0.35} />
                <stop offset="95%" stopColor={MEDIAN_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="rank" tickLine={false} axisLine={false} tick={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              dataKey="median"
              type="monotone"
              fill="url(#fillMedian)"
              stroke={MEDIAN_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={false}
            />
            <Area
              dataKey="points"
              type="natural"
              fill="url(#fillPoints)"
              stroke={ACCENT}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: ACCENT }}
            />
      </AreaChart>
    </Chart>
  )
}
