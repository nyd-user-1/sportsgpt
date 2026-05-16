import { Suspense } from 'react'
import { sql } from '@/lib/db'
import { PanelCompare, type AnyPlayer } from '@/components/PanelCompare'

export const dynamic = 'force-dynamic'

function parseKey(key: string): { slug: string; season: number } | null {
  const idx = key.lastIndexOf('__')
  if (idx === -1) return null
  const slug = key.slice(0, idx)
  const season = parseInt(key.slice(idx + 2), 10)
  if (!slug || isNaN(season)) return null
  return { slug, season }
}

async function fetchPlayer(slug: string, season: number, tab: string): Promise<AnyPlayer | null> {
  try {
    const rows = await sql`
      SELECT pss.player_slug, pss.player_name, pss.school_slug, pss.school_name,
             pss.completions, pss.attempts, pss.pass_yards, pss.pass_tds, pss.interceptions, pss.season,
             pss.comp_pct, pss.ypa, pss.ypc, pss.td_rate, pss.int_rate, pss.td_int_ratio, pss.yva,
             pss.cmd_score, pss.gbi_score, pss.ies_score,
             pss.rush_yards, pss.rush_attempts, pss.rush_tds,
             pss.recv_yards, pss.receptions, pss.recv_tds,
             pl.position
      FROM player_season_stats pss
      LEFT JOIN players pl ON pl.slug = pss.player_slug
      WHERE pss.player_slug = ${slug}
        AND pss.season = ${season}
        AND pss.stat_type = ${tab}
      LIMIT 1
    `
    if (!rows[0]) return null
    return rows[0] as AnyPlayer
  } catch {
    return null
  }
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; tab?: string }>
}) {
  const { a, b, tab: rawTab } = await searchParams

  if (!a && !b) return null

  const statTab = (rawTab === 'Rushing' || rawTab === 'Receiving') ? rawTab : 'Passing'

  const parsedA = a ? parseKey(a) : null
  const parsedB = b ? parseKey(b) : null

  const [playerA, playerB] = await Promise.all([
    parsedA ? fetchPlayer(parsedA.slug, parsedA.season, statTab) : Promise.resolve(null),
    parsedB ? fetchPlayer(parsedB.slug, parsedB.season, statTab) : Promise.resolve(null),
  ])

  return (
    <Suspense fallback={null}>
      <PanelCompare playerA={playerA} playerB={playerB} statTab={statTab} />
    </Suspense>
  )
}
