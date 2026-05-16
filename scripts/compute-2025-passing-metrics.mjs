/**
 * compute-2025-passing-metrics.mjs
 * Computes derived passing stats for season=2025 rows.
 * Usage: node --env-file=.env.local scripts/compute-2025-passing-metrics.mjs
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const INT_RATE_FLOOR = 0.005 // decimal (= 0.5%) — prevents CMD div/0 for 0-INT QBs

async function main() {
  const rows = await sql`
    SELECT player_slug, completions, attempts, pass_yards, pass_tds, interceptions
    FROM player_season_stats
    WHERE season = 2025 AND stat_type = 'Passing'
  `

  const avgYds = rows.reduce((s, r) => s + (Number(r.pass_yards) || 0), 0) / rows.length

  for (const r of rows) {
    const comp = Number(r.completions) || 0
    const att  = Number(r.attempts)   || 1
    const yds  = Number(r.pass_yards) || 0
    const tds  = Number(r.pass_tds)   || 0
    const ints = Number(r.interceptions) ?? 0

    const compPct       = att > 0 ? (comp / att) * 100 : null        // stored as % (e.g. 77.9)
    const ypa           = att > 0 ? yds / att : null
    const ypc           = comp > 0 ? yds / comp : null
    const tdRate        = att > 0 ? (tds / att) * 100 : null          // stored as % (e.g. 13.4)
    const intRate       = att > 0 ? (ints / att) * 100 : null         // stored as % (e.g. 2.77)
    const intRateDec    = att > 0 ? (ints / att) : 0                  // decimal form for formulas
    const intFloorDec   = Math.max(intRateDec, INT_RATE_FLOOR)
    const compDec       = att > 0 ? comp / att : 0
    const tdRateDec     = att > 0 ? tds / att : 0
    const tdInt         = ints > 0 ? tds / ints : tds                 // 0 INT → display TD count
    const yva           = yds - avgYds
    const cmd           = compPct != null ? (compDec * tdRateDec) / intFloorDec : null
    const gbi           = ypa != null ? ypa + tdInt * 2 + tdRateDec * 0.5 : null
    const ies           = ypa != null ? (tds * ypa) / (ints + 1) : null

    await sql`
      UPDATE player_season_stats SET
        comp_pct     = ${compPct},
        ypa          = ${ypa},
        ypc          = ${ypc},
        td_rate      = ${tdRate},
        int_rate     = ${intRate},
        td_int_ratio = ${tdInt},
        yva          = ${yva},
        cmd_score    = ${cmd},
        gbi_score    = ${gbi},
        ies_score    = ${ies}
      WHERE player_slug = ${r.player_slug} AND season = 2025 AND stat_type = 'Passing'
    `
    console.log(`${r.player_slug}: comp%=${compPct?.toFixed(1)} ypa=${ypa?.toFixed(2)} cmd=${cmd?.toFixed(2)} gbi=${gbi?.toFixed(2)} ies=${ies?.toFixed(2)}`)
  }

  console.log(`\nDone: ${rows.length} rows updated`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
