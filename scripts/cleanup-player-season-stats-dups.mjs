#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
// scripts/cleanup-player-season-stats-dups.mjs
//
// PURPOSE
// -------
// The first additive backfill run grouped by player_slug, but the same player
// appears in player_game_stats under multiple slugs (e.g. "aj-cannet" vs
// "ajcannet") due to scraping inconsistencies. That fragmented some players
// into 2 duplicate rows for the same (player_name, school_slug, season, stat_type)
// even though only ONE such row should exist.
//
// This script identifies those duplicate groups and deletes all but one row
// per group, with priority:
//   1. Keep the leaderboard row (season_rank IS NOT NULL) if present
//   2. Otherwise keep the row with the most games_played (most complete aggregate)
//   3. Tiebreak by lowest id (oldest insert wins)
//
// USAGE
// -----
//   node --env-file=.env.local scripts/cleanup-player-season-stats-dups.mjs           # dry run
//   node --env-file=.env.local scripts/cleanup-player-season-stats-dups.mjs --apply   # write
// ──────────────────────────────────────────────────────────────────────────────

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const APPLY = process.argv.includes('--apply')
const SEASONS = [2021, 2022, 2023, 2024, 2025]

function bar() { console.log('─'.repeat(72)) }

async function main() {
  bar()
  console.log(`player_season_stats duplicate cleanup  (${APPLY ? 'APPLY MODE' : 'DRY RUN'})`)
  bar()

  // Find all duplicate groups. Within each group, rank rows by:
  //   season_rank IS NOT NULL DESC (leaderboard first),
  //   games_played DESC NULLS LAST (more complete first),
  //   id ASC (oldest first)
  // The row with rank=1 is the keeper; the rest get deleted.
  const allDups = await sql`
    WITH ranked AS (
      SELECT
        id, player_slug, player_name, school_slug, season, stat_type,
        season_rank, games_played,
        ROW_NUMBER() OVER (
          PARTITION BY player_name, school_slug, season, stat_type
          ORDER BY
            (season_rank IS NOT NULL) DESC,
            games_played DESC NULLS LAST,
            id ASC
        ) AS rank_in_group,
        COUNT(*) OVER (PARTITION BY player_name, school_slug, season, stat_type) AS group_size
      FROM player_season_stats
      WHERE season = ANY(${SEASONS})
        AND stat_type IN ('Passing','Rushing','Receiving')
    )
    SELECT * FROM ranked WHERE group_size > 1 ORDER BY player_name, season, stat_type, rank_in_group`

  const keepers = allDups.filter(r => Number(r.rank_in_group) === 1)
  const deletables = allDups.filter(r => Number(r.rank_in_group) > 1)

  console.log(`\n${allDups.length} rows in duplicate groups (${keepers.length} groups)`)
  console.log(`  Keep: ${keepers.length} (leaderboard or most-complete)`)
  console.log(`  Delete: ${deletables.length}`)

  // Print a few samples
  console.log('\nSample duplicate groups (keep ✓ / delete ✗):')
  let lastKey = ''
  let shown = 0
  for (const r of allDups) {
    const key = `${r.player_name}|${r.season}|${r.stat_type}`
    if (key !== lastKey) {
      lastKey = key
      shown++
      if (shown > 8) break
      console.log(`\n  ${r.player_name}  ${r.season} ${r.stat_type}:`)
    }
    const mark = Number(r.rank_in_group) === 1 ? '✓ keep  ' : '✗ delete'
    console.log(`    ${mark} id=${String(r.id).padStart(5)}  slug='${r.player_slug}'  rank=${r.season_rank ?? 'null'}  games=${r.games_played ?? 'null'}`)
  }

  if (!APPLY) {
    console.log('\n──────')
    console.log('DRY RUN — no rows deleted.')
    console.log('Re-run with --apply to execute.')
    console.log('──────')
    return
  }

  bar()
  console.log('Applying...')
  bar()

  const ids = deletables.map(r => r.id)
  if (ids.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  const deleted = await sql`DELETE FROM player_season_stats WHERE id = ANY(${ids}) RETURNING id`
  console.log(`Deleted ${deleted.length} duplicate rows`)
}

main().catch(err => {
  console.error('\nCleanup failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
