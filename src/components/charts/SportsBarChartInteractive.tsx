'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts'
import { Chart } from '@/components/Chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'
import { ChartTooltipTeam } from './ChartTooltip'

export interface SeasonBars {
  season: string        // '2022', '2023', '2024'
  topValue: number      // KPI shown in the toggle button (top player's value or total)
  bars: { name: string; value: number; logoUrl?: string; record?: string }[]
}

interface TooltipPayloadEntry {
  color?: string
  value?: number
  payload?: { name: string; value: number; logoUrl?: string; record?: string }
}

function CustomTooltip({ active, payload, valueLabel }: { active?: boolean; payload?: TooltipPayloadEntry[]; valueLabel: string }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const item = entry.payload
  if (!item) return null
  return (
    <ChartTooltipTeam
      name={item.name}
      logoUrl={item.logoUrl}
      color={entry.color ?? '#033882'}
      label={valueLabel}
      value={entry.value ?? 0}
      record={item.record}
    />
  )
}

interface Props {
  seasons: SeasonBars[]
  color: string
  valueLabel: string
  negativeColor?: string
  showAvgLine?: boolean
}

export function SportsBarChartInteractive({ seasons, color, valueLabel, negativeColor, showAvgLine }: Props) {
  const defaultSeason = seasons[seasons.length - 1]?.season ?? ''
  const [active, setActive] = React.useState(defaultSeason)

  React.useEffect(() => {
    const handle = (e: Event) => {
      const yr = (e as CustomEvent<string>).detail
      if (seasons.some(s => s.season === yr)) setActive(yr)
    }
    window.addEventListener(SEASON_CHANGE_EVENT, handle)
    return () => window.removeEventListener(SEASON_CHANGE_EVENT, handle)
  }, [seasons])

  const activeBars = seasons.find(s => s.season === active)?.bars ?? []

  const avgValue = showAvgLine && activeBars.length
    ? Math.round(activeBars.reduce((s, b) => s + b.value, 0) / activeBars.length)
    : null

  return (
    <Chart>
      <BarChart
        accessibilityLayer
        data={activeBars}
        margin={{ left: 0, right: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
        <YAxis hide tickCount={25} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          content={({ active, payload }) => (
            <CustomTooltip active={active} payload={payload as unknown as TooltipPayloadEntry[]} valueLabel={valueLabel} />
          )}
        />
        {avgValue !== null && (
          <ReferenceLine
            y={avgValue}
            stroke="#94a3b8"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: `Avg ${avgValue}%`, position: 'insideTopRight', fontSize: 10, fill: '#94a3b8', dy: -4 }}
          />
        )}
        <Bar dataKey="value" fill={color} radius={0}>
          {negativeColor && activeBars.map((b, i) => (
            <Cell key={i} fill={b.value >= 0 ? color : negativeColor} />
          ))}
        </Bar>
      </BarChart>
    </Chart>
  )
}
