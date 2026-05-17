import { Suspense } from 'react'
import { sql } from '@/lib/db'
import LeaderboardTable from './LeaderboardTable'
import { AVAILABLE_SEASONS } from '@/lib/season'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, unknown>

export default async function LeaderboardPage() {
  let passers:   AnyRow[] = []
  let rushers:   AnyRow[] = []
  let receivers: AnyRow[] = []

  try {
    const results = await Promise.all([
      sql`
        WITH ranked AS (
          SELECT player_slug, player_name, school_slug, school_name, completions, attempts,
                 pass_yards, pass_tds, interceptions, season,
                 comp_pct, ypa, ypc, td_rate, int_rate, td_int_ratio, yva,
                 cmd_score, gbi_score, ies_score,
                 ROW_NUMBER() OVER (PARTITION BY season ORDER BY pass_yards DESC NULLS LAST) AS rn
          FROM player_season_stats
          WHERE stat_type = 'Passing' AND season = ANY(${[2020, ...AVAILABLE_SEASONS]})
        )
        SELECT * FROM ranked WHERE rn <= 25
        ORDER BY season DESC, pass_yards DESC NULLS LAST
      `,
      sql`
        WITH ranked AS (
          SELECT player_slug, player_name, school_slug, school_name, rush_attempts,
                 rush_yards, rush_tds, games_played, yards_per_game, season,
                 ROW_NUMBER() OVER (PARTITION BY season ORDER BY rush_yards DESC NULLS LAST) AS rn
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season = ANY(${[2020, ...AVAILABLE_SEASONS]})
        )
        SELECT * FROM ranked WHERE rn <= 25
        ORDER BY season DESC, rush_yards DESC NULLS LAST
      `,
      sql`
        WITH ranked AS (
          SELECT player_slug, player_name, school_slug, school_name, receptions,
                 recv_yards, recv_tds, season,
                 ROW_NUMBER() OVER (PARTITION BY season ORDER BY recv_yards DESC NULLS LAST) AS rn
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season = ANY(${[2020, ...AVAILABLE_SEASONS]})
        )
        SELECT * FROM ranked WHERE rn <= 25
        ORDER BY season DESC, recv_yards DESC NULLS LAST
      `,
    ])
    passers   = results[0] as AnyRow[]
    rushers   = results[1] as AnyRow[]
    receivers = results[2] as AnyRow[]
  } catch { /* DB not connected */ }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <Suspense fallback={null}>
      <LeaderboardTable passers={passers as any} rushers={rushers as any} receivers={receivers as any} />
    </Suspense>
  )
}
