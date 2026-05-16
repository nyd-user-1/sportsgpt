import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [playerRows, teamRows, schoolRows] = await Promise.all([
    sql`
      SELECT p.slug, p.name, p.position, p.school_slug,
             t.name AS team_name
      FROM players p
      LEFT JOIN teams t ON t.school_slug = p.school_slug
        AND t.name ILIKE '%football%'
      ORDER BY p.name
    `,
    sql`
      SELECT slug, name, division, school_slug
      FROM teams
      WHERE name ILIKE '%football%'
      ORDER BY name
    `,
    sql`
      SELECT slug, name FROM schools ORDER BY name
    `,
  ])

  return NextResponse.json({
    players: playerRows,
    teams:   teamRows,
    schools: schoolRows,
  })
}
