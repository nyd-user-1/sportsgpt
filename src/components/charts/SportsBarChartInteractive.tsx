'use client'

import * as React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

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
      <CardContent className="px-2 sm:px-6">
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
