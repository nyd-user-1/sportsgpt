import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
import CityTable from './CityTable'

export default async function CityPage() {
  const [rows, countRows] = await Promise.all([
    sql`
      SELECT MAX(city) AS city, MAX(county) AS county,
        regexp_replace(lower(MAX(city)), '[^a-z0-9]+', '-', 'g') AS slug,
        COUNT(*)::int                           AS provider_count,
        COALESCE(SUM(total_capacity),      0)::int AS total_capacity,
        COALESCE(SUM(infant_capacity),     0)::int AS infant_capacity,
        COALESCE(SUM(toddler_capacity),    0)::int AS toddler_capacity,
        COALESCE(SUM(preschool_capacity),  0)::int AS preschool_capacity,
        COALESCE(SUM(school_age_capacity), 0)::int AS school_age_capacity
      FROM facilities
      GROUP BY lower(city)
      ORDER BY MAX(city)
      LIMIT 200
    `,
    sql`SELECT COUNT(DISTINCT lower(city))::int AS total FROM facilities`,
  ])

  return (
    <CityTable
      cities={rows.map(r => ({
        city:               r.city as string,
        slug:               r.slug as string,
        county:             r.county as string,
        provider_count:     Number(r.provider_count),
        total_capacity:     Number(r.total_capacity),
        infant_capacity:    Number(r.infant_capacity),
        toddler_capacity:   Number(r.toddler_capacity),
        preschool_capacity: Number(r.preschool_capacity),
        school_age_capacity:Number(r.school_age_capacity),
      }))}
      total={Number(countRows[0].total)}
    />
  )
}
