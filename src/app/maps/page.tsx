import { sql } from '@/lib/db'
import { AppLayout } from '@/components/AppLayout'
import NYCountyMap from '@/components/NYCountyMap'

export const dynamic = 'force-dynamic'

export default async function MapsPage() {
  const rows = await sql`
    SELECT
      cc.county_fips_code,
      cc.county_name,
      cc.mcinfant,
      cc.mctoddler,
      cc.mcpreschool,
      cc.mhi,
      COALESCE(fa.provider_count, 0)::int AS provider_count,
      CASE
        WHEN COALESCE(fa.total_count, 0) > 0
          THEN ROUND(fa.dcc_count * 100.0 / fa.total_count, 1)
        ELSE 0.0
      END AS dcc_pct
    FROM county_costs cc
    LEFT JOIN (
      SELECT
        county,
        COUNT(*)                                           AS total_count,
        COUNT(*)                                           AS provider_count,
        COUNT(*) FILTER (WHERE program_type = 'DCC')      AS dcc_count
      FROM facilities
      GROUP BY county
    ) fa ON lower(fa.county || ' County') = lower(cc.county_name)
    WHERE cc.studyyear = 2022
    ORDER BY cc.county_name
  `

  return (
    <AppLayout showNavArrows>
      <NYCountyMap
        data={rows.map(r => ({
          county_fips_code: r.county_fips_code as string,
          county_name:      r.county_name      as string,
          provider_count:   Number(r.provider_count),
          dcc_pct:          Number(r.dcc_pct),
          mcinfant:    r.mcinfant    != null ? Number(r.mcinfant)    : null,
          mctoddler:   r.mctoddler   != null ? Number(r.mctoddler)   : null,
          mcpreschool: r.mcpreschool != null ? Number(r.mcpreschool) : null,
          mhi:         r.mhi         != null ? Number(r.mhi)         : null,
        }))}
      />
    </AppLayout>
  )
}
