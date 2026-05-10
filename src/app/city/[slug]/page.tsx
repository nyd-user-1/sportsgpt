import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { CityShell } from './Shell'

export default async function DetailPageCity({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [statsRows, zipRows] = await Promise.all([
    sql`
      SELECT
        MAX(city) AS city,
        MAX(county) AS county,
        COUNT(*) AS provider_count,
        COALESCE(SUM(total_capacity),      0) AS total_capacity,
        COALESCE(SUM(infant_capacity),     0) AS infant_capacity,
        COALESCE(SUM(toddler_capacity),    0) AS toddler_capacity,
        COALESCE(SUM(preschool_capacity),  0) AS preschool_capacity,
        COALESCE(SUM(school_age_capacity), 0) AS school_age_capacity
      FROM facilities
      WHERE regexp_replace(lower(city), '[^a-z0-9]+', '-', 'g') = ${slug}
    `,
    sql`
      SELECT zip_code, COUNT(*) AS providers, SUM(total_capacity) AS seats
      FROM facilities
      WHERE regexp_replace(lower(city), '[^a-z0-9]+', '-', 'g') = ${slug}
      GROUP BY zip_code
      ORDER BY providers DESC
      LIMIT 20
    `,
  ])

  const stats = statsRows[0]
  if (!stats?.city) notFound()

  const [prevRows, nextRows, firstRows, lastRows] = await Promise.all([
    sql`
      SELECT DISTINCT city, regexp_replace(lower(city), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities
      WHERE city < ${stats.city as string}
      ORDER BY city DESC LIMIT 1
    `,
    sql`
      SELECT DISTINCT city, regexp_replace(lower(city), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities
      WHERE city > ${stats.city as string}
      ORDER BY city ASC LIMIT 1
    `,
    sql`
      SELECT DISTINCT city, regexp_replace(lower(city), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities ORDER BY city ASC LIMIT 1
    `,
    sql`
      SELECT DISTINCT city, regexp_replace(lower(city), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities ORDER BY city DESC LIMIT 1
    `,
  ])

  const prevSlug = (prevRows[0]?.slug ?? lastRows[0]?.slug ?? slug) as string
  const nextSlug = (nextRows[0]?.slug ?? firstRows[0]?.slug ?? slug) as string

  return (
    <CityShell
      stats={{
        city:               stats.city as string,
        county:             stats.county as string,
        provider_count:     Number(stats.provider_count),
        total_capacity:     Number(stats.total_capacity),
        infant_capacity:    Number(stats.infant_capacity),
        toddler_capacity:   Number(stats.toddler_capacity),
        preschool_capacity: Number(stats.preschool_capacity),
        school_age_capacity:Number(stats.school_age_capacity),
      }}
      zips={zipRows.map(z => ({
        zip_code:  z.zip_code as string,
        providers: Number(z.providers),
        seats:     Number(z.seats),
      }))}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
    />
  )
}
