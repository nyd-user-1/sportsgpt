'use client'

import * as React from 'react'
import { ResponsiveContainer } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

/**
 * The single chart shell used everywhere in the app.
 * Owns size + responsive behavior. Change height here → every chart updates.
 *
 * Variants (SportsBarChart, SportsAreaGradient, etc.) render their Recharts
 * elements as children. They must not set their own size or ResponsiveContainer.
 *
 * Pass `config` when the variant uses shadcn-chart helpers (ChartTooltip,
 * ChartLegend, etc.) which need the chart-config context.
 */
interface ChartProps {
  children: React.ReactElement
  config?: ChartConfig
}

export function Chart({ children, config }: ChartProps) {
  return (
    <div data-slot="chart-shell" className="h-[520px] w-full">
      {config ? (
        <ChartContainer config={config} className="h-full w-full">
          {children}
        </ChartContainer>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  )
}
