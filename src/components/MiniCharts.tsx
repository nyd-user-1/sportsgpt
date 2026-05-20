'use client'

import {
  ResponsiveContainer,
  BarChart, Bar,
  AreaChart, Area,
  ScatterChart, Scatter, ZAxis,
  XAxis, YAxis,
} from 'recharts'

/* ── Bar Chart ────────────────────────────────────────────────────── */

export function MiniBarChart({ color, data }: { color: string; data: number[] }) {
  const d = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={d} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="15%">
        <XAxis dataKey="i" hide />
        <YAxis hide domain={[0, 'dataMax']} />
        <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Stacked Bar Chart ─────────────────────────────────────────────── */

export function MiniStackedBarChart({ wins, losses }: { wins: number[]; losses: number[] }) {
  const d = wins.map((w, i) => ({ i, w, l: losses[i] ?? 0 }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={d} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="15%">
        <XAxis dataKey="i" hide />
        <YAxis hide domain={[0, 'dataMax']} />
        <Bar dataKey="l" stackId="s" fill="#ef4444" isAnimationActive={false} />
        <Bar dataKey="w" stackId="s" fill="#033882" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Grouped Bar Chart ─────────────────────────────────────────────── */

export function MiniGroupedBarChart({ a, b }: { a: number[]; b: number[] }) {
  const d = a.map((av, i) => ({ i, a: av, b: b[i] ?? 0 }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={d} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="15%" barGap={2}>
        <XAxis dataKey="i" hide />
        <YAxis hide domain={[0, 'dataMax']} />
        <Bar dataKey="a" fill="#94a3b8" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="b" fill="#033882" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Horizontal Stacked Bar Chart ─────────────────────────────────── */

export function MiniHorizontalStackedBar({ wins, losses }: { wins: number[]; losses: number[] }) {
  const d = wins.map((w, i) => ({ i, w, l: losses[i] ?? 0 }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={d} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="15%">
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis type="category" dataKey="i" hide />
        <Bar dataKey="w" stackId="s" fill="#033882" isAnimationActive={false} />
        <Bar dataKey="l" stackId="s" fill="#ef4444" isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ── Scatter Chart ────────────────────────────────────────────────── */

interface ScatterDot { x: number; y: number; r: number }

export function MiniScatterChart({ color, points }: { color: string; points: ScatterDot[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
        <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
        <ZAxis type="number" dataKey="r" range={[20, 120]} />
        <Scatter data={points} fill={color} fillOpacity={0.72} isAnimationActive={false} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

/* ── Area Chart ───────────────────────────────────────────────────── */

export function MiniAreaChart({ color, data, id }: { color: string; data: number[]; id: string }) {
  const d = data.map((v, i) => ({ i, v }))
  const gid = `ag-${id}`
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={d} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <XAxis dataKey="i" hide />
        <YAxis hide domain={[0, 'dataMax']} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2.5}
          fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── Pie Chart (kept for future pages) ───────────────────────────── */

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

export function MiniPieChart({ colors, data }: { colors: string[]; data: number[] }) {
  const cx = 40, cy = 40, r = 32
  const total = data.reduce((a, b) => a + b, 0)
  let angle = 0
  const slices = data.map((v, i) => {
    const sweep = (v / total) * 360
    const [sx, sy] = polar(cx, cy, r, angle)
    const [ex, ey] = polar(cx, cy, r, angle + sweep)
    const large = sweep > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`
    angle += sweep
    return { d, color: colors[i % colors.length] }
  })
  return (
    <svg viewBox="0 0 80 80" className="h-full"
      style={{ maxWidth: '80px', margin: '0 auto', display: 'block' }}
      preserveAspectRatio="xMidYMid meet">
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1" />
      ))}
    </svg>
  )
}
