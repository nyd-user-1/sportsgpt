'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

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
      background: 'var(--surface)',
      border: '1px solid var(--border)',
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
        <span style={{ color: 'var(--muted)' }}>{valueLabel}</span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, paddingLeft: '8px' }}>
          {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </span>
      </div>
      {item.record && (
        <div style={{ color: 'var(--muted)', marginTop: '4px', fontSize: '11px' }}>{item.record}</div>
      )}
    </div>
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
            <Bar dataKey="value" fill="var(--color-value)" radius={0}>
              {negativeColor && activeBars.map((b, i) => (
                <Cell key={i} fill={b.value >= 0 ? color : negativeColor} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
