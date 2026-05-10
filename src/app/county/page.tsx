import { sql } from '@/lib/db'
import CountyTable from './CountyTable'

export default async function CountyPage() {
  const rows = await sql`
    SELECT
      f.county,
      COUNT(*)::int                          AS provider_count,
      COALESCE(SUM(f.total_capacity),      0)::int AS total_capacity,
      COALESCE(SUM(f.infant_capacity),     0)::int AS infant_capacity,
      COALESCE(SUM(f.toddler_capacity),    0)::int AS toddler_capacity,
      COALESCE(SUM(f.preschool_capacity),  0)::int AS preschool_capacity,
      COALESCE(SUM(f.school_age_capacity), 0)::int AS school_age_capacity,
      cc.mcinfant,
      cc.mctoddler,
      cc.mcpreschool,
      cc.mhi
    FROM facilities f
    LEFT JOIN county_costs cc
      ON lower(cc.county_name) = lower(f.county || ' County')
      AND cc.studyyear = 2022
    GROUP BY f.county, cc.mcinfant, cc.mctoddler, cc.mcpreschool, cc.mhi
    ORDER BY f.county
  `

  return (
    <CountyTable
      counties={rows.map(r => ({
        county:              r.county as string,
        provider_count:      Number(r.provider_count),
        total_capacity:      Number(r.total_capacity),
        infant_capacity:     Number(r.infant_capacity),
        toddler_capacity:    Number(r.toddler_capacity),
        preschool_capacity:  Number(r.preschool_capacity),
        school_age_capacity: Number(r.school_age_capacity),
        mcinfant:    r.mcinfant    != null ? Number(r.mcinfant)    : null,
        mctoddler:   r.mctoddler   != null ? Number(r.mctoddler)   : null,
        mcpreschool: r.mcpreschool != null ? Number(r.mcpreschool) : null,
        mhi:         r.mhi         != null ? Number(r.mhi)         : null,
      }))}
    />
  )
}
