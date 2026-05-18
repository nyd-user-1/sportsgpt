'use client'

/* ── Helpers ──────────────────────────────────────────────────────── */

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  const d: string[] = [`M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`]
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cx = ((x0 + x1) / 2).toFixed(1)
    d.push(`C ${cx},${y0.toFixed(1)} ${cx},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`)
  }
  return d.join(' ')
}

/* ── Area Chart ───────────────────────────────────────────────────── */
// Edge-to-edge fill, gradient, wavy-data-ready.

interface AreaProps { color: string; data: number[]; id: string }

export function MiniAreaChart({ color, data, id }: AreaProps) {
  const W = 200, H = 100, padTop = 12

  const max = Math.max(...data)
  const pts: [number, number][] = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    padTop + ((1 - v / max) * (H - padTop)),
  ])

  const line = smoothPath(pts)
  // Fill drops straight to the bottom from both ends
  const fill = `${line} L ${W},${H} L 0,${H} Z`
  const gid = `ag-${id}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Bar Chart ────────────────────────────────────────────────────── */

interface BarProps { color: string; data: number[] }

export function MiniBarChart({ color, data }: BarProps) {
  const W = 200, H = 100
  const max = Math.max(...data)
  const slot = W / data.length
  const barW = slot * 0.6
  const pad = 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = (v / max) * (H - pad)
        const x = i * slot + (slot - barW) / 2
        return (
          <rect key={i}
            x={x.toFixed(1)} y={(H - h).toFixed(1)}
            width={barW.toFixed(1)} height={h.toFixed(1)}
            fill={color} rx="2" />
        )
      })}
    </svg>
  )
}

/* ── Stacked Bar Chart ────────────────────────────────────────────── */
// bottom segment = wins (blue), top segment = losses (red)

interface StackedBarProps { wins: number[]; losses: number[] }

export function MiniStackedBarChart({ wins, losses }: StackedBarProps) {
  const W = 200, H = 100, pad = 2
  const maxTotal = Math.max(...wins.map((w, i) => w + (losses[i] ?? 0)))
  const slot = W / wins.length
  const barW = slot * 0.6

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {wins.map((w, i) => {
        const l = losses[i] ?? 0
        const totalH = ((w + l) / maxTotal) * (H - pad)
        const winH  = (w + l) > 0 ? (w / (w + l)) * totalH : 0
        const lossH = totalH - winH
        const x = i * slot + (slot - barW) / 2
        return (
          <g key={i}>
            {lossH > 0 && <rect x={x} y={H - totalH} width={barW} height={lossH} fill="#ef4444" />}
            {winH  > 0 && <rect x={x} y={H - winH}   width={barW} height={winH}  fill="#033882" />}
          </g>
        )
      })}
    </svg>
  )
}

/* ── Grouped Bar Chart ────────────────────────────────────────────── */
// Two bars per group: a (gray/away left), b (blue/home right)

interface GroupedBarProps { a: number[]; b: number[] }

export function MiniGroupedBarChart({ a, b }: GroupedBarProps) {
  const W = 200, H = 100, pad = 2
  const maxVal = Math.max(...a, ...b)
  const n = a.length
  const groupW = W / n
  const barW = groupW * 0.28
  const gap  = groupW * 0.05

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {a.map((av, i) => {
        const bv = b[i] ?? 0
        const aH = (av / maxVal) * (H - pad)
        const bH = (bv / maxVal) * (H - pad)
        const gx = i * groupW + (groupW - 2 * barW - gap) / 2
        return (
          <g key={i}>
            <rect x={gx}                y={H - aH} width={barW} height={aH} fill="#94a3b8" />
            <rect x={gx + barW + gap}   y={H - bH} width={barW} height={bH} fill="#033882" />
          </g>
        )
      })}
    </svg>
  )
}

/* ── Scatter Chart ────────────────────────────────────────────────── */

interface ScatterDot { x: number; y: number; r: number }

export function MiniScatterChart({ color, points }: { color: string; points: ScatterDot[] }) {
  return (
    <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={color} fillOpacity={0.72} />
      ))}
    </svg>
  )
}

/* ── Horizontal Stacked Bar Chart ─────────────────────────────────── */
// Wins (blue) left, losses (red) right — horizontal bars

interface HorizStackedProps { wins: number[]; losses: number[] }

export function MiniHorizontalStackedBar({ wins, losses }: HorizStackedProps) {
  const W = 200, H = 100, pad = 2
  const maxTotal = Math.max(...wins.map((w, i) => w + (losses[i] ?? 0)))
  const n = wins.length
  const rowH = H / n
  const barH = rowH * 0.55

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {wins.map((w, i) => {
        const l = losses[i] ?? 0
        const totalW = ((w + l) / maxTotal) * (W - pad)
        const winW  = (w + l) > 0 ? (w / (w + l)) * totalW : 0
        const lossW = totalW - winW
        const y = i * rowH + (rowH - barH) / 2
        return (
          <g key={i}>
            {winW  > 0 && <rect x={0}    y={y} width={winW}  height={barH} fill="#033882" />}
            {lossW > 0 && <rect x={winW} y={y} width={lossW} height={barH} fill="#ef4444" />}
          </g>
        )
      })}
    </svg>
  )
}

/* ── Pie Chart (kept for future pages) ───────────────────────────── */

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

interface PieProps { colors: string[]; data: number[] }

export function MiniPieChart({ colors, data }: PieProps) {
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
