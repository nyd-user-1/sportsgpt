import Link from 'next/link'
import { AppLayout } from '@/components/AppLayout'
import { MiniAreaChart, MiniBarChart } from '@/components/MiniCharts'
import { CHART_CONFIGS } from '@/lib/chart-configs'

/* ── Preview sparkline data keyed by slug ────────────────────────── */
const PREVIEW: Record<string, number[]> = {
  'win-pct-trend':         [55, 58, 60, 62, 64, 66, 68, 65, 63, 61],
  'win-pct-by-division':   [42, 38, 28, 22],
  'season-records':        [10, 9, 9, 8, 7, 7, 6, 5, 4, 3, 2, 1, 0],
  'wins-by-school':        [22, 20, 18, 16, 14, 13, 11, 10, 8, 7, 6],
  'schools-by-enrollment': [3200, 2900, 2700, 2400, 2100, 1900, 1600, 1400, 1100, 900],
  'passing-yards-leaders': [1820, 1650, 1490, 1310, 1180, 1040, 920, 810, 740, 680],
  'passing-tds-leaders':   [24, 22, 19, 17, 15, 14, 12, 11, 9, 8],
  'rushing-yards-leaders': [1540, 1380, 1220, 1090, 960, 840, 730, 640, 560, 480],
  'rushing-tds-leaders':   [20, 18, 16, 14, 13, 11, 10, 9, 7, 6],
  'receiving-yards-leaders':[980, 860, 750, 660, 580, 510, 440, 380, 320, 270],
  'receiving-tds-leaders': [12, 11, 10, 9, 8, 7, 6, 5, 4, 3],
  'total-tds-leaders':     [22, 20, 18, 16, 14, 13, 11, 10, 8, 7],
  'total-yards-leaders':   [1900, 1720, 1560, 1400, 1250, 1100, 960, 840, 730, 620],
  'total-points-leaders':  [136, 122, 110, 98, 88, 80, 72, 64, 56, 48],
  'team-scoring-avg':      [38, 35, 32, 30, 28, 26, 24, 22, 20, 18],
}
const AREA_SLUGS = new Set(['win-pct-trend'])

/* ── Page ─────────────────────────────────────────────────────────── */

export default function ChartsPage() {
  return (
    <AppLayout showNavArrows>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CHART_CONFIGS.map(chart => {
            const data = PREVIEW[chart.slug] ?? [50, 60, 70, 80, 75, 65, 55]
            return (
              <Link key={chart.slug} href={`/chart/${chart.slug}`}
                className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-transparent hover:shadow-md transition-all">
                <div className="flex-1 min-h-0 h-28 sm:h-32">
                  {AREA_SLUGS.has(chart.slug)
                    ? <MiniAreaChart id={chart.slug} color={chart.color} data={data} />
                    : <MiniBarChart color={chart.color} data={data} />}
                </div>
                <div className="shrink-0 px-4 pt-2 pb-3">
                  <p className="text-[13px] font-bold text-[var(--txt)] group-hover:text-sky-500 leading-snug transition-colors">{chart.title}</p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">{chart.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
