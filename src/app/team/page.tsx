import { sql } from '@/lib/db'
import TeamTable from './TeamTable'
import { PLACEHOLDER_TEAMS, type TeamRow } from '@/lib/placeholder-data'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  let teams: TeamRow[] = PLACEHOLDER_TEAMS
  let total = PLACEHOLDER_TEAMS.length

  try {
    const [rows, countRows] = await Promise.all([
      sql`SELECT id, name, school, section, division, city, county, wins, losses, pf, pa, coach FROM teams ORDER BY wins DESC, pf DESC LIMIT 200`,
      sql`SELECT COUNT(*)::int AS total FROM teams`,
    ])
    if (rows.length > 0) {
      teams = rows.map(r => ({
        id: Number(r.id), name: r.name as string, school: r.school as string,
        section: r.section as string, division: r.division as string,
        city: r.city as string, county: r.county as string,
        wins: Number(r.wins), losses: Number(r.losses),
        pf: Number(r.pf), pa: Number(r.pa), coach: r.coach as string,
      }))
      total = Number(countRows[0].total)
    }
  } catch { /* DB not connected — showing placeholder data */ }

  return <TeamTable teams={teams} total={total} />
}
