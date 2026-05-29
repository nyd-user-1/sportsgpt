import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { queryStem } from '@/lib/search'

export const dynamic = 'force-dynamic'

// Aggregated click leaderboard is hard-capped: anything that falls out of the
// top N (lowest count, oldest first) is evicted, so the table never bloats.
const MAX_LOGGED_ROWS = 50

const TYPES = new Set(['player', 'team', 'school', 'chart', 'game', 'season'])

export async function POST(req: NextRequest) {
  let body: { query?: string; key?: string; type?: string; label?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const stem = queryStem(body.query ?? '')
  const key = (body.key ?? '').trim()
  const type = (body.type ?? '').trim()
  const label = (body.label ?? '').trim()

  // Defense in depth: the client only logs result-card clicks, but guard the
  // boundary anyway. Empty stem/key means there's nothing meaningful to learn.
  if (!stem || !key || !TYPES.has(type) || !label) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Atomic increment — first click inserts at count 1, repeats bump the count.
  await sql`
    INSERT INTO search_clicks (query_stem, result_key, result_type, result_label, count, updated_at)
    VALUES (${stem}, ${key}, ${type}, ${label}, 1, now())
    ON CONFLICT (query_stem, result_key)
    DO UPDATE SET count = search_clicks.count + 1, updated_at = now()
  `

  // Evict the single lowest-value row beyond the cap. OFFSET MAX_LOGGED_ROWS
  // returns nothing until the table exceeds the cap, so this is a no-op while
  // small; LIMIT 1 keeps it to one row even when (count, updated_at) ties.
  await sql`
    DELETE FROM search_clicks
    WHERE (query_stem, result_key) = (
      SELECT query_stem, result_key
      FROM search_clicks
      ORDER BY count ASC, updated_at ASC
      OFFSET ${MAX_LOGGED_ROWS}
      LIMIT 1
    )
  `

  return NextResponse.json({ ok: true })
}
