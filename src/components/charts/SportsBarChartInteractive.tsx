'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

export interface SeasonBars {
  season: string        // '2022', '2023', '2024'
  topValue: number      // KPI shown in the toggle button (top player's value or total)
  bars: { name: string; value: number; logoUrl?: string }[]
}

interface TooltipPayloadEntry {
  color?: string
  value?: number
  payload?: { name: string; value: number; logoUrl?: string }
}

function CustomTooltip({
  active,
  payload,
  valueLabel,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  valueLabel: string
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const item = entry.payload
  if (!item) return null
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '12px',
      minWidth: '140px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
        {item.logoUrl && (
          <img src={item.logoUrl} alt="" width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <span>{item.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          display: 'inline-block', width: '10px', height: '10px',
          borderRadius: '2px', backgroundColor: entry.color ?? '#033882', flexShrink: 0,
        }} />
        <span style={{ color: '#6b7280' }}>{valueLabel}</span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, paddingLeft: '8px' }}>
          {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </span>
      </div>
    </div>
  )
}

interface Props {
  seasons: SeasonBars[]
  color: string
  valueLabel: string
}

export function SportsBarChartInteractive({ seasons, color, valueLabel }: Props) {
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

  const chartConfig = {
    value: { label: valueLabel, color },
  } satisfies ChartConfig

  return (
    <Card>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={activeBars}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
            <YAxis hide tickCount={25} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => (
                <CustomTooltip active={active} payload={payload as unknown as TooltipPayloadEntry[]} valueLabel={valueLabel} />
              )}
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={0} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
