import Link from 'next/link'
import { AppLayout } from '@/components/AppLayout'
import { MiniAreaChart, MiniBarChart } from '@/components/MiniCharts'
import { CHART_CONFIGS } from '@/lib/chart-configs'

/* ── Preview data keyed by slug ──────────────────────────────────── */
const PREVIEW: Record<string, number[]> = {
  'teams-by-division':    [24, 18, 14, 10, 8],
  'win-pct-by-division':  [68, 72, 65, 70, 62],
  'points-scored-leaders':[100, 92, 88, 85, 80, 76, 72, 68, 63, 58, 52, 47, 42, 36, 28],
  'point-differential':   [100, 88, 72, 65, 58, 48, 40, 32, 22, 14, 8, 2, -5, -12, -22],
  'schools-by-enrollment':[100, 95, 90, 82, 76, 70, 62, 55, 48, 42, 36, 30, 24, 18, 12],
  'wins-by-school':       [100, 90, 82, 75, 68, 62, 55, 48, 42, 36, 30, 25, 20, 15, 10],
  'season-records':       [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  'scoring-trend':        [38, 40, 36, 42, 45, 44, 48, 46, 50, 52, 54, 56, 55, 58, 60],
}
const AREA_SLUGS = new Set(['scoring-trend'])

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
