import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { FacilityShell } from './Shell'

export default async function DetailPageFacility({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const rows = await sql`
    SELECT
      facility_id, program_type, county, facility_status, facility_name,
      street_number, street_name, city, zip_code, phone_number, provider_name,
      infant_capacity, toddler_capacity, preschool_capacity, school_age_capacity, total_capacity,
      facility_opened_date, license_issue_date, license_expiration_date
    FROM facilities
    WHERE regexp_replace(lower(facility_name), '[^a-z0-9]+', '-', 'g') = ${slug}
    ORDER BY facility_id
    LIMIT 1
  `
  const facility = rows[0]
  if (!facility) notFound()

  const [prevRows, nextRows, firstRows, lastRows, countyRows] = await Promise.all([
    sql`
      SELECT regexp_replace(lower(facility_name), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities
      WHERE county = ${facility.county} AND facility_name < ${facility.facility_name}
      ORDER BY facility_name DESC LIMIT 1
    `,
    sql`
      SELECT regexp_replace(lower(facility_name), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities
      WHERE county = ${facility.county} AND facility_name > ${facility.facility_name}
      ORDER BY facility_name ASC LIMIT 1
    `,
    sql`
      SELECT regexp_replace(lower(facility_name), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities WHERE county = ${facility.county} ORDER BY facility_name ASC LIMIT 1
    `,
    sql`
      SELECT regexp_replace(lower(facility_name), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities WHERE county = ${facility.county} ORDER BY facility_name DESC LIMIT 1
    `,
    sql`
      SELECT facility_id, facility_name, program_type, total_capacity, city,
        regexp_replace(lower(facility_name), '[^a-z0-9]+', '-', 'g') AS slug
      FROM facilities
      WHERE county = ${facility.county} AND facility_id != ${facility.facility_id}
      ORDER BY facility_name
      LIMIT 20
    `,
  ])

  const prevSlug = (prevRows[0]?.slug ?? lastRows[0]?.slug ?? slug) as string
  const nextSlug = (nextRows[0]?.slug ?? firstRows[0]?.slug ?? slug) as string

  return (
    <FacilityShell
      facility={{
        facility_id:             Number(facility.facility_id),
        facility_name:           facility.facility_name as string,
        program_type:            facility.program_type as string,
        county:                  facility.county as string,
        facility_status:         facility.facility_status as string,
        provider_name:           facility.provider_name as string | null,
        street_number:           facility.street_number as string | null,
        street_name:             facility.street_name as string | null,
        city:                    facility.city as string,
        zip_code:                facility.zip_code as string,
        phone_number:            facility.phone_number as string | null,
        total_capacity:          Number(facility.total_capacity),
        infant_capacity:         Number(facility.infant_capacity),
        toddler_capacity:        Number(facility.toddler_capacity),
        preschool_capacity:      Number(facility.preschool_capacity),
        school_age_capacity:     Number(facility.school_age_capacity),
        facility_opened_date:    facility.facility_opened_date as string | null,
        license_issue_date:      facility.license_issue_date as string | null,
        license_expiration_date: facility.license_expiration_date as string | null,
      }}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      countyFacilities={countyRows.map(f => ({
        facility_id:    Number(f.facility_id),
        facility_name:  f.facility_name as string,
        program_type:   f.program_type as string,
        total_capacity: Number(f.total_capacity),
        city:           f.city as string,
        slug:           f.slug as string,
      }))}
    />
  )
}
