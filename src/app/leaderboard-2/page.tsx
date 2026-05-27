import { Suspense } from 'react'
import { sql } from '@/lib/db'
import { LeaderboardYearbook } from './Shell'
import { AVAILABLE_SEASONS } from '@/lib/season'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, unknown>

export default async function LeaderboardMagazinePage() {
  let passers:   AnyRow[] = []
  let rushers:   AnyRow[] = []
  let receivers: AnyRow[] = []

  try {
    const results = await Promise.all([
      sql`
        WITH varsity AS (
          SELECT DISTINCT ON (school_slug) school_slug, division
          FROM teams
          WHERE name ILIKE '%varsity%'
          ORDER BY school_slug, name
        ),
        ranked AS (
          SELECT pss.player_slug, pss.player_name, pss.school_slug, pss.school_name, pss.completions, pss.attempts,
                 pss.pass_yards, pss.pass_tds, pss.interceptions, pss.season,
                 pss.comp_pct, pss.ypa, pss.ypc, pss.td_rate, pss.int_rate, pss.td_int_ratio, pss.yva,
                 pss.cmd_score, pss.gbi_score, pss.ies_score,
                 v.division,
                 ROW_NUMBER() OVER (PARTITION BY pss.season ORDER BY pss.pass_yards DESC NULLS LAST) AS rn
          FROM player_season_stats pss
          LEFT JOIN varsity v ON v.school_slug = pss.school_slug
          WHERE pss.stat_type = 'Passing' AND pss.season = ANY(${[2020, ...AVAILABLE_SEASONS]})
        )
        SELECT * FROM ranked WHERE rn <= 25
        ORDER BY season DESC, pass_yards DESC NULLS LAST
      `,
      sql`
        WITH varsity AS (
          SELECT DISTINCT ON (school_slug) school_slug, division
          FROM teams
          WHERE name ILIKE '%varsity%'
          ORDER BY school_slug, name
        ),
        ranked AS (
          SELECT pss.player_slug, pss.player_name, pss.school_slug, pss.school_name, pss.rush_attempts,
                 pss.rush_yards, pss.rush_tds, pss.games_played, pss.yards_per_game, pss.season,
                 v.division,
                 ROW_NUMBER() OVER (PARTITION BY pss.season ORDER BY pss.rush_yards DESC NULLS LAST) AS rn
          FROM player_season_stats pss
          LEFT JOIN varsity v ON v.school_slug = pss.school_slug
          WHERE pss.stat_type = 'Rushing' AND pss.season = ANY(${[2020, ...AVAILABLE_SEASONS]})
        )
        SELECT * FROM ranked WHERE rn <= 25
        ORDER BY season DESC, rush_yards DESC NULLS LAST
      `,
      sql`
        WITH varsity AS (
          SELECT DISTINCT ON (school_slug) school_slug, division
          FROM teams
          WHERE name ILIKE '%varsity%'
          ORDER BY school_slug, name
        ),
        ranked AS (
          SELECT pss.player_slug, pss.player_name, pss.school_slug, pss.school_name, pss.receptions,
                 pss.recv_yards, pss.recv_tds, pss.season,
                 v.division,
                 ROW_NUMBER() OVER (PARTITION BY pss.season ORDER BY pss.recv_yards DESC NULLS LAST) AS rn
          FROM player_season_stats pss
          LEFT JOIN varsity v ON v.school_slug = pss.school_slug
          WHERE pss.stat_type = 'Receiving' AND pss.season = ANY(${[2020, ...AVAILABLE_SEASONS]})
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
      <LeaderboardYearbook
        passers={passers as any}
        rushers={rushers as any}
        receivers={receivers as any}
        availableSeasons={[2020, ...AVAILABLE_SEASONS].sort((a, b) => b - a)}
      />
    </Suspense>
  )
}
