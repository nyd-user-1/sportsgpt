import Link from 'next/link'
import { AppLayout } from '@/components/AppLayout'
import { MiniAreaChart, MiniBarChart } from '@/components/MiniCharts'
import { CHART_CONFIGS } from '@/lib/chart-configs'

/* ── Preview data keyed by slug ──────────────────────────────────── */
const PREVIEW: Record<string, number[]> = {
  'providers-by-county':  [100, 62, 58, 42, 38, 32, 28, 24, 20, 18, 14, 10, 8, 6, 4],
  'capacity-by-county':   [100, 88, 82, 70, 62, 54, 46, 38, 30, 24, 18, 14, 10, 7, 4],
  'program-types':        [100, 32, 22, 20, 1],
  'facilities-by-year':   [5, 8, 12, 18, 22, 30, 28, 32, 35, 42, 38, 36, 40, 32, 28],
  'age-group-capacity':   [18, 30, 45, 62],
  'facility-status':      [100, 44, 1],
  'license-expiration':   [55, 88, 100, 78, 60, 45, 32, 20],
  'infant-care-cost':     [100, 92, 85, 78, 72, 65, 58, 52, 46, 40, 35, 30, 26, 22, 18],
  'toddler-care-cost':    [100, 90, 82, 74, 66, 59, 52, 46, 40, 35, 30, 26, 22, 18, 14],
  'preschool-care-cost':  [100, 88, 78, 68, 60, 52, 45, 38, 32, 27, 22, 18, 14, 11, 8],
  'household-income':     [100, 95, 88, 82, 76, 70, 64, 58, 52, 46, 40, 35, 30, 25, 20],
  'cost-trend':           [42, 48, 52, 56, 60, 64, 70, 75, 80, 84, 88, 92, 96, 98, 100],
  'center-vs-family':     [40, 45, 50, 56, 62, 68, 74, 80, 85, 90, 94, 97, 99, 100, 98],
  'income-vs-cost':       [30, 55, 42, 70, 48, 65, 38, 82, 60, 45, 75, 52, 88, 35, 62],
  'lfpr-by-county':       [100, 95, 88, 82, 76, 70, 64, 58, 52, 46, 40, 35, 30, 25, 20],
}
const AREA_SLUGS = new Set(['facilities-by-year', 'cost-trend', 'center-vs-family'])

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
