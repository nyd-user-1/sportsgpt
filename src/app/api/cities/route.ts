import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const search  = req.nextUrl.searchParams.get('search')?.trim() ?? ''
  const limit   = 200
  const pattern = search ? `%${search}%` : null

  const [rows, countRows] = await Promise.all([
    pattern
      ? sql`
          SELECT MAX(city) AS city, MAX(county) AS county,
            regexp_replace(lower(MAX(city)), '[^a-z0-9]+', '-', 'g') AS slug,
            COUNT(*)::int                           AS provider_count,
            COALESCE(SUM(total_capacity),      0)::int AS total_capacity,
            COALESCE(SUM(infant_capacity),     0)::int AS infant_capacity,
            COALESCE(SUM(toddler_capacity),    0)::int AS toddler_capacity,
            COALESCE(SUM(preschool_capacity),  0)::int AS preschool_capacity,
            COALESCE(SUM(school_age_capacity), 0)::int AS school_age_capacity
          FROM facilities
          WHERE city ILIKE ${pattern} OR county ILIKE ${pattern}
          GROUP BY lower(city) ORDER BY MAX(city) LIMIT ${limit}
        `
      : sql`
          SELECT MAX(city) AS city, MAX(county) AS county,
            regexp_replace(lower(MAX(city)), '[^a-z0-9]+', '-', 'g') AS slug,
            COUNT(*)::int                           AS provider_count,
            COALESCE(SUM(total_capacity),      0)::int AS total_capacity,
            COALESCE(SUM(infant_capacity),     0)::int AS infant_capacity,
            COALESCE(SUM(toddler_capacity),    0)::int AS toddler_capacity,
            COALESCE(SUM(preschool_capacity),  0)::int AS preschool_capacity,
            COALESCE(SUM(school_age_capacity), 0)::int AS school_age_capacity
          FROM facilities
          GROUP BY lower(city) ORDER BY MAX(city) LIMIT ${limit}
        `,
    pattern
      ? sql`SELECT COUNT(DISTINCT lower(city))::int AS total FROM facilities
             WHERE city ILIKE ${pattern} OR county ILIKE ${pattern}`
      : sql`SELECT COUNT(DISTINCT lower(city))::int AS total FROM facilities`,
  ])

  return NextResponse.json({ data: rows, total: Number(countRows[0].total) })
}
