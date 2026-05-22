import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const teamSlug = `${slug}-varsity-football`
  const rows = await sql`
    SELECT tss.season,
           tss.overall_wins   AS wins,
           tss.overall_losses AS losses,
           tss.overall_ties   AS ties,
           tss.conference_wins AS conf_wins,
           tss.conference_losses AS conf_losses,
           t.name, t.division, t.school_slug
    FROM team_season_stats tss
    JOIN teams t ON t.slug = tss.team_slug
    WHERE tss.team_slug = ${teamSlug}
    ORDER BY tss.season DESC`
  return NextResponse.json(rows)
}
