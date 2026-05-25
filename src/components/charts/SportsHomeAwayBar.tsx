'use client'

import * as React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Chart } from '@/components/Chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { ChartTooltipShell, ChartTooltipName, ChartTooltipRow } from './ChartTooltip'

export interface HomeAwayTeam {
  name: string
  school_slug: string
  home_wins: number
  away_wins: number
}

export interface HomeAwaySeason {
  season: string
  teams: HomeAwayTeam[]
}

function abbrev(name: string) {
  return name.replace(' Varsity Football', '').replace(' Football', '')
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload?.length) return null
  const item = (payload as { payload?: HomeAwayTeam }[])[0]?.payload
  if (!item) return null
  const logo = SCHOOL_LOGOS[item.school_slug]
  return (
    <ChartTooltipShell minWidth={160}>
      <ChartTooltipName name={item.name} logoUrl={logo} />
      <ChartTooltipRow color="#033882"  label="Home Wins" value={item.home_wins} />
      <ChartTooltipRow color="#94a3b8" label="Away Wins" value={item.away_wins} />
    </ChartTooltipShell>
  )
}

export function SportsHomeAwayBar({ seasons }: { seasons: HomeAwaySeason[] }) {
  const defaultSeason = seasons[seasons.length - 1]?.season ?? ''
  const [active, setActive] = React.useState(defaultSeason)

  React.useEffect(() => {
    function handler(e: Event) {
      const yr = (e as CustomEvent<string>).detail
      if (seasons.some(s => s.season === yr)) setActive(yr)
    }
    window.addEventListener(SEASON_CHANGE_EVENT, handler)
    return () => window.removeEventListener(SEASON_CHANGE_EVENT, handler)
  }, [seasons])

  const data = (seasons.find(s => s.season === active)?.teams ?? []).slice(0, 40)

  return (
    <Chart>
      <BarChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
        <YAxis hide tickCount={10} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          content={({ active, payload }) => (
            <CustomTooltip active={active} payload={payload as unknown[]} />
          )}
        />
        <Bar dataKey="away_wins" name="Away Wins" fill="#94a3b8" radius={0} />
        <Bar dataKey="home_wins" name="Home Wins" fill="#033882" radius={0} />
      </BarChart>
    </Chart>
  )
}
