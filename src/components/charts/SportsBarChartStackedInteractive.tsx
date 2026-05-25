'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartTooltipShell, ChartTooltipName, ChartTooltipRow } from './ChartTooltip'
import { Chart } from '@/components/Chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

export interface StackedSeasonBars {
  season: string
  bars: { name: string; wins: number; losses: number; logoUrl?: string }[]
}

interface Props {
  seasons: StackedSeasonBars[]
  color: string
}

interface TooltipPayloadEntry {
  color?: string
  value?: number
  name?: string
  dataKey?: string
  payload?: { name: string; wins: number; losses: number; logoUrl?: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <ChartTooltipShell>
      <ChartTooltipName name={item.name} logoUrl={item.logoUrl} />
      {[...payload].reverse().map((entry) => (
        <ChartTooltipRow
          key={entry.dataKey}
          color={entry.color ?? '#033882'}
          label={String(entry.name ?? '').replace(/^./, c => c.toUpperCase())}
          value={entry.value ?? 0}
        />
      ))}
    </ChartTooltipShell>
  )
}

export function SportsBarChartStackedInteractive({ seasons, color }: Props) {
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

  return (
    <Chart>
      <BarChart data={activeBars} margin={{ left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
        <YAxis hide />
        <Tooltip
          cursor={false}
          content={({ active, payload }) => (
            <CustomTooltip active={active} payload={payload as unknown as TooltipPayloadEntry[]} />
          )}
        />
        <Bar dataKey="losses" fill="#ef4444" stackId="a" radius={0} />
        <Bar dataKey="wins"   fill={color}    stackId="a" radius={0} />
      </BarChart>
    </Chart>
  )
}
