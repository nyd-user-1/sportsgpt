#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
// scripts/normalize-school-names.mjs
//
// PURPOSE
// -------
// player_season_stats.school_name was populated from multiple sources:
//   - player_game_stats (which uses teams.name: "Floyd Varsity Football")
//   - leaderboard ingest (which uses abbreviations: "WFHS", "WMHS", "SWRHS")
//   - schools table (canonical short names: "Floyd", "Ward Melville")
//
// This script normalizes ALL school_name values in player_season_stats to the
// canonical schools.name (joined via school_slug). Safe to re-run — idempotent.
//
// Usage:
//   node --env-file=.env.local scripts/normalize-school-names.mjs [--apply]
// ──────────────────────────────────────────────────────────────────────────────

import { neon } from '@neondatabase/serverless'

const sql    = neon(process.env.DATABASE_URL)
const APPLY  = process.argv.includes('--apply')

const bad = await sql`
  SELECT COUNT(*) AS rows_to_fix
  FROM player_season_stats pss
  JOIN schools s ON s.slug = pss.school_slug
  WHERE pss.school_name IS DISTINCT FROM s.name
`

const count = Number(bad[0].rows_to_fix)
console.log(`school_name normalization — ${APPLY ? 'APPLY MODE' : 'DRY RUN'}`)
console.log(`Rows needing update: ${count}`)

if (count === 0) {
  console.log('Nothing to do — all school_name values already canonical.')
  process.exit(0)
}

if (!APPLY) {
  // Show a sample of what would be fixed
  const sample = await sql`
    SELECT pss.school_name AS bad, s.name AS canonical, COUNT(*) AS rows
    FROM player_season_stats pss
    JOIN schools s ON s.slug = pss.school_slug
    WHERE pss.school_name IS DISTINCT FROM s.name
    GROUP BY pss.school_name, s.name
    ORDER BY rows DESC
    LIMIT 10
  `
  console.log('\nTop mismatches (sample):')
  for (const r of sample) {
    console.log(`  ${String(r.rows).padStart(4)} rows | "${r.bad}" → "${r.canonical}"`)
  }
  console.log('\nRun with --apply to fix.')
  process.exit(0)
}

const result = await sql`
  UPDATE player_season_stats pss
  SET school_name = s.name
  FROM schools s
  WHERE s.slug = pss.school_slug
    AND pss.school_name IS DISTINCT FROM s.name
  RETURNING 1
`

console.log(`Normalized ${result.length} rows.`)
process.exit(0)
