import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow, type ScatterRow } from '@/components/ChartDetailPage'

export const dynamic = 'force-dynamic'

export default async function ChartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = getChartConfig(slug)
  if (!config) notFound()

  const { prevSlug, nextSlug } = getAdjacentSlugs(slug)

  let tableRows: StdRow[] = []
  let chartPoints: StdRow[] = []
  let multiPoints: MultiRow[] = []
  let scatterPoints: ScatterRow[] = []
  let kpiValue = 0

  // ── REPLACE FOR NEW DOMAIN ──────────────────────────────────────────────
  // Add one case per slug defined in src/lib/chart-configs.ts.
  // Query your DB via `sql` and populate the variables above.
  // Example:
  //
  //   case 'teams-by-section': {
  //     const rows = await sql`SELECT section AS name, COUNT(*)::int AS value FROM teams GROUP BY section ORDER BY value DESC`
  //     tableRows = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
  //     chartPoints = tableRows.slice(0, 30)
  //     kpiValue = tableRows.reduce((s, r) => s + r.value, 0)
  //     break
  //   }
  //
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void sql // remove this line once you add real queries

  switch (slug) {
    default:
      notFound()
  }

  return (
    <ChartDetailPage
      config={config!}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      kpiValue={kpiValue}
      tableRows={tableRows}
      chartPoints={chartPoints}
      multiPoints={multiPoints}
      scatterPoints={scatterPoints}
    />
  )
}
