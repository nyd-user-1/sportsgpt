import { sql } from '@/lib/db'
import SchoolTable from './SchoolTable'
import { PLACEHOLDER_SCHOOLS, type SchoolRow } from '@/lib/placeholder-data'

export const dynamic = 'force-dynamic'

export default async function SchoolPage() {
  let schools: SchoolRow[] = PLACEHOLDER_SCHOOLS
  let total = PLACEHOLDER_SCHOOLS.length

  try {
    const [rows, countRows] = await Promise.all([
      sql`SELECT id, name, city, county, section, division, enrollment, teams, wins, losses FROM schools ORDER BY name LIMIT 200`,
      sql`SELECT COUNT(*)::int AS total FROM schools`,
    ])
    if (rows.length > 0) {
      schools = rows.map(r => ({
        id: Number(r.id), name: r.name as string, city: r.city as string,
        county: r.county as string, section: r.section as string, division: r.division as string,
        enrollment: Number(r.enrollment), teams: Number(r.teams),
        wins: Number(r.wins), losses: Number(r.losses),
      }))
      total = Number(countRows[0].total)
    }
  } catch { /* DB not connected — showing placeholder data */ }

  return <SchoolTable schools={schools} total={total} />
}
