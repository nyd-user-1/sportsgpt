// Reconcile player_season_stats.player_slug with the canonical players.slug.
//
// player_season_stats was ingested with a buggy slugifier (first+last with no
// hyphen, plus a character substitution) — e.g. 'ryanfilippi', 'chri-tianru-o'
// — while players + player_game_stats use the canonical 'ryan-filippi',
// 'christian-russo'. Those bad slugs 404 on /player/[slug] and break the join
// that loads a player's season stats on their own page.
//
// This matches each orphan slug (not present in players) to a UNIQUE players
// row by collapsed-whitespace name within the same school, then updates its
// player_season_stats rows to the canonical slug. UNIQUE(player_slug, season,
// stat_type) means a canonical row can already exist — those rows are SKIPPED
// (not overwritten/deleted) and reported, never errored on.
//
// Dry run (read-only, default):  node --env-file=.env.local scripts/reconcile-season-stat-slugs.mjs
// Apply:                         node --env-file=.env.local scripts/reconcile-season-stat-slugs.mjs --apply

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('ERROR: DATABASE_URL not set'); process.exit(1) }
const sql = neon(DATABASE_URL)

const APPLY = process.argv.includes('--apply')

const orphans = await sql`
  SELECT DISTINCT pss.player_slug, pss.player_name, pss.school_slug
  FROM player_season_stats pss
  LEFT JOIN players p ON p.slug = pss.player_slug
  WHERE p.slug IS NULL`

let updated = 0, collisions = 0, unmatched = 0
const unresolved = []

for (const o of orphans) {
  const cands = await sql`
    SELECT slug FROM players
    WHERE school_slug = ${o.school_slug}
      AND lower(trim(regexp_replace(name, ' +', ' ', 'g'))) = lower(trim(regexp_replace(${o.player_name}, ' +', ' ', 'g')))`

  if (cands.length !== 1) {
    unmatched++
    if (unresolved.length < 20) unresolved.push(`${o.player_slug} (${o.player_name} @ ${o.school_slug ?? 'null'}) — ${cands.length} candidates`)
    continue
  }

  const target = cands[0].slug
  const rows = await sql`SELECT id, season, stat_type FROM player_season_stats WHERE player_slug = ${o.player_slug}`
  for (const r of rows) {
    const clash = await sql`
      SELECT 1 FROM player_season_stats
      WHERE player_slug = ${target} AND season = ${r.season} AND stat_type = ${r.stat_type} LIMIT 1`
    if (clash.length) { collisions++; continue }
    if (APPLY) await sql`UPDATE player_season_stats SET player_slug = ${target} WHERE id = ${r.id}`
    updated++
  }
}

console.log(`\n=== ${APPLY ? 'APPLIED' : 'DRY RUN (no writes)'} ===`)
console.log(`orphan slugs examined                       : ${orphans.length}`)
console.log(`rows reslugged to canonical                 : ${updated}`)
console.log(`rows skipped (canonical row already exists) : ${collisions}`)
console.log(`orphan slugs with no unique players match   : ${unmatched}`)
if (unresolved.length) { console.log('\nunmatched sample:'); unresolved.forEach(u => console.log('  ' + u)) }

if (APPLY) {
  const rem = await sql`
    SELECT COUNT(DISTINCT pss.player_slug)::int n
    FROM player_season_stats pss LEFT JOIN players p ON p.slug = pss.player_slug
    WHERE p.slug IS NULL`
  console.log(`\nremaining orphan slugs after reconcile: ${rem[0].n}`)
}
