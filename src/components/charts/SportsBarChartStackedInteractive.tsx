'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartTooltipShell } from './ChartTooltip'
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

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item) return null
  return (
    <ChartTooltipShell>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600, color: 'var(--paper-text)' }}>
        {item.logoUrl && (
          <img src={item.logoUrl} alt="" width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <span>{item.name}</span>
      </div>
      {[...payload].reverse().map((entry) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{
            display: 'inline-block', width: '10px', height: '10px',
            borderRadius: '2px', backgroundColor: entry.color ?? '#033882', flexShrink: 0,
          }} />
          <span style={{ color: 'var(--paper-muted)', textTransform: 'capitalize' }}>{entry.name}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600, paddingLeft: '8px', color: 'var(--paper-text)' }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
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
