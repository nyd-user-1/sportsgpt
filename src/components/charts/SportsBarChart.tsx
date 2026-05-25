'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { Chart } from '@/components/Chart'
import { ChartTooltipTeam } from './ChartTooltip'

interface DataItem {
  name: string
  value: number
  logoUrl?: string
}

interface TooltipPayloadEntry {
  color?: string
  value?: number
  payload?: DataItem
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
    />
  )
}

interface Props {
  data: DataItem[]
  color: string
  valueLabel: string
}

export function SportsBarChart({ data, color, valueLabel }: Props) {
  return (
    <Chart>
      <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
        <YAxis hide tickCount={25} />
        <Tooltip
          cursor={false}
          content={({ active, payload }) => (
            <CustomTooltip active={active} payload={payload as unknown as TooltipPayloadEntry[]} valueLabel={valueLabel} />
          )}
        />
        <Bar dataKey="value" fill={color} radius={0} />
      </BarChart>
    </Chart>
  )
}
