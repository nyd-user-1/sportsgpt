'use client'

import * as React from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Chart } from '@/components/Chart'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { ChartTooltipShell, ChartTooltipName, ChartTooltipRow } from './ChartTooltip'

export interface PFPAPoint { name: string; school_slug: string; pf: number; pa: number; wins: number }
export interface PFPASeason { season: string; points: PFPAPoint[] }

const MIN_SIZE = 18
const MAX_SIZE = 42

function dotSize(pf: number, minPf: number, maxPf: number): number {
  const range = maxPf - minPf || 1
  return Math.round(MIN_SIZE + ((pf - minPf) / range) * (MAX_SIZE - MIN_SIZE))
}

interface DotProps {
  cx?: number
  cy?: number
  index?: number
  payload?: PFPAPoint
  minPf: number
  maxPf: number
}

function LogoDot({ cx, cy, index = 0, payload, minPf, maxPf }: DotProps) {
  if (cx == null || cy == null || !payload) return null
  const logo = SCHOOL_LOGOS[payload.school_slug]
  const size = dotSize(payload.pf, minPf, maxPf)
  const r = size / 2
  const clipId = `pfpa-clip-${index}`
  if (!logo) return <circle cx={cx} cy={cy} r={r} fill="#033882" fillOpacity={0.7} />
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <image
        href={logo}
        x={cx - r} y={cy - r}
        width={size} height={size}
        clipPath={`url(#${clipId})`}
        preserveAspectRatio="xMidYMid slice"
      />
    </g>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload?.length) return null
  const d = (payload as { payload?: PFPAPoint }[])[0]?.payload
  if (!d) return null
  const logo = SCHOOL_LOGOS[d.school_slug]
  const diff = d.pf - d.pa
  return (
    <ChartTooltipShell minWidth={150}>
      <ChartTooltipName name={d.name} logoUrl={logo} />
      <ChartTooltipRow label="PF"   value={d.pf} />
      <ChartTooltipRow label="PA"   value={d.pa} />
      <ChartTooltipRow label="Diff" value={diff > 0 ? `+${diff}` : diff} valueColor={diff >= 0 ? '#033882' : '#ef4444'} />
      <ChartTooltipRow label="Wins" value={d.wins} valueColor="#033882" />
    </ChartTooltipShell>
  )
}

export function SportsPFPAScatter({ seasons }: { seasons: PFPASeason[] }) {
  const defaultSeason = seasons[seasons.length - 1]?.season ?? ''
  const [active, setActive] = React.useState(defaultSeason)

  React.useEffect(() => {
    function handler(e: Event) {
      const season = (e as CustomEvent<string>).detail
      if (seasons.some(s => s.season === season)) setActive(season)
    }
    window.addEventListener(SEASON_CHANGE_EVENT, handler)
    return () => window.removeEventListener(SEASON_CHANGE_EVENT, handler)
  }, [seasons])

  const points = seasons.find(s => s.season === active)?.points ?? []
  const minPf = Math.min(...points.map(p => p.pf))
  const maxPf = Math.max(...points.map(p => p.pf))

  // Capture minPf/maxPf in the shape closure so LogoDot can size correctly
  const shape = React.useMemo(
    () => (props: DotProps) => <LogoDot {...props} minPf={minPf} maxPf={maxPf} />,
    [minPf, maxPf]
  )

  return (
    <Chart>
      <ScatterChart margin={{ top: 16, right: 32, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          type="number" dataKey="pf" name="Points For"
          label={{ value: 'Points For →', position: 'insideBottom', offset: -4, fontSize: 10, fill: '#94a3b8' }}
          tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }}
        />
        <YAxis
          type="number" dataKey="pa" name="Points Against"
          reversed
          label={{ value: '← Points Against', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
          tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={40}
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => (
          <CustomTooltip active={active} payload={payload as unknown[]} />
        )} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Scatter data={points} shape={shape as any} />
      </ScatterChart>
    </Chart>
  )
}
