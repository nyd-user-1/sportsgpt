'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export interface MultiSeries {
  key: string
  label: string
  color: string
}

interface Props {
  data: Record<string, string | number>[]
  series: MultiSeries[]
  stacked?: boolean
}

export function SportsBarChartMulti({ data, series, stacked }: Props) {
  const chartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  return (
    <Card>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
            <YAxis hide tickCount={25} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={`var(--color-${s.key})`}
                radius={0}
                stackId={stacked ? 'a' : undefined}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
