// Backfill NULL player_game_stats.player_slug by matching player_name → players.slug.
//
// The box-score ingest left player_slug NULL whenever a name didn't match a
// players row (often a whitespace quirk, e.g. "Nick  Sevilla" with a double
// space). Those rows render as /player/null on team Player Logs → 404.
//
// This script collapses internal whitespace + lowercases the name and matches
// within the same school. It ONLY fills rows where player_slug IS NULL and the
// match is UNIQUE — it never overwrites an existing slug, and skips ambiguous
// or unmatched names (reported for manual review).
//
// Dry run (read-only, default):  node --env-file=.env.local scripts/backfill-player-game-slugs.mjs
// Apply:                         node --env-file=.env.local scripts/backfill-player-game-slugs.mjs --apply

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }
const sql = neon(DATABASE_URL)

const APPLY = process.argv.includes('--apply')

const pairs = await sql`
  SELECT player_name, school_slug, COUNT(*)::int AS rows
  FROM player_game_stats
  WHERE player_slug IS NULL
  GROUP BY player_name, school_slug
  ORDER BY rows DESC`

let matchedPairs = 0, matchedRows = 0, ambiguous = 0, unmatched = 0
const unresolved = []

for (const { player_name, school_slug, rows } of pairs) {
  const cands = await sql`
    SELECT slug FROM players
    WHERE school_slug = ${school_slug}
      AND lower(trim(regexp_replace(name, ' +', ' ', 'g'))) = lower(trim(regexp_replace(${player_name}, ' +', ' ', 'g')))`

  if (cands.length === 1) {
    matchedPairs++; matchedRows += rows
    if (APPLY) {
      await sql`
        UPDATE player_game_stats SET player_slug = ${cands[0].slug}
        WHERE player_slug IS NULL AND player_name = ${player_name} AND school_slug = ${school_slug}`
    }
  } else if (cands.length > 1) {
    ambiguous++
    unresolved.push({ player_name, school_slug, rows, reason: `${cands.length} candidate slugs` })
  } else {
    unmatched++
    unresolved.push({ player_name, school_slug, rows, reason: 'no players row for this name+school' })
  }
}

console.log(`\n=== ${APPLY ? 'APPLIED' : 'DRY RUN (no writes)'} ===`)
console.log(`distinct NULL-slug name/school pairs : ${pairs.length}`)
console.log(`matched uniquely                     : ${matchedPairs} pairs / ${matchedRows} rows`)
console.log(`ambiguous (multiple candidates)      : ${ambiguous}`)
console.log(`unmatched (no players row)           : ${unmatched}`)
if (unresolved.length) {
  console.log(`\nunresolved (first 25):`)
  for (const u of unresolved.slice(0, 25)) {
    console.log(`  ${u.player_name} @ ${u.school_slug} (${u.rows} rows) — ${u.reason}`)
  }
}

if (APPLY) {
  const rem = await sql`SELECT COUNT(*)::int AS n FROM player_game_stats WHERE player_slug IS NULL`
  console.log(`\nremaining NULL-slug rows after backfill: ${rem[0].n}`)
}
