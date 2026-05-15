'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

export interface DynastyBar {
  name: string
  logoUrl?: string
  yr1: number;  yr1Label: string
  yr2: number;  yr2Label: string
  yr3: number;  yr3Label: string
  totalGames: number
}

export interface DynastyWindow {
  filterYear: string
  bars: DynastyBar[]
}

const COLORS = {
  yr1: '#93c5fd', // light blue — oldest year
  yr2: '#1d4ed8', // bright blue — middle year
  yr3: '#033882', // dark navy  — newest year
}

interface TooltipPayload {
  dataKey?: string
  value?: number
  payload?: DynastyBar
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const bar = payload[0]?.payload
  if (!bar) return null
  const total = bar.yr1 + bar.yr2 + bar.yr3
  const winPct = bar.totalGames > 0 ? ((total / bar.totalGames) * 100).toFixed(1) : '—'

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
      padding: '8px 12px', fontSize: '12px', minWidth: '160px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
        {bar.logoUrl && (
          <img src={bar.logoUrl} alt="" width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        )}
        <span>{bar.name}</span>
      </div>
      {[
        { label: bar.yr3Label, value: bar.yr3, color: COLORS.yr3 },
        { label: bar.yr2Label, value: bar.yr2, color: COLORS.yr2 },
        { label: bar.yr1Label, value: bar.yr1, color: COLORS.yr1 },
      ].map(row => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{
            display: 'inline-block', width: '10px', height: '10px',
            borderRadius: '2px', backgroundColor: row.color, flexShrink: 0,
          }} />
          <span style={{ color: '#6b7280' }}>{row.label}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600, paddingLeft: '8px' }}>{row.value}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '6px', paddingTop: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#6b7280' }}>Total</span>
          <span style={{ fontWeight: 600 }}>{total}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ color: '#6b7280' }}>3yr Win %</span>
          <span style={{ fontWeight: 600 }}>{winPct}%</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  windows: DynastyWindow[]
}

export function SportsBarChartDynasty({ windows }: Props) {
  const defaultFilter = windows[windows.length - 1]?.filterYear ?? ''
  const [active, setActive] = React.useState(defaultFilter)

  React.useEffect(() => {
    const handle = (e: Event) => {
      const yr = (e as CustomEvent<string>).detail
      if (windows.some(w => w.filterYear === yr)) setActive(yr)
    }
    window.addEventListener(SEASON_CHANGE_EVENT, handle)
    return () => window.removeEventListener(SEASON_CHANGE_EVENT, handle)
  }, [windows])

  const activeWindow = windows.find(w => w.filterYear === active)
  const bars = activeWindow?.bars ?? []
  const yr1Label = bars[0]?.yr1Label ?? ''
  const yr2Label = bars[0]?.yr2Label ?? ''
  const yr3Label = bars[0]?.yr3Label ?? ''

  const chartConfig = {
    yr1: { label: yr1Label, color: COLORS.yr1 },
    yr2: { label: yr2Label, color: COLORS.yr2 },
    yr3: { label: yr3Label, color: COLORS.yr3 },
  } satisfies ChartConfig

  return (
    <Card>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={bars} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
            <YAxis hide domain={[0, 36]} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => (
                <CustomTooltip active={active} payload={payload as unknown as TooltipPayload[]} />
              )}
            />
            <Bar dataKey="yr1" fill="var(--color-yr1)" stackId="a" radius={0} />
            <Bar dataKey="yr2" fill="var(--color-yr2)" stackId="a" radius={0} />
            <Bar dataKey="yr3" fill="var(--color-yr3)" stackId="a" radius={0} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
