import { sql } from '@/lib/db'
import PlayerIndexTable from './PlayerIndexTable'

export const dynamic = 'force-dynamic'

export default async function PlayerPage() {
  let players: { slug: string; name: string; team_name: string | null; position: string | null }[] = []

  try {
    const rows = await sql`
      SELECT p.slug, p.name, p.position,
        t.name AS team_name
      FROM players p
      LEFT JOIN teams t ON t.slug = p.team_slug
      ORDER BY p.name
    `
    players = rows.map(r => ({
      slug:      r.slug as string,
      name:      r.name as string,
      position:  r.position as string | null,
      team_name: r.team_name
        ? (r.team_name as string).replace(/\s+Varsity\s+Football$/i, '')
        : null,
    }))
  } catch { /* DB not connected */ }

  return <PlayerIndexTable players={players} />
}
