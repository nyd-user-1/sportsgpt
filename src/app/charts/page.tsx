'use client'

import { useRouter, usePathname } from 'next/navigation'
import {
  MiniBarChart,
  MiniStackedBarChart,
  MiniGroupedBarChart,
  MiniScatterChart,
  MiniHorizontalStackedBar,
} from '@/components/MiniCharts'
import { CHART_CONFIGS } from '@/lib/chart-configs'

// Standard descending-bar previews
const BAR_PREVIEW: Record<string, number[]> = {
  'wins-by-school':              [28, 25, 24, 22, 20, 18, 16, 14, 12, 10, 8],
  'point-differential-leaders':  [280, 240, 210, 185, 160, 135, 110, 85, 60, 35],
  'strength-of-schedule':        [65, 63, 61, 60, 58, 55, 53, 50, 47, 44],
  'passing-yards-leaders':       [3337, 3102, 2885, 2663, 2556, 2540, 2380, 2367, 2362, 2277],
  'passing-tds-leaders':         [44, 43, 37, 34, 34, 34, 32, 29, 29, 29],
  'rushing-yards-leaders':       [1800, 1620, 1450, 1290, 1140, 1000, 870, 750, 640, 540],
  'rushing-tds-leaders':         [26, 23, 21, 18, 16, 14, 13, 11, 10, 9],
  'receiving-yards-leaders':     [980, 860, 750, 650, 560, 480, 410, 350, 295, 245],
  'receiving-tds-leaders':       [14, 12, 11, 10, 9, 8, 7, 6, 5, 4],
  'total-tds-leaders':           [28, 25, 22, 19, 17, 15, 13, 12, 10, 9],
  'total-yards-leaders':         [3800, 3400, 3050, 2750, 2500, 2250, 2000, 1780, 1580, 1400],
  'total-points-leaders':        [168, 150, 132, 114, 102, 90, 78, 72, 66, 54],
  'scoring-offense':             [38, 36, 34, 32, 30, 28, 27, 25, 24, 22],
  'scoring-defense':             [6, 8, 10, 12, 14, 16, 18, 20, 22, 25],
  'top-scoring-games':           [113, 108, 103, 98, 94, 90, 86, 82, 78, 74],
  'biggest-blowouts':            [63, 57, 54, 49, 46, 43, 40, 37, 34, 31],
  'single-game-rushing':         [361, 345, 320, 298, 275, 252, 230, 210, 192, 175],
  'single-game-passing':         [420, 395, 368, 342, 318, 295, 274, 255, 238, 222],
}

const PLACEHOLDER_BARS = [80, 72, 65, 58, 52, 46, 40, 34, 28, 22]

// Stacked bar previews (wins, losses)
const STACKED_PREVIEW: Record<string, { wins: number[]; losses: number[] }> = {
  'season-records': {
    wins:   [12, 11, 10, 10, 10, 10, 8, 8, 8, 7, 7, 6, 5, 4, 3, 2],
    losses: [1,  1,  2,  2,  2,  2,  4, 4, 4, 5, 5, 6, 7, 8, 9, 10],
  },
  'win-loss-division': {
    wins:   [10, 9, 8, 7, 6, 5, 5, 4, 3, 2],
    losses: [2,  3, 4, 5, 6, 7, 7, 8, 9, 10],
  },
}

// Grouped bar previews (a = away/gray, b = home/blue — right bar is home)
const GROUPED_PREVIEW: Record<string, { a: number[]; b: number[] }> = {
  'home-away-record': {
    a: [2, 3, 1, 4, 1, 5, 2, 6, 3, 7, 4, 8],  // away wins
    b: [6, 5, 7, 4, 7, 3, 6, 2, 5, 1, 4, 0],  // home wins
  },
}

// Scatter chart previews
const SCATTER_PREVIEW: Record<string, { x: number; y: number; r: number }[]> = {
  'pf-pa': [
    // top-right cluster (high PF, low PA = best teams)
    { x: 168, y: 15, r: 9 }, { x: 152, y: 22, r: 8 }, { x: 178, y: 32, r: 7 },
    { x: 140, y: 28, r: 7 }, { x: 160, y: 38, r: 6 },
    // middle cluster
    { x: 105, y: 52, r: 5 }, { x: 120, y: 58, r: 5 }, { x: 90, y: 62, r: 5 },
    { x: 130, y: 68, r: 4 }, { x: 100, y: 72, r: 4 }, { x: 115, y: 78, r: 4 },
    // bottom-left (struggling teams)
    { x: 42, y: 82, r: 3 }, { x: 58, y: 88, r: 3 }, { x: 30, y: 90, r: 3 },
  ],
}

// Horizontal stacked bar — same data as STACKED but rendered differently
const HORIZ_PREVIEW = STACKED_PREVIEW

function MiniPreview({ slug, color }: { slug: string; color: string }) {
  if (STACKED_PREVIEW[slug] && slug === 'season-records') {
    const d = STACKED_PREVIEW[slug]
    return <MiniStackedBarChart wins={d.wins} losses={d.losses} />
  }
  if (slug === 'win-loss-division') {
    const d = HORIZ_PREVIEW[slug]
    return <MiniHorizontalStackedBar wins={d.wins} losses={d.losses} />
  }
  if (GROUPED_PREVIEW[slug]) {
    const d = GROUPED_PREVIEW[slug]
    return <MiniGroupedBarChart a={d.a} b={d.b} />
  }
  if (SCATTER_PREVIEW[slug]) {
    return <MiniScatterChart color={color} points={SCATTER_PREVIEW[slug]} />
  }
  const data = BAR_PREVIEW[slug] ?? [50, 60, 70, 80, 75, 65, 55]
  return <MiniBarChart color={color} data={data} />
}

interface Placeholder {
  slug: string
  title: string
  placeholder: true
}

type RowItem = string | Placeholder

const ROWS: { label: string; charts: RowItem[] }[] = [
  {
    label: 'By Team & Season',
    charts: [
      'season-records',
      'wins-by-school',
      'point-differential-leaders',
      'home-away-record',
      'pf-pa',
      'win-loss-division',
      'strength-of-schedule',
    ],
  },
  {
    label: 'By Player & Position',
    charts: [
      'passing-yards-leaders',
      'passing-tds-leaders',
      'rushing-yards-leaders',
      'rushing-tds-leaders',
      'receiving-yards-leaders',
      'receiving-tds-leaders',
      'total-tds-leaders',
      'total-yards-leaders',
      'total-points-leaders',
    ],
  },
  {
    label: 'Game Records & Scoring',
    charts: [
      'scoring-offense',
      'scoring-defense',
      'top-scoring-games',
      'biggest-blowouts',
      'single-game-rushing',
      'single-game-passing',
    ],
  },
]

export default function ChartsPage() {
  const router   = useRouter()
  const pathname = usePathname()
  const match    = pathname.match(/^\/charts\/(.+)$/)
  const activeSlug = match ? match[1] : null

  function openChart(slug: string) {
    router.push(`/charts/${slug}`, { scroll: false })
  }

  return (
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 space-y-8">
          {ROWS.map(row => (
            <section key={row.label}>
              <h2 className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-3 px-1">
                {row.label}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {row.charts.map(item => {
                  if (typeof item === 'string') {
                    const chart = CHART_CONFIGS.find(c => c.slug === item)!
                    const isActive = item === activeSlug
                    return (
                      <button
                        key={item}
                        onClick={() => openChart(item)}
                        className={`group flex-shrink-0 w-[400px] flex flex-col rounded-xl border bg-[var(--surface)] overflow-hidden transition-all text-left ${
                          isActive
                            ? 'border-[#033882] shadow-md ring-1 ring-[#033882]/20'
                            : 'border-[var(--border)] hover:border-[#033882]/40 hover:shadow-md'
                        }`}
                      >
                        <div className="h-[180px]">
                          <MiniPreview slug={item} color={chart.color} />
                        </div>
                        <div className="px-4 pt-2 pb-3">
                          <p className={`text-[13px] font-bold leading-snug transition-colors ${
                            isActive ? 'text-[#033882]' : 'text-[var(--txt)] group-hover:text-sky-500'
                          }`}>
                            {chart.title}
                          </p>
                          {isActive && <p className="text-[10px] font-semibold mt-1" style={{ color: '#033882' }}>Viewing →</p>}
                        </div>
                      </button>
                    )
                  }

                  // placeholder card
                  return (
                    <div
                      key={item.slug}
                      className="flex-shrink-0 w-[400px] flex flex-col rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] overflow-hidden opacity-40"
                    >
                      <div className="h-[180px]">
                        <MiniBarChart color="#94a3b8" data={PLACEHOLDER_BARS} />
                      </div>
                      <div className="px-4 pt-2 pb-3">
                        <p className="text-[13px] font-bold leading-snug text-[var(--txt)]">{item.title}</p>
                        <p className="text-[10px] font-medium mt-1 text-[var(--muted)]">Coming soon</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

  )
}
