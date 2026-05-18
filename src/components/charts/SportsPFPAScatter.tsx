'use client'

import * as React from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'
import { SCHOOL_LOGOS } from '@/lib/team-images'

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
  const name = d.name.replace(' Varsity Football', '').replace(' Football', '')
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12, minWidth: 150 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {logo && <img src={logo} alt="" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />}
        <span style={{ fontWeight: 700 }}>{name}</span>
      </div>
      <p>
        <span style={{ color: '#6b7280' }}>PF </span><span style={{ fontWeight: 600 }}>{d.pf}</span>
        <span style={{ color: '#6b7280', marginLeft: 10 }}>PA </span><span style={{ fontWeight: 600 }}>{d.pa}</span>
      </p>
      <p>
        <span style={{ color: '#6b7280' }}>Diff </span><span style={{ fontWeight: 600, color: d.pf - d.pa >= 0 ? '#033882' : '#ef4444' }}>{d.pf - d.pa > 0 ? '+' : ''}{d.pf - d.pa}</span>
        <span style={{ color: '#6b7280', marginLeft: 10 }}>Wins </span><span style={{ fontWeight: 600, color: '#033882' }}>{d.wins}</span>
      </p>
    </div>
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
    <Card className="border-0 shadow-none py-0">
      <CardContent className="px-0 pb-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
