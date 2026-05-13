import { sql } from '@/lib/db'
import PlayerTable from './PlayerTable'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>

export default async function PlayerPage() {
  let passers:   AnyRow[] = []
  let rushers:   AnyRow[] = []
  let receivers: AnyRow[] = []

  try {
    const results = await Promise.all([
      sql`
        SELECT player_slug, player_name, school_name, completions, attempts,
               pass_yards, pass_tds, interceptions, season
        FROM player_season_stats
        WHERE stat_type = 'Passing' AND season = 2024
        ORDER BY pass_yards DESC NULLS LAST
        LIMIT 25
      `,
      sql`
        SELECT player_slug, player_name, school_name, rush_attempts,
               rush_yards, rush_tds, season
        FROM player_season_stats
        WHERE stat_type = 'Rushing' AND season = 2024
        ORDER BY rush_yards DESC NULLS LAST
        LIMIT 25
      `,
      sql`
        SELECT player_slug, player_name, school_name, receptions,
               recv_yards, recv_tds, season
        FROM player_season_stats
        WHERE stat_type = 'Receiving' AND season = 2024
        ORDER BY recv_yards DESC NULLS LAST
        LIMIT 25
      `,
    ])
    passers   = results[0] as unknown as AnyRow[]
    rushers   = results[1] as unknown as AnyRow[]
    receivers = results[2] as unknown as AnyRow[]
  } catch { /* DB not connected */ }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <PlayerTable
      passers={passers as any}
      rushers={rushers as any}
      receivers={receivers as any}
    />
  )
}
