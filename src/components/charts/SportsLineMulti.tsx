'use client'

import * as React from 'react'
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

export interface LineSeries {
  key: string
  label: string
  color: string
}

interface Props {
  data: Record<string, string | number>[]
  series: LineSeries[]
  title: string
  description: string
  xKey?: string
  valueSuffix?: string
}

export function SportsLineMulti({
  data,
  series,
  title,
  description,
  xKey = 'name',
  valueSuffix = '',
}: Props) {
  const [active, setActive] = React.useState<string>(series[0]?.key ?? '')

  const chartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  const averages = React.useMemo(
    () =>
      Object.fromEntries(
        series.map((s) => [
          s.key,
          data.length > 0
            ? data.reduce((acc, row) => acc + (Number(row[s.key]) || 0), 0) / data.length
            : 0,
        ])
      ),
    [data, series]
  )

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 pt-4 sm:pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          {series.map((s) => (
            <button
              key={s.key}
              data-active={active === s.key}
              className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-[var(--inp-bg)] sm:border-t-0 sm:border-l sm:px-6 sm:py-5"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setActive(s.key)}
            >
              <span className="text-xs text-[var(--muted)] whitespace-nowrap">{s.label}</span>
              <span className="text-lg leading-none font-bold" style={{ color: s.color }}>
                {averages[s.key]?.toFixed(1)}{valueSuffix}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  labelFormatter={(value) => `Season ${value}`}
                />
              }
            />
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                type="monotone"
                stroke={`var(--color-${s.key})`}
                strokeWidth={active === s.key ? 2.5 : 1.5}
                dot={{ r: 4, fill: `var(--color-${s.key})` }}
                opacity={active === s.key ? 1 : 0.35}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
