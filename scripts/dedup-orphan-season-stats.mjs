// Remove leftover buggy-slug player_season_stats rows that are EXACT duplicates
// of their canonical twin.
//
// After reconcile-season-stat-slugs.mjs, some buggy-slug rows couldn't be
// reslugged because a canonical-slug row already existed for the same
// (player, season, stat_type). Those buggy rows are orphaned (their slug 404s)
// yet still render as a second, broken entry in Top Players.
//
// This deletes a buggy-slug row ONLY when its canonical twin has identical stat
// values across every column compared below (true duplicate, zero data loss).
// Rows whose numbers differ are LEFT IN PLACE and reported for manual review.
//
// Dry run (read-only, default):  node --env-file=.env.local scripts/dedup-orphan-season-stats.mjs
// Apply:                         node --env-file=.env.local scripts/dedup-orphan-season-stats.mjs --apply

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }
const sql = neon(DATABASE_URL)

const APPLY = process.argv.includes('--apply')

// Buggy orphan rows that have a canonical twin (matched by name+school), with a
// flag for whether every stat column is identical.
const rows = await sql`
  WITH orphan AS (
    SELECT b.*, (
      SELECT slug FROM players p
      WHERE p.school_slug = b.school_slug
        AND lower(trim(regexp_replace(p.name,' +',' ','g'))) = lower(trim(regexp_replace(b.player_name,' +',' ','g')))
      LIMIT 1
    ) AS good_slug
    FROM player_season_stats b
    LEFT JOIN players p0 ON p0.slug = b.player_slug
    WHERE p0.slug IS NULL
  )
  SELECT o.id, o.player_slug AS bad_slug, o.good_slug, o.player_name, o.season, o.stat_type,
    (o.pass_yards    IS NOT DISTINCT FROM g.pass_yards
     AND o.pass_tds  IS NOT DISTINCT FROM g.pass_tds
     AND o.rush_yards IS NOT DISTINCT FROM g.rush_yards
     AND o.rush_tds  IS NOT DISTINCT FROM g.rush_tds
     AND o.recv_yards IS NOT DISTINCT FROM g.recv_yards
     AND o.recv_tds  IS NOT DISTINCT FROM g.recv_tds
     AND o.points    IS NOT DISTINCT FROM g.points
     AND o.completions IS NOT DISTINCT FROM g.completions
     AND o.attempts  IS NOT DISTINCT FROM g.attempts
     AND o.receptions IS NOT DISTINCT FROM g.receptions
     AND o.interceptions IS NOT DISTINCT FROM g.interceptions) AS identical
  FROM orphan o
  JOIN player_season_stats g
    ON g.player_slug = o.good_slug AND g.season = o.season AND g.stat_type = o.stat_type
  WHERE o.good_slug IS NOT NULL`

const identical = rows.filter(r => r.identical)
const differing = rows.filter(r => !r.identical)

console.log(`\n=== ${APPLY ? 'APPLIED' : 'DRY RUN (no writes)'} ===`)
console.log(`buggy rows with a canonical twin : ${rows.length}`)
console.log(`exact duplicates (delete)        : ${identical.length}`)
console.log(`differing (left for review)      : ${differing.length}`)

if (APPLY && identical.length) {
  for (const r of identical) {
    await sql`DELETE FROM player_season_stats WHERE id = ${r.id}`
  }
  console.log(`\ndeleted ${identical.length} exact-duplicate rows.`)
}

if (differing.length) {
  console.log(`\ndiffering rows kept for manual review:`)
  for (const d of differing) {
    console.log(`  ${d.player_name} ${d.season} ${d.stat_type}: bad='${d.bad_slug}' vs good='${d.good_slug}'`)
  }
}
