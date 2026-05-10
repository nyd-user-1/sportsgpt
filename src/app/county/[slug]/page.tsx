import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { NY_COUNTIES } from '@/lib/ny-counties'
import { CountyShell } from './Shell'

export default async function DetailPageCounty({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const idx = NY_COUNTIES.findIndex(c => c.slug === slug)
  if (idx === -1) notFound()

  const total    = NY_COUNTIES.length
  const prevSlug = NY_COUNTIES[(idx - 1 + total) % total].slug
  const nextSlug = NY_COUNTIES[(idx + 1) % total].slug

  const [statsRows, zipRows] = await Promise.all([
    sql`
      SELECT
        MAX(county) AS county_name,
        COUNT(*) AS provider_count,
        COALESCE(SUM(total_capacity),      0) AS total_capacity,
        COALESCE(SUM(infant_capacity),     0) AS infant_capacity,
        COALESCE(SUM(toddler_capacity),    0) AS toddler_capacity,
        COALESCE(SUM(preschool_capacity),  0) AS preschool_capacity,
        COALESCE(SUM(school_age_capacity), 0) AS school_age_capacity
      FROM facilities
      WHERE regexp_replace(lower(county), '[^a-z0-9]+', '-', 'g') = ${slug}
    `,
    sql`
      SELECT zip_code, MAX(city) AS city, COUNT(*) AS providers, SUM(total_capacity) AS seats
      FROM facilities
      WHERE regexp_replace(lower(county), '[^a-z0-9]+', '-', 'g') = ${slug}
      GROUP BY zip_code
      ORDER BY providers DESC
      LIMIT 20
    `,
  ])

  const stats = statsRows[0]
  if (!stats?.county_name) notFound()

  // county_costs uses "Albany County" format — query after we have the real county name
  const costRows = await sql`
    SELECT mcinfant, mctoddler, mcpreschool,
           mfccinfant, mfcctoddler, mfccpreschool,
           mhi, flfpr_20to64_under6, pr_f
    FROM county_costs
    WHERE lower(county_name) = lower(${(stats.county_name as string) + ' County'})
      AND studyyear = 2022
    LIMIT 1
  `
  const costs = costRows[0] ?? null

  return (
    <CountyShell
      stats={{
        county_name:        stats.county_name as string,
        provider_count:     Number(stats.provider_count),
        total_capacity:     Number(stats.total_capacity),
        infant_capacity:    Number(stats.infant_capacity),
        toddler_capacity:   Number(stats.toddler_capacity),
        preschool_capacity: Number(stats.preschool_capacity),
        school_age_capacity:Number(stats.school_age_capacity),
      }}
      costs={costs ? {
        mcinfant:            costs.mcinfant            != null ? Number(costs.mcinfant)            : null,
        mctoddler:           costs.mctoddler           != null ? Number(costs.mctoddler)           : null,
        mcpreschool:         costs.mcpreschool         != null ? Number(costs.mcpreschool)         : null,
        mfccinfant:          costs.mfccinfant          != null ? Number(costs.mfccinfant)          : null,
        mfcctoddler:         costs.mfcctoddler         != null ? Number(costs.mfcctoddler)         : null,
        mfccpreschool:       costs.mfccpreschool       != null ? Number(costs.mfccpreschool)       : null,
        mhi:                 costs.mhi                 != null ? Number(costs.mhi)                 : null,
        flfpr_20to64_under6: costs.flfpr_20to64_under6 != null ? Number(costs.flfpr_20to64_under6) : null,
        pr_f:                costs.pr_f                != null ? Number(costs.pr_f)                : null,
      } : null}
      zips={zipRows.map(z => ({
        zip_code:  z.zip_code as string,
        city:      z.city as string,
        providers: Number(z.providers),
        seats:     Number(z.seats),
      }))}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
    />
  )
}
