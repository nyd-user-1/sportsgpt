#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────────
// scripts/rebuild-player-season-stats.mjs
//
// PURPOSE — additive-only backfill
// --------------------------------
// `player_season_stats` is the Newsday top-25 leaderboard for each season —
// it's a blessed reference table, not a computed aggregate. Those rows MUST
// be preserved.
//
// Separately, `player_game_stats` has granular per-game player data scraped
// from box scores. Coverage is partial (not every game has a box score), but
// it contains thousands of players who never cracked the Newsday top-25 and
// therefore have no row in `player_season_stats`.
//
// This script ADDS those missing players. It never deletes, never updates
// existing rows. For each (player_name, school_slug, season, stat_type)
// combination present in game data but missing from the leaderboard, it
// inserts a single aggregated row.
//
// Re-runnability: safe to run any time. The NOT EXISTS guard ensures already-
// added (and already-present-in-leaderboard) rows are skipped on subsequent
// runs. If new box scores get ingested later, re-running adds the new players.
//
// Architectural note (future work)
// --------------------------------
// Conceptually we now have two distinct things in one table:
//   1. Newsday top-25 leaderboard (blessed, season totals from official source)
//   2. Game-aggregated rows for everyone else (potentially incomplete)
// A cleaner long-term schema would split these — e.g. rename the existing
// table to `player_season_leaderboard` and put aggregates in `player_season_aggregates`.
// For now they coexist in one table; chart queries treat them the same.
//
// USAGE
// -----
//   node --env-file=.env.local scripts/rebuild-player-season-stats.mjs           # dry run
//   node --env-file=.env.local scripts/rebuild-player-season-stats.mjs --apply   # write
// ──────────────────────────────────────────────────────────────────────────────

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const APPLY = process.argv.includes('--apply')

const SEASONS = [2021, 2022, 2023, 2024, 2025]

function bar() { console.log('─'.repeat(72)) }

async function snapshot(label) {
  const rows = await sql`
    SELECT season, stat_type, COUNT(*)::int AS n
    FROM player_season_stats
    WHERE season = ANY(${SEASONS}) AND stat_type IN ('Passing','Rushing','Receiving')
    GROUP BY season, stat_type
    ORDER BY season, stat_type`
  console.log(`\n${label}`)
  let total = 0
  for (const r of rows) {
    total += r.n
    console.log(`  ${r.season}  ${r.stat_type.padEnd(12)} ${String(r.n).padStart(5)}`)
  }
  console.log(`  TOTAL: ${total}`)
}

async function previewWouldAdd() {
  console.log('\nPlayers in game stats but missing from leaderboard (would be added)...')

  const passing = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Passing'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.pass_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Passing' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  const rushing = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Rushing'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.rush_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Rushing' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  const receiving = await sql`
    SELECT pgs.season, COUNT(DISTINCT (pgs.player_name, pgs.school_slug))::int AS n
    FROM player_game_stats pgs
    WHERE pgs.stat_type = 'Receiving'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.rec_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Receiving' AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.season ORDER BY pgs.season`

  for (const [label, counts] of [['Passing', passing], ['Rushing', rushing], ['Receiving', receiving]]) {
    console.log(`\n  ${label}:`)
    let total = 0
    for (const r of counts) {
      console.log(`    ${r.season}: ${r.n} new players to add`)
      total += r.n
    }
    console.log(`    Total: ${total}`)
  }
}

async function addPassing() {
  // Insert only players not already in the leaderboard for (season, school, name, Passing).
  const inserted = await sql`
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      completions, attempts, pass_yards, pass_tds, interceptions,
      games_played, comp_pct, ypa, td_rate, int_rate
    )
    SELECT
      MAX(pgs.player_slug),
      pgs.player_name,
      pgs.school_slug,
      MAX(t.name)                                         AS school_name,
      pgs.season,
      'Passing',
      'XI',
      SUM(COALESCE(pgs.pass_comp, 0))::int                AS completions,
      SUM(COALESCE(pgs.pass_att, 0))::int                 AS attempts,
      SUM(COALESCE(pgs.pass_yds, 0))::int                 AS pass_yards,
      SUM(COALESCE(pgs.pass_tds, 0))::int                 AS pass_tds,
      SUM(COALESCE(pgs.pass_int, 0))::int                 AS interceptions,
      COUNT(*)::int                                       AS games_played,
      CASE WHEN SUM(COALESCE(pgs.pass_att, 0)) > 0
           THEN ROUND(SUM(pgs.pass_comp)::numeric / NULLIF(SUM(pgs.pass_att), 0) * 100, 2)
           END                                            AS comp_pct,
      CASE WHEN SUM(COALESCE(pgs.pass_att, 0)) > 0
           THEN ROUND(SUM(pgs.pass_yds)::numeric / NULLIF(SUM(pgs.pass_att), 0), 2)
           END                                            AS ypa,
      CASE WHEN SUM(COALESCE(pgs.pass_att, 0)) > 0
           THEN ROUND(SUM(pgs.pass_tds)::numeric / NULLIF(SUM(pgs.pass_att), 0) * 100, 2)
           END                                            AS td_rate,
      CASE WHEN SUM(COALESCE(pgs.pass_att, 0)) > 0
           THEN ROUND(SUM(pgs.pass_int)::numeric / NULLIF(SUM(pgs.pass_att), 0) * 100, 2)
           END                                            AS int_rate
    FROM player_game_stats pgs
    LEFT JOIN teams t ON t.school_slug = pgs.school_slug AND t.level = 'Varsity'
    WHERE pgs.stat_type = 'Passing'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.pass_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Passing'
          AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug
          AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.player_name, pgs.school_slug, pgs.season
    RETURNING 1`
  return inserted.length
}

async function addRushing() {
  const inserted = await sql`
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      rush_attempts, rush_yards, rush_tds, games_played, ypc
    )
    SELECT
      MAX(pgs.player_slug),
      pgs.player_name,
      pgs.school_slug,
      MAX(t.name)                                         AS school_name,
      pgs.season,
      'Rushing',
      'XI',
      SUM(COALESCE(pgs.rush_att, 0))::int                 AS rush_attempts,
      SUM(COALESCE(pgs.rush_yds, 0))::int                 AS rush_yards,
      SUM(COALESCE(pgs.rush_tds, 0))::int                 AS rush_tds,
      COUNT(*)::int                                       AS games_played,
      CASE WHEN SUM(COALESCE(pgs.rush_att, 0)) > 0
           THEN ROUND(SUM(pgs.rush_yds)::numeric / NULLIF(SUM(pgs.rush_att), 0), 2)
           END                                            AS ypc
    FROM player_game_stats pgs
    LEFT JOIN teams t ON t.school_slug = pgs.school_slug AND t.level = 'Varsity'
    WHERE pgs.stat_type = 'Rushing'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.rush_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Rushing'
          AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug
          AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.player_name, pgs.school_slug, pgs.season
    RETURNING 1`
  return inserted.length
}

async function addReceiving() {
  const inserted = await sql`
    INSERT INTO player_season_stats (
      player_slug, player_name, school_slug, school_name, season, stat_type, section,
      receptions, recv_yards, recv_tds, games_played, ypc
    )
    SELECT
      MAX(pgs.player_slug),
      pgs.player_name,
      pgs.school_slug,
      MAX(t.name)                                         AS school_name,
      pgs.season,
      'Receiving',
      'XI',
      SUM(COALESCE(pgs.rec_rec, 0))::int                  AS receptions,
      SUM(COALESCE(pgs.rec_yds, 0))::int                  AS recv_yards,
      SUM(COALESCE(pgs.rec_tds, 0))::int                  AS recv_tds,
      COUNT(*)::int                                       AS games_played,
      CASE WHEN SUM(COALESCE(pgs.rec_rec, 0)) > 0
           THEN ROUND(SUM(pgs.rec_yds)::numeric / NULLIF(SUM(pgs.rec_rec), 0), 2)
           END                                            AS ypc
    FROM player_game_stats pgs
    LEFT JOIN teams t ON t.school_slug = pgs.school_slug AND t.level = 'Varsity'
    WHERE pgs.stat_type = 'Receiving'
      AND pgs.season = ANY(${SEASONS})
      AND COALESCE(pgs.rec_yds, 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.stat_type = 'Receiving'
          AND pss.season = pgs.season
          AND pss.school_slug = pgs.school_slug
          AND pss.player_name = pgs.player_name
      )
    GROUP BY pgs.player_name, pgs.school_slug, pgs.season
    RETURNING 1`
  return inserted.length
}

async function main() {
  bar()
  console.log(`player_season_stats backfill — additive only  (${APPLY ? 'APPLY MODE' : 'DRY RUN'})`)
  bar()
  console.log('Newsday top-25 leaderboard rows are NEVER deleted or updated.')
  console.log('Only adds players from game stats who are not already in the leaderboard.')

  await snapshot('BEFORE')
  await previewWouldAdd()

  if (!APPLY) {
    console.log('\n──────')
    console.log('DRY RUN — no changes made.')
    console.log('Re-run with --apply to insert the new aggregated rows.')
    console.log('──────')
    return
  }

  bar()
  console.log('Applying...')
  bar()

  console.log('\nInserting aggregated rows (leaderboard rows untouched)...')
  const passing = await addPassing()
  console.log(`  Added ${passing} Passing rows`)
  const rushing = await addRushing()
  console.log(`  Added ${rushing} Rushing rows`)
  const receiving = await addReceiving()
  console.log(`  Added ${receiving} Receiving rows`)

  await snapshot('AFTER')

  bar()
  console.log('✓ Backfill complete')
  bar()
}

main().catch(err => {
  console.error('\n✗ Backfill failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
