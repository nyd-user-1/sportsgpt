import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
import FacilityTable from './FacilityTable'

export default async function FacilityPage() {
  const [rows, countRows] = await Promise.all([
    sql`
      SELECT
        facility_id, facility_name, county, city,
        program_type, facility_status,
        total_capacity, infant_capacity, toddler_capacity,
        preschool_capacity, school_age_capacity,
        provider_name, license_expiration_date
      FROM facilities
      ORDER BY facility_name
      LIMIT 200
    `,
    sql`SELECT COUNT(*)::int AS total FROM facilities`,
  ])

  return (
    <FacilityTable
      facilities={rows.map(r => ({
        facility_id:             Number(r.facility_id),
        facility_name:           r.facility_name as string,
        county:                  r.county as string,
        city:                    r.city as string,
        program_type:            r.program_type as string,
        facility_status:         r.facility_status as string,
        total_capacity:          Number(r.total_capacity),
        infant_capacity:         Number(r.infant_capacity),
        toddler_capacity:        Number(r.toddler_capacity),
        preschool_capacity:      Number(r.preschool_capacity),
        school_age_capacity:     Number(r.school_age_capacity),
        provider_name:           r.provider_name as string | null,
        license_expiration_date: r.license_expiration_date as string | null,
      }))}
      total={Number(countRows[0].total)}
    />
  )
}
