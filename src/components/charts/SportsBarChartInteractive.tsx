'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

export interface SeasonBars {
  season: string        // '2022', '2023', '2024'
  topValue: number      // KPI shown in the toggle button (top player's value or total)
  bars: { name: string; value: number }[]
}

interface Props {
  seasons: SeasonBars[]
  title: string
  description: string
  color: string
  valueLabel: string
}

export function SportsBarChartInteractive({ seasons, title, description, color, valueLabel }: Props) {
  const defaultSeason = seasons[seasons.length - 1]?.season ?? ''
  const [active, setActive] = React.useState(defaultSeason)

  const activeBars = seasons.find(s => s.season === active)?.bars ?? []

  const chartConfig = {
    value: { label: valueLabel, color },
  } satisfies ChartConfig

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b border-[var(--border)] p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex">
          {seasons.map(s => (
            <button
              key={s.season}
              data-active={active === s.season}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-[var(--inp-bg)] sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setActive(s.season)}
            >
              <span className="text-sm font-semibold text-[var(--txt)]">{s.season}</span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={activeBars}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
            <YAxis hide tickCount={25} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="value"
                  labelFormatter={(value) => String(value)}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
