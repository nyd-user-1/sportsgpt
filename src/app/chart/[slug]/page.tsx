import { redirect } from 'next/navigation'
import { hasDataSource } from '@/lib/chart-data/registry'
import { getChartConfig } from '@/lib/chart-configs'

/**
 * /chart/[slug] → canonical redirect to /charts/[slug]
 *
 * The original standalone chart detail page has been superseded by the
 * parallel-route panel at /charts/@panel/[slug]. All 28+ chart slugs are
 * handled there. This file exists only to redirect any inbound links
 * (bookmarks, external refs, the AppPanel detailHref button) to the
 * correct canonical URL.
 */
export default async function ChartRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Validate slug before redirecting — unknown slugs get a 404 via /charts
  const isKnown = getChartConfig(slug) != null || hasDataSource(slug)
  if (!isKnown) redirect('/charts')

  redirect(`/charts/${slug}`)
}
